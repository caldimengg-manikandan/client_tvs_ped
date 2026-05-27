import PptxGenJS from 'pptxgenjs';

/**
 * Ultra-Professional Consultant-Grade PPT Generator
 * Adheres strictly to high-end corporate presentation standards:
 * - Minimalist, high data-ink ratio
 * - Action-driven titles
 * - Elegant typography and geometric hierarchy
 * - Strict adherence to TVS Corporate branding (Navy & Red)
 */
class PPTGenerator {
  constructor() {
    this.ppt = new PptxGenJS();
    
    // Premium Corporate Palette
    this.colors = {
      primary: '0B1A30',     // Deep Corporate Navy
      secondary: '2D3748',   // Slate Dark
      accent: 'D32F2F',      // Corporate Red Highlight
      bgLight: 'F8FAFC',     // Ultra-light slate (not stark white)
      white: 'FFFFFF',
      textMain: '1A202C',    // Charcoal for readability
      textMuted: '718096',   // Muted slate
      border: 'E2E8F0',      // Soft borders
      success: '2E7D32',     // Professional Green
      warning: 'F57C00',     // Professional Orange
      chartLight: 'CBD5E0'   // For inactive/background chart elements
    };

    this.fonts = {
      header: 'Arial',
      body: 'Arial',
      bold: 'Arial Black'
    };
  }

  async generateDashboardPPT(dashboardData) {
    try {
      this.ppt = new PptxGenJS();
      this.ppt.layout = 'LAYOUT_16x9';
      this.ppt.title = 'TVS PED Executive Analytics';

      const data = dashboardData || {};

      this.addCoverSlide();
      this.addExecutiveSummary(data);
      this.addPipelineVelocity(data);
      this.addVendorPerformance(data);
      this.addStrategicPortfolio(data);
      this.addStakeholderLoad(data);
      this.addRecentOperations(data);
      this.addConclusionSlide();

      const fileName = `TVS_Executive_Report_${new Date().toISOString().split('T')[0]}.pptx`;
      await this.ppt.writeFile({ fileName });

      return { success: true, fileName };
    } catch (error) {
      console.error('Designer PPT Generation Error:', error);
      return { success: false, error: error.message };
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // SLIDE TEMPLATES
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Slide 1: High-End Cover
   */
  addCoverSlide() {
    const slide = this.ppt.addSlide();
    slide.background = { color: this.colors.primary };

    // Geometric Abstraction (Consulting firm style)
    slide.addShape(this.ppt.ShapeType.rtTriangle, {
      x: 6.5, y: -0.5, w: 4, h: 6.5, fill: { color: this.colors.white, transparency: 95 }, flipV: true, line: { width: 0 }
    });
    slide.addShape(this.ppt.ShapeType.rect, {
      x: 0, y: 1.5, w: 0.15, h: 2.2, fill: { color: this.colors.accent }, line: { width: 0 }
    });

    slide.addText('TVS MOTOR COMPANY', {
      x: 0.6, y: 1.5, w: 5, h: 0.3,
      fontSize: 12, bold: true, color: this.colors.white, fontFace: this.fonts.header, letterSpacing: 2
    });

    slide.addText('EXECUTIVE\nOPERATIONS\nREVIEW', { 
      x: 0.6, y: 1.9, w: 8, h: 2, 
      fontSize: 48, bold: true, color: this.colors.white, fontFace: this.fonts.bold, lineSpacing: 48
    });

    const liveTime = new Date().toLocaleString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });

    slide.addText(`PLANT ENGINEERING DIVISION  |  LIVE DATA EXTRACT: ${liveTime.toUpperCase()}`, {
      x: 0.6, y: 4.8, w: 8, h: 0.3,
      fontSize: 10, color: 'A0AEC0', fontFace: this.fonts.body, letterSpacing: 1
    });
  }

  /**
   * Master Layout Applier (For inner slides)
   */
  applyMasterLayout(slide, title, actionSubtitle) {
    slide.background = { color: this.colors.bgLight };

    // 1. Top Corporate Band
    slide.addShape(this.ppt.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.3, fill: { color: this.colors.primary }, line: { width: 0 }
    });
    slide.addShape(this.ppt.ShapeType.rect, {
      x: 0, y: 0.3, w: '100%', h: 0.03, fill: { color: this.colors.accent }, line: { width: 0 }
    });
    slide.addText('TVS MOTOR COMPANY  |  PLANT ENGINEERING DIVISION', {
      x: 0.2, y: 0, w: 6, h: 0.3, fontSize: 8, color: this.colors.white, fontFace: this.fonts.header, bold: true, valign: 'middle', letterSpacing: 1
    });

    // 2. Slide Title with Accent
    slide.addShape(this.ppt.ShapeType.rect, {
      x: 0.4, y: 0.6, w: 0.08, h: 0.5, fill: { color: this.colors.accent }, line: { width: 0 }
    });
    slide.addText(title.toUpperCase(), { 
      x: 0.6, y: 0.55, w: 8, h: 0.4, 
      fontSize: 22, bold: true, color: this.colors.primary, fontFace: this.fonts.bold 
    });
    
    // 3. Action Subtitle (The "So What?")
    if (actionSubtitle) {
      slide.addText(actionSubtitle, { 
        x: 0.6, y: 0.95, w: 8.5, h: 0.25, 
        fontSize: 12, italic: true, color: this.colors.textMuted, fontFace: this.fonts.body 
      });
    }

    // 4. Clean Footer
    slide.addShape(this.ppt.ShapeType.rect, { x: 0, y: 5.4, w: '100%', h: 0.01, fill: { color: this.colors.border }, line: { width: 0 } });
    slide.addText(`Strictly Confidential  |  Slide ${this.ppt.slides.length}`, {
      x: 0.4, y: 5.45, w: 9, h: 0.15, fontSize: 8, color: this.colors.textMuted, fontFace: this.fonts.body
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // DATA SLIDES
  // ────────────────────────────────────────────────────────────────────────

  addExecutiveSummary(data) {
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'Executive Summary', 'Key operational metrics indicate steady pipeline throughput.');

    const s = data?.mhSummary || {};
    const metrics = [
      { label: 'Total MH Requests', val: s.totalRequested || 0 },
      { label: 'Approved Requests', val: s.totalApproved || 0 },
      { label: 'Approval Rate', val: `${s.approvalRate || 0}%` },
      { label: 'Active Pipeline', val: (s.totalPending + s.totalAssigned) || 0 }
    ];

    // Minimalist Metric Cards
    metrics.forEach((m, i) => {
      const x = 0.5 + (i * 2.3);
      
      // Clean Bordered Box
      slide.addShape(this.ppt.ShapeType.rect, {
        x, y: 1.5, w: 2.1, h: 1.2,
        fill: { color: this.colors.white },
        line: { color: this.colors.border, width: 1 }
      });
      
      slide.addText(m.val.toString(), { 
        x, y: 1.6, w: 2.1, h: 0.6, align: 'center', fontSize: 36, bold: true, color: this.colors.primary, fontFace: this.fonts.header
      });
      slide.addText(m.label.toUpperCase(), { 
        x, y: 2.2, w: 2.1, h: 0.3, align: 'center', fontSize: 9, bold: true, color: this.colors.textMuted, fontFace: this.fonts.body, letterSpacing: 1
      });
    });

    // Volume Chart
    slide.addText('METRIC COMPARISON', { x: 0.5, y: 3.1, w: 3, h: 0.3, fontSize: 10, bold: true, color: this.colors.secondary });
    
    slide.addChart(this.ppt.ChartType.bar, [{ name: 'Vol', labels: metrics.map(m => m.label), values: metrics.map(m => parseInt(m.val) || 0) }], {
      x: 0.5, y: 3.4, w: 9, h: 1.8,
      barDir: 'bar', barGapWidthPct: 60,
      chartColors: [this.colors.primary, this.colors.success, this.colors.accent, this.colors.secondary],
      showValue: true, valAxisHidden: true, catAxisLineShow: false,
      catAxisLabelColor: this.colors.textMain, catAxisFontSize: 10,
      dataLabelColor: this.colors.textMain, dataLabelFontSize: 11, dataLabelFontBold: true
    });
  }

  addPipelineVelocity(data) {
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'Pipeline Velocity', 'Current distribution of assets across the development lifecycle.');

    const phases = data?.mhDevTrackerFunnel || [];
    const fallbackLabels = ['Initiated', 'Design', 'PR/PO', 'Sample', 'Production', 'Released'];
    const labels = phases.length ? phases.map(p => p.stage) : fallbackLabels;
    const values = phases.length ? phases.map(p => p.count) : [0,0,0,0,0,0];

    // Elegant Chevron-style workflow
    labels.forEach((label, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const finalX = 0.5 + (col * 3.0);
      const finalY = 1.6 + (row * 1.8);
      
      const isActive = values[i] > 0;
      
      // Thin line connecting them (only if not the last item in row)
      if (col < 2) {
        slide.addShape(this.ppt.ShapeType.rect, {
            x: finalX + 2.4, y: finalY + 0.6, w: 0.6, h: 0.02, fill: { color: this.colors.border }
        });
      }

      // Elegant Box
      slide.addShape(this.ppt.ShapeType.rect, {
        x: finalX, y: finalY, w: 2.6, h: 1.2,
        fill: { color: this.colors.white },
        line: { color: isActive ? this.colors.primary : this.colors.border, width: isActive ? 2 : 1 }
      });

      // Number
      slide.addText(values[i].toString(), {
        x: finalX, y: finalY + 0.1, w: 2.6, h: 0.6, align: 'center', fontSize: 32, bold: true, color: isActive ? this.colors.primary : this.colors.textMuted, fontFace: this.fonts.header
      });

      // Label
      slide.addText(label.toUpperCase(), {
        x: finalX, y: finalY + 0.7, w: 2.6, h: 0.3, align: 'center', fontSize: 9, bold: true, color: isActive ? this.colors.accent : this.colors.textMuted, letterSpacing: 1
      });
    });
  }

  addVendorPerformance(data) {
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'Vendor Quality Assessment', 'Top performing partners based on strict QCD scoring metrics.');

    const vendors = data?.vendorPerformance || [];
    
    // Layout: Left Chart, Right Details
    slide.addText('VENDOR QCD SCORES (%)', { x: 0.5, y: 1.5, w: 4, h: 0.3, fontSize: 10, bold: true, color: this.colors.secondary });

    const vLabels = vendors.slice(0, 5).map(v => v.vendorName.substring(0, 15));
    const vValues = vendors.slice(0, 5).map(v => v.avgScore);

    if (vLabels.length > 0) {
      slide.addChart(this.ppt.ChartType.bar, [{ name: 'Score', labels: vLabels, values: vValues }], {
        x: 0.5, y: 1.8, w: 5, h: 3.2, 
        barDir: 'bar', valAxisMaxVal: 100, barGapWidthPct: 40,
        chartColors: [this.colors.primary], showValue: true,
        valAxisHidden: true, catAxisLineShow: false,
        dataLabelColor: this.colors.textMain, dataLabelFontSize: 10, dataLabelFontBold: true
      });
    }

    // Right side: Top Vendor Highlight
    const topVendor = vendors.length > 0 ? vendors[0] : null;
    if (topVendor) {
      slide.addShape(this.ppt.ShapeType.rect, {
          x: 6.0, y: 1.8, w: 3.5, h: 3.0, fill: { color: this.colors.primary }
      });
      slide.addText('TOP PARTNER', { 
          x: 6.0, y: 2.2, w: 3.5, align: 'center', fontSize: 10, bold: true, color: this.colors.white, letterSpacing: 2 
      });
      slide.addText(`${topVendor.avgScore || 0}%`, { 
          x: 6.0, y: 2.6, w: 3.5, align: 'center', fontSize: 64, bold: true, color: this.colors.accent, fontFace: this.fonts.bold 
      });
      slide.addText((topVendor.vendorName || '').toUpperCase(), { 
          x: 6.0, y: 3.6, w: 3.5, align: 'center', fontSize: 14, color: this.colors.white 
      });
    }
  }

  addStrategicPortfolio(data) {
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'Strategic Portfolio Trajectory', 'Historical volume growth and requirement classification.');

    // Left: Line Chart (Trends)
    slide.addText('6-MONTH REQUIREMENT TREND', { x: 0.5, y: 1.5, w: 4.5, h: 0.3, fontSize: 10, bold: true, color: this.colors.secondary });
    
    const trends = data?.mhTrend || [];
    const recentTrends = trends.slice(-6);

    if (recentTrends.length > 0) {
      slide.addChart(this.ppt.ChartType.line, [
        { name: 'Requested', labels: recentTrends.map(t => t.month), values: recentTrends.map(t => t.requested) },
        { name: 'Approved', labels: recentTrends.map(t => t.month), values: recentTrends.map(t => t.approved) }
      ], {
        x: 0.5, y: 1.9, w: 5.5, h: 3.0, 
        showLegend: true, legendPos: 't', legendFontSize: 9,
        chartColors: [this.colors.secondary, this.colors.accent],
        lineDataSymbol: 'none', lineSize: 3, lineSmooth: true,
        valAxisLineShow: false, catAxisLineShow: false, valAxisMajorGridLine: { color: this.colors.border, width: 1 }
      });
    }

    // Right: Priority Pie
    slide.addText('PRIORITY DISTRIBUTION', { x: 6.5, y: 1.5, w: 3, h: 0.3, fontSize: 10, bold: true, color: this.colors.secondary });
    const priority = data?.mhByPriority || {};
    const pLabels = Object.keys(priority);
    const pValues = Object.values(priority);
    
    if (pValues.length > 0 && pValues.some(v => v > 0)) {
      slide.addChart(this.ppt.ChartType.doughnut, [{ name: 'Priority', labels: pLabels, values: pValues }], {
        x: 6.5, y: 1.9, w: 3, h: 2.8,
        holeSize: 65, showPercent: true, dataLabelColor: this.colors.textMain,
        showLegend: true, legendPos: 'b', legendFontSize: 9,
        chartColors: [this.colors.primary, this.colors.accent, this.colors.chartLight]
      });
    }
  }

  addStakeholderLoad(data) {
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'Resource & Stakeholder Load', 'Analyzing departmental demand against engineering capacity.');

    const depts = data?.mhByDepartment || [];
    const deptLabels = depts.slice(0, 5).map(d => d.department.substring(0, 15));
    const deptValues = depts.slice(0, 5).map(d => d.requestCount);

    const engs = data?.engineerUtilisation || [];
    const engLabels = engs.slice(0, 5).map(e => e.engineerName.substring(0, 15));
    const engValues = engs.slice(0, 5).map(e => e.utilisationPct);

    slide.addText('TOP REQUESTING DEPARTMENTS', { x: 0.5, y: 1.5, w: 4.2, h: 0.3, fontSize: 10, bold: true, color: this.colors.secondary });
    if (deptLabels.length > 0) {
      slide.addChart(this.ppt.ChartType.bar, [{ name: 'Reqs', labels: deptLabels, values: deptValues }], {
        x: 0.5, y: 1.9, w: 4.2, h: 3.2, barDir: 'col', chartColors: [this.colors.primary], showValue: true, valAxisHidden: true, catAxisLineShow: false, dataLabelFontSize: 10
      });
    }

    slide.addText('ENGINEER UTILISATION (%)', { x: 5.3, y: 1.5, w: 4.2, h: 0.3, fontSize: 10, bold: true, color: this.colors.secondary });
    if (engLabels.length > 0) {
      slide.addChart(this.ppt.ChartType.bar, [{ name: 'Util', labels: engLabels, values: engValues }], {
        x: 5.3, y: 1.9, w: 4.2, h: 3.2, barDir: 'col', chartColors: [this.colors.accent], showValue: true, valAxisHidden: true, catAxisLineShow: false, dataLabelFontSize: 10
      });
    }
  }

  addRecentOperations(data) {
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'Operations Log', 'Latest high-priority asset interventions.');

    const activity = data?.recentRequests || [];

    if (activity.length > 0) {
      const rows = [[
        { text: 'REQUEST ID', options: { bold: true, fill: this.colors.white, color: this.colors.textMuted, fontSize: 9 } },
        { text: 'ASSET / MODEL', options: { bold: true, fill: this.colors.white, color: this.colors.textMuted, fontSize: 9 } },
        { text: 'OWNER', options: { bold: true, fill: this.colors.white, color: this.colors.textMuted, fontSize: 9 } },
        { text: 'STATUS', options: { bold: true, fill: this.colors.white, color: this.colors.textMuted, fontSize: 9 } },
        { text: 'PRIORITY', options: { bold: true, fill: this.colors.white, color: this.colors.textMuted, fontSize: 9 } }
      ]];

      activity.slice(0, 7).forEach((a) => {
        const statusColor = a.status === 'Completed' ? this.colors.success : this.colors.primary;
        rows.push([
          { text: a.requestId || '-', options: { color: this.colors.textMain, bold: true, fontSize: 10 } },
          { text: (a.assetName || '-').toUpperCase().substring(0,30), options: { color: this.colors.textMain, fontSize: 10 } },
          { text: a.assignedEngineerName || 'Unassigned', options: { color: this.colors.textMuted, fontSize: 10 } },
          { text: a.status || 'Pending', options: { color: statusColor, bold: true, fontSize: 10 } },
          { text: a.priority || 'Normal', options: { color: this.colors.accent, bold: true, fontSize: 10 } }
        ]);
      });

      slide.addTable(rows, {
        x: 0.5, y: 1.6, w: 9, 
        border: { type: 'solid', color: this.colors.border, pt: 1 },
        fill: this.colors.white,
        padding: 8, valign: 'middle'
      });
    } else {
      slide.addText('No recent activity to display.', { x: 0.5, y: 2.5, w: 9, align: 'center', color: this.colors.textMuted });
    }
  }

  addConclusionSlide() {
    const slide = this.ppt.addSlide();
    slide.background = { color: this.colors.primary };

    // Accent Line
    slide.addShape(this.ppt.ShapeType.rect, { x: 0, y: 1.2, w: 0.15, h: 1.0, fill: { color: this.colors.accent }, line: { width: 0 } });

    slide.addText('STRATEGIC\nCONCLUSION', { 
        x: 0.6, y: 1.2, w: 9, h: 1.0, fontSize: 36, bold: true, color: this.colors.white, fontFace: this.fonts.bold 
    });

    const strategy = [
      { t: 'DIGITAL TWIN INTEGRATION', d: 'Continue mapping physical handling assets into the digital inventory.' },
      { t: 'VENDOR RATIONALIZATION', d: 'Concentrate procurement towards vendors exceeding 80% QCD thresholds.' },
      { t: 'WORKFLOW AUTOMATION', d: 'Deploy automatic ERP triggers to bypass manual PO generation delays.' }
    ];

    strategy.forEach((s, idx) => {
      const y = 2.8 + (idx * 0.8);
      
      slide.addShape(this.ppt.ShapeType.rect, {
        x: 0.6, y: y + 0.1, w: 0.05, h: 0.4, fill: { color: this.colors.accent }, line: { width: 0 }
      });

      slide.addText([
        { text: `${s.t}\n`, options: { fontSize: 12, bold: true, color: this.colors.white, fontFace: this.fonts.header } },
        { text: s.d, options: { fontSize: 10, color: 'A0AEC0', fontFace: this.fonts.body } }
      ], { x: 0.8, y, w: 8, h: 0.6, valign: 'middle' });
    });
  }
}

export const pptGenerator = new PPTGenerator();
export default pptGenerator;