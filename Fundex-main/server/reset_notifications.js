
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Notification from './src/models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '.env') });

const resetNotifications = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected');

        // Count existing
        const count = await Notification.countDocuments();
        console.log(`📊 Found ${count} existing notifications`);

        // Delete all
        if (count > 0) {
            console.log('🗑️ Deleting all notifications...');
            await Notification.deleteMany({});
            console.log('✅ All notifications deleted');
        } else {
            console.log('✨ No notifications to delete');
        }

        console.log('\n✅ Database clean. You can now test new notification filtering logic.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

resetNotifications();
