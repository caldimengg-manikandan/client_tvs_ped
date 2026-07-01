# TVS-PED Portal — Enterprise Workflow Transformation Blueprint

> **Version:** 1.0.0 · **Date:** 2026-06-25  
> **Stack:** Node.js/Express · MongoDB/Mongoose · React/Vite · Nodemailer

---

## Confirmed Design Decisions

| # | Question | Decision |
|---|---------|----------|
| Q1 | Designer/Checker Assignment | **Manually assigned by L1 Approver** from portal |
| Q2 | Design Rejection handling | **Back to Designer** for revision only |
| Q3 | Final Approver | **Single system-wide Final Approver** (one user with Final Approver role) |
| Q4 | Existing Requests | **Full migration** — ALL existing requests get the new workflow applied |

---

## Executive Summary

Transform the existing TVS-PED MH Request workflow from a simple Employee→Approver pattern into a full 7-stage enterprise manufacturing workflow.

**Current:** Employee → Approver → Accepted/Rejected  
**Target:** Employee → L1 Approver → Designer → Checker → Final Approver → Production → Implementation

All changes are **additive**. No existing field is removed. Existing APIs are preserved.

---

## 1. Enterprise Workflow Architecture

### Stage Definitions

| # | Stage | Purpose | Responsible Role | Entry Criteria | Exit Criteria |
|---|-------|---------|-----------------|----------------|--------------|
| 1 | **Request Submitted** | Capture requirement | Employee | Valid form data submitted | Request saved, ID generated |
| 2 | **L1 Approval** | Business validation + AI lead time review | Approver | Request in SUBMITTED state | Approved → L1_APPROVED; Rejected → L1_REJECTED |
| 3 | **Design Creation** | CAD/engineering design work | Designer | Assigned by L1 Approver | Design document submitted |
| 4 | **Design Review (Checker)** | Technical quality review | Checker | Design submitted by Designer | Checker approves or rejects |
| 5 | **Final Approval** | Senior sign-off (single Final Approver) | Final Approver | Design checker-approved | Final approved or rejected |
| 6 | **Production** | Manufacturing begins | PED Engineer | Final approval granted | Production confirmed |
| 7 | **Implementation** | Physical deployment | PED Engineer | Production completed | Implementation confirmed → COMPLETED |

#### Rejection Handling Matrix

| Stage | Rejected By | Returns To | State |
|-------|-------------|------------|-------|
| L1 Approval | L1 Approver | Employee (informational) | L1_REJECTED |
| Design Review | Checker | Designer (revision required) | DESIGN_REJECTED → DESIGN_IN_PROGRESS |
| Final Approval | Final Approver | L1 Approver (re-evaluation) | FINAL_REJECTED |

---

## 2. State Machine Design

### State Definitions

```
SUBMITTED            → Request submitted, awaiting L1 review
L1_APPROVED          → L1 Approver accepted, Designer being assigned
L1_REJECTED          → L1 Approver rejected (terminal — resubmit as new request)
DESIGN_IN_PROGRESS   → Designer assigned and actively working
DESIGN_SUBMITTED     → Designer submitted design docs for checker review
DESIGN_APPROVED      → Checker approved design, awaiting Final Approval
DESIGN_REJECTED      → Checker rejected design → returns to DESIGN_IN_PROGRESS
FINAL_APPROVED       → Final Approver signed off
FINAL_REJECTED       → Final Approver rejected → returns to L1 Approver
IN_PRODUCTION        → Manufacturing in progress
IMPLEMENTATION       → Physical installation in progress
COMPLETED            → Full lifecycle complete
CANCELLED            → Admin-cancelled (emergency only)
```

### State Transition Diagram

```
                    ┌─────────────┐
                    │   SUBMITTED │◄──── Employee submits
                    └──────┬──────┘
                           │ L1 Approver reviews (+ sees Lead Time Insight)
               ┌───────────┴───────────┐
               ▼                       ▼
        ┌─────────────┐        ┌──────────────┐
        │ L1_APPROVED │        │ L1_REJECTED  │ (terminal)
        └──────┬──────┘        └──────────────┘
               │ L1 assigns Designer + Checker
               ▼
     ┌───────────────────┐
     │ DESIGN_IN_PROGRESS│◄──────────────────┐
     └─────────┬─────────┘                   │ revision loop
               │ Designer submits docs        │
               ▼                             │
     ┌───────────────────┐         ┌─────────┴──────┐
     │ DESIGN_SUBMITTED  │──reject─► DESIGN_REJECTED│
     └─────────┬─────────┘         └────────────────┘
               │ Checker approves
               ▼
     ┌───────────────────┐
     │  DESIGN_APPROVED  │
     └─────────┬─────────┘
               │ Final Approver reviews
        ┌──────┴──────┐
        ▼             ▼
┌──────────────┐ ┌───────────────┐
│FINAL_APPROVED│ │ FINAL_REJECTED │──► L1_APPROVED (re-eval)
└──────┬───────┘ └───────────────┘
       │
       ▼
┌──────────────┐
│ IN_PRODUCTION│
└──────┬───────┘
       ▼
┌──────────────┐
│IMPLEMENTATION│
└──────┬───────┘
       ▼
┌──────────────┐
│  COMPLETED   │
└──────────────┘
```

### Forbidden Transitions

- `COMPLETED → any` (immutable)
- `L1_REJECTED → any` (must resubmit as new request)
- `SUBMITTED → DESIGN_IN_PROGRESS` (must pass L1 first)
- `DESIGN_IN_PROGRESS → FINAL_APPROVED` (must pass checker)

---

## 3. Database Design

### 3A. MHRequest Enhancements (Additive Only)

New fields added — zero existing fields removed:

```javascript
// ── Enterprise Workflow Engine v2 ────────────────────────────────────────
workflowState: {
    type: String,
    enum: ['SUBMITTED','L1_APPROVED','L1_REJECTED','DESIGN_IN_PROGRESS',
           'DESIGN_SUBMITTED','DESIGN_APPROVED','DESIGN_REJECTED',
           'FINAL_APPROVED','FINAL_REJECTED','IN_PRODUCTION',
           'IMPLEMENTATION','COMPLETED','CANCELLED'],
    default: 'SUBMITTED'
},
workflowVersion: { type: Number, default: 2 },
currentStage:    { type: Number, default: 1 },  // 1-7
assignedDesigner:      { type: ObjectId, ref: 'Employee', default: null },
assignedChecker:       { type: ObjectId, ref: 'Employee', default: null },
assignedFinalApprover: { type: ObjectId, ref: 'Employee', default: null },
leadTimeEstimate:    { type: Number, default: null },
leadTimeConfidence:  { type: Number, default: null },
leadTimeSource:      { type: String, default: null },
leadTimeFactors:     [String],
leadTimeGeneratedAt: Date,
designDocuments: [{
    fileName: String, fileUrl: String,
    uploadedBy: ObjectId, uploadedAt: Date, version: Number
}],
stageHistory: [{
    stage: String, state: String, action: String,
    actor: ObjectId, actorName: String, actorRole: String,
    comment: String, timestamp: Date, metadata: Mixed
}],
stageFlags: {
    l1ApprovedAt: Date, designAssignedAt: Date,
    designSubmittedAt: Date, designApprovedAt: Date,
    finalApprovedAt: Date, productionStartAt: Date, implementedAt: Date
},
l1ApprovalComment:    { type: String, default: '' },
checkerComment:       { type: String, default: '' },
finalApprovalComment: { type: String, default: '' },
```

### 3B. New Collections

- `DesignLibrary` — Design templates, trolley models, variants
- `LeadTimeMaster` — Rule-based lead time configuration per request type
- `WorkflowNotificationLog` — Audit log for all sent notifications

### 3C. UserModel Role Extension

Add 3 new roles (non-breaking enum extension):
- `Designer`
- `Checker`
- `Final Approver`

---

## 4. RBAC Matrix

| Permission | Employee | Approver | Designer | Checker | Final Approver | PED Engineer | Admin |
|-----------|----------|----------|----------|---------|---------------|--------------|-------|
| Create Request | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| L1 Approve/Reject | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Assign Designer | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Submit Design | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Check Design | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Final Approve | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Advance Production | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View Lead Time | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 5. Sprint Roadmap

| Sprint | Focus | Duration |
|--------|-------|----------|
| **Sprint 1** | Schema + Workflow Foundation + Migration | 2 weeks |
| **Sprint 2** | Design Library + Lead Time Service | 2 weeks |
| **Sprint 3** | Full Workflow Backend (all transitions + notifications) | 2 weeks |
| **Sprint 4** | UI Development | 3 weeks |
| **Sprint 5** | Testing + Hardening | 2 weeks |
| **Sprint 6** | Production Rollout | 1 week |

---

## 6. Migration Strategy

Since ALL existing requests must be migrated to the new workflow:

### Migration Logic

```
IF request.status === 'Active' AND request.progressStatus === 'Initial':
    workflowState = 'SUBMITTED'
    currentStage  = 2  (awaiting L1 Approval)

IF request.status === 'Accepted' AND request.progressStatus === 'Initial':
    workflowState = 'L1_APPROVED'
    currentStage  = 3

IF request.status === 'Accepted' AND request.progressStatus === 'Design':
    workflowState = 'DESIGN_IN_PROGRESS'
    currentStage  = 3

IF request.status === 'Accepted' AND request.progressStatus === 'Design Approved':
    workflowState = 'DESIGN_APPROVED'
    currentStage  = 5

IF request.status === 'Accepted' AND request.progressStatus === 'Production':
    workflowState = 'IN_PRODUCTION'
    currentStage  = 6

IF request.status === 'Accepted' AND request.progressStatus === 'Implementation':
    workflowState = 'COMPLETED'
    currentStage  = 7

IF request.status === 'Rejected':
    workflowState = 'L1_REJECTED'
    currentStage  = 2
```

All migrated records set `workflowVersion: 2` and add a migration entry to `stageHistory`.

---

## 7. Files to Create / Modify

### Backend — New Files
- `backend/models/DesignLibrary.js`
- `backend/models/LeadTimeMaster.js`
- `backend/models/WorkflowNotificationLog.js`
- `backend/controllers/workflowController.js`
- `backend/controllers/designLibraryController.js`
- `backend/routes/workflowRoutes.js`
- `backend/routes/designLibraryRoutes.js`
- `backend/services/leadTimeService.js`
- `backend/services/workflowNotificationService.js`
- `backend/middleware/workflowAuthMiddleware.js`
- `backend/scripts/migrateWorkflow.js` ← migration script

### Backend — Modified Files
- `backend/models/MHRequest.js` — additive new fields
- `backend/models/UserModel.js` — 3 new roles
- `backend/controllers/mhRequestController.js` — set workflowVersion on create
- `backend/server.js` — mount new routes

### Frontend — New Files
- `frontend/src/pages/WorkflowDetail/WorkflowDetailPage.jsx`
- `frontend/src/pages/WorkflowDetail/WorkflowTimeline.jsx`
- `frontend/src/pages/WorkflowDetail/LeadTimeInsightCard.jsx`
- `frontend/src/pages/WorkflowDetail/WorkflowActions.jsx`
- `frontend/src/pages/WorkflowDetail/StageHistory.jsx`
- `frontend/src/pages/WorkflowDetail/DesignDocuments.jsx`
- `frontend/src/pages/DesignQueue/DesignQueuePage.jsx`
- `frontend/src/pages/CheckerQueue/CheckerQueuePage.jsx`
- `frontend/src/pages/FinalApprovalQueue/FinalApprovalQueuePage.jsx`
- `frontend/src/api/workflowApi.js`

### Frontend — Modified Files
- `frontend/src/App.jsx` — new routes
- `frontend/src/pages/Dashboard/` — role-based queue cards
