// server/scripts/calculateExpenseFraudScores.js
// Run this to calculate fraud scores for existing expenses

import mongoose from 'mongoose';
import Expense from '../src/models/Expense.js';
import { calculateFraudScore } from '../src/services/fraudDetectionService.js';
import dotenv from 'dotenv';

dotenv.config();

async function updateExpenseFraudScores() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find expenses without fraud scores or with score = 0
    const expenses = await Expense.find({
      $or: [
        { fraudScore: { $exists: false } },
        { fraudScore: 0 }
      ]
    });
    
    console.log(`📊 Found ${expenses.length} expense(s) to update\n`);
    
    if (expenses.length === 0) {
      console.log('✅ All expenses already have fraud scores!');
      await mongoose.disconnect();
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const expense of expenses) {
      try {
        console.log(`\n🔄 Processing expense: ${expense._id}`);
        console.log(`   Amount: ₹${expense.amountSpent}`);
        console.log(`   Detected Amount: ${expense.detectedAmount ? `₹${expense.detectedAmount}` : 'N/A'}`);
        console.log(`   GST: ${expense.gstNumber || 'N/A'}`);
        
        // Calculate fraud score based on available data
        const fraudAnalysis = calculateFraudScore({
          claimedAmount: expense.amountSpent || 0,
          detectedAmount: expense.detectedAmount || null,
          gstValidation: {
            found: !!expense.gstNumber,
            valid: expense.gstValid !== false, // Assume valid if not explicitly false
            extracted: expense.gstNumber
          },
          ocrExtracted: expense.ocrExtracted || '',
          remainingBalance: 10000 // Default value since we don't have request context
        });
        
        console.log(`   📊 Calculated Fraud Score: ${fraudAnalysis.score}/100`);
        console.log(`   🎯 Risk Level: ${fraudAnalysis.riskLevel}`);
        console.log(`   ✅ Trust Score: ${100 - fraudAnalysis.score}/100`);
        
        // Update the expense
        await Expense.findByIdAndUpdate(expense._id, {
          fraudScore: fraudAnalysis.score,
          fraudRiskLevel: fraudAnalysis.riskLevel,
          fraudAnalysis: {
            flags: fraudAnalysis.flags,
            details: fraudAnalysis.details,
            recommendation: fraudAnalysis.recommendation
          },
          verificationStatus: fraudAnalysis.score >= 50 ? 'flagged' : expense.verificationStatus || 'pending'
        });
        
        console.log(`   ✅ Updated successfully`);
        successCount++;
        
      } catch (error) {
        console.error(`   ❌ Error updating expense ${expense._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 Summary:');
    console.log(`   Total Expenses: ${expenses.length}`);
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    console.log('🎉 Done! Refresh your admin dashboard to see updated trust scores.');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
updateExpenseFraudScores();
