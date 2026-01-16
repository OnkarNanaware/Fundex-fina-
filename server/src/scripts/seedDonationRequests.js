// server/src/scripts/seedDonationRequests.js
import 'dotenv/config';
import mongoose from 'mongoose';
import DonationRequest from '../models/DonationRequest.js';

const sampleDonationRequests = [
    {
        ngoName: "Hope Foundation",
        purpose: "Medical Equipment for Rural Clinic",
        description: "We need urgent funding to purchase essential medical equipment for our rural health clinic serving 5000+ villagers. The equipment includes ECG machines, oxygen concentrators, and basic diagnostic tools.",
        category: "Healthcare",
        requestedAmount: 250000,
        fundedAmount: 75000,
        location: {
            city: "Pune",
            state: "Maharashtra",
            country: "India"
        },
        status: "active",
        urgency: "high",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        images: [
            "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800",
            "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800"
        ],
        volunteersAssigned: 3,
        receiptsSubmitted: 5,
        aiSummary: "Urgent medical equipment needed for rural clinic. High impact on 5000+ villagers. Verified by AI.",
        impact: "Will provide healthcare access to 5000+ rural residents",
        approvalStatus: "approved",
        approvedAt: new Date()
    },
    {
        ngoName: "Education for All",
        purpose: "Computer Lab for Government School",
        description: "Setting up a computer lab with 20 computers for underprivileged students in a government school. This will enable digital literacy for 500+ students.",
        category: "Education",
        requestedAmount: 400000,
        fundedAmount: 120000,
        location: {
            city: "Bangalore",
            state: "Karnataka",
            country: "India"
        },
        status: "active",
        urgency: "medium",
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        images: [
            "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800"
        ],
        volunteersAssigned: 5,
        receiptsSubmitted: 8,
        aiSummary: "Computer lab setup for 500+ students. Medium urgency. AI verified.",
        impact: "Will enable digital literacy for 500+ underprivileged students",
        approvalStatus: "approved",
        approvedAt: new Date()
    },
    {
        ngoName: "Green Earth Initiative",
        purpose: "Tree Plantation Drive - 10,000 Trees",
        description: "Large-scale tree plantation drive to combat deforestation and improve air quality. We aim to plant 10,000 native trees across degraded forest areas.",
        category: "Environment",
        requestedAmount: 150000,
        fundedAmount: 90000,
        location: {
            city: "Dehradun",
            state: "Uttarakhand",
            country: "India"
        },
        status: "active",
        urgency: "medium",
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        images: [
            "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800"
        ],
        volunteersAssigned: 12,
        receiptsSubmitted: 15,
        aiSummary: "Environmental restoration project. 10,000 trees to be planted. AI verified.",
        impact: "Will plant 10,000 trees and improve air quality for thousands",
        approvalStatus: "approved",
        approvedAt: new Date()
    },
    {
        ngoName: "Feed the Hungry",
        purpose: "Monthly Food Distribution for 200 Families",
        description: "Provide monthly food rations to 200 underprivileged families including rice, lentils, oil, and essential groceries for 3 months.",
        category: "Food & Nutrition",
        requestedAmount: 180000,
        fundedAmount: 45000,
        location: {
            city: "Delhi",
            state: "Delhi",
            country: "India"
        },
        status: "active",
        urgency: "high",
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        images: [
            "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800"
        ],
        volunteersAssigned: 8,
        receiptsSubmitted: 12,
        aiSummary: "Urgent food distribution for 200 families. High priority. AI verified.",
        impact: "Will provide food security for 200 families for 3 months",
        approvalStatus: "approved",
        approvedAt: new Date()
    },
    {
        ngoName: "Clean Water Mission",
        purpose: "Water Purification System for Village",
        description: "Install a community water purification system to provide clean drinking water to 1000+ villagers who currently rely on contaminated water sources.",
        category: "Water & Sanitation",
        requestedAmount: 300000,
        fundedAmount: 150000,
        location: {
            city: "Jaipur",
            state: "Rajasthan",
            country: "India"
        },
        status: "active",
        urgency: "high",
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        images: [
            "https://images.unsplash.com/photo-1541844053589-346841d0b34c?w=800"
        ],
        volunteersAssigned: 4,
        receiptsSubmitted: 6,
        aiSummary: "Critical water purification project for 1000+ villagers. High urgency. AI verified.",
        impact: "Will provide clean water access to 1000+ villagers",
        approvalStatus: "approved",
        approvedAt: new Date()
    },
    {
        ngoName: "Animal Rescue Center",
        purpose: "Shelter Expansion for Rescued Animals",
        description: "Expand our animal shelter to accommodate 50 more rescued street animals. Includes construction of kennels, medical facility, and feeding area.",
        category: "Animal Welfare",
        requestedAmount: 220000,
        fundedAmount: 65000,
        location: {
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India"
        },
        status: "active",
        urgency: "medium",
        deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days from now
        images: [
            "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800"
        ],
        volunteersAssigned: 6,
        receiptsSubmitted: 10,
        aiSummary: "Animal shelter expansion project. Medium priority. AI verified.",
        impact: "Will provide shelter and care for 50+ rescued animals",
        approvalStatus: "approved",
        approvedAt: new Date()
    },
    {
        ngoName: "Skill Development Foundation",
        purpose: "Vocational Training for 100 Youth",
        description: "3-month vocational training program in tailoring, electrical work, and plumbing for 100 unemployed youth from economically weaker sections.",
        category: "Education",
        requestedAmount: 350000,
        fundedAmount: 0,
        location: {
            city: "Kolkata",
            state: "West Bengal",
            country: "India"
        },
        status: "active",
        urgency: "low",
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        images: [
            "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800"
        ],
        volunteersAssigned: 7,
        receiptsSubmitted: 3,
        aiSummary: "Vocational training for unemployed youth. Low urgency. AI verified.",
        impact: "Will provide employable skills to 100 unemployed youth",
        approvalStatus: "approved",
        approvedAt: new Date()
    },
    {
        ngoName: "Child Care Foundation",
        purpose: "Educational Supplies for Orphanage",
        description: "Purchase books, stationery, school uniforms, and bags for 80 children in our orphanage for the upcoming academic year.",
        category: "Education",
        requestedAmount: 120000,
        fundedAmount: 120000,
        location: {
            city: "Hyderabad",
            state: "Telangana",
            country: "India"
        },
        status: "completed",
        urgency: "low",
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Completed 5 days ago
        images: [
            "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800"
        ],
        volunteersAssigned: 4,
        receiptsSubmitted: 20,
        aiSummary: "Educational supplies for orphanage children. Completed successfully. AI verified.",
        impact: "Provided educational materials for 80 orphan children",
        approvalStatus: "approved",
        approvedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    }
];

async function seedDonationRequests() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'fundex',
        });
        console.log('✅ MongoDB connected');

        // Clear existing donation requests
        await DonationRequest.deleteMany({});
        console.log('🗑️  Cleared existing donation requests');

        // Insert sample data
        const inserted = await DonationRequest.insertMany(sampleDonationRequests);
        console.log(`✅ Inserted ${inserted.length} donation requests`);

        // Display summary
        console.log('\n📊 Summary:');
        console.log(`   Active: ${inserted.filter(r => r.status === 'active').length}`);
        console.log(`   Completed: ${inserted.filter(r => r.status === 'completed').length}`);
        console.log(`   High Urgency: ${inserted.filter(r => r.urgency === 'high').length}`);
        console.log(`   Total Amount Requested: ₹${inserted.reduce((sum, r) => sum + r.requestedAmount, 0).toLocaleString()}`);
        console.log(`   Total Amount Funded: ₹${inserted.reduce((sum, r) => sum + r.fundedAmount, 0).toLocaleString()}`);

        console.log('\n✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedDonationRequests();
