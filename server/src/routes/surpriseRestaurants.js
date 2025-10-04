const express = require('express');
const mongoose = require('mongoose');
const Food = require('../models/Food.js');
const Restaurant = require('../models/Restaurant.js');
const { authRequired } = require('../middleware/auth.js');

const router = express.Router();

// GET surprise restaurant with dish
router.get('/', authRequired, async (req, res) => {
  try {
    const { 
      budget = 25, 
      latitude, 
      longitude, 
      dietaryRestrictions = '',
      minRating = 4.2,
      maxDistance = 10 // in kilometers
    } = req.query;

    console.log('Surprise request params:', {
      budget: parseFloat(budget),
      latitude,
      longitude,
      dietaryRestrictions: dietaryRestrictions.split(','),
      minRating: parseFloat(minRating),
      maxDistance: parseFloat(maxDistance)
    });

    // Build restaurant query
    let restaurantQuery = {
      isActive: true,
      isOpen: true,
      rating: { $gte: parseFloat(minRating) }
    };

    // Add location-based filtering if coordinates provided
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);
      const maxDist = parseFloat(maxDistance);

      // Simple bounding box approach for performance
      // In production, use proper geospatial queries with MongoDB's 2dsphere index
      const latRange = maxDist / 111; // Rough conversion: 1 degree ≈ 111 km
      const lngRange = maxDist / (111 * Math.cos(userLat * Math.PI / 180));

      restaurantQuery['locationGeo.coordinates.1'] = {
        $gte: userLat - latRange,
        $lte: userLat + latRange
      };
      restaurantQuery['locationGeo.coordinates.0'] = {
        $gte: userLng - lngRange,
        $lte: userLng + lngRange
      };
    }

    // Get qualifying restaurants
    const restaurants = await Restaurant.find(restaurantQuery);
    console.log(`Found ${restaurants.length} qualifying restaurants`);

    if (restaurants.length === 0) {
      return res.status(404).json({
        message: 'No restaurants available in your area right now',
        suggestion: 'Try expanding your search radius or check back later'
      });
    }

    const restaurantIds = restaurants.map(r => r._id);

    // Build food query
    let foodQuery = {
      restaurantId: { $in: restaurantIds },
      isAvailable: true,
      price: { $lte: parseFloat(budget) },
      rating: { $gte: 4.0 }
    };

    // Add dietary restrictions
    const dietaryArray = dietaryRestrictions ? dietaryRestrictions.split(',').filter(d => d.trim()) : [];
    
    if (dietaryArray.length > 0) {
      if (dietaryArray.includes('vegetarian')) {
        foodQuery.isVeg = true;
      }
      // Add more dietary restriction logic as needed
    }

    console.log('Food query:', foodQuery);

    // Get qualifying foods with restaurant data
    const foods = await Food.aggregate([
      { $match: foodQuery },
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
          // Calculate surprise score based on multiple factors
          surpriseScore: {
            $add: [
              // Rating weight (40%)
              { $multiply: ['$rating', 8] },
              // Random factor (30%)
              { $multiply: [{ $rand: {} }, 6] },
              // Price factor (20%) - prefer mid-range prices
              {
                $cond: [
                  { $and: [
                    { $gte: ['$price', { $multiply: [parseFloat(budget), 0.3] }] },
                    { $lte: ['$price', { $multiply: [parseFloat(budget), 0.8] }] }
                  ]},
                  2,
                  1
                ]
              },
              // Restaurant rating weight (10%)
              { $multiply: ['$restaurant.rating', 1] }
            ]
          }
        }
      },
      { $sort: { surpriseScore: -1 } },
      { $limit: 20 } // Get top 20 candidates
    ]);

    console.log(`Found ${foods.length} qualifying foods`);

    if (foods.length === 0) {
      return res.status(400).json({
        message: 'No dishes found within your budget',
        suggestion: 'Try increasing your budget or relaxing your dietary restrictions',
        budget: parseFloat(budget)
      });
    }

    // Randomly select from top candidates
    const randomIndex = Math.floor(Math.random() * Math.min(foods.length, 10));
    const selectedFood = foods[randomIndex];

    // Generate surprise message
    const surpriseMessages = [
      "Surprise! We found something amazing for you! 🎉",
      "Here's a delightful surprise just for you! ✨",
      "We think you'll love this! 😋",
      "A perfect surprise awaits you! 🍽️",
      "Something special just for your taste buds! 👅",
      "Ta-da! Your surprise is ready! 🎁",
      "We've got something delicious for you! 🍴"
    ];

    const randomMessage = surpriseMessages[Math.floor(Math.random() * surpriseMessages.length)];

    // Generate reason for recommendation
    const reasons = [];
    if (selectedFood.rating >= 4.5) {
      reasons.push('Exceptional rating');
    } else if (selectedFood.rating >= 4.0) {
      reasons.push('Highly rated');
    }
    
    if (selectedFood.price <= parseFloat(budget) * 0.5) {
      reasons.push('Great value');
    } else if (selectedFood.price <= parseFloat(budget) * 0.8) {
      reasons.push('Within your budget');
    }
    
    if (selectedFood.restaurant.rating >= 4.5) {
      reasons.push('From a top-rated restaurant');
    }

    const reason = reasons.length > 0 ? reasons.join(', ') : 'A great choice for you!';

    // Prepare response
    const response = {
      food: {
        _id: selectedFood._id,
        name: selectedFood.name,
        description: selectedFood.description,
        price: selectedFood.price,
        rating: selectedFood.rating,
        image: selectedFood.image,
        category: selectedFood.category,
        isVeg: selectedFood.isVeg,
        preparationTime: selectedFood.preparationTime,
        tags: selectedFood.tags || [],
        restaurant: {
          _id: selectedFood.restaurant._id,
          name: selectedFood.restaurant.name,
          cuisine: selectedFood.restaurant.cuisine,
          rating: selectedFood.restaurant.rating,
          deliveryTime: selectedFood.restaurant.deliveryTime,
          location: selectedFood.restaurant.location
        },
        restaurantId: selectedFood.restaurantId
      },
      message: randomMessage,
      reason: reason,
      isSurprise: true,
      metadata: {
        totalCandidates: foods.length,
        selectedFrom: Math.min(foods.length, 10),
        searchRadius: maxDistance,
        budget: parseFloat(budget),
        dietaryRestrictions: dietaryArray
      }
    };

    console.log('Surprise response:', {
      foodName: response.food.name,
      restaurantName: response.food.restaurant.name,
      price: response.food.price,
      rating: response.food.rating
    });

    res.json(response);

  } catch (error) {
    console.error('Surprise API error:', error);
    res.status(500).json({
      message: 'Error finding surprise dish',
      error: error.message
    });
  }
});

// GET multiple surprise options
router.get('/multiple', authRequired, async (req, res) => {
  try {
    const { 
      count = 3, 
      budget = 25, 
      latitude, 
      longitude, 
      dietaryRestrictions = '',
      minRating = 4.0 
    } = req.query;

    // Similar logic to single surprise but return multiple options
    const restaurantQuery = {
      isActive: true,
      isOpen: true,
      rating: { $gte: parseFloat(minRating) }
    };

    const restaurants = await Restaurant.find(restaurantQuery);
    if (restaurants.length === 0) {
      return res.status(404).json({
        message: 'No restaurants available',
        suggestion: 'Try again later'
      });
    }

    const foodQuery = {
      restaurantId: { $in: restaurants.map(r => r._id) },
      isAvailable: true,
      price: { $lte: parseFloat(budget) },
      rating: { $gte: 4.0 }
    };

    const foods = await Food.aggregate([
      { $match: foodQuery },
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
          surpriseScore: {
            $add: [
              { $multiply: ['$rating', 8] },
              { $multiply: [{ $rand: {} }, 6] }
            ]
          }
        }
      },
      { $sort: { surpriseScore: -1 } },
      { $limit: parseInt(count) }
    ]);

    if (foods.length === 0) {
      return res.status(400).json({
        message: 'No dishes found within your budget',
        suggestion: 'Try increasing your budget'
      });
    }

    const surprises = foods.map(food => ({
      food: {
        _id: food._id,
        name: food.name,
        description: food.description,
        price: food.price,
        rating: food.rating,
        image: food.image,
        category: food.category,
        isVeg: food.isVeg,
        preparationTime: food.preparationTime,
        tags: food.tags || [],
        restaurant: {
          _id: food.restaurant._id,
          name: food.restaurant.name,
          cuisine: food.restaurant.cuisine,
          rating: food.restaurant.rating,
          deliveryTime: food.restaurant.deliveryTime
        },
        restaurantId: food.restaurantId
      },
      message: `Option ${foods.indexOf(food) + 1}`,
      reason: 'Great choice!'
    }));

    res.json({
      surprises,
      count: surprises.length,
      message: `Here are ${surprises.length} amazing surprises for you! 🎉`
    });

  } catch (error) {
    console.error('Multiple surprise API error:', error);
    res.status(500).json({
      message: 'Error finding surprise dishes',
      error: error.message
    });
  }
});

module.exports = router;
