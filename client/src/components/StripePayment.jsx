// client/src/components/StripePayment.jsx
import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader, CreditCard, Lock } from 'lucide-react';
import './StripePayment.css';

export default function StripePayment({
  amount,
  campaignId,  // Optional: for campaign donations
  donationRequestId,  // Optional: for donation request donations
  ngoId,  // Optional: NGO ID
  campaignTitle,
  ngoName,
  onSuccess,
  onCancel
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [donorMessage, setDonorMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not loaded yet. Please wait.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      const tokenStr = localStorage.getItem('token');

      if (!userStr || !tokenStr) {
        throw new Error('Please login to donate');
      }

      const user = JSON.parse(userStr);

      // Handle both user.id and user._id
      const userId = user.id || user._id;

      if (!user || !userId) {
        console.error('❌ User object:', user);
        throw new Error('User information not found. Please login again.');
      }
      console.log('User object:', user);
      console.log('User id', userId);
      console.log("samarth");

      console.log('💳 Starting payment for:', {
        amount,
        campaignId,
        donationRequestId,
        ngoId,
        donorId: userId,
        userEmail: user.email,
        userName: user.fullName || user.donorFirstName
      });

      // Step 1: Create payment intent
      const response = await fetch('http://localhost:5000/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenStr}`
        },
        body: JSON.stringify({
          amount,
          campaignId,
          donationRequestId,
          ngoId,
          donorId: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      const paymentData = await response.json();
      console.log('✅ Payment intent created:', paymentData);

      if (!paymentData.success || !paymentData.data || !paymentData.data.clientSecret) {
        throw new Error('Invalid payment response from server');
      }

      // Step 2: Confirm card payment
      console.log('🔐 Confirming card payment...');
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: user.fullName || 'Donor',
              email: user.email
            }
          }
        }
      );

      if (stripeError) {
        console.error('❌ Stripe error:', stripeError);
        throw new Error(stripeError.message);
      }

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error('Payment was not successful');
      }

      console.log('✅ Payment confirmed:', paymentIntent.id);

      // Step 3: Confirm donation in backend
      console.log('💾 Saving donation to database...');
      const confirmResponse = await fetch('http://localhost:5000/api/payments/confirm-donation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenStr}`
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          campaignId,
          donationRequestId,
          ngoId,
          donorId: userId,
          amount,
          donorMessage,
          isAnonymous
        })
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.message || 'Failed to save donation');
      }

      const confirmData = await confirmResponse.json();
      console.log('✅ Donation saved:', confirmData);

      if (!confirmData.success) {
        throw new Error(confirmData.message || 'Failed to confirm donation');
      }

      // Success!
      console.log('🎉 Payment completed successfully!');
      onSuccess(confirmData.data);
    } catch (err) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
        iconColor: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <div className="payment-header">
        <CreditCard size={24} />
        <h3>Payment Details</h3>
      </div>

      <div className="payment-summary">
        <div className="summary-row">
          <span>Campaign</span>
          <strong>{campaignTitle}</strong>
        </div>
        <div className="summary-row">
          <span>NGO</span>
          <strong>{ngoName}</strong>
        </div>
        <div className="summary-row total">
          <span>Amount</span>
          <strong>₹{amount.toLocaleString()}</strong>
        </div>
      </div>

      <div className="form-group">
        <label>Card Details</label>
        <div className="card-element-wrapper">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="card-info">
          Use test card: <code>4242 4242 4242 4242</code>
        </p>
      </div>

      <div className="form-group">
        <label>Message (Optional)</label>
        <textarea
          placeholder="Share why you're supporting this cause..."
          value={donorMessage}
          onChange={(e) => setDonorMessage(e.target.value)}
          rows="3"
          className="message-input"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            disabled={loading}
          />
          <span>Donate anonymously</span>
        </label>
      </div>

      {error && (
        <div className="payment-error">
          ⚠️ {error}
        </div>
      )}

      <div className="payment-actions">
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-pay"
          disabled={!stripe || loading}
        >
          {loading ? (
            <>
              <Loader className="spinner" size={18} />
              Processing...
            </>
          ) : (
            <>
              <Lock size={18} />
              Pay ₹{amount.toLocaleString()}
            </>
          )}
        </button>
      </div>

      <div className="payment-security">
        <Lock size={14} />
        <span>Secured by Stripe • Test Mode</span>
      </div>
    </form>
  );
}
