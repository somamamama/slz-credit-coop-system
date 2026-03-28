import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmResult, setConfirmResult] = useState(null);
  const navigate = useNavigate();

  // Payment details and verification are performed server-side to avoid exposing secret keys.

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent_id');
    const checkoutSessionId = searchParams.get('checkout_session_id');
    // application_id and member_number are read when confirming the payment later
    if (paymentIntentId) {
      fetchPaymentDetails(paymentIntentId);
    } else if (checkoutSessionId) {
      fetchCheckoutSessionDetails(checkoutSessionId);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchPaymentDetails = async (paymentIntentId) => {
    try {
      // Fetch payment details from server (server will use secret)
      const response = await fetch(`/api/payments/details?payment_intent_id=${encodeURIComponent(paymentIntentId)}`);
      const ct = response.headers.get('content-type') || '';
      let json = null;
      if (ct.includes('application/json')) {
        json = await response.json();
      } else {
        const txt = await response.text();
        console.warn('Non-JSON response fetching payment details:', txt);
        setLoading(false);
        return;
      }
      if (response.ok && json.success && json.data) {
        // The server returns paymongo payload at json.data
        setPaymentDetails(json.data.data);
        // Notify server to record and apply payment (wait for result)
        try {
          const appId = searchParams.get('application_id') || null;
          const mNum = searchParams.get('member_number') || null;
          const confResp = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_intent_id: json.data.data.id, application_id: appId, member_number: mNum })
          });
          const confCt = confResp.headers.get('content-type') || '';
          let confJson = null;
          if (confCt.includes('application/json')) confJson = await confResp.json();
          if (confResp.ok && confJson && confJson.success) {
            setConfirmResult({ success: true, data: confJson });
          } else {
            setConfirmResult({ success: false, data: confJson || { message: 'Unknown error' }, status: confResp.status });
            console.warn('Payment confirmation returned non-success:', confJson || await confResp.text());
          }
        } catch (err) {
          console.warn('Server payment confirmation failed:', err);
          setConfirmResult({ success: false, error: String(err) });
        }
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckoutSessionDetails = async (checkoutSessionId) => {
    try {
      const response = await fetch(`/api/payments/details?checkout_session_id=${encodeURIComponent(checkoutSessionId)}`);
      const ct = response.headers.get('content-type') || '';
      let json = null;
      if (ct.includes('application/json')) {
        json = await response.json();
      } else {
        const txt = await response.text();
        console.warn('Non-JSON response fetching checkout session details:', txt);
        setLoading(false);
        return;
      }
      if (response.ok && json.success && json.data && json.data.data?.attributes?.payment_intent_id) {
        await fetchPaymentDetails(json.data.data.attributes.payment_intent_id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching checkout session details:', error);
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    // If we successfully applied the payment, navigate and reload so dashboard fetches updated loan data
    navigate('/dashboard', { replace: true });
    if (confirmResult && confirmResult.success) {
      // force reload to ensure latest user/loan data
      setTimeout(() => window.location.reload(), 300);
    }
  };

  const handleMakeAnotherPayment = () => {
    navigate('/payment', { replace: true });
  };

  if (loading) {
    return (
      <div className="payment-success-page">
        <Header />
        <main className="payment-success-main">
          <div className="container">
            <div className="loading-card">
              <div className="loading-spinner"></div>
              <h2>Processing your payment...</h2>
              <p>Please wait while we confirm your payment details.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="payment-success-page">
      <Header />
      <main className="payment-success-main">
        <div className="container">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h1>Payment Successful!</h1>
            <p className="success-message">
              Your payment has been processed successfully. Thank you for your payment to the Credit Cooperative.
            </p>

            {paymentDetails && (
              <div className="payment-details">
                <h3>Payment Details</h3>
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value">₱{(paymentDetails.attributes.amount / 100).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className={`value status-${paymentDetails.attributes.status}`}>
                    {paymentDetails.attributes.status.charAt(0).toUpperCase() + paymentDetails.attributes.status.slice(1)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Payment ID:</span>
                  <span className="value payment-id">{paymentDetails.id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Description:</span>
                  <span className="value">{paymentDetails.attributes.description}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Date:</span>
                  <span className="value">
                    {new Date().toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button onClick={handleGoToDashboard} className="btn btn-primary">
                Go to Dashboard
              </button>
              <button onClick={handleMakeAnotherPayment} className="btn btn-secondary">
                Make Another Payment
              </button>
            </div>

            {confirmResult && (
              <div className={`status-message ${confirmResult.success ? 'success' : 'error'}`} style={{marginTop:12}}>
                {confirmResult.success ? 'Payment applied to your loan successfully.' : `Payment not applied: ${confirmResult.data?.message || confirmResult.error || 'unknown'}`}
              </div>
            )}


          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;