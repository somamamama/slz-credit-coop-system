import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// no navigation needed in this file currently
import Header from '../components/Header';
import './Payment.css';

const Payment = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [, setCheckoutUrl] = useState(null);

  // PayMongo API key should be stored in environment variables
  // PayMongo secret must be set server-side (PAYMONGO_SECRET_KEY). The client should not contain secrets.

  useEffect(() => {
    if (user && user.loan && user.loan.monthly_payment) {
      const monthlyPaymentNum = Number(user.loan.monthly_payment);
      setAmount(monthlyPaymentNum.toFixed(2));
    }
  }, [user]);

  // Create PayMongo Payment Intent
  const createPaymentIntent = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setSubmitStatus({ type: 'error', message: 'Please enter a valid amount.' });
      return;
    }

    setIsProcessing(true);
    setSubmitStatus(null);

    try {
      // Convert amount to cents (PayMongo expects amounts in centavos)
      const amountInCents = Math.round(parseFloat(amount) * 100);

      // Call server to create payment intent + checkout session (server holds secret)
      const payload = {
        amount_in_cents: amountInCents,
        payment_method: paymentMethod,
        success_url: `${window.location.origin}/payment-success`,
        cancel_url: `${window.location.origin}/payment`,
        application_id: user?.loan?.application_id || null,
        member_number: user?.member_number || user?.member_number || null
      };

      const resp = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Parse response safely: handle non-JSON (HTML error pages) to give a readable message
      const contentType = resp.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await resp.json();
      } else {
        const text = await resp.text();
        // If response is not JSON, treat as error and surface text
        throw new Error(text || 'Unexpected non-JSON response from server');
      }

      if (!resp.ok) {
        throw new Error(data.message || 'Failed to create payment session');
      }

      // Redirect to checkout URL provided by server
      setCheckoutUrl(data.checkout_url);
      setSubmitStatus({ type: 'success', message: 'Payment session created! Redirecting...' });
      setTimeout(() => {
        if (data.checkout_url) window.location.href = data.checkout_url;
      }, 700);
    } catch (error) {
      setSubmitStatus({ type: 'error', message: error.message || 'Payment creation failed.' });
      setIsProcessing(false);
    }
  };

  // Checkout session creation is handled on the server (/api/payments/create).

  return (
    <div className="payment-page">
      <Header />
      <main className="payment-main">
        <div className="container">
          <div className="page-header">
            <h1>💳 Make a Payment</h1>
            <p>Secure payment processing powered by PayMongo</p>
          </div>

          <div className="grid grid-1">
            <div className="card">
              <h2>Payment Details</h2>
              
              <div className="form-group">
                <label htmlFor="amount">Amount (PHP)</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  readOnly
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="payment-method">Payment Method</label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-select"
                >
                  <option value="gcash">GCash</option>
                  <option value="grab_pay">GrabPay</option>
                  <option value="paymaya">Maya</option>
                  <option value="card">Credit/Debit Card</option>
                </select>
              </div>

              <div className="payment-method-info">
                {paymentMethod === 'gcash' && (
                  <div className="method-info">
                    <div className="method-icon">📱</div>
                    <div>
                      <h4>GCash</h4>
                      <p>Pay securely using your GCash wallet</p>
                    </div>
                  </div>
                )}
                {paymentMethod === 'grab_pay' && (
                  <div className="method-info">
                    <div className="method-icon">🚗</div>
                    <div>
                      <h4>GrabPay</h4>
                      <p>Pay using your GrabPay wallet</p>
                    </div>
                  </div>
                )}
                {paymentMethod === 'paymaya' && (
                  <div className="method-info">
                    <div className="method-icon">💰</div>
                    <div>
                      <h4>Maya</h4>
                      <p>Pay using your Maya wallet</p>
                    </div>
                  </div>
                )}
                {paymentMethod === 'card' && (
                  <div className="method-info">
                    <div className="method-icon">💳</div>
                    <div>
                      <h4>Credit/Debit Card</h4>
                      <p>Pay using Visa, Mastercard, or JCB</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="submit-section">
                <button
                  onClick={createPaymentIntent}
                  disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
                  className={`btn btn-primary btn-lg ${isProcessing ? 'loading' : ''}`}
                >
                  {isProcessing ? 'Processing...' : `Pay ₱${amount || '0.00'}`}
                </button>
              </div>

              {submitStatus && (
                <div className={`status-message ${submitStatus.type}`}>
                  {submitStatus.type === 'error' ? '❌' : submitStatus.type === 'success' ? '✅' : '⏳'} {submitStatus.message}
                </div>
              )}

              <div className="payment-security">
                <div className="security-badges">
                  <span className="security-badge">🔒 SSL Secured</span>
                  <span className="security-badge">🛡️ PayMongo Protected</span>
                  <span className="security-badge">✅ PCI Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;