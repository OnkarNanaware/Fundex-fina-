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

        const userBadIndex = userIndexes.find(idx => idx.key.organizationName);
        if (userBadIndex) {
            console.log(`⚠️ Found legacy index 'organizationName' in 'users'. Dropping...`);
            await usersCollection.dropIndex(userBadIndex.name);
            console.log('✅ Dropped index from users.');
        } else {
            console.log('No legacy organizationName index in users.');
        }

        // Check 'ngos' collection (just in case)
        const ngosCollection = mongoose.connection.collection('ngos');
        const ngoIndexes = await ngosCollection.indexes();
        console.log('NGO Indexes:', ngoIndexes.map(i => i.name));

        const ngoBadIndex = ngoIndexes.find(idx => idx.key.organizationName);
        if (ngoBadIndex) {
            console.log(`⚠️ Found legacy index 'organizationName' in 'ngos'. Dropping...`);
            await ngosCollection.dropIndex(ngoBadIndex.name);
            console.log('✅ Dropped index from ngos.');
        } else {
            console.log('No legacy organizationName index in ngos.');
        }

        console.log('Done checking indices.');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

dropIndices();
