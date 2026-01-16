import mongoose from 'mongoose';
import 'dotenv/config';

const dropIndices = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check 'users' collection
        const usersCollection = mongoose.connection.collection('users');
        const userIndexes = await usersCollection.indexes();
        console.log('User Indexes:', userIndexes.map(i => i.name));

        const userBadIndex = userIndexes.find(idx => idx.key.registrationNumber);
        if (userBadIndex) {
            console.log(`⚠️ Found index 'registrationNumber' in 'users'. Dropping...`);
            await usersCollection.dropIndex(userBadIndex.name);
            console.log('✅ Dropped index from users.');
        } else {
            console.log('No registrationNumber index in users.');
        }

        console.log('Done.');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

dropIndices();
