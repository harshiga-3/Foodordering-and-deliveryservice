const express = require('express');
const StripeLib = require('stripe');
const Order = require('../models/Order.js');

const router = express.Router();

// Do not instantiate Stripe client here to avoid startup crash if key is missing.

// Stripe requires the raw body to validate webhook signatures.
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event;
  try {
    if (!endpointSecret) {
      // In dev, if no webhook secret is configured, skip signature verification.
      // DO NOT use this in production.
      const raw = Buffer.isBuffer(req.body) ? req.body.toString() : req.body;
      event = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw;
    } else {
      // Signature verification does not require an API key
      event = StripeLib.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
  } catch (err) {
    console.error('Stripe webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    console.log(`[StripeWebhook] Received event: ${event.type} (id: ${event.id})`);
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const orderId = pi.metadata?.orderId;
        console.log(`[StripeWebhook] payment_intent.succeeded for orderId=${orderId}, pi=${pi.id}`);
        if (orderId) {
          const updated = await Order.findOneAndUpdate(
            { orderId },
            {
              paymentStatus: 'completed',
              paymentMethod: 'stripe',
              paymentId: pi.id,
            },
            { new: true }
          );
          if (updated) {
            console.log(`[StripeWebhook] Order ${orderId} updated -> paymentStatus=${updated.paymentStatus}`);
          } else {
            console.warn(`[StripeWebhook] Order not found for orderId=${orderId}`);
          }
        } else {
          console.warn('[StripeWebhook] Missing orderId in PaymentIntent metadata');
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const orderId = pi.metadata?.orderId;
        console.log(`[StripeWebhook] payment_intent.payment_failed for orderId=${orderId}, pi=${pi.id}`);
        if (orderId) {
          const updated = await Order.findOneAndUpdate(
            { orderId },
            { paymentStatus: 'failed', paymentMethod: 'stripe', paymentId: pi.id },
            { new: true }
          );
          if (updated) {
            console.log(`[StripeWebhook] Order ${orderId} updated -> paymentStatus=${updated.paymentStatus}`);
          } else {
            console.warn(`[StripeWebhook] Order not found for orderId=${orderId}`);
          }
        } else {
          console.warn('[StripeWebhook] Missing orderId in PaymentIntent metadata');
        }
        break;
      }
      default:
        console.log(`[StripeWebhook] Ignored event type: ${event.type}`);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
