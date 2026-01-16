import mongoose from 'mongoose';
import 'dotenv/config';

const dropIndices = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const ngosCollection = mongoose.connection.collection('ngos');

        try {
            console.log("Dropping 'registrationNumber_1' from 'ngos'...");
            await ngosCollection.dropIndex('registrationNumber_1');
            console.log('✅ Dropped registrationNumber_1');
        } catch (e) {
            console.log('Could not drop registrationNumber_1 (maybe not found):', e.message);
        }

        /* 
        Also dropping email_1 from ngos as it seems wrong (User has email, NGO has adminId) 
        If NGO.js doesn't have email field, this index is useless/harmful.
        */
        try {
            console.log("Dropping 'email_1' from 'ngos'...");
            await ngosCollection.dropIndex('email_1');
            console.log('✅ Dropped email_1');
        } catch (e) {
            console.log('Could not drop email_1:', e.message);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

dropIndices();
