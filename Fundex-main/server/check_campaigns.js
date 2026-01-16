import 'dotenv/config';
import mongoose from 'mongoose';
import Campaign from './src/models/Campaign.js';

async function checkCampaigns() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: 'fundex' });
        console.log('✅ Connected to MongoDB');

        const total = await Campaign.countDocuments();
        console.log(`Total Campaigns: ${total}`);

        const active = await Campaign.countDocuments({ status: 'active' });
        console.log(`Active Campaigns: ${active}`);

        const approved = await Campaign.countDocuments({ approvalStatus: 'approved' });
        console.log(`Approved Campaigns: ${approved}`);

        const activeAndApproved = await Campaign.countDocuments({ status: 'active', approvalStatus: 'approved' });
        console.log(`Active AND Approved Campaigns: ${activeAndApproved}`);

        // List a few campaigns to see their statuses
        const campaigns = await Campaign.find({}, 'title status approvalStatus ngoId').limit(5);
        console.log('Sample Campaigns:');
        campaigns.forEach(c => {
            console.log(`- ${c.title}: status=${c.status}, approval=${c.approvalStatus}, ngoId=${c.ngoId}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkCampaigns();
