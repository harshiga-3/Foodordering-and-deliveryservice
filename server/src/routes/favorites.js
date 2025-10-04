const express = require('express');
const Favorite = require('../models/Favorite.js');
const Food = require('../models/Food.js');
const { authRequired } = require('../middleware/auth.js');

const router = express.Router();

// All routes require authentication
router.use(authRequired);

// GET user's favorites
router.get('/', async (req, res) => {
  try {
    const favorites = await Favorite.findByUser(req.user.id);
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites', error: error.message });
  }
});

// POST add item to favorites
router.post('/add', async (req, res) => {
  try {
    const { foodId } = req.body;
    let { foodName, foodPrice, foodImage, foodCategory, isVeg } = req.body;
    
    if (!foodId) {
      return res.status(400).json({ message: 'foodId is required' });
    }
    
    // Check if already favorited
    const existingFavorite = await Favorite.isFavourited(req.user.id, foodId);
    
    if (existingFavorite) {
      return res.status(400).json({ message: 'Item already in favorites' });
    }
    
    // Hydrate missing fields from Food collection
    if (!foodName || !foodPrice || !foodImage || !foodCategory || typeof isVeg === 'undefined') {
      try {
        const foodDoc = /^[a-f\d]{24}$/i.test(String(foodId))
          ? await Food.findById(foodId)
          : await Food.findOne({ _id: foodId }).catch(() => null);
        if (foodDoc) {
          foodName = foodName || foodDoc.name;
          foodPrice = typeof foodPrice !== 'undefined' ? foodPrice : foodDoc.price;
          foodImage = foodImage || foodDoc.image;
          foodCategory = foodCategory || foodDoc.category;
          isVeg = typeof isVeg !== 'undefined' ? isVeg : foodDoc.isVeg;
        }
      } catch {}
    }

    if (!foodName || typeof foodPrice === 'undefined' || !foodImage || !foodCategory || typeof isVeg === 'undefined') {
      return res.status(400).json({ message: 'Incomplete food data and unable to resolve from database' });
    }

    // Add to favorites
    const favorite = new Favorite({
      userId: req.user.id,
      foodId: String(foodId),
      foodName,
      foodPrice,
      foodImage,
      foodCategory,
      isVeg
    });
    
    const savedFavorite = await favorite.save();
    res.status(201).json({ 
      message: 'Added to favorites', 
      favorite: savedFavorite 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to favorites', error: error.message });
  }
});

// POST remove item from favorites
router.post('/remove', async (req, res) => {
  try {
    const { foodId } = req.body;
    
    if (!foodId) {
      return res.status(400).json({ message: 'Food ID is required' });
    }
    
    const deletedFavorite = await Favorite.findOneAndDelete({
      userId: req.user.id,
      foodId
    });
    
    if (!deletedFavorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }
    
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing from favorites', error: error.message });
  }
});

// DELETE remove item from favorites
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedFavorite = await Favorite.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });
    
    if (!deletedFavorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }
    
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing from favorites', error: error.message });
  }
});

// GET check if food item is favorited by user
router.get('/check/:foodId', async (req, res) => {
  try {
    const { foodId } = req.params;
    
    const favorite = await Favorite.isFavourited(req.user.id, foodId);
    
    res.json({ 
      isFavourite: !!favorite, 
      isFavorited: !!favorite, // For backward compatibility
      favoriteId: favorite?._id 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking favorite status', error: error.message });
  }
});

// GET user's favourite count
router.get('/count', async (req, res) => {
  try {
    const count = await Favorite.getUserFavouriteCount(req.user.id);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error getting favourite count', error: error.message });
  }
});

// POST toggle favorite (add/remove)
router.post('/toggle', async (req, res) => {
  try {
    const { favoriteType, foodId, restaurantId, foodName, foodPrice, foodImage, foodCategory, isVeg } = req.body;
    
    if (favoriteType === 'food' && foodId) {
      const existingFavorite = await Favorite.isFavourited(req.user.id, foodId);
      
      if (existingFavorite) {
        // Remove from favorites
        const deletedFavorite = await Favorite.findOneAndDelete({
          userId: req.user.id,
          foodId
        });
        
        if (!deletedFavorite) {
          return res.status(404).json({ message: 'Favorite not found' });
        }
        
        res.json({ 
          message: 'Removed from favorites',
          isFavorited: false,
          favoriteId: null
        });
      } else {
        // Add to favorites
        if (!foodName || !foodPrice || !foodImage || !foodCategory) {
          return res.status(400).json({ 
            message: 'Please provide complete food data when adding to favorites',
            requiredFields: ['foodId', 'foodName', 'foodPrice', 'foodImage', 'foodCategory', 'isVeg']
          });
        }
        
        const favorite = new Favorite({
          userId: req.user.id,
          foodId, foodName, foodPrice, foodImage, foodCategory, isVeg
        });
        
        const savedFavorite = await favorite.save();
        res.status(201).json({ 
          message: 'Added to favorites', 
          isFavorited: true,
          favorite: savedFavorite,
          favoriteId: savedFavorite._id
        });
      }
    } else if (favoriteType === 'restaurant' && restaurantId) {
      return res.status(400).json({ message: 'Restaurant favorites not implemented yet' });
    } else {
      return res.status(400).json({ message: 'Invalid favorite data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error toggling favorite', error: error.message });
  }
});

module.exports = router;
