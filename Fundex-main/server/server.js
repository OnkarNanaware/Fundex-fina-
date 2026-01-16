// server.js
// Load dotenv FIRST - before ANY other imports
import 'dotenv/config';

// Core imports
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import donorRoutes from './src/routes/donorRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import campaignRoutes from './src/routes/campaign_routes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import fundRequestRoutes from './src/routes/fundRequestRoutes.js';
import donationRequestRoutes from './src/routes/donationRequestRoutes.js';
import ngoRoutes from './src/routes/ngoRoutes.js';
import volunteerRoutes from './src/routes/volunteerRoutes.js';
import ngoVerifyRoutes from './src/routes/ngoVerifyRoutes.js';
import notificationRoutes from './src/routes/notifications.js';
import testRoutes from './src/routes/testRoutes.js';
import adminReportRoutes from './src/routes/adminReportRoutes.js';

// Debug: Environment variables check
console.log('🔍 Environment Variables Check:');
console.log('PORT:', process.env.PORT ? '✅' : '❌');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅' : '❌');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅' : '❌');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅' : '❌');
console.log('STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? '✅' : '❌');
console.log('');

const app = express();

/* -------------------------- MIDDLEWARES -------------------------- */

// CORS
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

/* ---------------------------- ROUTES ----------------------------- */

// Auth & core modules
app.use('/api/auth', authRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/admin/reports', adminReportRoutes); // Must come before /api/admin
app.use('/api/admin', adminRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/fundrequests', fundRequestRoutes);
app.use('/api/donationrequests', donationRequestRoutes);

// NGO & Volunteer
app.use('/api/ngos', ngoRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/ngo-verify', ngoVerifyRoutes);

// Extra features
app.use('/api/notifications', notificationRoutes);
app.use('/api/test', testRoutes);

/* ------------------------ HEALTH CHECK ---------------------------- */

app.get('/', (req, res) => {
  res.json({
    message: 'Fundex API running',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/* ----------------------- ROUTE DIRECTORY -------------------------- */

app.get('/api/routes', (req, res) => {
  res.json({
    routes: [
      'POST   /api/auth/register',
      'POST   /api/auth/login',
      'GET    /api/auth/me',
      'GET    /api/auth/logout',

      'GET    /api/donor/dashboard',
      'GET    /api/donor/campaigns',
      'POST   /api/donor/donate',
      'GET    /api/donor/donations',

      'GET    /api/admin/dashboard',
      'GET    /api/admin/campaigns',
      'POST   /api/admin/campaigns',
      'PUT    /api/admin/campaigns/:id',
      'DELETE /api/admin/campaigns/:id',
      'GET    /api/admin/volunteers',
      'POST   /api/admin/requests/:id/approve',
      'POST   /api/admin/requests/:id/reject',

      'GET    /api/campaigns',
      'GET    /api/campaigns/:id',

      'POST   /api/payments/create-payment-intent',
      'POST   /api/payments/webhook',

      'GET    /api/fundrequests',
      'POST   /api/fundrequests',

      'GET    /api/donationrequests',
      'POST   /api/donationrequests',
      'GET    /api/donationrequests/search/donors',

      'GET    /api/ngos',
      'GET    /api/volunteer',

      'GET    /api/ngo-verify/:darpanId',
      'POST   /api/ngo-verify/send-otp',
      'POST   /api/ngo-verify/verify-otp',

      'GET    /api/notifications',
      'GET    /api/test',
    ],
  });
});

/* ------------------------- ERROR HANDLING ------------------------- */

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

/* -------------------------- SERVER START -------------------------- */

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'fundex',
    });

    console.log('✅ MongoDB connected');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log('\n==================================================');
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('==================================================\n');
    });
  } catch (err) {
    console.error('❌ Mongo connection error:', err);
    process.exit(1);
  }
}

// Process safety
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Closing MongoDB...');
  mongoose.connection.close(() => process.exit(0));
});

start();
