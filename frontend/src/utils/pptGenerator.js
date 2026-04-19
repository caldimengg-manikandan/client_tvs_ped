import PptxGenJS from 'pptxgenjs';

/**
 * Designer-Grade PPT Generator Utility
 * Implements sophisticated master templates, high-fidelity visualizations, 
 * and strategic storytelling patterns for board-level reviews.
 */

class PPTGenerator {
  constructor() {
    this.ppt = new PptxGenJS();
    // CalTIMS Master Palette (Designer Curated)
    this.colors = {
      primary: '1E293B',    // Slate Dark (Modern Base)
      tvsBlue: '253C80',    // CalTIMS Deep Blue
      tvsRed: 'FA1102',     // CalTIMS Racing Red
      accentGold: 'F59E0B', // Strategic Gold
      surfaceHigh: 'F1F5F9',// Surface Background
      textHeavy: '0F172A',  // Midnight Text
      textLight: '64748B',  // Muted Tech Slate
      success: '10B981',    // Emerald Green
      warning: 'F59E0B',    // Amber
      danger: 'EF4444',     // Red
      white: 'FFFFFF'
    };

    this.margin = 0.5;
    this.ppt.title = 'CalTIMS PED | Executive Strategic Analytics';
    this.ppt.layout = 'LAYOUT_16x9';
  }

  /**
   * Main Generation Lifecycle
   */
  async generateDashboardPPT(dashboardData) {
    try {
      this.ppt = new PptxGenJS();
      this.ppt.layout = 'LAYOUT_16x9';

      // 1. MASTER BRANDING COVER
      this.addSlideCover();

      // 2. EXECUTIVE KPI BENTO 2.0 (Gradients + Icons)
      this.addSlideKPIBento(dashboardData.stats);

      // 3. PORTFOLIO COMPOSITION (Sunburst-style Pie)
      this.addSlidePortfolioAnalytics(dashboardData.stats);

      // 4. PIPELINE LIFECYCLE (Horizontal Process Flow)
      this.addSlideProcessFlow(dashboardData.stats);

      // 5. OPERATIONAL VELOCITY (Meter Charts)
      this.addSlideEfficiencyMetrics(dashboardData.stats);

      // 6. GROWTH TRAJECTORY (Spline Trends)
      this.addSlideHistoricalTrends(dashboardData.trends);

      // 7. STAKEHOLDER HEATMAP
      this.addSlideLoadHeatmap(dashboardData.stats);

      // 8. PRIORITY RADAR (Action Table)
      this.addSlidePriorityActions(dashboardData.stats.stageMetrics);

      // 9. RECENT MILESTONES (Zebra Table + Badges)
      this.addSlideMilestones(dashboardData.recentActivity);

      // 10. STRATEGIC VISION & CLOSURE
      this.addSlideRoadmap();

      const fileName = `CalTIMS_Executive_Strategy_V3_${new Date().toISOString().split('T')[0]}.pptx`;
      await this.ppt.writeFile({ fileName });

      return { success: true, fileName };
    } catch (error) {
      console.error('Designer PPT Generation Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Slide 1: High-Impact Master Cover
   */
  addSlideCover() {
    const slide = this.ppt.addSlide();

    // Background Split
    slide.addShape(this.ppt.ShapeType.rect, { x: 0, y: 0, w: '40%', h: '100%', fill: { color: this.colors.tvsBlue } });
    slide.addShape(this.ppt.ShapeType.rect, { x: '40%', y: 0, w: '60%', h: '100%', fill: { color: 'F8FAFC' } });

    // Design Elements
    slide.addShape(this.ppt.ShapeType.rtTriangle, { x: 3, y: 0, w: 2, h: '100%', fill: { color: this.colors.tvsBlue }, opacity: 20 });

    // Title Branding
    slide.addText('CalTIMS', {
      x: 0.5, y: 1.0, w: 3, fontSize: 14, bold: true, color: this.colors.white, letterSpacing: 3, align: 'left'
    });

    slide.addText([
      { text: 'PED EXECUTIVE\n', options: { fontSize: 44, bold: true, color: this.colors.textHeavy, breakLine: true } },
      { text: 'STRATEGIC DASHBOARD', options: { fontSize: 24, bold: false, color: this.colors.tvsBlue } }
    ], { x: 4.5, y: 1.8, w: 5, h: 2, fontFace: 'Arial', align: 'left' });

    slide.addShape(this.ppt.ShapeType.line, { x: 4.5, y: 4.3, w: 2, h: 0, line: { color: this.colors.tvsRed, width: 4 } });

    slide.addText(`DIGITAL OPS REVIEW | ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, {
      x: 4.5, y: 4.8, w: 5, fontSize: 11, color: this.colors.textLight, align: 'left'
    });
  }

  /**
   * Slide 2: Bento KPI Grid 2.0 (Premium Gradients)
   */
  addSlideKPIBento(stats) {
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'EXECUTIVE SUMMARY', 'Quarterly Performance Snapshot');

    const kpi = stats?.kpiCards || {};
    const cards = [
      { label: 'TOTAL VOLUME', val: kpi.totalRequests || 0, icon: '📈', color: this.colors.primary },
      { label: 'APPROVAL RATE', val: kpi.accepted || 0, icon: '✅', color: this.colors.success },
      { label: 'IMPLEMENTATION', val: kpi.implemented || 0, icon: '🏭', color: this.colors.warning },
      { label: 'ACTIVE FLOW', val: (kpi.totalRequests - (kpi.accepted + kpi.rejected)) || 0, icon: '🔄', color: this.colors.tvsBlue }
    ];

    cards.forEach((c, i) => {
      const x = 0.5 + (i * 2.35);
      // Premium Card Base
      slide.addShape(this.ppt.ShapeType.rect, {
        x, y: 1.3, w: 2.2, h: 1.8,
        fill: { color: c.color },
        line: { color: this.colors.white, width: 2 }
      });

      slide.addText(c.icon, { x, y: 1.4, w: 2.2, align: 'center', fontSize: 20 });
      slide.addText(c.val.toString(), { x, y: 1.8, w: 2.2, align: 'center', fontSize: 38, bold: true, color: this.colors.white });
      slide.addText(c.label, { x, y: 2.6, w: 2.2, align: 'center', fontSize: 9, bold: true, color: this.colors.white, letterSpacing: 1 });
    });

    slide.addChart(this.ppt.ChartType.bar, [{ name: 'Vol', labels: cards.map(c => c.label), values: cards.map(c => c.val) }], {
      x: 0.5, y: 3.3, w: 9, h: 2.1,
      barGapWidthPct: 60,
      chartColors: cards.map(c => c.color),
      showValue: true,
      valAxisHidden: true,
      catAxisLabelColor: this.colors.textHeavy,
      catAxisFontSize: 10
    });
  }

  /**
   * Slide 4: Strategic Process Flow
   */
  addSlideProcessFlow(stats) {
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'PROCESS LIFECYCLE', '9-Stage Operational Velocity & Queue Health');

    const workflow = stats?.productionWorkflow || {};
    const labels = Object.keys(workflow);
    const values = Object.values(workflow);

    labels.forEach((label, i) => {
      const col = i < 5 ? i : i - 5;
      const finalX = 0.5 + (col * 1.8);
      const finalY = i < 5 ? 1.5 : 3.2;

      const isActive = values[i] > 0;

      slide.addShape(this.ppt.ShapeType.rect, {
        x: finalX, y: finalY, w: 1.7, h: 1.2,
        fill: { color: isActive ? this.colors.tvsBlue : 'E2E8F0' },
        line: { color: this.colors.white, width: 2 }
      });

      slide.addText(values[i].toString(), {
        x: finalX, y: finalY + 0.2, w: 1.7, align: 'center', fontSize: 24, bold: true, color: isActive ? this.colors.white : this.colors.textLight
      });

      slide.addText(label.split('_').join(' ').toUpperCase(), {
        x: finalX, y: finalY + 0.8, w: 1.7, align: 'center', fontSize: 7, bold: true, color: isActive ? this.colors.accentGold : this.colors.textLight
      });
    });

    slide.addShape(this.ppt.ShapeType.rect, { x: 0.5, y: 4.8, w: 9, h: 0.6, fill: { color: this.colors.surfaceHigh } });
    slide.addText('STRATEGIC FOCUS: Accelerating Design & Vendor Selection stages to improve downstream implementation velocity.', {
      x: 0.7, y: 4.8, w: 8.6, h: 0.6, fontSize: 10, italic: true, valign: 'middle', color: this.colors.tvsBlue
    });
  }

  /**
   * Slide 9: Operational Milestones
   */
  addSlideMilestones(activity) {
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'OPERATIONAL MILESTONES', 'Event-log & Recent High-Value Transitions');

    if (activity?.length) {
      const rows = [[
        { text: 'ID', options: { bold: true, fill: this.colors.primary, color: this.colors.white } },
        { text: 'DEPARTMENT', options: { bold: true, fill: this.colors.primary, color: this.colors.white } },
        { text: 'OWNER', options: { bold: true, fill: this.colors.primary, color: this.colors.white } },
        { text: 'STATUS', options: { bold: true, fill: this.colors.primary, color: this.colors.white } },
        { text: 'TRANSITION DATE', options: { bold: true, fill: this.colors.primary, color: this.colors.white } }
      ]];

      activity.slice(0, 8).forEach((a, idx) => {
        const isOdd = idx % 2 !== 0;
        const statusColor = a.status === 'Accepted' ? this.colors.success : this.colors.tvsBlue;

        rows.push([
          { text: a.mhRequestId || '-', options: { fill: isOdd ? 'F8FAFC' : 'FFFFFF' } },
          { text: (a.departmentName || 'PED').toUpperCase(), options: { fill: isOdd ? 'F8FAFC' : 'FFFFFF' } },
          { text: a.userName || 'System', options: { fill: isOdd ? 'F8FAFC' : 'FFFFFF' } },
          { text: a.status || 'Active', options: { color: statusColor, bold: true, fill: isOdd ? 'F8FAFC' : 'FFFFFF' } },
          { text: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-', options: { fill: isOdd ? 'F8FAFC' : 'FFFFFF' } }
        ]);
      });

      slide.addTable(rows, {
        x: 0.5, y: 1.5, w: 9, fontSize: 10,
        border: { type: 'solid', color: 'E2E8F0', pt: 1 },
        padding: 10, valign: 'middle', align: 'center'
      });
    }
  }

  /**
   * Slide 10: Roadmap
   */
  addSlideRoadmap() {
    const slide = this.ppt.addSlide();
    slide.addShape(this.ppt.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: this.colors.primary } });

    slide.addShape(this.ppt.ShapeType.rtTriangle, { x: 6, y: 0, w: 4, h: 5.6, fill: { color: this.colors.white, opacity: 5 }, flipV: true });

    slide.addText('FUTURE STRATEGY', { x: 0.5, y: 1.0, w: 9, fontSize: 36, bold: true, color: this.colors.white, align: 'center' });
    slide.addShape(this.ppt.ShapeType.line, { x: 3.5, y: 1.7, w: 3, h: 0, line: { color: this.colors.accentGold, width: 3 } });

    const strategy = [
      { t: 'Phase 1: Digital Asset Twins', d: 'Mirroring physical handling assets into digital inventory with real-time health tracking.' },
      { t: 'Phase 2: AI Vendor Grading', d: 'Automated performance scoring based on lead-time and implementation quality APIs.' },
      { t: 'Phase 3: Hyper-Automation', d: 'Closing the loop between request raising and vendor PO via integrated ERP triggers.' }
    ];

    strategy.forEach((s, idx) => {
      const y = 2.2 + (idx * 1.1);
      slide.addShape(this.ppt.ShapeType.rect, { x: 1, y, w: 8, h: 0.9, fill: { color: this.colors.white, opacity: 8 } });
      slide.addText([
        { text: `${s.t}:\n`, options: { fontSize: 14, bold: true, color: this.colors.accentGold } },
        { text: s.d, options: { fontSize: 11, color: this.colors.white } }
      ], { x: 1.2, y, w: 7.6, h: 0.9, valign: 'middle' });
    });

    slide.addText('CalTIMS | PROCESS ENGINEERING DIVISION 2026', {
      x: 0, y: 5.2, w: '100%', align: 'center', fontSize: 10, color: '888888', letterSpacing: 2
    });
  }

  /**
   * Master Layout Utility
   */
  applyMasterLayout(slide, title, subtitle) {
    slide.addShape(this.ppt.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1, fill: { color: this.colors.surfaceHigh } });
    slide.addShape(this.ppt.ShapeType.line, { x: 0, y: 1, w: '100%', h: 0, line: { color: this.colors.tvsBlue, width: 3 } });

    slide.addText('CalTIMS PED', { x: 8.5, y: 0.2, w: 1, fontSize: 12, bold: true, color: this.colors.tvsBlue, align: 'right' });
    slide.addText(title, { x: 0.5, y: 0.25, w: 7, fontSize: 22, bold: true, color: this.colors.textHeavy, align: 'left', fit: 'shrink' });
    slide.addText(subtitle, { x: 0.5, y: 0.65, w: 7, fontSize: 9, italic: true, color: this.colors.textLight, align: 'left' });

    slide.addShape(this.ppt.ShapeType.rect, { x: 0, y: 5.4, w: '100%', h: 0.225, fill: { color: this.colors.primary } });
    slide.addText(`STRATEGIC REVIEW | CONFIDENTIAL | PAGE ${this.ppt.slides.length}`, {
      x: 0, y: 5.4, w: '100%', align: 'center', fontSize: 7, color: 'AAAAAA', valign: 'middle'
    });
  }

  /**
   * Portfolio Slide
   */
  addSlidePortfolioAnalytics(stats) {
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'MANAGEMENT PORTFOLIO', 'Categorization Analysis of Active Requirements');

    const types = stats?.additionalStats?.typeBreakdown || {};
    const labels = Object.keys(types);
    const values = Object.values(types);

    if (values.length > 0) {
      slide.addChart(this.ppt.ChartType.pie, [{ name: 'Type', labels, values }], {
        x: 0.5, y: 1.5, w: 5, h: 3.5,
        showPercent: true,
        showLegend: true,
        legendPos: 'b',
        legendFontSize: 9,
        chartColors: [this.colors.tvsBlue, this.colors.tvsRed, this.colors.accentGold, this.colors.primary, this.colors.success]
      });

      slide.addShape(this.ppt.ShapeType.rect, { x: 5.8, y: 1.5, w: 3.5, h: 3.5, fill: { color: this.colors.surfaceHigh } });
      slide.addText('PORTFOLIO INSIGHTS', { x: 6.0, y: 1.7, w: 3.1, fontSize: 13, bold: true, color: this.colors.tvsBlue, align: 'center' });

      const insight = `Requirement diversity is currently controlled. "${labels[values.indexOf(Math.max(...values))]}" represents the core operational focus this period.`;
      slide.addText(insight, { x: 6.0, y: 2.2, w: 3.1, fontSize: 10, align: 'left', color: this.colors.textHeavy, fit: 'shrink' });
    }
  }

  /**
   * Slide 5: Efficiency Metrics
   */
  addSlideEfficiencyMetrics(stats) {
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'OPERATIONAL VELOCITY', 'Lead-time Compliance & Scale Benchmarks');

    const efficiency = stats?.additionalStats || {};
    slide.addChart(this.ppt.ChartType.bar, [{ name: 'Comp', labels: ['Current'], values: [efficiency.completionRate || 0] }], {
      x: 0.5, y: 1.5, w: 4, h: 3.5, barDir: 'bar', valAxisMaxVal: 100, chartColors: [this.colors.success], showValue: true
    });

    slide.addText('AVG PROCESSING CYCLE', { x: 5.5, y: 1.8, w: 3.5, fontSize: 12, bold: true, color: this.colors.textLight, align: 'center' });
    slide.addText(`${efficiency.avgProcessingTime || 0} DAYS`, { x: 5.5, y: 2.3, w: 3.5, fontSize: 54, bold: true, color: this.colors.tvsBlue, align: 'center' });

    slide.addShape(this.ppt.ShapeType.rect, { x: 5.5, y: 3.5, w: 3.5, h: 1, fill: { color: this.colors.primary, opacity: 5 } });
    slide.addText('TARGET KPI: 12.0 DAYS', { x: 5.5, y: 3.6, w: 3.5, fontSize: 11, bold: true, color: this.colors.textHeavy, align: 'center' });
  }

  /**
   * Slide 6: Historical Trajectory
   */
  addSlideHistoricalTrends(trends) {
    if (!trends?.length) return;
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'GROWTH TRAJECTORY', 'Monthly Volume Analysis & Approvals');

    slide.addChart(this.ppt.ChartType.line, [
      { name: 'Raised', labels: trends.map(t => t.displayDate), values: trends.map(t => t.total) },
      { name: 'Strategic', labels: trends.map(t => t.displayDate), values: trends.map(t => t.accepted) }
    ], {
      x: 0.5, y: 1.5, w: 9, h: 3.8, showLegend: true, legendPos: 't',
      chartColors: [this.colors.tvsBlue, this.colors.success],
      lineDataSymbol: 'circle', markerSize: 6,
      catAxisLabelColor: this.colors.textLight, catAxisFontSize: 8
    });
  }

  /**
   * Slide 7: Load Heatmap
   */
  addSlideLoadHeatmap(stats) {
    if (!stats?.additionalStats) return;
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'STAKEHOLDER LOAD', 'Heatmap Strategy for Departments & Product Classes');

    const deptData = Object.entries(stats.additionalStats.deptBreakdown || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const prodData = Object.entries(stats.additionalStats.productBreakdown || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

    slide.addText('DEPT CONCENTRATION', { x: 0.5, y: 1.35, w: 4, fontSize: 11, bold: true, color: this.colors.tvsBlue });
    slide.addChart(this.ppt.ChartType.bar, [{ name: 'L', labels: deptData.map(d => d[0]), values: deptData.map(d => d[1]) }], {
      x: 0.5, y: 1.6, w: 4.2, h: 3.5, barDir: 'bar', chartColors: [this.colors.tvsRed], catAxisFontSize: 8, showValue: true
    });

    slide.addText('MODEL PREVALENCE', { x: 5.3, y: 1.35, w: 4, fontSize: 11, bold: true, color: this.colors.tvsBlue });
    slide.addChart(this.ppt.ChartType.bar, [{ name: 'V', labels: prodData.map(p => p[0]), values: prodData.map(p => p[1]) }], {
      x: 5.3, y: 1.6, w: 4.2, h: 3.5, barDir: 'bar', chartColors: [this.colors.accentGold], catAxisFontSize: 8, showValue: true
    });
  }

  /**
   * Slide 8: Priority Matrix
   */
  addSlidePriorityActions(stageMetrics) {
    const slide = this.ppt.addSlide();
    this.applyMasterLayout(slide, 'STRATEGIC RADAR', 'Critical Requirements Mapping & Urgent Release Phase');

    const pending = stageMetrics?.designRelease?.pendingList?.slice(0, 5) || [];
    if (pending.length > 0) {
      const rows = [[{ text: 'REQUEST ID', options: { bold: true, fill: this.colors.tvsRed, color: this.colors.white } }, { text: 'TECHNICAL SCOPE / DESCRIPTION', options: { bold: true, fill: this.colors.tvsRed, color: this.colors.white } }]];
      pending.forEach(item => {
        rows.push([{ text: item.id || '-', options: { bold: true } }, item.name || 'Critical Scope Review Required']);
      });

      slide.addTable(rows, { x: 0.5, y: 1.5, w: 9, fontSize: 11, border: { type: 'solid', color: 'E2E8F0', pt: 1 }, padding: 12 });
    } else {
      slide.addShape(this.ppt.ShapeType.rect, { x: 2, y: 2.5, w: 6, h: 1.5, fill: { color: this.colors.success, opacity: 10 } });
      slide.addText('OPERATIONAL STATUS: OPTIMAL\nAll pending design releases are currently synchronized.', {
        x: 2, y: 2.5, w: 6, h: 1.5, align: 'center', bold: true, color: this.colors.success
      });
    }
  }
}

export const pptGenerator = new PPTGenerator();
export default pptGenerator;