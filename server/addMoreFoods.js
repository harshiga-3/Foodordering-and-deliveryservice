const mongoose = require('mongoose');
const Food = require('./src/models/Food');
const Restaurant = require('./src/models/Restaurant');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food_delivery';

const addMoreFoods = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find the divya foods restaurant
    const restaurant = await Restaurant.findOne({ name: 'divya foods' });
    
    if (!restaurant) {
      console.log('divya foods restaurant not found');
      return;
    }

    console.log('Adding foods to restaurant:', restaurant.name);

    const foodsToAdd = [
      // Main Course
      { 
        name: "Chicken Biryani", 
        description: "Fragrant basmati rice cooked with tender chicken and aromatic spices", 
        price: 250, 
        category: "Main Course", 
        restaurantId: restaurant._id, 
        image: "images/TrendingFood/briyani.jpg", 
        isVeg: false, 
        rating: 4.8, 
        tags: ["spicy", "popular"], 
        foodType: "biryani" 
      },
      { 
        name: "Mutton Biryani", 
        description: "Rich and flavorful biryani with tender mutton pieces", 
        price: 350, 
        category: "Main Course", 
        restaurantId: restaurant._id, 
        image: "images/spicybriyani/mutton.jpg", 
        isVeg: false, 
        rating: 4.9, 
        tags: ["spicy", "premium"], 
        foodType: "biryani" 
      },
      { 
        name: "Vegetable Biryani", 
        description: "Aromatic rice with mixed vegetables and spices", 
        price: 180, 
        category: "Main Course", 
        restaurantId: restaurant._id, 
        image: "images/spicybriyani/veg.jpg", 
        isVeg: true, 
        rating: 4.5, 
        tags: ["vegetarian"], 
        foodType: "biryani" 
      },
      
      // Breakfast
      { 
        name: "Masala Dosa", 
        description: "Crispy crepe filled with spiced potato filling", 
        price: 90, 
        category: "Breakfast", 
        restaurantId: restaurant._id, 
        image: "images/TrendingFood/dosa.jpeg", 
        isVeg: true, 
        rating: 4.7, 
        tags: ["popular", "tiffin"], 
        foodType: "dosa" 
      },
      { 
        name: "Idli Sambar", 
        description: "Soft steamed rice cakes served with lentil stew", 
        price: 60, 
        category: "Breakfast", 
        restaurantId: restaurant._id, 
        image: "images/TrendingFood/idli.jpg", 
        isVeg: true, 
        rating: 4.5, 
        tags: ["tiffin"], 
        foodType: "idli" 
      },
      { 
        name: "Pongal", 
        description: "Traditional South Indian rice and lentil dish", 
        price: 80, 
        category: "Breakfast", 
        restaurantId: restaurant._id, 
        image: "images/TrendingFood/pongal.jpg", 
        isVeg: true, 
        rating: 4.6, 
        tags: ["traditional"], 
        foodType: "pongal" 
      },
      
      // Curry
      { 
        name: "Paneer Butter Masala", 
        description: "Creamy tomato gravy with soft paneer cubes", 
        price: 180, 
        category: "Curry", 
        restaurantId: restaurant._id, 
        image: "images/curries/f1.jpg", 
        isVeg: true, 
        rating: 4.8, 
        tags: ["paneer", "creamy"], 
        foodType: "curry" 
      },
      { 
        name: "Chicken Curry", 
        description: "Spicy and tangy chicken curry with onions and tomatoes", 
        price: 220, 
        category: "Curry", 
        restaurantId: restaurant._id, 
        image: "images/curries/f2.jpg", 
        isVeg: false, 
        rating: 4.7, 
        tags: ["spicy"], 
        foodType: "curry" 
      },
      { 
        name: "Dal Makhani", 
        description: "Rich and creamy black lentil curry", 
        price: 160, 
        category: "Curry", 
        restaurantId: restaurant._id, 
        image: "images/curries/f3.jpg", 
        isVeg: true, 
        rating: 4.6, 
        tags: ["dal", "creamy"], 
        foodType: "curry" 
      },
      
      // Beverages
      { 
        name: "Filter Coffee", 
        description: "Traditional South Indian filter coffee", 
        price: 40, 
        category: "Beverages", 
        restaurantId: restaurant._id, 
        image: "images/TrendingFood/filtercofee.jpg", 
        isVeg: true, 
        rating: 4.6, 
        tags: ["drink", "traditional"], 
        foodType: "beverage" 
      },
      { 
        name: "Fresh Lime Soda", 
        description: "Refreshing lime soda with mint", 
        price: 50, 
        category: "Beverages", 
        restaurantId: restaurant._id, 
        image: "images/food/f1.jpg", 
        isVeg: true, 
        rating: 4.4, 
        tags: ["refreshing"], 
        foodType: "beverage" 
      }
    ];

    // Clear existing foods for this restaurant
    await Food.deleteMany({ restaurantId: restaurant._id });
    console.log('Cleared existing foods');

    // Add new foods
    await Food.insertMany(foodsToAdd);
    console.log(`Added ${foodsToAdd.length} food items`);
    
    foodsToAdd.forEach(f => console.log(`- ${f.name} (${f.category}) - ₹${f.price}`));

  } catch (error) {
    console.error('Error adding foods:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

addMoreFoods();
