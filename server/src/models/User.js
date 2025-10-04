const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ROLES = ['owner', 'user', 'delivery'];
const PROVIDERS = ['local', 'google'];

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		passwordHash: { type: String, required: function () { return this.provider === 'local'; } },
		provider: { type: String, enum: PROVIDERS, default: 'local', required: true },
		googleId: { type: String },
		role: { type: String, enum: ROLES, default: 'user', required: true },
		ownerDetails: {
			restaurantName: { type: String, trim: true },
			address: { type: String, trim: true },
			fssaiLicense: { type: String, trim: true }
		},
		deliveryDetails: {
			vehicleType: { type: String, trim: true },
			licenseNumber: { type: String, trim: true },
			vehicleNumber: { type: String, trim: true }
		},
		tasteProfileId: { 
			type: mongoose.Schema.Types.ObjectId, 
			ref: 'TasteProfile',
			default: null 
		}
	},
	{ timestamps: true }
);

userSchema.methods.comparePassword = async function (password) {
	return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
module.exports.PROVIDERS = PROVIDERS;
