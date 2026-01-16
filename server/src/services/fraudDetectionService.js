/**
 * Fraud Detection Service
 * Calculates fraud scores and detects suspicious patterns in expense submissions
 */

/**
 * Calculate fraud score based on multiple factors
 * Returns a score from 0-100 (0 = no fraud indicators, 100 = high fraud risk)
 */
export const calculateFraudScore = (expenseData) => {
    let score = 0;
    const flags = [];
    const details = {};

    // Factor 1: Amount Mismatch (0-35 points) - Increased weight
    if (expenseData.detectedAmount && expenseData.claimedAmount) {
        const difference = Math.abs(expenseData.detectedAmount - expenseData.claimedAmount);
        const percentageDiff = (difference / expenseData.claimedAmount) * 100;

        if (percentageDiff > 50) {
            score += 35;
            flags.push('SEVERE_AMOUNT_MISMATCH');
            details.amountMismatch = {
                severity: 'high',
                claimed: expenseData.claimedAmount,
                detected: expenseData.detectedAmount,
                difference: difference,
                percentageDiff: percentageDiff.toFixed(2)
            };
        } else if (percentageDiff > 20) {
            score += 25;
            flags.push('MODERATE_AMOUNT_MISMATCH');
            details.amountMismatch = {
                severity: 'moderate',
                claimed: expenseData.claimedAmount,
                detected: expenseData.detectedAmount,
                difference: difference,
                percentageDiff: percentageDiff.toFixed(2)
            };
        } else if (percentageDiff > 5) {
            score += 15;
            flags.push('MINOR_AMOUNT_MISMATCH');
            details.amountMismatch = {
                severity: 'low',
                claimed: expenseData.claimedAmount,
                detected: expenseData.detectedAmount,
                difference: difference,
                percentageDiff: percentageDiff.toFixed(2)
            };
        }
    } else if (!expenseData.detectedAmount) {
        score += 20; // Increased from 15
        flags.push('NO_AMOUNT_DETECTED');
        details.ocrIssue = 'Could not detect amount from receipt';
    }

    // Factor 2: GST Validation (0-30 points) - Increased weight
    if (expenseData.gstValidation) {
        if (!expenseData.gstValidation.found) {
            score += 25; // Increased from 20
            flags.push('NO_GST_NUMBER');
            details.gstIssue = 'No GST number found on receipt';
        } else if (!expenseData.gstValidation.valid) {
            score += 30; // Increased from 25
            flags.push('INVALID_GST');
            details.gstIssue = 'GST number is invalid or not registered';
        } else if (!expenseData.gstValidation.apiVerified) {
            score += 10; // Increased from 5
            flags.push('GST_NOT_API_VERIFIED');
            details.gstIssue = 'GST format valid but could not verify online';
        }
    } else {
        score += 20; // Increased from 15
        flags.push('GST_NOT_CHECKED');
        details.gstIssue = 'GST validation was not performed';
    }

    // Factor 3: OCR Quality (0-15 points)
    if (expenseData.ocrExtracted) {
        const textLength = expenseData.ocrExtracted.length;
        if (textLength < 50) {
            score += 15;
            flags.push('LOW_OCR_QUALITY');
            details.ocrQuality = 'Very little text extracted from receipt';
        } else if (textLength < 100) {
            score += 10; // Increased from 8
            flags.push('MODERATE_OCR_QUALITY');
            details.ocrQuality = 'Limited text extracted from receipt';
        }
    } else {
        score += 15;
        flags.push('OCR_FAILED');
        details.ocrQuality = 'OCR processing failed completely';
    }

    // Factor 4: Overspending (0-20 points)
    if (expenseData.remainingBalance !== undefined && expenseData.claimedAmount) {
        if (expenseData.claimedAmount > expenseData.remainingBalance) {
            const overspend = expenseData.claimedAmount - expenseData.remainingBalance;
            score += 20;
            flags.push('OVERSPENDING');
            details.overspending = {
                claimed: expenseData.claimedAmount,
                remaining: expenseData.remainingBalance,
                overspend: overspend
            };
        }
    }

    // Determine risk level with adjusted thresholds
    let riskLevel;
    if (score >= 80) {
        riskLevel = 'CRITICAL';
    } else if (score >= 60) {
        riskLevel = 'HIGH';
    } else if (score >= 40) { // Lowered from 50
        riskLevel = 'MEDIUM';
    } else if (score >= 20) { // Lowered from 30
        riskLevel = 'LOW';
    } else {
        riskLevel = 'MINIMAL';
    }

    return {
        score: Math.min(score, 100), // Cap at 100
        riskLevel,
        flags,
        details,
        recommendation: getRecommendation(score, flags)
    };
};

/**
 * Get recommendation based on fraud score
 */
const getRecommendation = (score, flags) => {
    if (score >= 80) {
        return 'REJECT - Critical fraud risk detected. Immediate investigation required.';
    } else if (score >= 60) {
        return 'FLAG - High fraud risk. Requires thorough admin review before approval.';
    } else if (score >= 40) {
        return 'REVIEW - Moderate concerns. Admin should carefully verify all details.';
    } else if (score >= 20) {
        return 'CAUTION - Minor concerns noted. Quick admin verification recommended.';
    } else {
        return 'APPROVE - Low fraud risk. Standard verification sufficient.';
    }
};

/**
 * Generate human-readable fraud report
 */
export const generateFraudReport = (fraudAnalysis) => {
    const { score, riskLevel, flags, details, recommendation } = fraudAnalysis;

    let report = `🔍 FRAUD ANALYSIS REPORT\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📊 Fraud Score: ${score}/100\n`;
    report += `⚠️  Risk Level: ${riskLevel}\n`;
    report += `💡 Recommendation: ${recommendation}\n\n`;

    if (flags.length > 0) {
        report += `🚩 Flags Detected (${flags.length}):\n`;
        flags.forEach((flag, index) => {
            report += `   ${index + 1}. ${flag.replace(/_/g, ' ')}\n`;
        });
        report += `\n`;
    }

    if (Object.keys(details).length > 0) {
        report += `📋 Details:\n`;
        Object.entries(details).forEach(([key, value]) => {
            report += `   • ${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}\n`;
        });
    }

    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    return report;
};

export default {
    calculateFraudScore,
    generateFraudReport
};
