const mongoose = require('mongoose');
const Food = require('./src/models/Food');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food_delivery';

const testFoods = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const restaurantId = '68c2f2db390448388370330c';
    console.log('Testing restaurant ID:', restaurantId);

    // Test direct query
    const directQuery = { restaurantId: new mongoose.Types.ObjectId(restaurantId) };
    console.log('Direct query:', directQuery);
    const directResult = await Food.find(directQuery);
    console.log('Direct query result:', directResult.length, 'foods found');
    directResult.forEach(f => console.log('- ' + f.name + ' (' + f.category + ')'));

    // Test aggregation
    const aggQuery = { restaurantId: new mongoose.Types.ObjectId(restaurantId) };
    console.log('Aggregation query:', aggQuery);
    const aggResult = await Food.aggregate([{ $match: aggQuery }]);
    console.log('Aggregation result:', aggResult.length, 'foods found');
    aggResult.forEach(f => console.log('- ' + f.name + ' (' + f.category + ')'));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testFoods();
