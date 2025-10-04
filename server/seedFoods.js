// Seed script to add sample food items to restaurants
const mongoose = require('mongoose');
const Food = require('./src/models/Food');
const Restaurant = require('./src/models/Restaurant');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food_delivery';

const sampleFoods = [
  {
    name: "Masala Dosa",
    description: "Crispy crepe filled with spiced potato filling",
    price: 90,
    category: "Breakfast",
    image: "/images/TrendingFood/dosa.jpeg",
    isVeg: true,
    rating: 4.7,
    tags: ["popular", "tiffin"],
    foodType: "dosa"
  },
  {
    name: "Idli Sambar",
    description: "Soft steamed rice cakes served with lentil stew and coconut chutney",
    price: 60,
    category: "Breakfast",
    image: "/images/TrendingFood/idli.jpg",
    isVeg: true,
    rating: 4.5,
    tags: ["traditional"],
    foodType: "idli"
  },
  {
    name: "Chicken Biryani",
    description: "Fragrant basmati rice cooked with tender chicken and aromatic spices",
    price: 250,
    category: "Main Course",
    image: "/images/TrendingFood/briyani.jpg",
    isVeg: false,
    rating: 4.9,
    tags: ["popular", "spicy"],
    foodType: "biryani"
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
    foodType: "curry"
  },
  {
    name: "Filter Coffee",
    description: "Traditional South Indian filter coffee made with chicory and milk",
    price: 40,
    category: "Beverages",
    image: "/images/TrendingFood/filtercofee.jpg",
    isVeg: true,
    rating: 4.6,
    tags: ["traditional", "hot"],
    foodType: "beverage"
  },
  {
    name: "Gulab Jamun",
    description: "Sweet milk solids in sugar syrup",
    price: 80,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400",
    isVeg: true,
    rating: 4.8,
    tags: ["sweet", "traditional"],
    foodType: "dessert"
  }
];

async function seedFoods() {
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

    // Clear existing foods for this restaurant
    await Food.deleteMany({ restaurantId: restaurant._id });
    console.log('Cleared existing foods for this restaurant');

    // Add sample foods
    const foodsToAdd = sampleFoods.map(food => ({
      ...food,
      restaurantId: restaurant._id
    }));

    const createdFoods = await Food.insertMany(foodsToAdd);
    console.log(`Added ${createdFoods.length} food items to ${restaurant.name}`);

    // Display the added foods
    createdFoods.forEach(food => {
      console.log(`- ${food.name} (${food.category}) - ₹${food.price}`);
    });

  } catch (error) {
    console.error('Error seeding foods:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedFoods();
