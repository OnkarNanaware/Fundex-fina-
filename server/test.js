// test_import.js
import dotenv from 'dotenv';
dotenv.config();

console.log('Stripe key exists:', !!process.env.STRIPE_SECRET_KEY);

// Test import
try {
  const module = await import('./src/config/stripe.js');
  console.log('✅ stripe.js import successful');
  console.log('Exports:', Object.keys(module));
} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('Full error:', error);
}