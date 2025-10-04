const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
		restaurantName: { type: String, required: true },
		licenseNo: { type: String, required: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Owner', ownerSchema);


