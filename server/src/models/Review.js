const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true }, // Store username for display
  // Support both food and restaurant reviews
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 500 },
  isVerified: { type: Boolean, default: false },
  reviewType: { 
    type: String, 
    required: true, 
    enum: ['food', 'restaurant'],
    default: 'food'
  }
}, { timestamps: true });

// Ensure a user can only review a specific food item or restaurant once
reviewSchema.index({ userId: 1, foodId: 1, reviewType: 1 }, { 
  unique: true, 
  partialFilterExpression: { foodId: { $exists: true } }
});

reviewSchema.index({ userId: 1, restaurantId: 1, reviewType: 1 }, { 
  unique: true, 
  partialFilterExpression: { restaurantId: { $exists: true } }
});

module.exports = mongoose.model('Review', reviewSchema);
