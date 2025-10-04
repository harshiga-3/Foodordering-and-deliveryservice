const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  razorpayOrderId: {
    type: String,
    required: true,
  },
  razorpayPaymentId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  metadata: {
    type: Map,
    of: String,
  },
  refundDetails: {
    refundId: String,
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
  },
}, {
  timestamps: true,
});

// Index for better query performance
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return (this.amount / 100).toFixed(2); // Convert from paise to rupees
});

// Method to update payment status
paymentSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(refundData) {
  this.status = 'refunded';
  this.refundDetails = {
    refundId: refundData.id,
    refundAmount: refundData.amount,
    refundReason: refundData.reason || 'Customer requested refund',
    refundedAt: new Date(),
  };
  return this.save();
};

// Static method to find payments by user
paymentSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).populate('order').sort({ createdAt: -1 });
};

// Static method to find payments by order
paymentSchema.statics.findByOrder = function(orderId) {
  return this.findOne({ order: orderId });
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
