import 'dotenv/config';
import mongoose from 'mongoose';
import Campaign from './src/models/Campaign.js';
import User from './src/models/User.js';

async function fixCampaigns() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: 'fundex' });
        console.log('✅ Connected to MongoDB');

        // Find active campaigns that are pending
        const pendingCampaigns = await Campaign.find({
            status: 'active',
            approvalStatus: 'pending'
        });

        console.log(`Found ${pendingCampaigns.length} active but pending campaigns.`);

        if (pendingCampaigns.length === 0) {
            console.log('No campaigns to fix.');
            return;
        }

        const admin = await User.findOne({ role: 'admin' });
        const approvedBy = admin ? admin._id : pendingCampaigns[0].createdBy; // Fallback to creator if no admin found

        for (const campaign of pendingCampaigns) {
            campaign.approvalStatus = 'approved';
            campaign.approvedBy = approvedBy;
            campaign.approvedAt = new Date();
            admin ? console.log(`Approving campaign: ${campaign.title} by Admin`) : console.log(`Approving campaign: ${campaign.title} (Fallback approver)`);
            await campaign.save();
        }

        console.log('✅ All pending campaigns have been approved.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

fixCampaigns();
