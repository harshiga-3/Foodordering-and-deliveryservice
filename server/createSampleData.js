const mongoose = require('mongoose');
const Restaurant = require('./src/models/Restaurant');
const Food = require('./src/models/Food');

async function createSampleData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/fooddelivery');
    console.log('Connected to MongoDB');

    const ownerId = '68c2f29f3904483883703272';
    
    // Create a restaurant
    const restaurant = new Restaurant({
      name: 'My Sample Restaurant',
      cuisine: 'Indian',
      location: 'Chennai',
      owner: ownerId,
      image: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Restaurant',
      tags: ['Indian', 'Vegetarian', 'Non-Vegetarian'],
      isActive: true
    });

    const savedRestaurant = await restaurant.save();
    console.log('Created restaurant:', savedRestaurant.name, 'with ID:', savedRestaurant._id);

    // Create food items
    const foodItems = [
      {
        name: 'Chicken Biryani',
        description: 'Spicy chicken biryani with basmati rice',
        price: 250,
        category: 'Biryani',
        restaurantId: savedRestaurant._id,
        owner: ownerId,
        image: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Food',
        isVeg: false,
        tags: ['chicken', 'biryani', 'spicy'],
        foodType: 'biryani'
      },
      {
        name: 'Paneer Butter Masala',
        description: 'Creamy paneer curry with butter and cream',
        price: 180,
        category: 'Curry',
        restaurantId: savedRestaurant._id,
        owner: ownerId,
        image: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Food',
        isVeg: true,
        tags: ['paneer', 'curry', 'butter'],
        foodType: 'curry'
      },
      {
        name: 'Masala Dosa',
        description: 'Crispy dosa with spiced potato filling',
        price: 120,
        category: 'Breakfast',
        restaurantId: savedRestaurant._id,
        owner: ownerId,
        image: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Food',
        isVeg: true,
        tags: ['dosa', 'breakfast', 'south indian'],
        foodType: 'dosa'
      },
      {
        name: 'Chicken Curry',
        description: 'Traditional chicken curry with spices',
        price: 200,
        category: 'Curry',
        restaurantId: savedRestaurant._id,
        owner: ownerId,
        image: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Food',
        isVeg: false,
        tags: ['chicken', 'curry', 'traditional'],
        foodType: 'curry'
      }
    ];

    for (const foodData of foodItems) {
      const food = new Food(foodData);
      const savedFood = await food.save();
      console.log('Created food item:', savedFood.name, 'for ₹', savedFood.price);
    }

    console.log('\n✅ Sample data created successfully!');
    console.log('Restaurant:', savedRestaurant.name);
    console.log('Food items:', foodItems.length);
    console.log('\nNow you can:');
    console.log('1. Go to Owner Dashboard → Combo Offers');
    console.log('2. Click "Add Combo"');
    console.log('3. Select "My Sample Restaurant"');
    console.log('4. You should now see 4 food items to choose from!');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

createSampleData();
