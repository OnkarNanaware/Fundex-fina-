import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

class PDFService {
    generateReportPDF(reportsData, ngoName, adminEmail) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    info: {
                        Title: `${ngoName} - Financial Report`,
                        Author: 'Fundex Platform',
                        Subject: 'NGO Financial and Transparency Report'
                    }
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                const { stats, monthlyData, categoryBreakdown, donorInsights, transparencyMetrics, campaignPerformance } = reportsData;

                // Header with logo placeholder and title
                doc.fontSize(24)
                    .fillColor('#2563eb')
                    .text('FUNDEX', 50, 50)
                    .fontSize(10)
                    .fillColor('#666')
                    .text('Financial & Transparency Report', 50, 80);

                // NGO Name and Date
                doc.fontSize(18)
                    .fillColor('#000')
                    .text(ngoName, 50, 110)
                    .fontSize(10)
                    .fillColor('#666')
                    .text(`Generated on: ${new Date().toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}`, 50, 135);

                doc.moveDown(2);

                // Divider line
                doc.strokeColor('#e5e7eb')
                    .lineWidth(1)
                    .moveTo(50, doc.y)
                    .lineTo(545, doc.y)
                    .stroke();

                doc.moveDown(1);

                // Key Performance Indicators Section
                doc.fontSize(16)
                    .fillColor('#1f2937')
                    .text('Key Performance Indicators', 50, doc.y);

                doc.moveDown(0.5);

                const kpiY = doc.y;
                const kpiBoxWidth = 115;
                const kpiBoxHeight = 70;
                const kpiSpacing = 10;

                // KPI Boxes
                const kpis = [
                    { label: 'Total Funds Raised', value: `₹${(stats.totalFunds / 100000).toFixed(2)}L`, color: '#3b82f6' },
                    { label: 'Total Donors', value: donorInsights.totalDonors, color: '#10b981' },
                    { label: 'Active Campaigns', value: stats.activeCampaigns, color: '#8b5cf6' },
                    { label: 'Transparency Score', value: `${transparencyMetrics.overallScore}%`, color: '#f59e0b' }
                ];

                kpis.forEach((kpi, index) => {
                    const x = 50 + (index % 4) * (kpiBoxWidth + kpiSpacing);

                    // Box background
                    doc.rect(x, kpiY, kpiBoxWidth, kpiBoxHeight)
                        .fillAndStroke(kpi.color, kpi.color)
                        .fillOpacity(0.1);

                    // Value
                    doc.fillOpacity(1)
                        .fontSize(20)
                        .fillColor(kpi.color)
                        .text(kpi.value, x + 10, kpiY + 15, { width: kpiBoxWidth - 20, align: 'center' });

                    // Label
                    doc.fontSize(9)
                        .fillColor('#4b5563')
                        .text(kpi.label, x + 10, kpiY + 45, { width: kpiBoxWidth - 20, align: 'center' });
                });

                doc.y = kpiY + kpiBoxHeight + 20;

                // Monthly Trends Section
                if (monthlyData && monthlyData.length > 0) {
                    doc.fontSize(14)
                        .fillColor('#1f2937')
                        .text('Monthly Financial Trends (Last 6 Months)', 50, doc.y);

                    doc.moveDown(0.5);

                    // Table header
                    const tableTop = doc.y;
                    const colWidth = 80;

                    doc.fontSize(9)
                        .fillColor('#fff')
                        .rect(50, tableTop, 495, 20)
                        .fill('#4b5563');

                    doc.text('Month', 55, tableTop + 6, { width: colWidth });
                    doc.text('Donations', 135, tableTop + 6, { width: colWidth });
                    doc.text('Expenses', 215, tableTop + 6, { width: colWidth });
                    doc.text('Net', 295, tableTop + 6, { width: colWidth });
                    doc.text('Campaigns', 375, tableTop + 6, { width: colWidth });

                    let rowY = tableTop + 25;

                    monthlyData.forEach((month, index) => {
                        const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
                        doc.rect(50, rowY - 5, 495, 20).fill(bgColor);

                        doc.fillColor('#000')
                            .text(month.month, 55, rowY, { width: colWidth });
                        doc.text(`₹${(month.donations / 1000).toFixed(1)}K`, 135, rowY, { width: colWidth });
                        doc.text(`₹${(month.expenses / 1000).toFixed(1)}K`, 215, rowY, { width: colWidth });

                        const net = month.donations - month.expenses;
                        doc.fillColor(net >= 0 ? '#10b981' : '#ef4444')
                            .text(`₹${(net / 1000).toFixed(1)}K`, 295, rowY, { width: colWidth });

                        doc.fillColor('#000')
                            .text(month.campaigns, 375, rowY, { width: colWidth });

                        rowY += 20;
                    });

                    doc.y = rowY + 10;
                }

                // Category Breakdown Section
                if (categoryBreakdown && categoryBreakdown.length > 0) {
                    if (doc.y > 650) {
                        doc.addPage();
                    }

                    doc.fontSize(14)
                        .fillColor('#1f2937')
                        .text('Category Breakdown', 50, doc.y);

                    doc.moveDown(0.5);

                    categoryBreakdown.forEach((cat, index) => {
                        if (doc.y > 700) {
                            doc.addPage();
                        }

                        const barY = doc.y;
                        const barMaxWidth = 300;
                        const barHeight = 15;

                        // Category name and amount
                        doc.fontSize(10)
                            .fillColor('#000')
                            .text(cat.category, 50, barY);

                        doc.text(`₹${(cat.amount / 1000).toFixed(0)}K (${cat.percentage}%)`, 360, barY);

                        // Progress bar background
                        doc.rect(50, barY + 15, barMaxWidth, barHeight)
                            .fillAndStroke('#e5e7eb', '#e5e7eb');

                        // Progress bar fill
                        const fillWidth = (cat.percentage / 100) * barMaxWidth;
                        doc.rect(50, barY + 15, fillWidth, barHeight)
                            .fill(cat.color);

                        doc.y = barY + 35;
                    });

                    doc.moveDown(1);
                }

                // Donor Insights Section
                if (doc.y > 600) {
                    doc.addPage();
                }

                doc.fontSize(14)
                    .fillColor('#1f2937')
                    .text('Donor Insights', 50, doc.y);

                doc.moveDown(0.5);

                const donorMetrics = [
                    { label: 'Total Donors', value: donorInsights.totalDonors },
                    { label: 'New Donors', value: `+${donorInsights.newDonors}` },
                    { label: 'Recurring Donors', value: donorInsights.recurringDonors },
                    { label: 'Average Donation', value: `₹${donorInsights.averageDonation.toLocaleString()}` },
                    { label: 'Top Donation', value: `₹${donorInsights.topDonorAmount.toLocaleString()}` },
                    { label: 'Retention Rate', value: `${donorInsights.donorRetention}%` }
                ];

                const metricsPerRow = 3;
                const metricBoxWidth = 155;
                const metricBoxHeight = 50;

                donorMetrics.forEach((metric, index) => {
                    const row = Math.floor(index / metricsPerRow);
                    const col = index % metricsPerRow;
                    const x = 50 + col * (metricBoxWidth + 10);
                    const y = doc.y + row * (metricBoxHeight + 10);

                    doc.rect(x, y, metricBoxWidth, metricBoxHeight)
                        .fillAndStroke('#f3f4f6', '#e5e7eb');

                    doc.fontSize(9)
                        .fillColor('#6b7280')
                        .text(metric.label, x + 10, y + 10, { width: metricBoxWidth - 20 });

                    doc.fontSize(16)
                        .fillColor('#000')
                        .text(metric.value, x + 10, y + 25, { width: metricBoxWidth - 20 });
                });

                doc.y += Math.ceil(donorMetrics.length / metricsPerRow) * (metricBoxHeight + 10) + 20;

                // Transparency Metrics Section
                if (doc.y > 600) {
                    doc.addPage();
                }

                doc.fontSize(14)
                    .fillColor('#1f2937')
                    .text('Transparency Metrics', 50, doc.y);

                doc.moveDown(0.5);

                const transparencyData = [
                    { label: 'Overall Score', value: `${transparencyMetrics.overallScore}%` },
                    { label: 'Receipts Verified', value: transparencyMetrics.receiptsVerified },
                    { label: 'Receipts Pending', value: transparencyMetrics.receiptsPending },
                    { label: 'Fraud Cases', value: transparencyMetrics.fraudCases },
                    { label: 'GST Verified', value: `${transparencyMetrics.gstVerified}%` },
                    { label: 'AI Accuracy', value: `${transparencyMetrics.aiAccuracy}%` }
                ];

                transparencyData.forEach((metric, index) => {
                    const row = Math.floor(index / metricsPerRow);
                    const col = index % metricsPerRow;
                    const x = 50 + col * (metricBoxWidth + 10);
                    const y = doc.y + row * (metricBoxHeight + 10);

                    doc.rect(x, y, metricBoxWidth, metricBoxHeight)
                        .fillAndStroke('#f3f4f6', '#e5e7eb');

                    doc.fontSize(9)
                        .fillColor('#6b7280')
                        .text(metric.label, x + 10, y + 10, { width: metricBoxWidth - 20 });

                    doc.fontSize(16)
                        .fillColor('#000')
                        .text(metric.value, x + 10, y + 25, { width: metricBoxWidth - 20 });
                });

                doc.y += Math.ceil(transparencyData.length / metricsPerRow) * (metricBoxHeight + 10) + 20;

                // Campaign Performance Table
                if (campaignPerformance && campaignPerformance.length > 0) {
                    doc.addPage();

                    doc.fontSize(14)
                        .fillColor('#1f2937')
                        .text('Campaign Performance', 50, 50);

                    doc.moveDown(0.5);

                    // Table header
                    const tableTop = doc.y;

                    doc.fontSize(9)
                        .fillColor('#fff')
                        .rect(50, tableTop, 495, 20)
                        .fill('#4b5563');

                    doc.text('Campaign', 55, tableTop + 6, { width: 150 });
                    doc.text('Target', 210, tableTop + 6, { width: 70 });
                    doc.text('Raised', 285, tableTop + 6, { width: 70 });
                    doc.text('Progress', 360, tableTop + 6, { width: 60 });
                    doc.text('Transparency', 425, tableTop + 6, { width: 60 });
                    doc.text('Status', 490, tableTop + 6, { width: 50 });

                    let rowY = tableTop + 25;

                    campaignPerformance.slice(0, 15).forEach((campaign, index) => {
                        if (rowY > 750) {
                            doc.addPage();
                            rowY = 50;
                        }

                        const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
                        doc.rect(50, rowY - 5, 495, 20).fill(bgColor);

                        doc.fillColor('#000')
                            .fontSize(8)
                            .text(campaign.title.substring(0, 25), 55, rowY, { width: 150 });
                        doc.text(`₹${(campaign.target / 1000).toFixed(0)}K`, 210, rowY, { width: 70 });
                        doc.text(`₹${(campaign.raised / 1000).toFixed(0)}K`, 285, rowY, { width: 70 });

                        const progress = campaign.target > 0 ? Math.round((campaign.raised / campaign.target) * 100) : 0;
                        doc.text(`${progress}%`, 360, rowY, { width: 60 });
                        doc.text(`${campaign.transparency}%`, 425, rowY, { width: 60 });

                        const statusColor = campaign.status === 'active' ? '#10b981' : '#6b7280';
                        doc.fillColor(statusColor)
                            .text(campaign.status, 490, rowY, { width: 50 });

                        rowY += 20;
                    });
                }

                // Footer
                const pageCount = doc.bufferedPageRange().count;
                for (let i = 0; i < pageCount; i++) {
                    doc.switchToPage(i);
                    doc.fontSize(8)
                        .fillColor('#9ca3af')
                        .text(
                            `Page ${i + 1} of ${pageCount} | Generated by Fundex Platform | ${adminEmail}`,
                            50,
                            doc.page.height - 50,
                            { align: 'center', width: 495 }
                        );
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default new PDFService();
