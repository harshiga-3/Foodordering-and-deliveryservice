const express = require('express');
const mongoose = require('mongoose');
const Combo = require('../models/Combo.js');
const Food = require('../models/Food.js');
const Restaurant = require('../models/Restaurant.js');
const { authRequired, requireRole } = require('../middleware/auth.js');

const router = express.Router();

// GET all combos with filtering and search
router.get('/', async (req, res) => {
  try {
    const { 
      restaurantId, 
      isFeatured, 
      category, 
      minDiscount, 
      maxDiscount,
      isActive,
      limit = 20,
      skip = 0
    } = req.query;

    console.log('Combo API request received:', {
      restaurantId,
      isFeatured,
      category,
      isActive,
      allQuery: req.query
    });

    // First, let's check if there are any combos at all
    const totalCombos = await Combo.countDocuments();
    console.log('Total combos in database:', totalCombos);

    // Normalize booleans coming as strings
    const isActiveBool = (isActive === undefined) ? true : String(isActive).toLowerCase() === 'true';
    const isFeaturedBool = (isFeatured === undefined) ? undefined : String(isFeatured).toLowerCase() === 'true';

    let query = { isActive: isActiveBool };

    // Filter by restaurant
    if (restaurantId) {
      console.log('Filtering by restaurant ID:', restaurantId);
      // Handle both populated objects and simple IDs
      const restaurantQuery = {
        $or: [
          { restaurantId: new mongoose.Types.ObjectId(restaurantId) },
          { 'restaurantId._id': new mongoose.Types.ObjectId(restaurantId) }
        ]
      };
      query = { ...query, ...restaurantQuery };
      console.log('Query object:', query);
    }

    // Filter by featured status
    if (isFeaturedBool !== undefined) {
      query.isFeatured = isFeaturedBool;
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by discount range
    if (minDiscount || maxDiscount) {
      query.discount = {};
      if (minDiscount) query.discount.$gte = parseInt(minDiscount);
      if (maxDiscount) query.discount.$lte = parseInt(maxDiscount);
    }

    // Check validity dates
    const now = new Date();
    const validityQuery = {
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: null },
        { validUntil: { $gt: now } }
      ]
    };
    
    // Combine all queries
    if (restaurantId) {
      query = {
        $and: [
          { isActive: isActiveBool },
          validityQuery,
          {
            $or: [
              { restaurantId: new mongoose.Types.ObjectId(restaurantId) },
              { 'restaurantId._id': new mongoose.Types.ObjectId(restaurantId) }
            ]
          }
        ]
      };
    } else {
      query = { ...query, ...validityQuery };
    }

    console.log('Final query object:', JSON.stringify(query, null, 2));
    
    const combos = await Combo.find(query)
      .populate('restaurantId', 'name location image rating')
      .populate('items.foodId', 'name price image')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    console.log('Combos found:', combos.length);
    console.log('Combos data:', combos.map(c => ({ id: c._id, name: c.name, restaurantId: c.restaurantId })));

    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching combos', error: error.message });
  }
});

// GET combo by ID
router.get('/:id', async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id)
      .populate('restaurantId', 'name location image rating')
      .populate('items.foodId', 'name price image description');

    if (!combo) {
      return res.status(404).json({ message: 'Combo not found' });
    }

    res.json(combo);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching combo', error: error.message });
  }
});

// GET combos by restaurant owner (Owner only)
router.get('/owner/:ownerId', authRequired, requireRole('owner'), async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    // Check if user is requesting their own combos
    if (req.user.id.toString() !== ownerId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // First get all restaurants owned by this user
    const restaurants = await Restaurant.find({ ownerId });
    const restaurantIds = restaurants.map(r => r._id);
    
    // Then get all combos from these restaurants
    const combos = await Combo.find({ 
      restaurantId: { $in: restaurantIds } 
    })
    .populate('restaurantId', 'name location')
    .populate('items.foodId', 'name price')
    .sort({ createdAt: -1 });
    
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching owner combos', error: error.message });
  }
});

// POST create new combo (Owner only)
router.post('/', authRequired, requireRole('owner'), async (req, res) => {
  try {
    console.log('Combo creation request received:', {
      body: req.body,
      user: req.user
    });
    
    const {
      name,
      description,
      restaurantId,
      items,
      comboPrice,
      image,
      category,
      tags,
      validUntil,
      maxOrders
    } = req.body;

    // Validate required fields
    if (!name || !description || !restaurantId || !items || !comboPrice) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if restaurant exists and user owns it
    console.log('Checking restaurant ownership:', {
      restaurantId,
      userId: req.user.id
    });
    
    const restaurant = await Restaurant.findOne({ 
      _id: restaurantId, 
      ownerId: req.user.id 
    });
    
    console.log('Restaurant found:', restaurant ? 'Yes' : 'No');
    
    if (!restaurant) {
      console.log('Restaurant not found or access denied');
      return res.status(404).json({ message: 'Restaurant not found or access denied' });
    }

    // Handle items - can be array of objects or simple string description
    let validatedItems;
    let originalPrice = 0;

    if (typeof items === 'string') {
      // Simple text description - estimate original price as 1.5x combo price
      validatedItems = items;
      originalPrice = Math.round(comboPrice * 1.5); // Estimate original price
    } else if (Array.isArray(items)) {
      // Complex items array - validate each item
      validatedItems = [];
      for (const item of items) {
        const food = await Food.findById(item.foodId);
        if (!food) {
          return res.status(400).json({ message: `Food item ${item.foodId} not found` });
        }
        
        if (food.restaurantId.toString() !== restaurantId) {
          return res.status(400).json({ message: `Food item ${food.name} does not belong to this restaurant` });
        }

        const itemTotal = food.price * (item.quantity || 1);
        originalPrice += itemTotal;

        validatedItems.push({
          foodId: food._id,
          quantity: item.quantity || 1,
          name: food.name,
          price: food.price
        });
      }
    } else {
      return res.status(400).json({ message: 'Items must be a string description or array of food items' });
    }

    // Validate combo price - only check if we have actual food items
    if (Array.isArray(items) && comboPrice >= originalPrice) {
      return res.status(400).json({ message: 'Combo price must be less than original price' });
    }

    // Calculate discount percentage
    const discount = originalPrice > 0 ? Math.round(((originalPrice - comboPrice) / originalPrice) * 100) : 33; // Default 33% discount for text descriptions

    console.log('Creating combo with data:', {
      name,
      description,
      restaurantId,
      items: validatedItems,
      originalPrice,
      comboPrice,
      discount,
      category: category || 'special',
      tags: tags || []
    });

    const combo = new Combo({
      name,
      description,
      restaurantId,
      items: validatedItems,
      originalPrice,
      comboPrice,
      discount,
      image: image || 'images/combo/default-combo.jpg',
      category: category || 'special',
      tags: tags || [],
      validFrom: new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      maxOrders: maxOrders || null,
      isActive: true,
      isFeatured: req.body.isFeatured || false
    });

    const savedCombo = await combo.save();
    
    // Don't populate restaurantId in the response to avoid issues with queries
    // The restaurantId should remain as a simple ObjectId reference
    
    // Only populate items.foodId if items is an array of food items
    if (Array.isArray(savedCombo.items) && savedCombo.items.length > 0 && savedCombo.items[0].foodId) {
      await savedCombo.populate('items.foodId', 'name price image');
    }

    res.status(201).json(savedCombo);
  } catch (error) {
    console.error('Error creating combo:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      user: req.user?.id
    });
    res.status(500).json({ 
      message: 'Error creating combo', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT update combo (Owner only)
router.put('/:id', authRequired, requireRole('owner'), async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id);
    
    if (!combo) {
      return res.status(404).json({ message: 'Combo not found' });
    }

    // Check if user owns the restaurant
    const restaurant = await Restaurant.findOne({ 
      _id: combo.restaurantId, 
      ownerId: req.user.id 
    });
    
    if (!restaurant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      name,
      description,
      items,
      comboPrice,
      image,
      category,
      tags,
      isActive,
      isFeatured,
      validUntil,
      maxOrders
    } = req.body;

    // Update fields
    if (name) combo.name = name;
    if (description) combo.description = description;
    if (image) combo.image = image;
    if (category) combo.category = category;
    if (tags) combo.tags = tags;
    if (isActive !== undefined) combo.isActive = isActive;
    if (isFeatured !== undefined) combo.isFeatured = isFeatured;
    if (validUntil) combo.validUntil = new Date(validUntil);
    if (maxOrders !== undefined) combo.maxOrders = maxOrders;

    // Update items and recalculate prices if provided
    if (items) {
      let originalPrice = 0;
      const validatedItems = [];

      for (const item of items) {
        const food = await Food.findById(item.foodId);
        if (!food) {
          return res.status(400).json({ message: `Food item ${item.foodId} not found` });
        }
        
        if (food.restaurantId.toString() !== combo.restaurantId.toString()) {
          return res.status(400).json({ message: `Food item ${food.name} does not belong to this restaurant` });
        }

        const itemTotal = food.price * (item.quantity || 1);
        originalPrice += itemTotal;

        validatedItems.push({
          foodId: food._id,
          quantity: item.quantity || 1,
          name: food.name,
          price: food.price
        });
      }

      combo.items = validatedItems;
      combo.originalPrice = originalPrice;
    }

    if (comboPrice) {
      if (comboPrice >= combo.originalPrice) {
        return res.status(400).json({ message: 'Combo price must be less than original price' });
      }
      combo.comboPrice = comboPrice;
    }

    const updatedCombo = await combo.save();
    await updatedCombo.populate('restaurantId', 'name location');
    await updatedCombo.populate('items.foodId', 'name price image');

    res.json(updatedCombo);
  } catch (error) {
    res.status(500).json({ message: 'Error updating combo', error: error.message });
  }
});

// DELETE combo (Owner only)
router.delete('/:id', authRequired, requireRole('owner'), async (req, res) => {
  try {
    const combo = await Combo.findById(req.params.id);
    
    if (!combo) {
      return res.status(404).json({ message: 'Combo not found' });
    }

    // Check if user owns the restaurant
    const restaurant = await Restaurant.findOne({ 
      _id: combo.restaurantId, 
      ownerId: req.user.id 
    });
    
    if (!restaurant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Combo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Combo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting combo', error: error.message });
  }
});

// GET featured combos for homepage
router.get('/featured/homepage', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const combos = await Combo.find({ 
      isActive: true, 
      isFeatured: true 
    })
    .populate('restaurantId', 'name location image rating')
    .populate('items.foodId', 'name price image')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching featured combos', error: error.message });
  }
});

module.exports = router;
