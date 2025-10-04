const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  cuisine: { type: String, required: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  deliveryTime: { type: String, required: true },
  costForTwo: { type: String, required: true },
  image: { type: String, required: true },
  location: { type: String, required: true },
  // Optional precise coordinates for distance calculations
  locationGeo: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
      default: [0, 0]
    },
    updatedAt: { type: Date }
  },
  tags: [{ type: String }],
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  isOpen: { type: Boolean, default: true },
  operatingHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } }
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  phone: String,
  email: String
}, { timestamps: true });

// Text index for search functionality
restaurantSchema.index({ name: 'text', cuisine: 'text', location: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
