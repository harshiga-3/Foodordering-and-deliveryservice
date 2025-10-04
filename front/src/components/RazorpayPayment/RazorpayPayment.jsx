import React, { useEffect, useState } from 'react';
import { apiConfig, makeAuthenticatedRequest } from '../../utils/apiConfig';
import './RazorpayPayment.css';

const RazorpayPayment = ({ amount, orderId, onSuccess, onFailure, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Create Razorpay order via Orders endpoint (redirect mode supported)
      const orderData = await makeAuthenticatedRequest(`${apiConfig.endpoints.orders}/create-payment`, {
        method: 'POST',
        body: JSON.stringify({
          // Send in rupees; backend normalizes to paise
          amount: amount,
          currency: 'INR',
          orderId: orderId,
          description: `Food Order - ${orderId}`,
        })
      });
      if (!orderData?.success) {
        throw new Error(orderData?.message || 'Payment service not available');
      }

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.key, // prefer env real key id
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Food Delivery App',
        description: `Food Order - ${orderId}`,
        order_id: orderData.order.id,
        // Open in new page using redirect
        redirect: true,
        callback_url: `${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/orders/razorpay-callback?orderId=${encodeURIComponent(orderId)}`,
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '9999999999',
        },
        notes: {
          address: 'Food Delivery Address',
        },
        theme: {
          color: '#059669',
        },
        modal: {
          ondismiss: function () {
            onClose();
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setError(err.message || 'Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="razorpay-payment-modal">
      <div className="payment-modal-content">
        <div className="payment-header">
          <h3>Complete Your Payment</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="payment-body">
          <div className="order-summary">
            <h4>Order Summary</h4>
            <div className="order-details">
              <div className="order-row">
                <span>Order ID:</span>
                <span className="order-id">{orderId}</span>
              </div>
              <div className="order-row">
                <span>Amount:</span>
                <span className="amount">{formatAmount(amount)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="payment-options">
            <div className="payment-method">
              <img 
                src="https://razorpay.com/favicon.png" 
                alt="Razorpay" 
                className="razorpay-logo"
              />
              <span>Secure payment via Razorpay</span>
            </div>
          </div>

          <button
            className="pay-now-btn"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Pay ${formatAmount(amount)}`}
          </button>

          <div className="payment-security">
            <div className="security-badges">
              <span className="security-badge">🔒 SSL Secured</span>
              <span className="security-badge">🛡️ PCI Compliant</span>
              <span className="security-badge">✅ 256-bit Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayPayment;
