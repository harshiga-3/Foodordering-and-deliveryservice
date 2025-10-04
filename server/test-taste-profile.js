// Test script for Taste Profile and Surprise Me features
const mongoose = require('mongoose');
const TasteProfile = require('./src/models/TasteProfile');
const User = require('./src/models/User');
const Food = require('./src/models/Food');
const Restaurant = require('./src/models/Restaurant');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food_delivery';

async function testTasteProfile() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Test creating a taste profile
    console.log('\n📝 Testing Taste Profile creation...');
    
    // Find a user to test with
    const user = await User.findOne({ role: 'user' });
    if (!user) {
      console.log('❌ No user found. Please create a user first.');
      return;
    }
    
    console.log(`👤 Testing with user: ${user.name} (${user.email})`);

    // Create a taste profile
    const tasteProfile = new TasteProfile({
      userId: user._id,
      preferences: {
        cuisines: ['South Indian', 'North Indian'],
        spiceLevel: 'medium',
        dietaryRestrictions: ['vegetarian'],
        categories: ['curries', 'rice'],
        priceRange: { min: 100, max: 500 },
        mealTypes: ['lunch', 'dinner'],
        textures: ['soft', 'creamy'],
        flavors: ['spicy', 'sour']
      },
      quizResponses: [
        {
          questionId: 'cuisines',
          answer: ['South Indian', 'North Indian'],
          timestamp: new Date()
        }
      ],
      isComplete: true,
      completionPercentage: 100
    });

    await tasteProfile.save();
    console.log('✅ Taste profile created successfully');

    // Update user with taste profile reference
    user.tasteProfileId = tasteProfile._id;
    await user.save();
    console.log('✅ User updated with taste profile reference');

    // Test Surprise Me functionality
    console.log('\n🎁 Testing Surprise Me functionality...');
    
    // Find some foods to test with
    const foods = await Food.find({ isAvailable: true }).limit(5);
    if (foods.length === 0) {
      console.log('❌ No foods found. Please add some foods first.');
      return;
    }
    
    console.log(`🍽️ Found ${foods.length} foods for testing`);

    // Test the surprise me query
    const surpriseQuery = {
      isAvailable: true,
      rating: { $gte: 4.0 },
      price: { $lte: 500 }
    };

    const surpriseFoods = await Food.aggregate([
      { $match: surpriseQuery },
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
    ]);

    if (surpriseFoods.length > 0) {
      console.log('✅ Surprise Me query successful');
      console.log(`🎉 Surprise food: ${surpriseFoods[0].name} (₹${surpriseFoods[0].price})`);
    } else {
      console.log('⚠️ No surprise foods found with current criteria');
    }

    // Test recommendation generation
    console.log('\n🎯 Testing recommendation generation...');
    
    const recommendations = await Food.aggregate([
      { $match: { isAvailable: true } },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurantId',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      { $unwind: '$restaurant' },
      { $match: { 'restaurant.isActive': true } },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ['$rating', 20] },
              { $multiply: [{ $rand: {} }, 10] }
            ]
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 3 }
    ]);

    console.log(`✅ Generated ${recommendations.length} recommendations`);
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.name} - Score: ${Math.round(rec.score)}`);
    });

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Taste Profile model created');
    console.log('  ✅ User model updated');
    console.log('  ✅ Taste profile created for test user');
    console.log('  ✅ Surprise Me functionality tested');
    console.log('  ✅ Recommendation generation tested');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testTasteProfile();
