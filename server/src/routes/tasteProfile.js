const express = require('express');
const mongoose = require('mongoose');
const TasteProfile = require('../models/TasteProfile.js');
const User = require('../models/User.js');
const Food = require('../models/Food.js');
const Restaurant = require('../models/Restaurant.js');
const { authRequired } = require('../middleware/auth.js');

const router = express.Router();

// GET user's taste profile
router.get('/', authRequired, async (req, res) => {
  try {
    const tasteProfile = await TasteProfile.findOne({ userId: req.user.id })
      .populate('recommendedFoods.foodId')
      .populate('behavior.favoriteRestaurants');
    
    if (!tasteProfile) {
      return res.status(404).json({ message: 'Taste profile not found' });
    }
    
    res.json(tasteProfile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching taste profile', error: error.message });
  }
});

// POST create or update taste profile
router.post('/', authRequired, async (req, res) => {
  try {
    const { preferences, quizResponses } = req.body;
    
    // Calculate completion percentage
    const totalQuestions = 10; // Total number of quiz questions
    const answeredQuestions = quizResponses ? quizResponses.length : 0;
    const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100);
    const isComplete = completionPercentage >= 80; // 80% completion threshold
    
    let tasteProfile = await TasteProfile.findOne({ userId: req.user.id });
    
    if (tasteProfile) {
      // Update existing profile
      tasteProfile.preferences = { ...tasteProfile.preferences, ...preferences };
      if (quizResponses) {
        tasteProfile.quizResponses = [...tasteProfile.quizResponses, ...quizResponses];
      }
      tasteProfile.isComplete = isComplete;
      tasteProfile.completionPercentage = completionPercentage;
      tasteProfile.behavior.lastUpdated = new Date();
      
      await tasteProfile.save();
    } else {
      // Create new profile
      tasteProfile = new TasteProfile({
        userId: req.user.id,
        preferences,
        quizResponses: quizResponses || [],
        isComplete,
        completionPercentage
      });
      
      await tasteProfile.save();
      
      // Update user with taste profile reference
      await User.findByIdAndUpdate(req.user.id, { tasteProfileId: tasteProfile._id });
    }
    
    // Generate recommendations if profile is complete
    if (isComplete) {
      await generateRecommendations(tasteProfile._id);
    }
    
    res.json(tasteProfile);
  } catch (error) {
    res.status(500).json({ message: 'Error saving taste profile', error: error.message });
  }
});

// GET personalized recommendations
router.get('/recommendations', authRequired, async (req, res) => {
  try {
    const tasteProfile = await TasteProfile.findOne({ userId: req.user.id })
      .populate('recommendedFoods.foodId')
      .populate('recommendedFoods.foodId.restaurantId');
    
    if (!tasteProfile) {
      return res.status(404).json({ message: 'Taste profile not found' });
    }
    
    // Sort recommendations by score
    const recommendations = tasteProfile.recommendedFoods
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Return top 10 recommendations
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommendations', error: error.message });
  }
});

// POST update user behavior (called when user orders, likes, dislikes food)
router.post('/behavior', authRequired, async (req, res) => {
  try {
    const { action, foodId, restaurantId } = req.body;
    
    const tasteProfile = await TasteProfile.findOne({ userId: req.user.id });
    if (!tasteProfile) {
      return res.status(404).json({ message: 'Taste profile not found' });
    }
    
    switch (action) {
      case 'order':
        tasteProfile.behavior.totalOrders += 1;
        if (restaurantId && !tasteProfile.behavior.favoriteRestaurants.includes(restaurantId)) {
          tasteProfile.behavior.favoriteRestaurants.push(restaurantId);
        }
        break;
      case 'dislike':
        if (foodId && !tasteProfile.behavior.dislikedFoods.includes(foodId)) {
          tasteProfile.behavior.dislikedFoods.push(foodId);
        }
        break;
    }
    
    tasteProfile.behavior.lastUpdated = new Date();
    await tasteProfile.save();
    
    res.json({ message: 'Behavior updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating behavior', error: error.message });
  }
});

// Helper function to generate recommendations
async function generateRecommendations(tasteProfileId) {
  try {
    const tasteProfile = await TasteProfile.findById(tasteProfileId);
    if (!tasteProfile) return;
    
    const { preferences } = tasteProfile;
    let query = { isAvailable: true };
    
    // Filter by cuisine preferences
    if (preferences.cuisines && preferences.cuisines.length > 0) {
      query['restaurant.cuisine'] = { $in: preferences.cuisines };
    }
    
    // Filter by dietary restrictions
    if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
      if (preferences.dietaryRestrictions.includes('vegetarian')) {
        query.isVeg = true;
      }
    }
    
    // Filter by price range
    if (preferences.priceRange) {
      query.price = {
        $gte: preferences.priceRange.min,
        $lte: preferences.priceRange.max
      };
    }
    
    // Filter by categories
    if (preferences.categories && preferences.categories.length > 0) {
      query.category = { $in: preferences.categories };
    }
    
    // Get foods with restaurant data
    const foods = await Food.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurantId',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      { $unwind: '$restaurant' },
      { $match: { 'restaurant.isActive': true, 'restaurant.isOpen': true } }
    ]);
    
    // Calculate recommendation scores
    const recommendations = foods.map(food => {
      let score = 0;
      
      // Base score from rating
      score += food.rating * 0.3;
      
      // Cuisine match bonus
      if (preferences.cuisines && preferences.cuisines.includes(food.restaurant.cuisine)) {
        score += 0.2;
      }
      
      // Category match bonus
      if (preferences.categories && preferences.categories.includes(food.category)) {
        score += 0.15;
      }
      
      // Price range bonus
      if (preferences.priceRange) {
        const priceInRange = food.price >= preferences.priceRange.min && 
                           food.price <= preferences.priceRange.max;
        if (priceInRange) score += 0.1;
      }
      
      // Spice level match (if available in tags)
      if (preferences.spiceLevel && food.tags) {
        const spiceMatch = food.tags.some(tag => 
          tag.toLowerCase().includes(preferences.spiceLevel.toLowerCase())
        );
        if (spiceMatch) score += 0.1;
      }
      
      // Normalize score to 0-1
      score = Math.min(score, 1);
      
      return {
        foodId: food._id,
        score,
        reason: generateRecommendationReason(food, preferences)
      };
    });
    
    // Sort by score and take top recommendations
    const topRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    
    // Update taste profile with new recommendations
    tasteProfile.recommendedFoods = topRecommendations;
    await tasteProfile.save();
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
}

// Helper function to generate recommendation reason
function generateRecommendationReason(food, preferences) {
  const reasons = [];
  
  if (food.rating >= 4) {
    reasons.push('Highly rated');
  }
  
  if (preferences.cuisines && preferences.cuisines.includes(food.restaurant.cuisine)) {
    reasons.push(`Matches your ${food.restaurant.cuisine} preference`);
  }
  
  if (preferences.categories && preferences.categories.includes(food.category)) {
    reasons.push(`Your preferred ${food.category} category`);
  }
  
  if (preferences.priceRange && 
      food.price >= preferences.priceRange.min && 
      food.price <= preferences.priceRange.max) {
    reasons.push('Within your price range');
  }
  
  return reasons.join(', ') || 'Recommended for you';
}

module.exports = router;
