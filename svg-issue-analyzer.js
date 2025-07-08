#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class SVGIssueAnalyzer {
  constructor() {
    this.reportPath = '/Users/milav/Code/studio/svg-inspection-results/inspection-report.json';
    this.screenshotsDir = '/Users/milav/Code/studio/svg-inspection-results';
  }

  analyze() {
    console.log('🔍 Analyzing SVG Issues...\n');
    
    const report = JSON.parse(fs.readFileSync(this.reportPath, 'utf8'));
    
    // Categorize issues
    const issueCategories = {
      textOverlaps: [],
      outsideViewBox: [],
      missingTitles: [],
      zeroRecommendations: []
    };

    const severityRanking = [];

    report.details.forEach(detail => {
      if (detail.issues && detail.issues.length > 0) {
        const fileIssues = {
          file: detail.file,
          screenshot: path.join(this.screenshotsDir, detail.screenshot),
          totalIssues: detail.issues.length,
          overlaps: detail.issues.filter(issue => issue.includes('overlapping')).length,
          outsideViewBox: detail.issues.filter(issue => issue.includes('outside viewBox')).length,
          allIssues: detail.issues
        };

        // Categorize by severity (number of issues)
        severityRanking.push(fileIssues);

        // Track specific issue types
        if (fileIssues.overlaps > 0) {
          issueCategories.textOverlaps.push(fileIssues);
        }
        if (fileIssues.outsideViewBox > 0) {
          issueCategories.outsideViewBox.push(fileIssues);
        }
      }
      
      if (!detail.hasTitle) {
        issueCategories.missingTitles.push(detail.file);
      }
    });

    // Sort by severity (most issues first)
    severityRanking.sort((a, b) => b.totalIssues - a.totalIssues);

    this.printSummary(report, issueCategories, severityRanking);
    this.generatePriorityFixes(severityRanking.slice(0, 10)); // Top 10 worst files
    
    return {
      report,
      issueCategories,
      severityRanking
    };
  }

  printSummary(report, categories, severityRanking) {
    console.log('📊 SUMMARY STATISTICS');
    console.log('========================');
    console.log(`Total Files Analyzed: ${report.totalFiles}`);
    console.log(`Files with Issues: ${severityRanking.length}`);
    console.log(`Files with Text Overlaps: ${categories.textOverlaps.length}`);
    console.log(`Files with Elements Outside ViewBox: ${categories.outsideViewBox.length}`);
    console.log(`Files Missing Titles: ${categories.missingTitles.length}`);
    console.log(`Total Text Elements: ${report.summary.totalTextElements}`);
    console.log(`Total Rectangle Elements: ${report.summary.totalRectElements}\n`);

    console.log('🚨 TOP 10 FILES WITH MOST ISSUES');
    console.log('===================================');
    severityRanking.slice(0, 10).forEach((file, index) => {
      console.log(`${index + 1}. ${file.file}`);
      console.log(`   📍 Issues: ${file.totalIssues} (${file.overlaps} overlaps, ${file.outsideViewBox} outside bounds)`);
      console.log(`   📸 Screenshot: ${file.screenshot}`);
      console.log('');
    });

    console.log('🎯 ISSUE BREAKDOWN BY TYPE');
    console.log('============================');
    
    console.log('\n📝 Text Overlap Issues:');
    categories.textOverlaps.slice(0, 5).forEach(file => {
      console.log(`  • ${file.file} (${file.overlaps} overlaps)`);
    });
    
    console.log('\n📏 Elements Outside ViewBox:');
    categories.outsideViewBox.slice(0, 5).forEach(file => {
      console.log(`  • ${file.file} (${file.outsideViewBox} elements)`);
    });

    console.log('\n🏷️  Files Missing Titles:');
    categories.missingTitles.slice(0, 5).forEach(file => {
      console.log(`  • ${file}`);
    });
  }

  generatePriorityFixes(topIssues) {
    console.log('\n🔧 PRIORITY FIXES RECOMMENDED');
    console.log('===============================');
    
    topIssues.forEach((file, index) => {
      console.log(`\n${index + 1}. ${file.file}`);
      console.log(`   Priority: ${this.getPriorityLevel(file.totalIssues)}`);
      console.log(`   Issues to fix:`);
      
      // Group similar issues
      const groupedIssues = this.groupIssues(file.allIssues);
      Object.entries(groupedIssues).forEach(([type, issues]) => {
        console.log(`     ${type}: ${issues.length} instances`);
        if (issues.length <= 3) {
          issues.forEach(issue => console.log(`       - ${issue}`));
        } else {
          console.log(`       - ${issues[0]}`);
          console.log(`       - ... and ${issues.length - 1} more`);
        }
      });
      
      console.log(`   Recommended actions:`);
      if (file.overlaps > 0) {
        console.log(`     • Adjust text positioning to prevent overlaps`);
        console.log(`     • Consider increasing spacing between elements`);
        console.log(`     • Review font sizes and container dimensions`);
      }
      if (file.outsideViewBox > 0) {
        console.log(`     • Expand viewBox dimensions or reposition elements`);
        console.log(`     • Check if elements are intentionally clipped`);
      }
    });
  }

  groupIssues(issues) {
    const grouped = {
      'Text Overlaps': [],
      'Outside ViewBox': [],
      'Other': []
    };

    issues.forEach(issue => {
      if (issue.includes('overlapping')) {
        grouped['Text Overlaps'].push(issue);
      } else if (issue.includes('outside viewBox')) {
        grouped['Outside ViewBox'].push(issue);
      } else {
        grouped['Other'].push(issue);
      }
    });

    // Remove empty categories
    Object.keys(grouped).forEach(key => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });

    return grouped;
  }

  getPriorityLevel(issueCount) {
    if (issueCount >= 10) return '🔴 Critical';
    if (issueCount >= 5) return '🟡 High';
    if (issueCount >= 2) return '🟢 Medium';
    return '🔵 Low';
  }
}

// Run the analyzer
const analyzer = new SVGIssueAnalyzer();
analyzer.analyze();
