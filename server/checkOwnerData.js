const mongoose = require('mongoose');
const Restaurant = require('./src/models/Restaurant');
const Food = require('./src/models/Food');

async function checkOwnerData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/fooddelivery');
    console.log('Connected to MongoDB');

    const ownerId = '68c2f29f3904483883703272';
    
    // Check owner's restaurants
    const restaurants = await Restaurant.find({ owner: ownerId });
    console.log(`\nOwner ${ownerId} has ${restaurants.length} restaurants:`);
    restaurants.forEach(r => {
      console.log(`- ${r.name} (ID: ${r._id})`);
    });

    // Check all restaurants
    const allRestaurants = await Restaurant.find({});
    console.log(`\nAll restaurants in database (${allRestaurants.length}):`);
    allRestaurants.forEach(r => {
      console.log(`- ${r.name} (ID: ${r._id}, Owner: ${r.owner})`);
    });

    // Check foods for each restaurant
    console.log('\nFood items per restaurant:');
    for (const restaurant of allRestaurants) {
      const foods = await Food.find({ restaurantId: restaurant._id });
      console.log(`- ${restaurant.name}: ${foods.length} food items`);
      if (foods.length > 0) {
        foods.forEach(f => console.log(`  * ${f.name} - ₹${f.price}`));
      }
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOwnerData();
