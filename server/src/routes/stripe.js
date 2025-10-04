const express = require('express');
const Stripe = require('stripe');
const { authRequired } = require('../middleware/auth.js');
const Order = require('../models/Order.js');

const router = express.Router();

// Note: do not instantiate Stripe here; create inside handlers to avoid startup failure when env not set.

// Public endpoint to fetch publishable key (optional convenience)
router.get('/config', (req, res) => {
  return res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  });
});

// Create a PaymentIntent for an existing order (requires auth)
router.post('/create-payment-intent', authRequired, async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    // Try to find by custom orderId first; if not found and looks like ObjectId, try by _id
    let order = await Order.findOne({ orderId, user: req.user.id });
    if (!order && /^[a-f\d]{24}$/i.test(String(orderId))) {
      try {
        order = await Order.findOne({ _id: orderId, user: req.user.id });
      } catch (_) {}
    }
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const amountPaise = Math.max(0, Math.round(Number(order.finalAmount || 0) * 100));
    if (!amountPaise) {
      return res.status(400).json({ message: 'Order amount invalid' });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return res.status(503).json({ message: 'Stripe is not configured on the server' });
    }
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });

    // Create a PaymentIntent with payment method configuration
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountPaise,
      currency: 'inr',
      metadata: {
        orderId: order.orderId,
        userId: String(req.user.id),
      },
      // Let Stripe determine the best set of supported methods
      automatic_payment_methods: {
        enabled: true,
      },
      // Provide receipt email when available
      receipt_email: order?.userDetails?.email || undefined,
    });

    // Persist paymentId on the order for reference
    try {
      order.paymentId = paymentIntent.id;
      order.paymentMethod = 'stripe';
      await order.save();
    } catch (e) {
      console.warn('Failed to persist paymentId on order:', e.message);
    }

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('Error creating PaymentIntent:', err);
    return res.status(500).json({ message: 'Failed to create payment intent', error: err.message });
  }
});

module.exports = router;
