const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/auth.js');
const orderRoutes = require('./routes/orders.js');
const userRoutes = require('./routes/users.js');
const foodRoutes = require('./routes/foods.js');
const favoriteRoutes = require('./routes/favorites.js');
const reviewRoutes = require('./routes/reviews.js');
const restaurantRoutes = require('./routes/restaurants.js');
const comboRoutes = require('./routes/combos.js');
const tasteProfileRoutes = require('./routes/tasteProfile.js');
const surpriseMeRoutes = require('./routes/surpriseMe.js');
const surpriseRestaurantsRoutes = require('./routes/surpriseRestaurants.js');
const trackingRoutes = require('./routes/tracking.js');
const adminRoutes = require('./routes/admin.js');
const analyticsRoutes = require('./routes/analytics.js');
// const paymentRoutes = require('./routes/payments.js'); // Payment integration disabled
const stripeWebhookRoute = require('./routes/stripeWebhook.js');
const stripeRoutes = require('./routes/stripe.js');

dotenv.config();

const app = express();
app.use(cors({ origin: '*', credentials: true }));
// IMPORTANT: Stripe webhook must be mounted BEFORE body parsers
app.use('/api/stripe/webhook', stripeWebhookRoute);
// Increase body size limits to support base64 images and larger payloads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static files from uploads directory
const uploadsPath = path.join(__dirname, '..', '..', 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, path) => {
    // Set proper CORS headers for static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food_delivery';
const PORT = process.env.PORT || 4000;

// Add error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

mongoose
	.connect(MONGO_URI, { autoIndex: true })
	.then(() => console.log('MongoDB connected'))
	.catch((err) => {
		console.error('MongoDB connection error:', err);
		process.exit(1);
	});

app.get('/health', (req, res) => {
	res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/taste-profile', tasteProfileRoutes);
app.use('/api/surprise-me', surpriseMeRoutes);
app.use('/api/restaurants/surprise', surpriseRestaurantsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stripe', stripeRoutes);
// app.use('/api/payments', paymentRoutes); // Payment integration disabled

app.use((err, req, res, next) => {
	console.error(err);
	res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const server = app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

// Add server error handling
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});
