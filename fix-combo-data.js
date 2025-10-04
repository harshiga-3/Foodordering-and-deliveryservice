const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fooddelivery', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Combo = require('./src/models/Combo.js');

async function fixComboData() {
  try {
    console.log('Connecting to database...');
    
    // Find all combos
    const combos = await Combo.find({});
    console.log(`Found ${combos.length} combos`);
    
    for (const combo of combos) {
      console.log(`Processing combo: ${combo.name}`);
      console.log(`Current restaurantId type: ${typeof combo.restaurantId}`);
      console.log(`Current restaurantId value:`, combo.restaurantId);
      
      // If restaurantId is an object, extract the _id
      if (typeof combo.restaurantId === 'object' && combo.restaurantId._id) {
        const originalRestaurantId = combo.restaurantId._id;
        console.log(`Extracting restaurant ID: ${originalRestaurantId}`);
        
        // Update the combo with just the ID
        await Combo.findByIdAndUpdate(combo._id, {
          restaurantId: originalRestaurantId
        });
        
        console.log(`Updated combo ${combo.name} with restaurant ID: ${originalRestaurantId}`);
      } else {
        console.log(`Combo ${combo.name} already has correct restaurant ID format`);
      }
    }
    
    console.log('All combos processed successfully!');
    
    // Verify the fix
    const updatedCombos = await Combo.find({});
    console.log('\nVerification:');
    for (const combo of updatedCombos) {
      console.log(`Combo: ${combo.name}, Restaurant ID: ${combo.restaurantId} (${typeof combo.restaurantId})`);
    }
    
  } catch (error) {
    console.error('Error fixing combo data:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixComboData();
