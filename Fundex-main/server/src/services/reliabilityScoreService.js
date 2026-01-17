/**
 * Expense Reliability Score Service
 * Calculates a comprehensive reliability score for expense submissions
 * Score: 0-100 (Higher = More Reliable)
 */

/**
 * Calculate Expense Reliability Score
 * This is a POSITIVE metric - higher scores mean more reliable expenses
 * 
 * Components:
 * 1. Document Quality (40 points) - Receipt clarity, OCR success
 * 2. Amount Accuracy (30 points) - How well claimed amount matches detected amount
 * 3. Compliance (20 points) - GST presence, proper documentation
 * 4. Spending Pattern (10 points) - Within budget, reasonable timing
 */
export const calculateReliabilityScore = (expenseData) => {
    let score = 0;
    const breakdown = {};
    const flags = [];

    // ===================================
    // 1. DOCUMENT QUALITY (0-40 points)
    // ===================================
    let documentQuality = 0;

    // OCR Text Quality (0-20 points)
    if (expenseData.ocrExtracted) {
        const textLength = expenseData.ocrExtracted.length;
        if (textLength >= 200) {
            documentQuality += 20; // Excellent OCR
        } else if (textLength >= 100) {
            documentQuality += 15; // Good OCR
        } else if (textLength >= 50) {
            documentQuality += 10; // Fair OCR
        } else {
            documentQuality += 5; // Poor OCR
            flags.push('Low OCR quality - receipt may be unclear');
        }
    } else {
        flags.push('OCR failed - manual verification required');
    }

    // Amount Detection (0-20 points)
    if (expenseData.detectedAmount) {
        documentQuality += 20; // Amount successfully detected
    } else {
        documentQuality += 5; // Amount not detected
        flags.push('Amount not auto-detected from receipt');
    }

    breakdown.documentQuality = {
        score: documentQuality,
        maxScore: 40,
        percentage: Math.round((documentQuality / 40) * 100)
    };
    score += documentQuality;

    // ===================================
    // 2. AMOUNT ACCURACY (0-30 points)
    // ===================================
    let amountAccuracy = 30; // Start with full points

    if (expenseData.detectedAmount && expenseData.claimedAmount) {
        const difference = Math.abs(expenseData.detectedAmount - expenseData.claimedAmount);
        const percentageDiff = (difference / expenseData.claimedAmount) * 100;

        if (percentageDiff <= 2) {
            amountAccuracy = 30; // Perfect match
        } else if (percentageDiff <= 5) {
            amountAccuracy = 25; // Excellent match
        } else if (percentageDiff <= 10) {
            amountAccuracy = 20; // Good match
            flags.push(`Minor amount difference: ${percentageDiff.toFixed(1)}%`);
        } else if (percentageDiff <= 20) {
            amountAccuracy = 10; // Fair match
            flags.push(`Moderate amount difference: ${percentageDiff.toFixed(1)}%`);
        } else {
            amountAccuracy = 0; // Poor match
            flags.push(`Large amount difference: ${percentageDiff.toFixed(1)}%`);
        }

        breakdown.amountAccuracy = {
            score: amountAccuracy,
            maxScore: 30,
            percentage: Math.round((amountAccuracy / 30) * 100),
            claimed: expenseData.claimedAmount,
            detected: expenseData.detectedAmount,
            difference: percentageDiff.toFixed(2) + '%'
        };
    } else {
        // If no detected amount, give partial credit
        amountAccuracy = 15;
        breakdown.amountAccuracy = {
            score: amountAccuracy,
            maxScore: 30,
            percentage: 50,
            note: 'Amount not auto-detected - manual verification needed'
        };
    }

    score += amountAccuracy;

    // ===================================
    // 3. COMPLIANCE (0-20 points)
    // ===================================
    let compliance = 0;

    // GST Number (0-15 points)
    if (expenseData.gstValidation) {
        if (expenseData.gstValidation.found) {
            if (expenseData.gstValidation.apiVerified) {
                compliance += 15; // GST found and verified
            } else {
                compliance += 12; // GST found but not verified
            }
        } else {
            compliance += 5; // No GST (might be small vendor)
            flags.push('No GST number found on receipt');
        }
    } else {
        compliance += 5;
    }

    // Receipt Completeness (0-5 points)
    if (expenseData.ocrExtracted && expenseData.ocrExtracted.length > 100) {
        compliance += 5; // Complete receipt
    } else {
        compliance += 2; // Incomplete receipt
    }

    breakdown.compliance = {
        score: compliance,
        maxScore: 20,
        percentage: Math.round((compliance / 20) * 100),
        gstFound: expenseData.gstValidation?.found || false,
        gstVerified: expenseData.gstValidation?.apiVerified || false
    };

    score += compliance;

    // ===================================
    // 4. SPENDING PATTERN (0-10 points)
    // ===================================
    let spendingPattern = 10; // Start with full points

    // Check if within budget
    if (expenseData.remainingBalance !== undefined && expenseData.claimedAmount) {
        if (expenseData.claimedAmount <= expenseData.remainingBalance) {
            spendingPattern = 10; // Within budget
        } else {
            const overspend = expenseData.claimedAmount - expenseData.remainingBalance;
            const overspendPercent = (overspend / expenseData.remainingBalance) * 100;

            if (overspendPercent <= 5) {
                spendingPattern = 7; // Slight overspend
                flags.push('Slight budget overspend');
            } else if (overspendPercent <= 10) {
                spendingPattern = 5; // Moderate overspend
                flags.push('Moderate budget overspend');
            } else {
                spendingPattern = 0; // Significant overspend
                flags.push('Significant budget overspend');
            }
        }
    }

    breakdown.spendingPattern = {
        score: spendingPattern,
        maxScore: 10,
        percentage: Math.round((spendingPattern / 10) * 100)
    };

    score += spendingPattern;

    // ===================================
    // FINAL SCORE & RATING
    // ===================================
    const finalScore = Math.min(100, Math.max(0, score));

    let rating, color, recommendation;
    if (finalScore >= 90) {
        rating = 'EXCELLENT';
        color = 'green';
        recommendation = 'Highly reliable expense - approve with confidence';
    } else if (finalScore >= 75) {
        rating = 'GOOD';
        color = 'blue';
        recommendation = 'Reliable expense - standard approval process';
    } else if (finalScore >= 60) {
        rating = 'FAIR';
        color = 'yellow';
        recommendation = 'Acceptable expense - quick verification recommended';
    } else if (finalScore >= 40) {
        rating = 'NEEDS REVIEW';
        color = 'orange';
        recommendation = 'Requires careful review before approval';
    } else {
        rating = 'POOR';
        color = 'red';
        recommendation = 'Significant concerns - thorough investigation required';
    }

    return {
        score: finalScore,
        rating,
        color,
        breakdown,
        flags,
        recommendation
    };
};

/**
 * Generate human-readable reliability report
 */
export const generateReliabilityReport = (reliabilityData) => {
    const { score, rating, breakdown, flags, recommendation } = reliabilityData;

    let report = `📊 EXPENSE RELIABILITY REPORT\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `🎯 Reliability Score: ${score}/100\n`;
    report += `⭐ Rating: ${rating}\n`;
    report += `💡 Recommendation: ${recommendation}\n\n`;

    report += `📋 Score Breakdown:\n`;
    report += `   1. Document Quality: ${breakdown.documentQuality.score}/${breakdown.documentQuality.maxScore} (${breakdown.documentQuality.percentage}%)\n`;
    report += `   2. Amount Accuracy: ${breakdown.amountAccuracy.score}/${breakdown.amountAccuracy.maxScore} (${breakdown.amountAccuracy.percentage}%)\n`;
    report += `   3. Compliance: ${breakdown.compliance.score}/${breakdown.compliance.maxScore} (${breakdown.compliance.percentage}%)\n`;
    report += `   4. Spending Pattern: ${breakdown.spendingPattern.score}/${breakdown.spendingPattern.maxScore} (${breakdown.spendingPattern.percentage}%)\n\n`;

    if (flags.length > 0) {
        report += `🚩 Notes (${flags.length}):\n`;
        flags.forEach((flag, index) => {
            report += `   ${index + 1}. ${flag}\n`;
        });
    } else {
        report += `✅ No concerns detected\n`;
    }

    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    return report;
};

export default {
    calculateReliabilityScore,
    generateReliabilityReport
};
