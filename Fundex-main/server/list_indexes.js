import mongoose from 'mongoose';
import 'dotenv/config';

const listIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        console.log('DB Name:', mongoose.connection.name);

        const usersCollection = mongoose.connection.collection('users');
        const userIndexes = await usersCollection.indexes();
        console.log('\n--- User Collection Indexes ---');
        userIndexes.forEach(idx => {
            console.log(`Name: ${idx.name}`);
            console.log(`Key:`, idx.key);
            console.log(`Unique:`, idx.unique);
            console.log('----------------');
        });

        const ngosCollection = mongoose.connection.collection('ngos');
        const ngoIndexes = await ngosCollection.indexes();
        console.log('\n--- NGO Collection Indexes ---');
        ngoIndexes.forEach(idx => {
            console.log(`Name: ${idx.name}`);
            console.log(`Key:`, idx.key);
            console.log('----------------');
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

listIndexes();
