// Payment utility functions

// Generate a unique order ID
export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `ORDER_${timestamp}_${random}`.toUpperCase();
};

// Format amount to Indian currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Convert amount to paise (Razorpay expects amount in paise)
export const convertToPaise = (amount) => {
  return Math.round(amount * 100);
};

// Convert paise to rupees
export const convertFromPaise = (paise) => {
  return paise / 100;
};

// Validate payment data
export const validatePaymentData = (paymentData) => {
  const errors = [];

  if (!paymentData.amount || paymentData.amount <= 0) {
    errors.push('Invalid amount');
  }

  if (!paymentData.orderId) {
    errors.push('Order ID is required');
  }

  if (!paymentData.userId) {
    errors.push('User ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Handle payment success
export const handlePaymentSuccess = async (paymentResponse, orderData) => {
  try {
    // Verify payment with backend
    const verificationResponse = await fetch('/api/payments/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        orderId: orderData.orderId,
        amount: convertToPaise(orderData.amount),
        userId: orderData.userId,
        orderObjectId: orderData.orderObjectId,
      }),
    });

    if (!verificationResponse.ok) {
      throw new Error('Payment verification failed');
    }

    const verificationResult = await verificationResponse.json();
    return {
      success: true,
      data: verificationResult,
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Handle payment failure
export const handlePaymentFailure = (error) => {
  console.error('Payment failed:', error);
  return {
    success: false,
    error: error.message || 'Payment failed',
  };
};

// Get payment status text
export const getPaymentStatusText = (status) => {
  const statusMap = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return statusMap[status] || status;
};

// Get payment status color
export const getPaymentStatusColor = (status) => {
  const colorMap = {
    pending: '#f59e0b',
    completed: '#10b981',
    failed: '#ef4444',
    refunded: '#6b7280',
  };
  return colorMap[status] || '#6b7280';
};

// Calculate delivery charges
export const calculateDeliveryCharges = (orderAmount) => {
  if (orderAmount >= 500) {
    return 0; // Free delivery for orders above ₹500
  } else if (orderAmount >= 200) {
    return 30; // ₹30 for orders between ₹200-₹499
  } else {
    return 50; // ₹50 for orders below ₹200
  }
};

// Calculate total amount with taxes and delivery
export const calculateTotalAmount = (subtotal, deliveryCharges = 0) => {
  const gst = subtotal * 0.05; // 5% GST
  const total = subtotal + deliveryCharges + gst;
  return {
    subtotal,
    deliveryCharges,
    gst: Math.round(gst),
    total: Math.round(total),
  };
};
