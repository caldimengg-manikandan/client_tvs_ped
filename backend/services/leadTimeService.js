/**
 * leadTimeService.js
 * Phase 1: Rule-Based Lead Time Estimation Engine
 *
 * Calculates estimated lead time for a MH Request based on:
 * - Request type
 * - Plant location
 * - Equipment type (standard vs. custom)
 * - Design library similarity match
 *
 * Phase 2 (future): Historical data learning (moving averages per request cluster)
 * Phase 3 (future): ML model (Vertex AI / scikit-learn microservice)
 */

const LeadTimeMaster = require('../models/LeadTimeMaster');
const DesignLibrary  = require('../models/DesignLibrary');

// ─── Standard equipment list (known standard components = faster lead time) ────
const STANDARD_EQUIPMENT_TYPES = [
    'Trolley', 'Hand Truck', 'Pallet Jack', 'Conveyor',
    'Standard Rack', 'Bin', 'Container', 'Fork Lift Attachment'
];

// ─── Plant complexity offset (days added for logistics/vendor distance) ────────
const PLANT_COMPLEXITY = {
    'Hosur Plant 1 (TN)':  0,
    'Hosur Plant 2 (TN)':  0,
    'Hosur Plant 3 (TN)':  1,
    'Mysore (KA)':          2,
    'Nalagarh (HP)':        3
};

// ─── Request type complexity map ──────────────────────────────────────────────
const REQUEST_TYPE_ADJUSTMENTS = {
    'Modification':         { days: -2, confidence: +8,  label: '✓ Modification (faster than new)' },
    'Replacement':          { days: -1, confidence: +5,  label: '✓ Replacement (known specs)' },
    'Refresh':              { days: -2, confidence: +5,  label: '✓ Refresh (incremental change)' },
    'Upgrade':              { days:  0, confidence: +3,  label: '✓ Upgrade (partial redesign)' },
    'Capacity':             { days: +2, confidence: -5,  label: '⚡ Capacity expansion (higher complexity)' },
    'New Project':          { days: +5, confidence: -10, label: '⚡ New Project (no existing reference)' },
    'Special Improvements': { days: +3, confidence: -5,  label: '⚡ Special improvement (custom work)' }
};

/**
 * Find a similar design in the Design Library.
 * Matches on equipmentType (case-insensitive).
 * @param {Object} request - MHRequest document
 * @returns {Object|null} matching design or null
 */
async function findSimilarDesign(request) {
    if (!request.materialHandlingEquipment) return null;
    try {
        const design = await DesignLibrary.findOne({
            activeStatus: true,
            $or: [
                { equipmentType: { $regex: new RegExp(request.materialHandlingEquipment, 'i') } },
                { tags: { $in: [request.materialHandlingEquipment.toLowerCase()] } }
            ]
        });
        return design;
    } catch {
        return null;
    }
}

/**
 * Get the lead time master rule for this request type.
 * Falls back to a generic rule if no specific rule exists.
 */
async function getLeadTimeMasterRule(requestType, plantLocation) {
    try {
        // Most specific: requestType + plantLocation
        let rule = await LeadTimeMaster.findOne({
            requestType,
            plantLocation,
            activeStatus: true
        });
        if (rule) return rule;

        // Fallback: requestType only
        rule = await LeadTimeMaster.findOne({
            requestType,
            plantLocation: '',
            activeStatus: true
        });
        if (rule) return rule;

        // Generic fallback
        rule = await LeadTimeMaster.findOne({ activeStatus: true });
        return rule;
    } catch {
        return null;
    }
}

/**
 * Main estimate function.
 * @param {Object} request - MHRequest document (lean or full)
 * @returns {Object} { estimatedDays, confidence, source, factors, recommendation, generatedAt }
 */
async function estimateLeadTime(request) {
    const factors = [];

    // 1. Get base from master rules
    const masterRule = await getLeadTimeMasterRule(request.requestType, request.plantLocation);
    let days       = masterRule ? masterRule.baseLeadTimeDays   : 14;  // default 14 days
    let confidence = masterRule ? masterRule.confidenceDefault   : 65;  // default 65%

    // 2. Apply request type adjustment
    const typeAdj = REQUEST_TYPE_ADJUSTMENTS[request.requestType];
    if (typeAdj) {
        days       += typeAdj.days;
        confidence += typeAdj.confidence;
        factors.push(typeAdj.label);
    }

    // 3. Check Design Library for similar existing design
    const existingDesign = await findSimilarDesign(request);
    if (existingDesign) {
        days       -= 3;
        confidence += 10;
        factors.push('✓ Existing Design Available in Library');

        // Check variant lead times
        if (existingDesign.variants && existingDesign.variants.length > 0) {
            const bestVariant = existingDesign.variants.reduce((a, b) =>
                a.standardLeadTimeDays < b.standardLeadTimeDays ? a : b
            );
            if (bestVariant.standardLeadTimeDays < days) {
                days = bestVariant.standardLeadTimeDays;
                factors.push(`✓ Best matching variant: ${bestVariant.name}`);
            }
        }
    }

    // 4. Standard equipment check
    if (request.materialHandlingEquipment &&
        STANDARD_EQUIPMENT_TYPES.some(e =>
            request.materialHandlingEquipment.toLowerCase().includes(e.toLowerCase())
        )) {
        days       -= 1;
        confidence += 5;
        factors.push('✓ Standard Equipment Type');
    } else if (request.materialHandlingEquipment) {
        factors.push('⚡ Custom/Non-standard Equipment');
    }

    // 5. Plant location complexity offset
    const plantOffset = PLANT_COMPLEXITY[request.plantLocation] || 0;
    if (plantOffset > 0) {
        days += plantOffset;
        factors.push(`⚡ Remote plant location (+${plantOffset} days logistics)`);
    }

    // 6. Apply master rule adjustment factors (if any)
    if (masterRule && masterRule.adjustmentFactors) {
        masterRule.adjustmentFactors.forEach(af => {
            days       += af.adjustment;
            confidence += af.confidenceBoost;
            if (af.label) factors.push(af.label);
        });
    }

    // 7. Clamp values
    days       = Math.max(3,  Math.round(days));
    confidence = Math.min(95, Math.max(30, Math.round(confidence)));

    // 8. Build recommendation string
    let recommendation = 'Review carefully before approving';
    if (confidence >= 85) recommendation = 'Approve for Design Phase';
    else if (confidence >= 70) recommendation = 'Approve with standard monitoring';
    else recommendation = 'Approve with close tracking — high uncertainty';

    return {
        estimatedDays:   days,
        confidence,
        source:          'RULE_BASED',
        factors,
        recommendation,
        generatedAt:     new Date()
    };
}

module.exports = { estimateLeadTime };
