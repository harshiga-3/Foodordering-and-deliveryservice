const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Restaurant = require('./src/models/Restaurant.js');
const Food = require('./src/models/Food.js');
const User = require('./src/models/User.js');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodapp')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample data
const sampleRestaurants = [
  {
    name: "Tamil Nadu Spice House",
    cuisine: "South Indian",
    rating: 4.5,
    deliveryTime: "30-45 min",
    costForTwo: "₹300-500",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
    location: "Chennai",
    tags: ["Traditional", "Spicy", "Authentic"],
    address: {
      street: "123 Anna Salai",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600002"
    },
    phone: "+91 9876543210",
    email: "info@tamilnaduspice.com"
  },
  {
    name: "Coimbatore Kitchen",
    cuisine: "Tamil Nadu",
    rating: 4.2,
    deliveryTime: "25-40 min",
    costForTwo: "₹250-400",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500",
    location: "Coimbatore",
    tags: ["Local", "Fresh", "Home-style"],
    address: {
      street: "456 Race Course Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641018"
    },
    phone: "+91 9876543211",
    email: "contact@coimbatorekitchen.com"
  },
  {
    name: "Madurai Meals",
    cuisine: "South Indian",
    rating: 4.7,
    deliveryTime: "35-50 min",
    costForTwo: "₹200-350",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500",
    location: "Madurai",
    tags: ["Traditional", "Budget-friendly", "Quick"],
    address: {
      street: "789 Temple Street",
      city: "Madurai",
      state: "Tamil Nadu",
      pincode: "625001"
    },
    phone: "+91 9876543212",
    email: "hello@maduraimeals.com"
  }
];

const sampleFoods = [
  {
    name: "Masala Dosa",
    description: "Crispy rice and lentil crepe filled with spiced potato mixture, served with sambar and coconut chutney",
    price: 120,
    category: "Breakfast",
    foodType: "Dosa",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500",
    isVeg: true,
    tags: ["Popular", "Breakfast", "Traditional"],
    rating: 4.5,
    preparationTime: 15
  },
  {
    name: "Chicken Biryani",
    description: "Aromatic basmati rice cooked with tender chicken pieces, spices, and herbs",
    price: 280,
    category: "Main Course",
    foodType: "Biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03246963d4a9?w=500",
    isVeg: false,
    tags: ["Popular", "Spicy", "Rice"],
    rating: 4.8,
    preparationTime: 25
  },
  {
    name: "Idli Sambar",
    description: "Soft steamed rice cakes served with hot sambar and coconut chutney",
    price: 80,
    category: "Breakfast",
    foodType: "Idli",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500",
    isVeg: true,
    tags: ["Healthy", "Breakfast", "Light"],
    rating: 4.3,
    preparationTime: 10
  },
  {
    name: "Prawn Curry",
    description: "Fresh prawns cooked in a rich coconut-based curry with aromatic spices",
    price: 350,
    category: "Seafood",
    foodType: "Curry",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500",
    isVeg: false,
    tags: ["Seafood", "Spicy", "Rich"],
    rating: 4.6,
    preparationTime: 20
  },
  {
    name: "Filter Coffee",
    description: "Traditional South Indian filter coffee made with fresh milk and coffee decoction",
    price: 40,
    category: "Beverages",
    foodType: "Coffee",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500",
    isVeg: true,
    tags: ["Beverage", "Traditional", "Strong"],
    rating: 4.4,
    preparationTime: 5
  },
  {
    name: "Veg Thali",
    description: "Complete meal with rice, dal, vegetables, curd, pickle, and papad",
    price: 150,
    category: "Thali",
    foodType: "Meal",
    image: "https://images.unsplash.com/photo-1563379091339-03246963d4a9?w=500",
    isVeg: true,
    tags: ["Complete Meal", "Balanced", "Traditional"],
    rating: 4.2,
    preparationTime: 15
  }
];

async function seedData() {
  try {
    // Clear existing data
    await Restaurant.deleteMany({});
    await Food.deleteMany({});
    console.log('Cleared existing data');

    // Create a sample owner user if it doesn't exist
    let owner = await User.findOne({ email: 'owner@example.com' });
    if (!owner) {
      const passwordHash = await bcrypt.hash('password123', 10);
      owner = new User({
        name: 'Restaurant Owner',
        email: 'owner@example.com',
        passwordHash: passwordHash,
        role: 'owner'
      });
      await owner.save();
      console.log('Created sample owner user');
    }

    // Create restaurants
    const createdRestaurants = [];
    for (const restaurantData of sampleRestaurants) {
      const restaurant = new Restaurant({
        ...restaurantData,
        ownerId: owner._id
      });
      const savedRestaurant = await restaurant.save();
      createdRestaurants.push(savedRestaurant);
      console.log(`Created restaurant: ${savedRestaurant.name}`);
    }

    // Create foods and assign to restaurants
    for (let i = 0; i < sampleFoods.length; i++) {
      const foodData = sampleFoods[i];
      const restaurantIndex = i % createdRestaurants.length;
      const restaurant = createdRestaurants[restaurantIndex];

      const food = new Food({
        ...foodData,
        restaurantId: restaurant._id,
        restaurantName: restaurant.name
      });
      const savedFood = await food.save();
      console.log(`Created food: ${savedFood.name} for ${restaurant.name}`);
    }

    console.log('Seed data created successfully!');
    console.log(`Created ${createdRestaurants.length} restaurants`);
    console.log(`Created ${sampleFoods.length} food items`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedData();
