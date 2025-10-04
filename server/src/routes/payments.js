const express = require('express');
// const Razorpay = require('razorpay'); // Payment integration disabled
const crypto = require('crypto');
const Payment = require('../models/Payment');
const router = express.Router();

// Initialize Razorpay (only if environment variables are set)
// let razorpay;
// try {
//   if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
//     razorpay = new Razorpay({
//       key_id: process.env.RAZORPAY_KEY_ID,
//       key_secret: process.env.RAZORPAY_KEY_SECRET,
//     });
//   }
// } catch (error) {
//   console.warn('Razorpay not initialized - missing environment variables');
// }

// Create payment order
// router.post('/create-order', async (req, res) => {
//   return res.status(503).json({ success: false, message: 'Online payments are temporarily disabled.' });
// });

// Verify payment signature and save payment details
// router.post('/verify-payment', async (req, res) => {
//   return res.status(503).json({ success: false, message: 'Online payments are temporarily disabled.' });
// });

// Get payment details
// router.get('/payment/:paymentId', async (req, res) => {
//   return res.status(503).json({ success: false, message: 'Online payments are temporarily disabled.' });
// });

// Get payment history for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.findByUser(userId)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Payment.countDocuments({ user: userId });

    res.json({
      success: true,
      payments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalPayments: count,
    });
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message,
    });
  }
});

// Refund payment
// router.post('/refund', async (req, res) => {
//   return res.status(503).json({ success: false, message: 'Online payments are temporarily disabled.' });
// });

module.exports = router;
