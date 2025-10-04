const mongoose = require('mongoose');

const tasteProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  preferences: {
    // Cuisine preferences (multiple selection)
    cuisines: [{ type: String }], // e.g., ['South Indian', 'North Indian', 'Chinese', 'Italian']
    
    // Spice level preference
    spiceLevel: { 
      type: String, 
      enum: ['mild', 'medium', 'hot', 'very-hot'], 
      default: 'medium' 
    },
    
    // Dietary preferences
    dietaryRestrictions: [{ type: String }], // e.g., ['vegetarian', 'vegan', 'gluten-free']
    
    // Food categories preferences
    categories: [{ type: String }], // e.g., ['curries', 'rice', 'breads', 'snacks', 'desserts']
    
    // Price range preference
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 1000 }
    },
    
    // Meal preferences
    mealTypes: [{ type: String }], // e.g., ['breakfast', 'lunch', 'dinner', 'snacks']
    
    // Texture preferences
    textures: [{ type: String }], // e.g., ['crispy', 'soft', 'creamy', 'crunchy']
    
    // Flavor preferences
    flavors: [{ type: String }], // e.g., ['sweet', 'sour', 'bitter', 'umami', 'spicy']
  },
  
  // Quiz responses for analysis
  quizResponses: [{
    questionId: { type: String, required: true },
    answer: { type: mongoose.Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Personalized recommendations
  recommendedFoods: [{
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    score: { type: Number, min: 0, max: 1 }, // Recommendation score
    reason: { type: String }, // Why this food was recommended
    addedAt: { type: Date, default: Date.now }
  }],
  
  // User behavior tracking
  behavior: {
    totalOrders: { type: Number, default: 0 },
    favoriteRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
    dislikedFoods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Profile completion status
  isComplete: { type: Boolean, default: false },
  completionPercentage: { type: Number, min: 0, max: 100, default: 0 }
}, { timestamps: true });

// Index for efficient queries
tasteProfileSchema.index({ userId: 1 });
tasteProfileSchema.index({ 'preferences.cuisines': 1 });
tasteProfileSchema.index({ 'preferences.categories': 1 });

module.exports = mongoose.model('TasteProfile', tasteProfileSchema);
