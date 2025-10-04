const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  foodId: {
    type: String,
    required: true,
  },
  foodName: {
    type: String,
    required: true,
  },
  foodPrice: {
    type: String,
    required: true,
  },
  foodImage: {
    type: String,
    required: true,
  },
  foodCategory: {
    type: String,
    required: true,
  },
  isVeg: {
    type: Boolean,
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index to ensure a user can only have one favourite per food item
favoriteSchema.index({ userId: 1, foodId: 1 }, { unique: true });

// Index for better query performance
favoriteSchema.index({ userId: 1 });
favoriteSchema.index({ foodId: 1 });
favoriteSchema.index({ addedAt: -1 });

// Static method to find all favourites for a user
favoriteSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ addedAt: -1 });
};

// Static method to check if a food item is favourited by a user
favoriteSchema.statics.isFavourited = function(userId, foodId) {
  return this.findOne({ userId, foodId });
};

// Static method to get favourite count for a food item
favoriteSchema.statics.getFavouriteCount = function(foodId) {
  return this.countDocuments({ foodId });
};

// Static method to get user's favourite count
favoriteSchema.statics.getUserFavouriteCount = function(userId) {
  return this.countDocuments({ userId });
};

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
