const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  image: { type: String, required: true },
  isVeg: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  tags: [{ type: String }],
  foodType: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 20 }
}, { timestamps: true });

// Text index for search functionality
foodSchema.index({ name: 'text', 'restaurant.name': 'text' });

module.exports = mongoose.model('Food', foodSchema);
