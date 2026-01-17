// server/scripts/calculateTrustScores.js
// Run this script to calculate and populate trust scores for all NGOs

import mongoose from 'mongoose';
import NGO from '../src/models/NGO.js';
import { calculateNGOTrustScore } from '../src/services/trustScoreService.js';
import dotenv from 'dotenv';

dotenv.config();

async function updateAllTrustScores() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const ngos = await NGO.find({});
        console.log(`📊 Found ${ngos.length} NGO(s) to process\n`);

        if (ngos.length === 0) {
            console.log('⚠️  No NGOs found in database');
            await mongoose.disconnect();
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const ngo of ngos) {
            try {
                console.log(`\n🔄 Processing: ${ngo.ngoName}`);

                const scoreData = await calculateNGOTrustScore(ngo._id);

                await NGO.findByIdAndUpdate(ngo._id, {
                    'trustScore.score': scoreData.trustScore,
                    'trustScore.lastCalculated': new Date(),
                    'trustScore.breakdown': scoreData.breakdown,
                    fundMetrics: scoreData.fundMetrics
                });

                console.log(`✅ ${ngo.ngoName}:`);
                console.log(`   Trust Score: ${scoreData.trustScore}/100`);
                console.log(`   Breakdown:`);
                console.log(`     - Fraud Score: ${scoreData.breakdown.fraudScore.score}/40`);
                console.log(`     - Utilization: ${scoreData.breakdown.utilization.score}/30`);
                console.log(`     - Transparency: ${scoreData.breakdown.transparency.score}/20`);
                console.log(`     - Donor Confidence: ${scoreData.breakdown.donorConfidence.score}/10`);
                console.log(`   Fund Metrics:`);
                console.log(`     - Total Raised: ₹${scoreData.fundMetrics.totalRaised.toLocaleString('en-IN')}`);
                console.log(`     - Total Spent: ₹${scoreData.fundMetrics.totalSpent.toLocaleString('en-IN')}`);
                console.log(`     - Utilization: ${scoreData.fundMetrics.utilizationPercentage}%`);

                successCount++;
            } catch (error) {
                console.error(`❌ Error updating ${ngo.ngoName}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📈 Summary:');
        console.log(`   Total NGOs: ${ngos.length}`);
        console.log(`   ✅ Successfully updated: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log('='.repeat(60) + '\n');

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        console.log('🎉 Done!');

    } catch (error) {
        console.error('❌ Fatal error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the script
updateAllTrustScores();
