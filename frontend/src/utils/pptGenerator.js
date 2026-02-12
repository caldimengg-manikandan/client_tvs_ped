import PptxGenJS from 'pptxgenjs';

/**
 * PPT Generator Utility for Dashboard Content
 * This utility captures dashboard content and generates a PowerPoint presentation
 */

class PPTGenerator {
  constructor() {
    this.ppt = new PptxGenJS();
    this.currentSlide = 0;
    this.companyColor = '0078D4'; // TVS blue color
    this.accentColor = 'FFB900'; // Gold accent color
    
    // Set presentation properties
    this.ppt.title = 'TVS Dashboard Report';
    this.ppt.company = 'TVS Motors';
    this.ppt.subject = 'Material Handling System Dashboard';
    this.ppt.author = 'TVS Executive Dashboard';
    this.ppt.layout = 'LAYOUT_16x9';
  }

  /**
   * Generate PPT from dashboard data
   * @param {Object} dashboardData - Complete dashboard data including stats, activity, trends
   * @param {Object} elements - DOM elements to capture screenshots (optional)
   */
  async generateDashboardPPT(dashboardData, elements = {}) {
    try {
      // Create cover slide
      this.createCoverSlide(dashboardData);
      
      // Add KPI summary slide
      this.createKPISlide(dashboardData.stats);
      
      // Add production workflow slide
      this.createWorkflowSlide(dashboardData.stats);
      
      // Add recent activity slide
      this.createActivitySlide(dashboardData.recentActivity);
      
      // Add breakdown slides
      this.createBreakdownSlides(dashboardData.stats);
      
      // Add trends slide
      this.createTrendsSlide(dashboardData.trends);
      
      // Save the PPT
      const fileName = `TVS_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pptx`;
      await this.ppt.writeFile({ fileName });
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating PPT:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create cover slide with dashboard title and date
   */
  createCoverSlide(dashboardData) {
    const slide = this.ppt.addSlide();
    
    // Add background
    slide.background = { color: this.companyColor };
    
    // Add title
    slide.addText('Executive Dashboard Report', {
      x: 0.5,
      y: 2.0,
      w: '90%',
      h: 1.5,
      fontSize: 36,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      fontFace: 'Arial'
    });
    
    // Add subtitle
    slide.addText('TVS Motors - Material Handling System', {
      x: 0.5,
      y: 3.5,
      w: '90%',
      h: 1.0,
      fontSize: 20,
      color: 'CCCCCC',
      align: 'center',
      fontFace: 'Arial'
    });
    
    // Add date
    slide.addText(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, {
      x: 0.5,
      y: 6.5,
      w: '90%',
      h: 0.5,
      fontSize: 14,
      color: 'CCCCCC',
      align: 'center',
      fontFace: 'Arial'
    });
    
    this.currentSlide++;
  }

  /**
   * Create KPI summary slide
   */
  createKPISlide(stats) {
    const slide = this.ppt.addSlide();
    
    // Add title
    slide.addText('Key Performance Indicators', {
      x: 0.5,
      y: 0.5,
      w: '90%',
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: '000000',
      align: 'center',
      fontFace: 'Arial'
    });
    
    if (stats?.kpiCards) {
      const kpiData = [
        { label: 'Total Requests', value: stats.kpiCards.total || 0, color: '4F46E5' },
        { label: 'Approved Requests', value: stats.kpiCards.accepted || 0, color: '10B981' },
        { label: 'Implemented Requests', value: stats.kpiCards.implemented || 0, color: 'F59E0B' },
        { label: 'Rejected Requests', value: stats.kpiCards.rejected || 0, color: 'EF4444' }
      ];
      
      // Create KPI cards in a 2x2 grid
      kpiData.forEach((kpi, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const x = col === 0 ? 0.5 : 5.0;
        const y = 1.8 + (row * 2.2);
        
        // Add colored rectangle
        slide.addShape({ shape: 'rect',
          x,
          y,
          w: 4.0,
          h: 1.8,
          fill: kpi.color,
          line: 'FFFFFF',
          lineSize: 2
        });
        
        // Add value
        slide.addText(kpi.value.toString(), {
          x: x + 0.2,
          y: y + 0.3,
          w: 3.6,
          h: 0.8,
          fontSize: 32,
          bold: true,
          color: 'FFFFFF',
          align: 'center',
          fontFace: 'Arial'
        });
        
        // Add label
        slide.addText(kpi.label, {
          x: x + 0.2,
          y: y + 1.1,
          w: 3.6,
          h: 0.5,
          fontSize: 14,
          color: 'FFFFFF',
          align: 'center',
          fontFace: 'Arial'
        });
      });
    }
    
    this.currentSlide++;
  }

  /**
   * Create production workflow slide
   */
  createWorkflowSlide(stats) {
    const slide = this.ppt.addSlide();
    
    // Add title
    slide.addText('Production Workflow Status', {
      x: 0.5,
      y: 0.5,
      w: '90%',
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: '000000',
      align: 'center',
      fontFace: 'Arial'
    });
    
    if (stats?.productionWorkflow) {
      const workflowData = Object.entries(stats.productionWorkflow).map(([stage, count]) => ({
        stage: this.formatStageName(stage),
        count,
        percentage: ((count / Object.values(stats.productionWorkflow).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
      }));
      
      // Create table
      const tableData = [
        ['Stage', 'Count', 'Percentage'],
        ...workflowData.map(({ stage, count, percentage }) => [stage, count.toString(), `${percentage}%`])
      ];
      
      slide.addTable(tableData, {
        x: 0.5,
        y: 1.5,
        w: '90%',
        colW: [4.0, 2.0, 2.0],
        border: { type: 'solid', color: '000000', pt: 1 },
        fill: 'F8F9FA',
        fontSize: 12,
        color: '000000',
        fontFace: 'Arial',
        valign: 'middle',
        align: 'left'
      });
    }
    
    this.currentSlide++;
  }

  /**
   * Create recent activity slide
   */
  createActivitySlide(recentActivity) {
    const slide = this.ppt.addSlide();
    
    // Add title
    slide.addText('Recent Activity Stream', {
      x: 0.5,
      y: 0.5,
      w: '90%',
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: '000000',
      align: 'center',
      fontFace: 'Arial'
    });
    
    if (recentActivity && recentActivity.length > 0) {
      const tableData = recentActivity.map(activity => ({
        id: activity.mhRequestId || 'N/A',
        user: activity.userName || 'N/A',
        department: activity.departmentName || 'N/A',
        status: activity.status || 'N/A',
        progress: activity.progressStatus || 'N/A',
        date: activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'N/A'
      }));
      
      // Create table
      const tableRows = [
        ['MH ID', 'User', 'Department', 'Status', 'Progress', 'Date'],
        ...tableData.map(activity => [
          activity.id,
          activity.user,
          activity.department,
          activity.status,
          activity.progress,
          activity.date
        ])
      ];
      
      slide.addTable(tableRows, {
        x: 0.5,
        y: 1.5,
        w: '90%',
        colW: [1.5, 2.0, 2.0, 1.5, 1.5, 1.5],
        border: { type: 'solid', color: '000000', pt: 1 },
        fill: 'F8F9FA',
        fontSize: 10,
        color: '000000',
        fontFace: 'Arial',
        valign: 'middle',
        align: 'left'
      });
    } else {
      slide.addText('No recent activity recorded', {
        x: 0.5,
        y: 3.0,
        w: '90%',
        h: 0.5,
        fontSize: 16,
        color: '666666',
        align: 'center',
        fontFace: 'Arial',
        italic: true
      });
    }
    
    this.currentSlide++;
  }

  /**
   * Create breakdown slides
   */
  createBreakdownSlides(stats) {
    if (stats?.additionalStats) {
      // Product Model Breakdown slide
      const productSlide = this.ppt.addSlide();
      
      productSlide.addText('Product Model Breakdown', {
        x: 0.5,
        y: 0.5,
        w: '90%',
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: '000000',
        align: 'center',
        fontFace: 'Arial'
      });
      
      if (stats.additionalStats.productBreakdown) {
        const productData = Object.entries(stats.additionalStats.productBreakdown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10); // Limit to top 10
        
        const tableData = [
          ['Product Model', 'Count'],
          ...productData
        ];
        
        productSlide.addTable(tableData, {
          x: 0.5,
          y: 1.5,
          w: '90%',
          colW: [6.0, 2.0],
          border: { type: 'solid', color: '000000', pt: 1 },
          fill: 'F8F9FA',
          fontSize: 12,
          color: '000000',
          fontFace: 'Arial',
          valign: 'middle',
          align: 'left'
        });
      }
      
      this.currentSlide++;
      
      // Request Type Breakdown slide
      const typeSlide = this.ppt.addSlide();
      
      typeSlide.addText('Request Type Breakdown', {
        x: 0.5,
        y: 0.5,
        w: '90%',
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: '000000',
        align: 'center',
        fontFace: 'Arial'
      });
      
      if (stats.additionalStats.typeBreakdown) {
        const typeData = Object.entries(stats.additionalStats.typeBreakdown)
          .sort(([,a], [,b]) => b - a);
        
        const tableData = [
          ['Request Type', 'Count'],
          ...typeData
        ];
        
        typeSlide.addTable(tableData, {
          x: 0.5,
          y: 1.5,
          w: '90%',
          colW: [6.0, 2.0],
          border: { type: 'solid', color: '000000', pt: 1 },
          fill: 'F8F9FA',
          fontSize: 12,
          color: '000000',
          fontFace: 'Arial',
          valign: 'middle',
          align: 'left'
        });
      }
      
      this.currentSlide++;
    }
  }

  /**
   * Create trends slide
   */
  createTrendsSlide(trends) {
    if (trends && trends.length > 0) {
      const slide = this.ppt.addSlide();
      
      slide.addText('Historical Trends Analysis', {
        x: 0.5,
        y: 0.5,
        w: '90%',
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: '000000',
        align: 'center',
        fontFace: 'Arial'
      });
      
      const tableData = trends.map(trend => ({
        date: trend.displayDate || 'N/A',
        total: trend.total || 0,
        accepted: trend.accepted || 0,
        active: trend.active || 0,
        rejected: trend.rejected || 0
      }));
      
      const tableRows = [
        ['Date', 'Total', 'Accepted', 'Active', 'Rejected'],
        ...tableData.map(trend => [
          trend.date,
          trend.total.toString(),
          trend.accepted.toString(),
          trend.active.toString(),
          trend.rejected.toString()
        ])
      ];
      
      slide.addTable(tableRows, {
        x: 0.5,
        y: 1.5,
        w: '90%',
        colW: [2.0, 1.5, 1.5, 1.5, 1.5],
        border: { type: 'solid', color: '000000', pt: 1 },
        fill: 'F8F9FA',
        fontSize: 10,
        color: '000000',
        fontFace: 'Arial',
        valign: 'middle',
        align: 'left'
      });
      
      this.currentSlide++;
    }
  }

  /**
   * Format stage name for display
   */
  formatStageName(stage) {
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Export singleton instance
export const pptGenerator = new PPTGenerator();
export default pptGenerator;