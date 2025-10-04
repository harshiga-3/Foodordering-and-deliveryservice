const express = require('express');
const Restaurant = require('../models/Restaurant.js');
const Food = require('../models/Food.js');
const { authRequired } = require('../middleware/auth.js');

const router = express.Router();

// GET restaurants by owner ID (Owner only)
router.get('/owner/:ownerId', authRequired, async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    // Check if user is requesting their own restaurants
    if (req.user.id.toString() !== ownerId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const restaurants = await Restaurant.find({ ownerId });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching restaurants', error: error.message });
  }
});

// GET all restaurants (public)
router.get('/', async (req, res) => {
  try {
    const { sortBy, limit } = req.query;
    const query = { isActive: true };

    // Default sort: by created date desc
    let sort = { createdAt: -1 };
    if (sortBy === 'rating') sort = { rating: -1 };
    if (sortBy === 'name') sort = { name: 1 };

    const max = Math.min(parseInt(limit || '0', 10) || 0, 50); // cap at 50

    let q = Restaurant.find(query).sort(sort);
    if (max > 0) q = q.limit(max);

    const restaurants = await q.exec();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching restaurants', error: error.message });
  }
});

// PATCH toggle restaurant open/close status (Owner only) - MUST be before /:id route
router.patch('/:id/toggle-status', authRequired, async (req, res) => {
  try {
    console.log('Toggle status request received for restaurant:', req.params.id);
    console.log('User:', req.user);
    
    // Check if user is owner
    if (req.user.role !== 'owner') {
      console.log('User is not owner, role:', req.user.role);
      return res.status(403).json({ message: 'Only restaurant owners can toggle restaurant status' });
    }
    
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      console.log('Restaurant not found:', req.params.id);
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    console.log('Found restaurant:', restaurant.name, 'Current status:', restaurant.isOpen);
    
    // Verify ownership
    if (restaurant.ownerId.toString() !== req.user.id.toString()) {
      console.log('Ownership mismatch. Restaurant owner:', restaurant.ownerId, 'User:', req.user.id);
      return res.status(403).json({ message: 'You can only toggle status of your own restaurant' });
    }
    
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isOpen: !restaurant.isOpen },
      { new: true }
    );
    
    console.log('Restaurant status updated to:', updatedRestaurant.isOpen);
    
    res.json({ 
      message: `Restaurant ${updatedRestaurant.isOpen ? 'opened' : 'closed'} successfully`,
      isOpen: updatedRestaurant.isOpen
    });
  } catch (error) {
    console.error('Error toggling restaurant status:', error);
    res.status(500).json({ message: 'Error toggling restaurant status', error: error.message });
  }
});

// GET single restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching restaurant', error: error.message });
  }
});

// POST new restaurant (Owner only)
router.post('/', authRequired, async (req, res) => {
  try {
    // Check if user is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only restaurant owners can create restaurants' });
    }
    
    const restaurantData = {
      ...req.body,
      ownerId: req.user.id
    };
    
    const restaurant = new Restaurant(restaurantData);
    const savedRestaurant = await restaurant.save();
    
    res.status(201).json(savedRestaurant);
  } catch (error) {
    res.status(500).json({ message: 'Error creating restaurant', error: error.message });
  }
});

// PUT update restaurant (Owner only)
router.put('/:id', authRequired, async (req, res) => {
  try {
    // Check if user is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only restaurant owners can edit restaurants' });
    }
    
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Verify ownership
    if (restaurant.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own restaurants' });
    }
    
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(updatedRestaurant);
  } catch (error) {
    res.status(500).json({ message: 'Error updating restaurant', error: error.message });
  }
});

// DELETE restaurant (Owner or Admin)
router.delete('/:id', authRequired, async (req, res) => {
  try {
    // Allow owners and admins
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only restaurant owners or admins can delete restaurants' });
    }
    
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Verify ownership unless admin
    if (req.user.role !== 'admin' && restaurant.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own restaurants' });
    }
    
    // Cascade delete foods for this restaurant
    await Food.deleteMany({ restaurantId: restaurant._id });
    await Restaurant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Restaurant and associated menu items deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting restaurant', error: error.message });
  }
});

module.exports = router;
