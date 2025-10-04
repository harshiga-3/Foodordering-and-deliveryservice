const express = require('express');
const mongoose = require('mongoose');
const Food = require('../models/Food.js');
const Restaurant = require('../models/Restaurant.js');
const { authRequired } = require('../middleware/auth.js');

const router = express.Router();

// GET foods by restaurant owner (Owner only)
router.get('/owner/:ownerId', authRequired, async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    // Check if user is requesting their own foods
    if (req.user.id.toString() !== ownerId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // First get all restaurants owned by this user
    const restaurants = await Restaurant.find({ ownerId });
    const restaurantIds = restaurants.map(r => r._id);
    
    // Then get all foods from these restaurants
    const foods = await Food.find({ 
      restaurantId: { $in: restaurantIds } 
    }).populate('restaurantId', 'name location');
    
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching owner foods', error: error.message });
  }
});

// GET all foods with search and filtering
router.get('/', async (req, res) => {
  try {
    const { q, category, isVeg, restaurantId, minPrice, maxPrice, sortBy } = req.query;
    
    let query = {};
    
    // Enhanced search by food name or restaurant name (case-insensitive)
    if (q) {
      const searchTerm = q.trim();
      if (searchTerm.length > 0) {
        // First try exact match, then partial match
        query.$or = [
          // Exact match (highest priority)
          { name: { $regex: `^${searchTerm}$`, $options: 'i' } },
          // Starts with search term (high priority)
          { name: { $regex: `^${searchTerm}`, $options: 'i' } },
          // Contains search term (medium priority)
          { name: { $regex: searchTerm, $options: 'i' } },
          // Restaurant name contains search term
          { 'restaurant.name': { $regex: searchTerm, $options: 'i' } },
          // Description contains search term (lowest priority)
          { description: { $regex: searchTerm, $options: 'i' } }
        ];
      }
    }
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filter by veg/non-veg
    if (isVeg !== undefined) {
      query.isVeg = isVeg === 'true';
    }
    
    // Filter by restaurant
    if (restaurantId) {
      query.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Build aggregation pipeline with search scoring
    let pipeline = [
      { $match: query }
    ];
    
    // Only add lookup if we need restaurant data (for search or display)
    if (q || !restaurantId) {
      pipeline.push(
        {
          $lookup: {
            from: 'restaurants',
            localField: 'restaurantId',
            foreignField: '_id',
            as: 'restaurant'
          }
        },
        { $unwind: '$restaurant' },
        {
          $addFields: {
            restaurantName: '$restaurant.name',
            originalRestaurantId: '$restaurantId'
          }
        }
      );
    } else {
      // For restaurant-specific queries, just preserve the restaurantId
      pipeline.push({
        $addFields: {
          originalRestaurantId: '$restaurantId'
        }
      });
    }
    
    // Add search relevance scoring if search term exists
    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      pipeline.push({
        $addFields: {
          searchScore: {
            $sum: [
              // Exact name match gets highest score
              { $cond: [{ $regexMatch: { input: '$name', regex: `^${searchTerm}$`, options: 'i' } }, 100, 0] },
              // Starts with search term gets high score
              { $cond: [{ $regexMatch: { input: '$name', regex: `^${searchTerm}`, options: 'i' } }, 50, 0] },
              // Contains search term gets medium score
              { $cond: [{ $regexMatch: { input: '$name', regex: searchTerm, options: 'i' } }, 25, 0] },
              // Restaurant name match gets lower score
              { $cond: [{ $regexMatch: { input: '$restaurant.name', regex: searchTerm, options: 'i' } }, 10, 0] },
              // Description match gets lowest score
              { $cond: [{ $regexMatch: { input: '$description', regex: searchTerm, options: 'i' } }, 5, 0] }
            ]
          }
        }
      });
      
      // Sort by search relevance first, then by other criteria
      pipeline.push({ $sort: { searchScore: -1 } });
    }
    
    // Apply other sorting if no search term or after search relevance
    if (sortBy && (!q || q.trim().length === 0)) {
      const sortOptions = {
        'price-low': { price: 1 },
        'price-high': { price: -1 },
        'rating': { rating: -1 },
        'name': { name: 1 }
      };
      if (sortOptions[sortBy]) {
        pipeline.push({ $sort: sortOptions[sortBy] });
      }
    }
    
    const foods = await Food.aggregate(pipeline);
    
    // Ensure restaurantId is preserved for each food item
    const foodsWithRestaurantId = foods.map(food => ({
      ...food,
      restaurantId: food.originalRestaurantId || food.restaurantId
    }));
    
    res.json(foodsWithRestaurantId);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching foods', error: error.message });
  }
});

// GET single food by ID
router.get('/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id).populate('restaurantId');
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    res.json(food);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food', error: error.message });
  }
});

// POST new food (Owner only)
router.post('/', authRequired, async (req, res) => {
  try {
    // Check if user is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only restaurant owners can add food items' });
    }
    
    const { name, description, price, category, restaurantId, image, isVeg, tags, foodType } = req.body;
    
    // Verify restaurant ownership
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    if (restaurant.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only add food to your own restaurant' });
    }
    
    const food = new Food({
      name,
      description,
      price,
      category,
      restaurantId,
      image,
      isVeg,
      tags,
      foodType
    });
    
    const savedFood = await food.save();
    res.status(201).json(savedFood);
  } catch (error) {
    res.status(500).json({ message: 'Error creating food', error: error.message });
  }
});

// PUT update food (Owner only)
router.put('/:id', authRequired, async (req, res) => {
  try {
    // Check if user is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only restaurant owners can edit food items' });
    }
    
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    
    // Verify restaurant ownership
    const restaurant = await Restaurant.findById(food.restaurantId);
    if (restaurant.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only edit food from your own restaurant' });
    }
    
    const updatedFood = await Food.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(updatedFood);
  } catch (error) {
    res.status(500).json({ message: 'Error updating food', error: error.message });
  }
});

// DELETE food (Owner or Admin)
router.delete('/:id', authRequired, async (req, res) => {
  try {
    // Allow owners and admins
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only restaurant owners or admins can delete food items' });
    }
    
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    
    // Verify restaurant ownership
    const restaurant = await Restaurant.findById(food.restaurantId);
    if (req.user.role !== 'admin' && restaurant.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only delete food from your own restaurant' });
    }
    
    await Food.findByIdAndDelete(req.params.id);
    res.json({ message: 'Food deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting food', error: error.message });
  }
});

module.exports = router;
