const mongoose = require('mongoose');

const comboItemSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  name: { type: String, required: true }, // Store food name for display
  price: { type: Number, required: true } // Store individual price for calculation
});

const comboSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 500
  },
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    required: true 
  },
  items: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }, // Can be array of comboItemSchema or simple string description
  originalPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  comboPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  discount: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  image: { 
    type: String, 
    default: 'images/combo/default-combo.jpg'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isFeatured: { 
    type: Boolean, 
    default: false 
  },
  category: { 
    type: String, 
    enum: ['family', 'couple', 'individual', 'group', 'special'],
    default: 'special'
  },
  tags: [String],
  validFrom: { 
    type: Date, 
    default: Date.now 
  },
  validUntil: { 
    type: Date 
  },
  maxOrders: { 
    type: Number 
  },
  currentOrders: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
comboSchema.index({ restaurantId: 1, isActive: 1 });
comboSchema.index({ isFeatured: 1, isActive: 1 });
comboSchema.index({ validFrom: 1, validUntil: 1 });

// Virtual for savings amount
comboSchema.virtual('savings').get(function() {
  return Math.max(0, this.originalPrice - this.comboPrice);
});

// Virtual for savings percentage
comboSchema.virtual('savingsPercentage').get(function() {
  if (this.originalPrice > 0) {
    return Math.round(((this.originalPrice - this.comboPrice) / this.originalPrice) * 100);
  }
  return 0;
});

// Ensure virtual fields are serialized
comboSchema.set('toJSON', { virtuals: true });
comboSchema.set('toObject', { virtuals: true });

// Pre-save middleware to calculate discount
comboSchema.pre('save', function(next) {
  if (this.originalPrice > 0 && this.comboPrice > 0) {
    this.discount = Math.round(((this.originalPrice - this.comboPrice) / this.originalPrice) * 100);
  } else {
    // For text descriptions or when prices are not properly set, set a default discount
    this.discount = 0;
  }
  next();
});

module.exports = mongoose.model('Combo', comboSchema);
