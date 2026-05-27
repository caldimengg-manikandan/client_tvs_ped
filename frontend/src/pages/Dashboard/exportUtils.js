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
    const { pptGenerator } = await import("../../utils/pptGenerator");
    await pptGenerator.generateDashboardPPT(dashboardData);
}