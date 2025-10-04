const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  items: [{
    foodId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    image: String,
    category: String,
    isVeg: Boolean
  }],
  userDetails: {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    email: String
  },
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  gst: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'stripe', 'cod'],
    default: 'stripe'
  },
  paymentId: String,
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  specialInstructions: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date
  ,
  deletedByUser: { type: Boolean, default: false },
  deletedByOwner: { type: Boolean, default: false },
  // Stored coordinates for tracking
  restaurantLatLng: {
    lat: { type: Number },
    lng: { type: Number }
  },
  deliveryLatLng: {
    lat: { type: Number },
    lng: { type: Number }
  },
  coordSource: {
    restaurant: { type: String, enum: ['stored','geocoded','default'], default: 'default' },
    delivery: { type: String, enum: ['stored','geocoded','default'], default: 'default' }
  }
}, {
  timestamps: true
});

// Index for efficient queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderStatus: 1 });

// Static method to generate unique order ID
orderSchema.statics.generateOrderId = async function() {
  let orderId;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate a random 6-digit number
    orderId = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Check if this order ID already exists
    const existingOrder = await this.findOne({ orderId });
    if (!existingOrder) {
      isUnique = true;
    }
  }
  
  return orderId;
};

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId, deletedByUser: { $ne: true } }).sort({ createdAt: -1 });
};

// Virtual for order summary
orderSchema.virtual('orderSummary').get(function() {
  return {
    orderId: this.orderId,
    totalItems: this.items.length,
    totalAmount: this.totalAmount,
    status: this.orderStatus,
    createdAt: this.createdAt
  };
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
