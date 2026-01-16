import mongoose from 'mongoose';
import NGO from './src/models/NGO.js';
import dotenv from 'dotenv';

dotenv.config();

const checkNGOs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fundex');
        console.log('Connected to MongoDB');

        const ngos = await NGO.find({});
        console.log('\n=== All NGOs in Database ===');
        console.log(`Total NGOs: ${ngos.length}\n`);

        ngos.forEach((ngo, index) => {
            console.log(`${index + 1}. NGO Name: ${ngo.ngoName}`);
            console.log(`   Registration Number: ${ngo.ngoRegistrationNumber}`);
            console.log(`   Type: ${ngo.ngoType}`);
            console.log(`   Admin ID: ${ngo.adminId}`);
            console.log(`   Created: ${ngo.createdAt}`);
            console.log('');
        });

        // Check for the specific registration number
        const specificNGO = await NGO.findOne({ ngoRegistrationNumber: 'WB/2014/0098823' });
        if (specificNGO) {
            console.log('⚠️  Found NGO with registration number WB/2014/0098823:');
            console.log(JSON.stringify(specificNGO, null, 2));
        } else {
            console.log('✅ No NGO found with registration number WB/2014/0098823');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkNGOs();
