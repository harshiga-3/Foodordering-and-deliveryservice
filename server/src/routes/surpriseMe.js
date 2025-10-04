const express = require('express');
const mongoose = require('mongoose');
const Food = require('../models/Food.js');
const Restaurant = require('../models/Restaurant.js');
const TasteProfile = require('../models/TasteProfile.js');
const { authRequired } = require('../middleware/auth.js');

const router = express.Router();

// GET surprise me - random highly-rated dish within budget
router.get('/', authRequired, async (req, res) => {
  try {
    const { maxPrice = 1000, minRating = 4.0 } = req.query;
    
    // Get user's taste profile for better recommendations
    const tasteProfile = await TasteProfile.findOne({ userId: req.user.id });
    
    let query = {
      isAvailable: true,
      rating: { $gte: parseFloat(minRating) },
      price: { $lte: parseFloat(maxPrice) }
    };
    
    // If user has taste profile, use it to filter better
    if (tasteProfile && tasteProfile.isComplete) {
      const { preferences } = tasteProfile;
      
      // Add cuisine filter if available
      if (preferences.cuisines && preferences.cuisines.length > 0) {
        // We'll filter this in the aggregation pipeline
      }
      
      // Add dietary restrictions
      if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.includes('vegetarian')) {
        query.isVeg = true;
      }
      
      // Add category filter
      if (preferences.categories && preferences.categories.length > 0) {
        query.category = { $in: preferences.categories };
      }
    }
    
    // Build aggregation pipeline
    const pipeline = [
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
      { 
        $match: { 
          'restaurant.isActive': true, 
          'restaurant.isOpen': true 
        } 
      }
    ];
    
    // Add cuisine filter if user has preferences
    if (tasteProfile && tasteProfile.isComplete && tasteProfile.preferences.cuisines) {
      pipeline.push({
        $match: {
          'restaurant.cuisine': { $in: tasteProfile.preferences.cuisines }
        }
      });
    }
    
    // Add scoring for better randomization
    pipeline.push({
      $addFields: {
        // Higher rating gets higher score
        ratingScore: { $multiply: ['$rating', 20] },
        // Random score for true randomization
        randomScore: { $rand: {} },
        // Combined score
        totalScore: {
          $add: [
            { $multiply: ['$rating', 20] },
            { $multiply: [{ $rand: {} }, 10] }
          ]
        }
      }
    });
    
    // Sort by combined score and get random selection
    pipeline.push({ $sort: { totalScore: -1 } });
    pipeline.push({ $limit: 50 }); // Get top 50 candidates
    pipeline.push({ $sample: { size: 1 } }); // Randomly select 1 from top 50
    
    const surpriseFoods = await Food.aggregate(pipeline);
    
    if (surpriseFoods.length === 0) {
      // Fallback: get any highly-rated food if no matches found
      const fallbackPipeline = [
        { 
          $match: { 
            isAvailable: true,
            rating: { $gte: 3.5 },
            price: { $lte: parseFloat(maxPrice) }
          } 
        },
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
          $match: { 
            'restaurant.isActive': true, 
            'restaurant.isOpen': true 
          } 
        },
        { $sample: { size: 1 } }
      ];
      
      const fallbackFoods = await Food.aggregate(fallbackPipeline);
      if (fallbackFoods.length === 0) {
        return res.status(404).json({ 
          message: 'No suitable dishes found. Try adjusting your budget or preferences.' 
        });
      }
      
      return res.json({
        food: fallbackFoods[0],
        isFallback: true,
        message: 'Here\'s a great dish we found for you!'
      });
    }
    
    const surpriseFood = surpriseFoods[0];
    
    // Generate surprise message
    const surpriseMessages = [
      "Surprise! We found something amazing for you! 🎉",
      "Here's a delightful surprise just for you! ✨",
      "We think you'll love this! 😋",
      "A perfect surprise awaits you! 🍽️",
      "Something special just for your taste buds! 👅"
    ];
    
    const randomMessage = surpriseMessages[Math.floor(Math.random() * surpriseMessages.length)];
    
    res.json({
      food: surpriseFood,
      message: randomMessage,
      isSurprise: true,
      reason: generateSurpriseReason(surpriseFood, tasteProfile)
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error finding surprise dish', error: error.message });
  }
});

// GET multiple surprise options
router.get('/multiple', authRequired, async (req, res) => {
  try {
    const { count = 3, maxPrice = 1000, minRating = 4.0 } = req.query;
    
    const tasteProfile = await TasteProfile.findOne({ userId: req.user.id });
    
    let query = {
      isAvailable: true,
      rating: { $gte: parseFloat(minRating) },
      price: { $lte: parseFloat(maxPrice) }
    };
    
    if (tasteProfile && tasteProfile.isComplete) {
      const { preferences } = tasteProfile;
      
      if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.includes('vegetarian')) {
        query.isVeg = true;
      }
      
      if (preferences.categories && preferences.categories.length > 0) {
        query.category = { $in: preferences.categories };
      }
    }
    
    const pipeline = [
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
      { 
        $match: { 
          'restaurant.isActive': true, 
          'restaurant.isOpen': true 
        } 
      }
    ];
    
    if (tasteProfile && tasteProfile.isComplete && tasteProfile.preferences.cuisines) {
      pipeline.push({
        $match: {
          'restaurant.cuisine': { $in: tasteProfile.preferences.cuisines }
        }
      });
    }
    
    pipeline.push({
      $addFields: {
        totalScore: {
          $add: [
            { $multiply: ['$rating', 20] },
            { $multiply: [{ $rand: {} }, 10] }
          ]
        }
      }
    });
    
    pipeline.push({ $sort: { totalScore: -1 } });
    pipeline.push({ $limit: 20 }); // Get top 20 candidates
    pipeline.push({ $sample: { size: parseInt(count) } }); // Randomly select requested count
    
    const surpriseFoods = await Food.aggregate(pipeline);
    
    if (surpriseFoods.length === 0) {
      return res.status(404).json({ 
        message: 'No suitable dishes found. Try adjusting your budget or preferences.' 
      });
    }
    
    res.json({
      foods: surpriseFoods,
      count: surpriseFoods.length,
      message: `Here are ${surpriseFoods.length} amazing surprises for you! 🎉`
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error finding surprise dishes', error: error.message });
  }
});

// Helper function to generate surprise reason
function generateSurpriseReason(food, tasteProfile) {
  const reasons = [];
  
  if (food.rating >= 4.5) {
    reasons.push('Exceptional rating');
  } else if (food.rating >= 4.0) {
    reasons.push('Highly rated');
  }
  
  if (tasteProfile && tasteProfile.isComplete) {
    const { preferences } = tasteProfile;
    
    if (preferences.cuisines && preferences.cuisines.includes(food.restaurant.cuisine)) {
      reasons.push(`Matches your ${food.restaurant.cuisine} preference`);
    }
    
    if (preferences.categories && preferences.categories.includes(food.category)) {
      reasons.push(`Your preferred ${food.category} category`);
    }
    
    if (preferences.priceRange && 
        food.price >= preferences.priceRange.min && 
        food.price <= preferences.priceRange.max) {
      reasons.push('Within your budget');
    }
  }
  
  return reasons.length > 0 ? reasons.join(', ') : 'A great choice for you!';
}

module.exports = router;
