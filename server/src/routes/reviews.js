const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review.js');
const Food = require('../models/Food.js');
const Restaurant = require('../models/Restaurant.js');
const { authRequired } = require('../middleware/auth.js');

const router = express.Router();

// GET reviews for a specific food
router.get('/food/:foodId', async (req, res) => {
  try {
    const { foodId } = req.params;
    
    const reviews = await Review.find({ foodId, reviewType: 'food' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// GET reviews for a specific restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const reviews = await Review.find({ restaurantId, reviewType: 'restaurant' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching restaurant reviews', error: error.message });
  }
});

// GET user's reviews
router.get('/user', authRequired, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id })
      .populate('foodId', 'name image')
      .populate('restaurantId', 'name image')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user reviews', error: error.message });
  }
});

// POST new review (Users only) - Support both food and restaurant reviews
router.post('/', authRequired, async (req, res) => {
  try {
    // Check if user is a regular user (not owner or delivery)
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only regular users can write reviews' });
    }
    
    const { foodId, restaurantId, rating, comment, reviewType } = req.body;
    
    if (!rating || !comment || !reviewType) {
      return res.status(400).json({ message: 'Rating, comment, and review type are required' });
    }
    
    if (reviewType === 'food' && !foodId) {
      return res.status(400).json({ message: 'Food ID is required for food reviews' });
    }
    
    if (reviewType === 'restaurant' && !restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required for restaurant reviews' });
    }
    
    // Check if item exists
    let item;
    if (reviewType === 'food') {
      item = await Food.findById(foodId);
      if (!item) {
        return res.status(404).json({ message: 'Food not found' });
      }
    } else {
      item = await Restaurant.findById(restaurantId);
      if (!item) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
    }
    
    // Check if user already reviewed this item
    const existingReview = await Review.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id),
      reviewType,
      ...(reviewType === 'food' ? { foodId: new mongoose.Types.ObjectId(foodId) } : { restaurantId: new mongoose.Types.ObjectId(restaurantId) })
    });
    
    console.log('Duplicate check - User ID:', req.user.id, 'Review Type:', reviewType, 'Restaurant ID:', restaurantId, 'Food ID:', foodId);
    console.log('Existing review found:', existingReview ? 'YES' : 'NO');
    
    if (existingReview) {
      return res.status(400).json({ message: `You have already reviewed this ${reviewType}` });
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const review = new Review({
      userId: new mongoose.Types.ObjectId(req.user.id),
      userName: req.user.name,
      reviewType,
      rating: parseInt(rating),
      comment: comment.trim(),
      ...(reviewType === 'food' ? { foodId: new mongoose.Types.ObjectId(foodId) } : { restaurantId: new mongoose.Types.ObjectId(restaurantId) })
    });
    
    console.log('Creating review with data:', {
      userId: review.userId,
      userName: review.userName,
      reviewType: review.reviewType,
      rating: review.rating,
      restaurantId: review.restaurantId,
      foodId: review.foodId
    });
    
    const savedReview = await review.save();
    console.log('Review saved successfully:', savedReview._id);
    
    // Update item's average rating
    const allReviews = await Review.find({ 
      reviewType,
      ...(reviewType === 'food' ? { foodId } : { restaurantId })
    });
    const avgRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0) / allReviews.length;
    
    if (reviewType === 'food') {
      await Food.findByIdAndUpdate(foodId, { rating: Math.round(avgRating * 10) / 10 });
    } else {
      await Restaurant.findByIdAndUpdate(restaurantId, { rating: Math.round(avgRating * 10) / 10 });
    }
    
    const populatedReview = await Review.findById(savedReview._id).populate('userId', 'name');
    res.status(201).json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
});

// PUT update review (Users can only edit their own reviews)
router.put('/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns this review
    if (review.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }
    
    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { rating: parseInt(rating), comment: comment.trim() },
      { new: true, runValidators: true }
    ).populate('userId', 'name');
    
    // Update food's average rating
    const foodId = review.foodId;
    const allReviews = await Review.find({ foodId });
    const avgRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0) / allReviews.length;
    
    await Food.findByIdAndUpdate(foodId, { rating: Math.round(avgRating * 10) / 10 });
    
    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
});

// DELETE review (Users can only delete their own reviews)
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user owns this review
    if (review.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }
    
    const foodId = review.foodId;
    await Review.findByIdAndDelete(id);
    
    // Update food's average rating
    const remainingReviews = await Review.find({ foodId });
    if (remainingReviews.length > 0) {
      const avgRating = remainingReviews.reduce((sum, rev) => sum + rev.rating, 0) / remainingReviews.length;
      await Food.findByIdAndUpdate(foodId, { rating: Math.round(avgRating * 10) / 10 });
    } else {
      await Food.findByIdAndUpdate(foodId, { rating: 0 });
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
});

module.exports = router;
