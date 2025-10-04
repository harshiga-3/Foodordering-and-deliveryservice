const mongoose = require('mongoose');
const Review = require('./src/models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food_delivery';

const testDuplicateReview = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const userId = '68a6e6db4da5c931dd49da31';
    const restaurantId = '68c2f2db390448388370330c';
    const reviewType = 'restaurant';

    console.log('Testing duplicate review check...');
    console.log('User ID:', userId);
    console.log('Restaurant ID:', restaurantId);
    console.log('Review Type:', reviewType);

    // Check for existing review
    const existingReview = await Review.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      reviewType,
      restaurantId: new mongoose.Types.ObjectId(restaurantId)
    });

    console.log('Existing review found:', existingReview ? 'YES' : 'NO');
    if (existingReview) {
      console.log('Existing review details:', {
        id: existingReview._id,
        rating: existingReview.rating,
        comment: existingReview.comment.substring(0, 50)
      });
    }

    // Try to create a new review
    try {
      const newReview = new Review({
        userId: new mongoose.Types.ObjectId(userId),
        userName: 'Test User',
        reviewType,
        rating: 5,
        comment: 'Test review for duplicate check',
        restaurantId: new mongoose.Types.ObjectId(restaurantId)
      });

      await newReview.save();
      console.log('New review created successfully');
    } catch (error) {
      if (error.code === 11000) {
        console.log('Duplicate review prevented by database unique index');
      } else {
        console.log('Error creating review:', error.message);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testDuplicateReview();
