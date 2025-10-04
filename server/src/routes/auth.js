const { Router } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.js');
const Owner = require('../models/Owner.js');
const DeliveryPerson = require('../models/DeliveryPerson.js');

const router = Router();

router.post('/signup', async (req, res) => {
	try {
		const { name, email, password, role, ownerDetails, deliveryDetails } = req.body;
		if (!name || !email || !password || !role) {
			return res.status(400).json({ message: 'All fields are required' });
		}
		if (!User.ROLES.includes(role)) {
			return res.status(400).json({ message: 'Invalid role' });
		}
		const existing = await User.findOne({ email });
		if (existing) return res.status(409).json({ message: 'Email already in use' });
		const passwordHash = await bcrypt.hash(password, 10);
		const payload = { name, email, passwordHash, role };
		if (role === 'owner' && ownerDetails) {
			payload.ownerDetails = {
				restaurantName: ownerDetails.restaurantName,
				address: ownerDetails.address,
				fssaiLicense: ownerDetails.fssaiLicense
			};
		}
		if (role === 'delivery' && deliveryDetails) {
			payload.deliveryDetails = {
				vehicleType: deliveryDetails.vehicleType,
				licenseNumber: deliveryDetails.licenseNumber,
				vehicleNumber: deliveryDetails.vehicleNumber
			};
		}
		const user = await User.create(payload);
		// create role-specific records
		if (role === 'owner' && ownerDetails) {
			await Owner.create({
				userId: user._id,
				restaurantName: ownerDetails.restaurantName,
				licenseNo: ownerDetails.fssaiLicense || ownerDetails.licenseNo,
			});
		}
		if (role === 'delivery' && deliveryDetails) {
			await DeliveryPerson.create({
				userId: user._id,
				vehicleNo: deliveryDetails.vehicleNumber || deliveryDetails.vehicleNo,
				vehicleType: deliveryDetails.vehicleType,
			});
		}
		const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
		res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: 'Signup failed' });
	}
});

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ message: 'Invalid credentials' });
		const ok = await user.comparePassword(password);
		if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
		const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
		res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: 'Login failed' });
	}
});

module.exports = router;

// Google Sign-In
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body || {};
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res.status(503).json({ message: 'Google Sign-In not configured on server' });
    }
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: googleClientId });
    const payload = ticket.getPayload();
    // payload: { sub, email, name, picture, email_verified, ... }
    if (!payload?.email || !payload?.sub) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const email = String(payload.email).toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || email.split('@')[0];

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        provider: 'google',
        googleId,
        role: 'user',
        passwordHash: '' // not used for google provider
      });
      await user.save();
    } else {
      // Upgrade existing local user to link Google if same email
      if (user.provider !== 'google') {
        user.provider = 'google';
        user.googleId = googleId;
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    console.error('Google auth failed:', e);
    return res.status(401).json({ message: 'Google authentication failed' });
  }
});
