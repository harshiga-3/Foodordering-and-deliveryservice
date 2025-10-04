const { Router } = require('express');
const { authRequired } = require('../middleware/auth.js');
const User = require('../models/User.js');
const DeliveryPerson = require('../models/DeliveryPerson');

const router = Router();

// Get current user's profile
router.get('/profile', authRequired, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('_id name email role ownerDetails deliveryDetails createdAt updatedAt');
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.json({
			success: true,
			user
		});
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: 'Failed to fetch profile' });
	}
});

// List users, optionally filtered by role
router.get('/', authRequired, async (req, res) => {
	try {
		const { role } = req.query;
		const filter = role ? { role } : {};
		const users = await User.find(filter).select('_id name email role');
		res.json(users);
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: 'Failed to fetch users' });
	}
});

module.exports = router;

// Delivery partner endpoints
router.patch('/delivery/availability', authRequired, async (req, res) => {
	try {
		if (req.user.role !== 'delivery') {
			return res.status(403).json({ message: 'Only delivery partners can update availability' });
		}
		const { isAvailable } = req.body;
		const doc = await DeliveryPerson.findOneAndUpdate(
			{ userId: req.user.id },
			{ isAvailable: !!isAvailable },
			{ new: true, upsert: true, setDefaultsOnInsert: true }
		);
		res.json({ success: true, isAvailable: doc.isAvailable });
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: 'Failed to update availability' });
	}
});

router.patch('/delivery/location', authRequired, async (req, res) => {
	try {
		if (req.user.role !== 'delivery') {
			return res.status(403).json({ message: 'Only delivery partners can update location' });
		}
		const { latitude, longitude } = req.body;
		if (![latitude, longitude].every(v => typeof v === 'number' && Number.isFinite(v))) {
			return res.status(400).json({ message: 'latitude and longitude (numbers) are required' });
		}
		const doc = await DeliveryPerson.findOneAndUpdate(
			{ userId: req.user.id },
			{ 
				location: { type: 'Point', coordinates: [longitude, latitude], updatedAt: new Date() }
			},
			{ new: true, upsert: true, setDefaultsOnInsert: true }
		);
		res.json({ success: true });
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: 'Failed to update location' });
	}
});

router.get('/delivery/available', authRequired, async (_req, res) => {
	try {
		const list = await DeliveryPerson.find({ isAvailable: true }).select('userId activeOrders location');
		res.json(list);
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: 'Failed to list available delivery partners' });
	}
});
