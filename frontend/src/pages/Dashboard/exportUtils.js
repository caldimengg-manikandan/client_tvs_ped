import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';

/* ─────────────────────────────────────────────────────────
   PDF Export — structured multi-page data PDF
   Uses jsPDF + jspdf-autotable (no screenshots)
───────────────────────────────────────────────────────── */
export async function exportDashboardPDF(dashboardData) {
    try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // ── Palette ──────────────────────────────────────────
        const RED        = [204, 31,  31 ];
        const RED_DARK   = [160, 18,  18 ];
        const NAVY       = [6,   13,  31 ];
        const GRAY       = [100, 116, 139];
        const LIGHT      = [245, 247, 250];
        const MID_GRAY   = [226, 232, 240];
        const WHITE      = [255, 255, 255];
        const GREEN      = [16,  120, 85 ];
        const AMBER      = [161, 89,  15 ];
        const BLUE       = [37,  60,  128];

        const pageW = doc.internal.pageSize.getWidth();   // 210 mm
        const pageH = doc.internal.pageSize.getHeight();  // 297 mm

        // ── Helpers ───────────────────────────────────────────
        const addFooter = (pageNum) => {
            doc.setDrawColor(...MID_GRAY);
            doc.setLineWidth(0.3);
            doc.line(10, pageH - 12, pageW - 10, pageH - 12);
            doc.setTextColor(...GRAY);
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.text('TVS Motor Company — PED Analytics Report  |  Confidential', 10, pageH - 7);
            doc.text(`Page ${pageNum}`, pageW - 10, pageH - 7, { align: 'right' });
        };

        const addSectionHeader = (title, subtitle, startY = 42) => {
            // Red top bar
            doc.setFillColor(...RED);
            doc.rect(0, 0, pageW, 17, 'F');

            doc.setTextColor(...WHITE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text('TVS MOTOR COMPANY', 10, 6.5);
            doc.text('PED FACTORY COMMAND CENTRE', pageW - 10, 6.5, { align: 'right' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            const dateStr = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
            doc.text(`Generated: ${dateStr}`, pageW - 10, 12.5, { align: 'right' });

            // Section title
            doc.setTextColor(...NAVY);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.text(title, 10, 27);

            if (subtitle) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(...GRAY);
                doc.text(subtitle, 10, 33.5);
            }

            // Red rule
            doc.setDrawColor(...RED);
            doc.setLineWidth(0.4);
            doc.line(10, 37, pageW - 10, 37);
        };

        // ══════════════════════════════════════════════════════
        // PAGE 1 — Cover + KPI Summary
        // ══════════════════════════════════════════════════════

        // Hero band
        doc.setFillColor(...RED);
        doc.rect(0, 0, pageW, 60, 'F');

        // Subtle dark diagonal accent
        doc.setFillColor(...RED_DARK);
        doc.triangle(pageW - 50, 0, pageW, 0, pageW, 60, 'F');

        // TVS brand label
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('TVS MOTOR COMPANY', 10, 14);

        // Separator line
        doc.setDrawColor(255, 160, 160);
        doc.setLineWidth(0.3);
        doc.line(10, 17, 80, 17);

        // Main title
        doc.setFontSize(24);
        doc.text('PED Factory', 10, 32);
        doc.text('Command Centre', 10, 43);

        // Sub caption
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 210, 210);
        doc.text('Performance & Engineering Division — Analytics Dashboard', 10, 52);

        // Date chip below hero
        doc.setFillColor(...LIGHT);
        doc.roundedRect(10, 66, pageW - 20, 10, 2, 2, 'F');
        doc.setTextColor(...NAVY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        const coverDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(`Report generated on ${coverDate}`, pageW / 2, 72.5, { align: 'center' });

        // ── KPI Cards ─────────────────────────────────────────
        let y = 85;

        doc.setTextColor(...NAVY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('KEY PERFORMANCE INDICATORS', 10, y);

        doc.setDrawColor(...RED);
        doc.setLineWidth(0.5);
        doc.line(10, y + 2.5, pageW - 10, y + 2.5);

        y += 9;

        const s = dashboardData?.mhSummary || {};
        const t = dashboardData?.topStats   || {};

        const kpis = [
            { label: 'Total Requested',   value: s.totalRequested     ?? 0,    color: RED   },
            { label: 'Total Approved',    value: s.totalApproved      ?? 0,    color: GREEN },
            { label: 'Total Pending',     value: s.totalPending       ?? 0,    color: AMBER },
            { label: 'Total Rejected',    value: s.totalRejected      ?? 0,    color: RED   },
            { label: 'Approval Rate',     value: `${s.approvalRate    ?? 0}%`, color: GREEN },
            { label: 'Total Assigned',    value: s.totalAssigned      ?? 0,    color: BLUE  },
            { label: 'This Month',        value: s.thisMonthRequested ?? 0,    color: RED   },
            { label: 'vs Last Month',     value: `${s.vsLastMonthPct  ?? 0}%`, color: GRAY  },
            { label: 'Active Vendors',    value: t.activeVendors      ?? 0,    color: BLUE  },
            { label: 'PED Engineers',     value: t.activePEDEngineers ?? 0,    color: BLUE  },
            { label: 'Emails Dispatched', value: t.emailsDispatched   ?? 0,    color: GRAY  },
            { label: 'Total Employees',   value: t.totalEmployees     ?? 0,    color: GRAY  },
        ];

        const cols       = 4;
        const gapX       = 4;
        const gapY       = 5;
        const cardW      = (pageW - 20 - gapX * (cols - 1)) / cols;
        const cardH      = 22;

        kpis.forEach((kpi, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx  = 10 + col * (cardW + gapX);
            const cy  = y  + row * (cardH + gapY);

            // Card bg
            doc.setFillColor(...LIGHT);
            doc.roundedRect(cx, cy, cardW, cardH, 2, 2, 'F');

            // Left colour accent bar
            doc.setFillColor(...kpi.color);
            doc.roundedRect(cx, cy, 3, cardH, 1, 1, 'F');

            // Value number
            doc.setTextColor(...kpi.color);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.text(String(kpi.value), cx + 6.5, cy + 10);

            // Label
            doc.setTextColor(...GRAY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.text(kpi.label, cx + 6.5, cy + 17);
        });

        addFooter(1);

        // ══════════════════════════════════════════════════════
        // PAGE 2 — Recent MH Requests
        // ══════════════════════════════════════════════════════
        doc.addPage();
        addSectionHeader('Recent MH Requests', 'Latest material-handling requests submitted across all departments');

        if (dashboardData?.recentRequests?.length) {
            const head = [['#', 'Request ID', 'Asset Name', 'Department', 'Submitted By', 'Engineer', 'Status', 'Priority', 'Date']];
            const body = dashboardData.recentRequests.map((r, i) => [
                i + 1,
                r.requestId              || '—',
                r.assetName              || '—',
                r.department             || '—',
                r.submittedByName        || '—',
                r.assignedEngineerName   || '—',
                r.status                 || '—',
                r.priority               || '—',
                r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
            ]);

            autoTable(doc, {
                head,
                body,
                startY: 42,
                margin: { left: 10, right: 10 },
                styles: {
                    fontSize: 7,
                    cellPadding: 3,
                    textColor: NAVY,
                    lineColor: MID_GRAY,
                    lineWidth: 0.2,
                    overflow: 'linebreak',
                },
                headStyles: {
                    fillColor: NAVY,
                    textColor: WHITE,
                    fontStyle: 'bold',
                    fontSize: 7,
                    cellPadding: 3.5,
                },
                alternateRowStyles: { fillColor: LIGHT },
                columnStyles: {
                    0: { cellWidth:  7, halign: 'center' },
                    1: { cellWidth: 22 },
                    6: { cellWidth: 18 },
                    7: { cellWidth: 14 },
                    8: { cellWidth: 22 },
                },
                didParseCell: (data) => {
                    if (data.section !== 'body') return;
                    if (data.column.index === 6) {
                        const v = data.cell.raw;
                        data.cell.styles.fontStyle = 'bold';
                        if (v === 'Approved' || v === 'Completed') data.cell.styles.textColor = GREEN;
                        else if (v === 'Pending')                  data.cell.styles.textColor = AMBER;
                        else if (v === 'Rejected')                 data.cell.styles.textColor = RED;
                        else                                        data.cell.styles.textColor = BLUE;
                    }
                    if (data.column.index === 7) {
                        const v = data.cell.raw;
                        data.cell.styles.fontStyle = 'bold';
                        if (v === 'High')   data.cell.styles.textColor = RED;
                        else if (v === 'Medium') data.cell.styles.textColor = AMBER;
                        else                data.cell.styles.textColor = GREEN;
                    }
                },
                didDrawPage: () => addFooter(doc.internal.getCurrentPageInfo().pageNumber),
            });
        } else {
            doc.setTextColor(...GRAY);
            doc.setFontSize(9);
            doc.text('No recent requests data available.', 10, 50);
            addFooter(2);
        }

        // ══════════════════════════════════════════════════════
        // PAGE 3 — MH Request Trend
        // ══════════════════════════════════════════════════════
        doc.addPage();
        addSectionHeader('MH Request Trend', 'Monthly breakdown of material-handling requests over the past 12 months');

        if (dashboardData?.mhTrend?.length) {
            const head = [['Month', 'Requested', 'Approved', 'Rejected']];
            const body = dashboardData.mhTrend.map(m => [
                m.month,
                m.requested,
                m.approved,
                m.rejected,
            ]);

            autoTable(doc, {
                head,
                body,
                startY: 42,
                margin: { left: 10, right: 10 },
                tableWidth: pageW - 20,
                styles: {
                    fontSize: 9,
                    cellPadding: 4.5,
                    textColor: NAVY,
                    lineColor: MID_GRAY,
                    lineWidth: 0.2,
                },
                headStyles: {
                    fillColor: NAVY,
                    textColor: WHITE,
                    fontStyle: 'bold',
                    fontSize: 9,
                    cellPadding: 5,
                },
                alternateRowStyles: { fillColor: LIGHT },
                columnStyles: {
                    0: { cellWidth: 60 },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                },
                didParseCell: (data) => {
                    if (data.section !== 'body') return;
                    if (data.column.index === 2) { data.cell.styles.textColor = GREEN; data.cell.styles.fontStyle = 'bold'; }
                    if (data.column.index === 3) { data.cell.styles.textColor = RED;   data.cell.styles.fontStyle = 'bold'; }
                },
                didDrawPage: () => addFooter(doc.internal.getCurrentPageInfo().pageNumber),
            });
        } else {
            doc.setTextColor(...GRAY);
            doc.setFontSize(9);
            doc.text('No trend data available.', 10, 50);
            addFooter(doc.internal.getCurrentPageInfo().pageNumber);
        }

        // ══════════════════════════════════════════════════════
        // PAGE 4 — Vendor Performance
        // ══════════════════════════════════════════════════════
        doc.addPage();
        addSectionHeader('Vendor Performance', 'Supplier scorecards based on quality, on-time delivery, and overall performance metrics');

        if (dashboardData?.vendorPerformance?.length) {
            const head = [['#', 'Vendor Name', 'Score (/100)', 'On-Time Rate (%)', 'Delay Rate (%)']];
            const body = dashboardData.vendorPerformance.map((v, i) => [
                i + 1,
                v.vendorName,
                v.avgScore   ?? '—',
                v.onTimeRate ?? '—',
                v.defectRate ?? '—',
            ]);

            autoTable(doc, {
                head,
                body,
                startY: 42,
                margin: { left: 10, right: 10 },
                tableWidth: pageW - 20,
                styles: {
                    fontSize: 9,
                    cellPadding: 4.5,
                    textColor: NAVY,
                    lineColor: MID_GRAY,
                    lineWidth: 0.2,
                },
                headStyles: {
                    fillColor: NAVY,
                    textColor: WHITE,
                    fontStyle: 'bold',
                    fontSize: 9,
                    cellPadding: 5,
                },
                alternateRowStyles: { fillColor: LIGHT },
                columnStyles: {
                    0: { cellWidth: 12, halign: 'center' },
                    1: { cellWidth: 70 },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center' },
                },
                didParseCell: (data) => {
                    if (data.section !== 'body' || data.column.index !== 2) return;
                    const score = Number(data.cell.raw);
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.textColor = score >= 75 ? GREEN : score >= 50 ? AMBER : RED;
                },
                didDrawPage: () => addFooter(doc.internal.getCurrentPageInfo().pageNumber),
            });
        } else {
            doc.setTextColor(...GRAY);
            doc.setFontSize(9);
            doc.text('No vendor performance data available.', 10, 50);
            addFooter(doc.internal.getCurrentPageInfo().pageNumber);
        }

        // ── Save ─────────────────────────────────────────────
        doc.save(`TVS-PED-Dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
        console.error('[Export PDF]', err);
        throw err;
    }
}

/* ─────────────────────────────────────────────────────────
   Excel Export — KPI summary + recent requests sheet
───────────────────────────────────────────────────────── */
export async function exportDashboardExcel(dashboardData) {
    try {
        const wb = XLSX.utils.book_new();

        // Sheet 1: KPI Summary
        const kpiRows = [];
        if (dashboardData?.mhSummary) {
            const s = dashboardData.mhSummary;
            kpiRows.push(['Metric', 'Value']);
            kpiRows.push(['Total MH Requested', s.totalRequested]);
            kpiRows.push(['Total Approved', s.totalApproved]);
            kpiRows.push(['Total Pending', s.totalPending]);
            kpiRows.push(['Total Rejected', s.totalRejected]);
            kpiRows.push(['Total Assigned', s.totalAssigned]);
            kpiRows.push(['Approval Rate (%)', s.approvalRate]);
            kpiRows.push(['This Month Requested', s.thisMonthRequested]);
            kpiRows.push(['vs Last Month (%)', s.vsLastMonthPct]);
        }
        if (dashboardData?.topStats) {
            const t = dashboardData.topStats;
            kpiRows.push(['Active Vendors', t.activeVendors]);
            kpiRows.push(['PED Engineers Active', t.activePEDEngineers]);
            kpiRows.push(['Emails Dispatched', t.emailsDispatched]);
            kpiRows.push(['Total Employees', t.totalEmployees]);
        }
        const ws1 = XLSX.utils.aoa_to_sheet(kpiRows);
        XLSX.utils.book_append_sheet(wb, ws1, 'KPI Summary');

        // Sheet 2: Recent Requests
        if (dashboardData?.recentRequests?.length) {
            const headers = ['Request ID', 'Asset Name', 'Department', 'Submitted By', 'Assigned Engineer', 'Status', 'Priority', 'Created At'];
            const rows = dashboardData.recentRequests.map(r => [
                r.requestId, r.assetName, r.department, r.submittedByName,
                r.assignedEngineerName || '—', r.status, r.priority,
                r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'
            ]);
            const ws2 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            XLSX.utils.book_append_sheet(wb, ws2, 'Recent Requests');
        }

        // Sheet 3: MH Trend
        if (dashboardData?.mhTrend?.length) {
            const headers = ['Month', 'Requested', 'Approved', 'Rejected'];
            const rows = dashboardData.mhTrend.map(m => [m.month, m.requested, m.approved, m.rejected]);
            const ws3 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            XLSX.utils.book_append_sheet(wb, ws3, 'MH Trend');
        }

        // Sheet 4: Vendor Performance
        if (dashboardData?.vendorPerformance?.length) {
            const headers = ['Vendor', 'Score (0-100)', 'On-Time Rate (%)', 'Delay Rate (%)'];
            const rows = dashboardData.vendorPerformance.map(v => [v.vendorName, v.avgScore, v.onTimeRate, v.defectRate]);
            const ws4 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            XLSX.utils.book_append_sheet(wb, ws4, 'Vendor Performance');
        }

        XLSX.writeFile(wb, `TVS-PED-Dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
        console.error('[Export Excel]', err);
        throw err;
    }
}

// ─── PPTX Export ─────────────────────────────────────────────────────────────

export async function exportDashboardPPTX(dashboardData) {
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // ── Design tokens ──────────────────────────────────────────────────────────
    const NAVY   = '0F1535';
    const HDR    = '141B45';
    const RED    = 'E8192C';
    const GREEN  = '059669';
    const AMBER  = 'D97706';
    const BLUE   = '1D4ED8';
    const TEAL   = '0D9488';
    const ORANGE = 'EA580C';
    const PURPLE = '6D28D9';
    const WHITE  = 'FFFFFF';
    const BG     = 'F8FAFC';
    const GRAY   = '6B7280';
    const BORDER = 'E5E7EB';
    const SHADOW = 'CBD5E1';

    // ── Load logo ──────────────────────────────────────────────────────────────
    let logoData = null;
    try {
        const resp = await fetch('/tvs_logo_clean.png');
        const blob = await resp.blob();
        logoData = await new Promise((res, rej) => {
            const fr = new FileReader();
            fr.onload  = () => res(fr.result);
            fr.onerror = rej;
            fr.readAsDataURL(blob);
        });
    } catch (_) { /* logo unavailable – skip */ }

    // ── Helpers ────────────────────────────────────────────────────────────────

    // Logo badge (white pill behind logo so it reads on any bg)
    const addLogo = (slide, x = 8.05, y = 0.06) => {
        if (!logoData) return;
        slide.addShape(pptx.ShapeType.roundRect, {
            x, y, w: 1.82, h: 0.62, rectRadius: 0.06,
            fill: { color: WHITE }, line: { width: 0 },
        });
        slide.addImage({ data: logoData, x: x + 0.04, y: y + 0.04, w: 1.74, h: 0.54 });
    };

    // Dark header band (used on every content slide)
    const addHeader = (slide, title, sub = '') => {
        // Full-width dark band
        slide.addShape(pptx.ShapeType.rect, {
            x: 0, y: 0, w: 10, h: 0.88,
            fill: { color: HDR }, line: { width: 0 },
        });
        // Red left accent stripe
        slide.addShape(pptx.ShapeType.rect, {
            x: 0, y: 0, w: 0.08, h: 0.88,
            fill: { color: RED }, line: { width: 0 },
        });
        // Title text
        slide.addText(title, {
            x: 0.22, y: 0.08, w: 7.6, h: 0.44,
            fontSize: 18, bold: true, color: WHITE, fontFace: 'Calibri',
            valign: 'middle', align: 'left',
        });
        if (sub) {
            slide.addText(sub, {
                x: 0.22, y: 0.52, w: 7.6, h: 0.28,
                fontSize: 10, color: 'A5B4FC', fontFace: 'Calibri',
                valign: 'middle', align: 'left',
            });
        }
        addLogo(slide);
    };

    // Shadow KPI card
    const addCard = (slide, x, y, w, h, value, label, accentColor) => {
        // Shadow layer
        slide.addShape(pptx.ShapeType.roundRect, {
            x: x + 0.04, y: y + 0.04, w, h, rectRadius: 0.12,
            fill: { color: SHADOW }, line: { width: 0 },
        });
        // White card
        slide.addShape(pptx.ShapeType.roundRect, {
            x, y, w, h, rectRadius: 0.12,
            fill: { color: WHITE }, line: { color: BORDER, width: 0.5 },
        });
        // Color accent top stripe
        slide.addShape(pptx.ShapeType.roundRect, {
            x, y, w, h: 0.07, rectRadius: 0.06,
            fill: { color: accentColor }, line: { width: 0 },
        });
        // Value
        slide.addText(String(value ?? '–'), {
            x: x + 0.12, y: y + 0.12, w: w - 0.24, h: h * 0.52,
            fontSize: 28, bold: true, color: accentColor, fontFace: 'Calibri',
            align: 'center', valign: 'middle',
        });
        // Label
        slide.addText(label, {
            x: x + 0.08, y: y + h * 0.62, w: w - 0.16, h: h * 0.34,
            fontSize: 9, color: GRAY, fontFace: 'Calibri',
            align: 'center', valign: 'middle', wrap: true,
        });
    };

    // Rounded-track progress bar (two-layer: gray track + colored fill)
    const addBar = (slide, x, y, trackW, h, fillColor, ratio) => {
        const clampedRatio = Math.min(1, Math.max(0, ratio || 0));
        // Track
        slide.addShape(pptx.ShapeType.roundRect, {
            x, y, w: trackW, h, rectRadius: h / 2,
            fill: { color: BORDER }, line: { width: 0 },
        });
        // Fill
        const fillW = Math.max(h, trackW * clampedRatio);
        slide.addShape(pptx.ShapeType.roundRect, {
            x, y, w: fillW, h, rectRadius: h / 2,
            fill: { color: fillColor }, line: { width: 0 },
        });
    };

    // ── Data extraction ────────────────────────────────────────────────────────
    const summary      = dashboardData?.mhSummary        || {};
    const topStats     = dashboardData?.topStats          || {};
    const trend        = dashboardData?.mhTrend           || [];
    const depts        = dashboardData?.mhByDepartment    || [];
    const engineers    = dashboardData?.engineerUtilisation || [];
    const vendors      = dashboardData?.vendorPerformance  || [];
    const assetSummary = dashboardData?.assetSummary       || {};
    const assetList    = Array.isArray(assetSummary.byCategory) ? assetSummary.byCategory : [];
    const funnel       = dashboardData?.mhDevTrackerFunnel || [];
    const recent       = dashboardData?.recentRequests     || [];
    const today     = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // ── SLIDE 1 — Cover ────────────────────────────────────────────────────────
    {
        const sl = pptx.addSlide();
        // Left deep-navy panel
        sl.addShape(pptx.ShapeType.rect, {
            x: 0, y: 0, w: 5.8, h: 5.625,
            fill: { color: NAVY }, line: { width: 0 },
        });
        // Right TVS-red panel
        sl.addShape(pptx.ShapeType.rect, {
            x: 5.8, y: 0, w: 4.2, h: 5.625,
            fill: { color: RED }, line: { width: 0 },
        });
        // Decorative circles at the panel divide
        ['0.6', '0.38', '0.22'].forEach((r, i) => {
            const radius = parseFloat(r);
            sl.addShape(pptx.ShapeType.ellipse, {
                x: 5.8 - radius + (i === 0 ? -0.1 : i === 1 ? 0.05 : 0.14),
                y: 5.625 / 2 - radius,
                w: radius * 2, h: radius * 2,
                fill: { color: i === 0 ? RED : i === 1 ? NAVY : WHITE, transparency: i === 0 ? 20 : i === 1 ? 20 : 30 },
                line: { width: 0 },
            });
        });
        // Main title — three lines stacked
        sl.addText('FACTORY', {
            x: 0.55, y: 1.3, w: 5.0, h: 0.85,
            fontSize: 54, bold: true, color: WHITE, fontFace: 'Calibri', align: 'left',
        });
        sl.addText('COMMAND', {
            x: 0.55, y: 2.05, w: 5.0, h: 0.85,
            fontSize: 54, bold: true, color: RED, fontFace: 'Calibri', align: 'left',
        });
        sl.addText('CENTRE', {
            x: 0.55, y: 2.8, w: 5.0, h: 0.85,
            fontSize: 54, bold: true, color: WHITE, fontFace: 'Calibri', align: 'left',
        });
        // Sub-label
        sl.addText('Plant Engineering — Material Handling Assets Dashboard', {
            x: 0.55, y: 3.72, w: 5.0, h: 0.36,
            fontSize: 12, color: 'A5B4FC', fontFace: 'Calibri', align: 'left',
        });
        sl.addText(`Generated on ${today}`, {
            x: 0.55, y: 4.1, w: 5.0, h: 0.28,
            fontSize: 10, color: '7C8DB5', fontFace: 'Calibri', align: 'left',
        });
        // Right panel text
        sl.addText('TVS MOTOR', {
            x: 6.0, y: 1.9, w: 3.7, h: 0.52,
            fontSize: 26, bold: true, color: WHITE, fontFace: 'Calibri', align: 'center',
        });
        sl.addText('PLANT ENGINEERING', {
            x: 6.0, y: 2.44, w: 3.7, h: 0.36,
            fontSize: 13, color: 'FECACA', fontFace: 'Calibri', align: 'center',
        });
        sl.addText('DIVISION', {
            x: 6.0, y: 2.8, w: 3.7, h: 0.36,
            fontSize: 13, color: 'FECACA', fontFace: 'Calibri', align: 'center',
        });
        addLogo(sl, 6.1, 4.78);
    }

    // ── SLIDE 2 — Executive Summary ────────────────────────────────────────────
    {
        const sl = pptx.addSlide();
        sl.background = { color: BG };
        addHeader(sl, 'Executive Summary', 'High-level KPIs at a glance');

        const cards = [
            { v: summary.totalRequested  ?? '–', l: 'Total MH Requests',    c: BLUE   },
            { v: summary.totalAssigned   ?? '–', l: 'Open / Active',        c: ORANGE },
            { v: summary.totalApproved   ?? '–', l: 'Approved',             c: GREEN  },
            { v: summary.totalPending    ?? '–', l: 'Pending Approval',     c: AMBER  },
            { v: assetSummary.totalAssets ?? '–', l: 'Total Assets Tracked', c: TEAL   },
            { v: topStats.activeVendors  ?? vendors.length ?? '–', l: 'Active Vendors', c: PURPLE },
            { v: engineers.length,               l: 'Engineers Assigned',   c: RED    },
            { v: summary.approvalRate != null ? summary.approvalRate + '%' : '–', l: 'Approval Rate', c: NAVY },
        ];

        const cols = 4, cW = 2.08, cH = 1.25, startX = 0.18, startY = 1.08, gapX = 0.12, gapY = 0.22;
        cards.forEach((card, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            addCard(sl,
                startX + col * (cW + gapX),
                startY + row * (cH + gapY),
                cW, cH,
                card.v, card.l, card.c
            );
        });
    }

    // ── SLIDE 3 — Asset Management ─────────────────────────────────────────────
    {
        const sl = pptx.addSlide();
        sl.background = { color: BG };
        addHeader(sl, 'Asset Management', 'Asset inventory by location / category');

        // Left hero panel
        sl.addShape(pptx.ShapeType.roundRect, {
            x: 0.18, y: 1.08, w: 2.8, h: 4.2, rectRadius: 0.14,
            fill: { color: NAVY }, line: { width: 0 },
        });
        const totalAssets = assetSummary.totalAssets || '–';
        sl.addText('TOTAL\nASSETS', {
            x: 0.22, y: 1.5, w: 2.72, h: 0.8,
            fontSize: 13, bold: true, color: 'A5B4FC', fontFace: 'Calibri',
            align: 'center', valign: 'middle',
        });
        sl.addText(String(totalAssets), {
            x: 0.22, y: 2.2, w: 2.72, h: 1.1,
            fontSize: 64, bold: true, color: WHITE, fontFace: 'Calibri',
            align: 'center', valign: 'middle',
        });
        sl.addText('across all locations', {
            x: 0.22, y: 3.28, w: 2.72, h: 0.36,
            fontSize: 10, color: '7C8DB5', fontFace: 'Calibri', align: 'center',
        });
        // Divider
        sl.addShape(pptx.ShapeType.rect, {
            x: 0.5, y: 3.7, w: 2.16, h: 0.02,
            fill: { color: '1E3A5F' }, line: { width: 0 },
        });
        const assetBreakdown = assetList.slice(0, 4);
        assetBreakdown.forEach((a, i) => {
            sl.addText(String(a.category || `Location ${i + 1}`), {
                x: 0.3, y: 3.82 + i * 0.38, w: 2.56, h: 0.28,
                fontSize: 10, color: 'CBD5E1', fontFace: 'Calibri', align: 'left',
            });
            sl.addText(String(a.count || 0), {
                x: 0.3, y: 3.82 + i * 0.38, w: 2.56, h: 0.28,
                fontSize: 10, bold: true, color: WHITE, fontFace: 'Calibri', align: 'right',
            });
        });

        // Right: bar chart by location
        const barData = assetList.slice(0, 8);
        const maxAsset = Math.max(1, ...barData.map(a => a.count || 0));
        sl.addText('Distribution by Location', {
            x: 3.22, y: 1.08, w: 6.5, h: 0.36,
            fontSize: 12, bold: true, color: HDR, fontFace: 'Calibri', align: 'left',
        });
        const barColors = [BLUE, TEAL, ORANGE, RED, PURPLE, GREEN, AMBER, NAVY];
        barData.forEach((a, i) => {
            const rowY = 1.52 + i * 0.52;
            const label = (a.category || `Location ${i + 1}`).slice(0, 22);
            const val   = a.count || 0;
            sl.addText(label, {
                x: 3.22, y: rowY, w: 2.2, h: 0.3,
                fontSize: 10, color: HDR, fontFace: 'Calibri', align: 'left', valign: 'middle',
            });
            addBar(sl, 5.5, rowY + 0.06, 3.6, 0.2, barColors[i % barColors.length], val / maxAsset);
            sl.addText(String(val), {
                x: 9.16, y: rowY, w: 0.6, h: 0.3,
                fontSize: 10, bold: true, color: barColors[i % barColors.length], fontFace: 'Calibri',
                align: 'right', valign: 'middle',
            });
        });
    }

    // ── SLIDE 4 — MH Development Phases ────────────────────────────────────────
    {
        const sl = pptx.addSlide();
        sl.background = { color: BG };
        addHeader(sl, 'MH Development Phases', 'Pipeline stage distribution');

        const phases   = Array.isArray(funnel) ? funnel : [];
        const total    = phases.reduce((s, p) => s + (p.count || 0), 0) || 1;
        const phColors = [NAVY, BLUE, TEAL, GREEN, AMBER, ORANGE, RED, PURPLE];
        const n        = phases.length || 1;
        const startX   = 0.4;
        const endX     = 9.6;
        const stepX    = (endX - startX) / Math.max(n, 1);
        const circleY  = 2.8;
        const circleR  = 0.55;

        // Connector line
        if (phases.length > 1) {
            sl.addShape(pptx.ShapeType.rect, {
                x: startX + circleR, y: circleY + circleR - 0.03,
                w: endX - startX - circleR * 2, h: 0.06,
                fill: { color: BORDER }, line: { width: 0 },
            });
        }

        phases.forEach((phase, i) => {
            const cx     = startX + i * stepX + stepX / 2;
            const color  = phColors[i % phColors.length];
            const pct    = total > 0 ? Math.round((phase.count || 0) / total * 100) : 0;

            // Circle
            sl.addShape(pptx.ShapeType.ellipse, {
                x: cx - circleR, y: circleY, w: circleR * 2, h: circleR * 2,
                fill: { color }, line: { color: WHITE, width: 2 },
            });
            // Circle number
            sl.addText(String(i + 1), {
                x: cx - circleR, y: circleY, w: circleR * 2, h: circleR * 2,
                fontSize: 18, bold: true, color: WHITE, fontFace: 'Calibri',
                align: 'center', valign: 'middle',
            });
            // Count above
            sl.addText(String(phase.count || 0), {
                x: cx - 0.5, y: circleY - 0.52, w: 1.0, h: 0.36,
                fontSize: 20, bold: true, color, fontFace: 'Calibri',
                align: 'center', valign: 'middle',
            });
            // Label below
            const label = (phase.stage || phase.name || phase.label || `Phase ${i + 1}`).slice(0, 16);
            sl.addText(label, {
                x: cx - 0.7, y: circleY + circleR * 2 + 0.1, w: 1.4, h: 0.32,
                fontSize: 9, bold: true, color: HDR, fontFace: 'Calibri',
                align: 'center', wrap: true,
            });
            sl.addText(`${pct}%`, {
                x: cx - 0.5, y: circleY + circleR * 2 + 0.44, w: 1.0, h: 0.28,
                fontSize: 9, color: GRAY, fontFace: 'Calibri', align: 'center',
            });
        });

        if (!phases.length) {
            sl.addText('No phase data available', {
                x: 1, y: 2.4, w: 8, h: 0.5,
                fontSize: 14, color: GRAY, fontFace: 'Calibri', align: 'center',
            });
        }
    }

    // ── SLIDE 5 — MH Request Trend ─────────────────────────────────────────────
    {
        const sl = pptx.addSlide();
        sl.background = { color: BG };
        addHeader(sl, 'MH Request Trend', 'Monthly request volume and completion rate');

        const trendData = Array.isArray(trend) ? trend.slice(-6) : [];
        const maxTrend  = Math.max(1, ...trendData.map(t => t.requested || 0));

        // Left stat summary cards
        const tTotal     = trendData.reduce((s, t) => s + (t.requested || 0), 0);
        const tCompleted = trendData.reduce((s, t) => s + (t.approved  || 0), 0);
        const tOpen      = trendData.reduce((s, t) => s + (t.rejected  || 0), 0);
        [
            { v: tTotal,     l: 'Requests (6 mo)', c: BLUE   },
            { v: tCompleted, l: 'Completed',        c: GREEN  },
            { v: tOpen,      l: 'Rejected',          c: ORANGE },
        ].forEach((card, i) => {
            addCard(sl, 0.18, 1.08 + i * 1.52, 2.4, 1.28, card.v, card.l, card.c);
        });

        // Right grouped bar chart
        sl.addText('Monthly Volume', {
            x: 2.82, y: 1.08, w: 6.9, h: 0.32,
            fontSize: 11, bold: true, color: HDR, fontFace: 'Calibri', align: 'left',
        });

        const chartX = 2.82, chartY = 1.5, chartW = 6.9, chartH = 3.6;
        const barGroupW = chartW / Math.max(trendData.length, 1);

        const baseY = chartY + chartH - 0.3;

        trendData.forEach((t, i) => {
            const gx     = chartX + i * barGroupW + barGroupW * 0.08;
            const bW     = Math.max(0.12, barGroupW * 0.38);
            const total  = t.requested || 0;
            const comp   = t.approved  || 0;
            const totalH = Math.max(0, (total / maxTrend) * chartH * 0.82);
            const compH  = Math.max(0, (comp  / maxTrend) * chartH * 0.82);

            // Total bar (only draw if height > 0)
            if (totalH > 0.02) {
                sl.addShape(pptx.ShapeType.roundRect, {
                    x: gx, y: baseY - totalH, w: bW, h: totalH,
                    rectRadius: 0.04,
                    fill: { color: BLUE, transparency: 15 }, line: { width: 0 },
                });
            }
            // Approved bar
            if (compH > 0.02) {
                sl.addShape(pptx.ShapeType.roundRect, {
                    x: gx + bW + 0.04, y: baseY - compH, w: bW, h: compH,
                    rectRadius: 0.04,
                    fill: { color: GREEN }, line: { width: 0 },
                });
            }
            // Baseline tick
            sl.addShape(pptx.ShapeType.rect, {
                x: gx, y: baseY, w: bW * 2 + 0.04, h: 0.02,
                fill: { color: BORDER }, line: { width: 0 },
            });
            // X-axis label
            const monthLabel = t.month || `M${i + 1}`;
            sl.addText(monthLabel.slice(0, 6), {
                x: gx - 0.05, y: baseY + 0.04, w: bW * 2 + 0.12, h: 0.22,
                fontSize: 8, color: GRAY, fontFace: 'Calibri', align: 'center',
            });
            // Value label above bar
            if (total > 0 && totalH > 0.02) {
                sl.addText(String(total), {
                    x: gx, y: Math.max(chartY, baseY - totalH - 0.22), w: bW, h: 0.2,
                    fontSize: 8, bold: true, color: BLUE, fontFace: 'Calibri', align: 'center',
                });
            }
        });

        // "No data" message when trend is empty or all-zero
        if (!trendData.length || trendData.every(t => !t.requested)) {
            sl.addText('No trend data available for the selected period', {
                x: 2.82, y: 3.0, w: 6.9, h: 0.5,
                fontSize: 12, color: GRAY, fontFace: 'Calibri', align: 'center', italic: true,
            });
        }

        // Legend
        [[BLUE, 'Total'], [GREEN, 'Completed']].forEach(([color, label], i) => {
            sl.addShape(pptx.ShapeType.rect, {
                x: 2.82 + i * 1.5, y: 5.1, w: 0.18, h: 0.14,
                fill: { color }, line: { width: 0 },
            });
            sl.addText(label, {
                x: 3.06 + i * 1.5, y: 5.06, w: 1.2, h: 0.22,
                fontSize: 9, color: GRAY, fontFace: 'Calibri', align: 'left',
            });
        });
    }

    // ── SLIDE 6 — Department Load ──────────────────────────────────────────────
    {
        const sl = pptx.addSlide();
        sl.background = { color: BG };
        addHeader(sl, 'Department Load Breakdown', 'MH hours distribution by department');

        const deptData  = Array.isArray(depts) ? depts.slice(0, 10) : [];
        const maxDept   = Math.max(1, ...deptData.map(d => d.totalHours || d.requestCount || 0));
        const deptColors = [BLUE, TEAL, RED, ORANGE, PURPLE, GREEN, AMBER, NAVY, 'C026D3', 'BE123C'];

        deptData.forEach((d, i) => {
            const rowY    = 1.08 + i * 0.44;
            const val     = d.totalHours || d.requestCount || 0;
            const label   = (d.department || `Dept ${i + 1}`).slice(0, 28);
            const color   = deptColors[i % deptColors.length];

            // Dept name
            sl.addText(label, {
                x: 0.22, y: rowY, w: 3.2, h: 0.34,
                fontSize: 10, color: HDR, fontFace: 'Calibri', align: 'left', valign: 'middle',
            });
            // Bar
            addBar(sl, 3.6, rowY + 0.08, 5.5, 0.2, color, val / maxDept);
            // Value
            sl.addText(String(val), {
                x: 9.16, y: rowY, w: 0.6, h: 0.34,
                fontSize: 10, bold: true, color, fontFace: 'Calibri', align: 'right', valign: 'middle',
            });
        });

        if (!deptData.length) {
            sl.addText('No department data available', {
                x: 1, y: 2.8, w: 8, h: 0.5,
                fontSize: 14, color: GRAY, fontFace: 'Calibri', align: 'center',
            });
        }
    }

    // ── SLIDE 7 — Engineer Utilization ─────────────────────────────────────────
    {
        const sl = pptx.addSlide();
        sl.background = { color: BG };
        addHeader(sl, 'Engineer Utilization', 'Workload and capacity per assigned engineer');

        const engData = Array.isArray(engineers) ? engineers.slice(0, 8) : [];
        const maxEng  = Math.max(1, ...engData.map(e => e.assignedCount || 0));

        // Summary cards row
        const totalAssigned  = engData.reduce((s, e) => s + (e.assignedCount || 0), 0);
        const avgUtil        = engData.length
            ? Math.round(engData.reduce((s, e) => s + (e.utilisationPct || 0), 0) / engData.length)
            : 0;
        [
            { v: engData.length,  l: 'Engineers',       c: NAVY   },
            { v: totalAssigned,   l: 'Total Assigned',  c: BLUE   },
            { v: `${avgUtil}%`,   l: 'Avg Utilization', c: avgUtil >= 80 ? RED : avgUtil >= 60 ? AMBER : GREEN },
        ].forEach((card, i) => {
            addCard(sl, 0.18 + i * 3.26, 1.0, 3.0, 1.1, card.v, card.l, card.c);
        });

        // Engineer rows
        engData.forEach((eng, i) => {
            const rowY  = 2.3 + i * 0.4;
            const name  = (eng.engineerName || `Engineer ${i + 1}`).slice(0, 24);
            const val   = eng.assignedCount || 0;
            const util  = eng.utilisationPct || 0;
            const color = util >= 80 ? RED : util >= 60 ? AMBER : GREEN;

            sl.addText(name, {
                x: 0.22, y: rowY, w: 2.8, h: 0.3,
                fontSize: 10, color: HDR, fontFace: 'Calibri', align: 'left', valign: 'middle',
            });
            sl.addText(`${val} req`, {
                x: 3.1, y: rowY, w: 1.0, h: 0.3,
                fontSize: 10, color: GRAY, fontFace: 'Calibri', align: 'right', valign: 'middle',
            });
            addBar(sl, 4.22, rowY + 0.06, 5.0, 0.2, color, val / maxEng);
            sl.addText(`${util}%`, {
                x: 9.28, y: rowY, w: 0.5, h: 0.3,
                fontSize: 10, bold: true, color, fontFace: 'Calibri', align: 'right', valign: 'middle',
            });
        });

        if (!engData.length) {
            sl.addText('No engineer data available', {
                x: 1, y: 2.8, w: 8, h: 0.5,
                fontSize: 14, color: GRAY, fontFace: 'Calibri', align: 'center',
            });
        }
    }

    // ── SLIDE 8 — Vendor Performance ───────────────────────────────────────────
    {
        const sl = pptx.addSlide();
        sl.background = { color: BG };
        addHeader(sl, 'Vendor Performance', 'On-time delivery and quality scores');

        const vendorData = Array.isArray(vendors) ? vendors.slice(0, 7) : [];
        const topVendor  = vendorData[0] || {};

        // Left hero
        sl.addShape(pptx.ShapeType.roundRect, {
            x: 0.18, y: 1.08, w: 2.8, h: 4.2, rectRadius: 0.14,
            fill: { color: NAVY }, line: { width: 0 },
        });
        sl.addText('TOP\nPERFORMER', {
            x: 0.22, y: 1.48, w: 2.72, h: 0.64,
            fontSize: 12, bold: true, color: 'A5B4FC', fontFace: 'Calibri', align: 'center',
        });
        sl.addText(String(topVendor.avgScore ?? '–'), {
            x: 0.22, y: 2.08, w: 2.72, h: 0.9,
            fontSize: 52, bold: true, color: WHITE, fontFace: 'Calibri', align: 'center',
        });
        sl.addText((topVendor.vendorName || 'N/A').slice(0, 18), {
            x: 0.22, y: 2.98, w: 2.72, h: 0.4,
            fontSize: 12, bold: true, color: 'FBBF24', fontFace: 'Calibri', align: 'center',
        });
        sl.addText('Quality Score', {
            x: 0.22, y: 3.42, w: 2.72, h: 0.28,
            fontSize: 9, color: '7C8DB5', fontFace: 'Calibri', align: 'center',
        });

        // Right: bar rows
        const maxScore = Math.max(1, ...vendorData.map(v => v.avgScore || 0));
        sl.addText('All Vendors', {
            x: 3.22, y: 1.08, w: 6.5, h: 0.3,
            fontSize: 11, bold: true, color: HDR, fontFace: 'Calibri', align: 'left',
        });
        vendorData.forEach((v, i) => {
            const rowY = 1.48 + i * 0.55;
            const name  = (v.vendorName || `Vendor ${i + 1}`).slice(0, 22);
            const score = v.avgScore || 0;
            const color = score >= 90 ? GREEN : score >= 75 ? AMBER : RED;
            sl.addText(name, {
                x: 3.22, y: rowY, w: 2.2, h: 0.3,
                fontSize: 10, color: HDR, fontFace: 'Calibri', align: 'left', valign: 'middle',
            });
            addBar(sl, 5.5, rowY + 0.06, 3.6, 0.2, color, score / maxScore);
            sl.addText(String(score), {
                x: 9.16, y: rowY, w: 0.6, h: 0.3,
                fontSize: 10, bold: true, color, fontFace: 'Calibri', align: 'right', valign: 'middle',
            });
        });

        if (!vendorData.length) {
            sl.addText('No vendor data available', {
                x: 3.22, y: 2.5, w: 6.5, h: 0.5,
                fontSize: 14, color: GRAY, fontFace: 'Calibri', align: 'center',
            });
        }
    }

    // ── SLIDE 9 — Recent MH Requests ───────────────────────────────────────────
    {
        const sl = pptx.addSlide();
        sl.background = { color: BG };
        addHeader(sl, 'Recent MH Requests', 'Latest activity and current status');

        const rows = Array.isArray(recent) ? recent.slice(0, 9) : [];

        const STATUS_COLOR = { Completed: GREEN, 'In Progress': BLUE, Pending: AMBER, Rejected: RED, Approved: TEAL };
        const PRIORITY_COLOR = { High: RED, Medium: AMBER, Low: GREEN, Critical: PURPLE };

        // Column headers
        [['ID / Title', 0.18, 3.8], ['Department', 4.1, 1.8], ['Status', 6.0, 1.4], ['Priority', 7.5, 1.3], ['MH', 8.9, 0.9]].forEach(([label, x, w]) => {
            sl.addText(label, {
                x, y: 1.0, w, h: 0.28,
                fontSize: 9, bold: true, color: GRAY, fontFace: 'Calibri', align: 'left',
            });
        });
        // Thin divider
        sl.addShape(pptx.ShapeType.rect, {
            x: 0.18, y: 1.3, w: 9.64, h: 0.02,
            fill: { color: BORDER }, line: { width: 0 },
        });

        rows.forEach((req, i) => {
            const rowY = 1.38 + i * 0.46;
            const bg   = i % 2 === 0 ? WHITE : 'F1F5F9';
            sl.addShape(pptx.ShapeType.roundRect, {
                x: 0.18, y: rowY, w: 9.64, h: 0.4, rectRadius: 0.05,
                fill: { color: bg }, line: { width: 0 },
            });

            const title    = (req.assetName || req.requestId || `REQ-${i + 1}`).slice(0, 38);
            const dept     = (req.department || '–').slice(0, 18);
            const status   = req.status || 'Pending';
            const priority = req.priority || 'Normal';
            const mh       = req.estimatedHours ?? '–';
            const sColor   = STATUS_COLOR[status]   || GRAY;
            const pColor   = PRIORITY_COLOR[priority] || GRAY;

            sl.addText(title, {
                x: 0.24, y: rowY + 0.05, w: 3.8, h: 0.3,
                fontSize: 9, color: HDR, fontFace: 'Calibri', align: 'left', valign: 'middle',
            });
            sl.addText(dept, {
                x: 4.1, y: rowY + 0.05, w: 1.8, h: 0.3,
                fontSize: 9, color: GRAY, fontFace: 'Calibri', align: 'left', valign: 'middle',
            });

            // Status pill
            sl.addShape(pptx.ShapeType.roundRect, {
                x: 6.0, y: rowY + 0.08, w: 1.2, h: 0.24, rectRadius: 0.08,
                fill: { color: sColor, transparency: 80 }, line: { color: sColor, width: 0.5 },
            });
            sl.addText(status, {
                x: 6.0, y: rowY + 0.08, w: 1.2, h: 0.24,
                fontSize: 8, bold: true, color: sColor, fontFace: 'Calibri', align: 'center', valign: 'middle',
            });

            // Priority pill
            sl.addShape(pptx.ShapeType.roundRect, {
                x: 7.5, y: rowY + 0.08, w: 1.0, h: 0.24, rectRadius: 0.08,
                fill: { color: pColor, transparency: 80 }, line: { color: pColor, width: 0.5 },
            });
            sl.addText(priority, {
                x: 7.5, y: rowY + 0.08, w: 1.0, h: 0.24,
                fontSize: 8, bold: true, color: pColor, fontFace: 'Calibri', align: 'center', valign: 'middle',
            });

            sl.addText(String(mh), {
                x: 8.9, y: rowY + 0.05, w: 0.9, h: 0.3,
                fontSize: 9, bold: true, color: HDR, fontFace: 'Calibri', align: 'right', valign: 'middle',
            });
        });

        if (!rows.length) {
            sl.addText('No recent requests', {
                x: 1, y: 2.8, w: 8, h: 0.5,
                fontSize: 14, color: GRAY, fontFace: 'Calibri', align: 'center',
            });
        }
    }

    // ── SLIDE 10 — Conclusion ──────────────────────────────────────────────────
    {
        const sl = pptx.addSlide();
        // Mirror cover: left navy, right red
        sl.addShape(pptx.ShapeType.rect, {
            x: 0, y: 0, w: 5.8, h: 5.625,
            fill: { color: NAVY }, line: { width: 0 },
        });
        sl.addShape(pptx.ShapeType.rect, {
            x: 5.8, y: 0, w: 4.2, h: 5.625,
            fill: { color: RED }, line: { width: 0 },
        });
        // Decorative circles
        ['0.6', '0.38', '0.22'].forEach((r, i) => {
            const radius = parseFloat(r);
            sl.addShape(pptx.ShapeType.ellipse, {
                x: 5.8 - radius + (i === 0 ? -0.1 : i === 1 ? 0.05 : 0.14),
                y: 5.625 / 2 - radius,
                w: radius * 2, h: radius * 2,
                fill: { color: i === 0 ? RED : i === 1 ? NAVY : WHITE, transparency: i === 0 ? 20 : i === 1 ? 20 : 30 },
                line: { width: 0 },
            });
        });

        sl.addText('KEY', {
            x: 0.55, y: 1.1, w: 5.0, h: 0.7,
            fontSize: 54, bold: true, color: WHITE, fontFace: 'Calibri', align: 'left',
        });
        sl.addText('TAKEAWAYS', {
            x: 0.55, y: 1.72, w: 5.0, h: 0.7,
            fontSize: 48, bold: true, color: RED, fontFace: 'Calibri', align: 'left',
        });

        const totalMH   = summary.totalRequested ?? '–';
        const completed = summary.totalApproved  ?? '–';
        const bullets   = [
            `${totalMH} total MH requests tracked this period`,
            `${completed} requests approved successfully`,
            `${engineers.length} engineers actively utilised`,
            `${vendors.length} vendors evaluated for performance`,
            assetSummary.totalAssets ? `${assetSummary.totalAssets} assets across all locations` : 'Asset inventory actively maintained',
        ];
        bullets.forEach((b, i) => {
            sl.addText(`• ${b}`, {
                x: 0.55, y: 2.6 + i * 0.5, w: 4.9, h: 0.4,
                fontSize: 11, color: i === 0 ? 'A5B4FC' : 'CBD5E1', fontFace: 'Calibri', align: 'left',
            });
        });

        sl.addText('Thank you', {
            x: 6.0, y: 1.9, w: 3.7, h: 0.52,
            fontSize: 26, bold: true, color: WHITE, fontFace: 'Calibri', align: 'center',
        });
        sl.addText('TVS Motor Company', {
            x: 6.0, y: 2.5, w: 3.7, h: 0.36,
            fontSize: 13, color: 'FECACA', fontFace: 'Calibri', align: 'center',
        });
        sl.addText('Plant Engineering Division', {
            x: 6.0, y: 2.88, w: 3.7, h: 0.32,
            fontSize: 11, color: 'FECACA', fontFace: 'Calibri', align: 'center',
        });
        addLogo(sl, 6.1, 4.78);
    }

    // ── Save ───────────────────────────────────────────────────────────────────
    const fileName = `TVS-PED-Dashboard-${new Date().toISOString().slice(0, 10)}.pptx`;
    await pptx.writeFile({ fileName });
}

