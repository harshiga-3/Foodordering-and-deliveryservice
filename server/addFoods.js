const mongoose = require('mongoose');
const Food = require('./src/models/Food');
const Restaurant = require('./src/models/Restaurant');

const MONGO_URI = 'mongodb://127.0.0.1:27017/food_delivery';

async function addFoods() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the first restaurant
    const restaurant = await Restaurant.findOne({ isActive: true });
    if (!restaurant) {
      console.log('No active restaurant found. Please create a restaurant first.');
      return;
    }

    console.log(`Adding foods to restaurant: ${restaurant.name}`);

    // Sample foods
    const foods = [
      {
        name: "Masala Dosa",
        description: "Crispy crepe filled with spiced potato filling",
        price: 90,
        category: "Breakfast",
        image: "/images/TrendingFood/dosa.jpeg",
        isVeg: true,
        rating: 4.7,
        tags: ["popular", "tiffin"],
        foodType: "dosa",
        restaurantId: restaurant._id
      },
      {
        name: "Idli Sambar",
        description: "Soft steamed rice cakes served with lentil stew",
        price: 60,
        category: "Breakfast",
        image: "/images/TrendingFood/idli.jpg",
        isVeg: true,
        rating: 4.5,
        tags: ["traditional"],
        foodType: "idli",
        restaurantId: restaurant._id
      },
      {
        name: "Chicken Biryani",
        description: "Fragrant basmati rice cooked with tender chicken",
        price: 250,
        category: "Main Course",
        image: "/images/TrendingFood/briyani.jpg",
        isVeg: false,
        rating: 4.9,
        tags: ["popular", "spicy"],
        foodType: "biryani",
        restaurantId: restaurant._id
      },
      {
        name: "Paneer Butter Masala",
        description: "Paneer in creamy tomato gravy",
        price: 180,
        category: "Curry",
        image: "/images/curries/f1.png",
        isVeg: true,
        rating: 4.8,
        tags: ["paneer", "creamy"],
        foodType: "curry",
        restaurantId: restaurant._id
      },
      {
        name: "Filter Coffee",
        description: "Traditional South Indian filter coffee",
        price: 40,
        category: "Beverages",
        image: "/images/TrendingFood/filtercofee.jpg",
        isVeg: true,
        rating: 4.6,
        tags: ["traditional", "hot"],
        foodType: "beverage",
        restaurantId: restaurant._id
      }
    ];

    // Clear existing foods
    await Food.deleteMany({ restaurantId: restaurant._id });
    console.log('Cleared existing foods');

    // Add new foods
    const createdFoods = await Food.insertMany(foods);
    console.log(`Added ${createdFoods.length} food items`);

    createdFoods.forEach(food => {
      console.log(`- ${food.name} (${food.category}) - ₹${food.price}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addFoods();
