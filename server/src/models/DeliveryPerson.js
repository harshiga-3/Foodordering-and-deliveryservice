const mongoose = require('mongoose');

const deliveryPersonSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
		vehicleNo: { type: String, required: true },
		vehicleType: { type: String, required: true },
		isAvailable: { type: Boolean, default: true },
		activeOrders: { type: Number, default: 0 },
		location: {
			// GeoJSON Point
			type: {
				type: String,
				enum: ['Point'],
				default: 'Point'
			},
			coordinates: {
				type: [Number], // [longitude, latitude]
				index: '2dsphere',
				default: [0, 0]
			},
			updatedAt: { type: Date }
		}
	},
	{ timestamps: true }
);

// Convenience virtuals
deliveryPersonSchema.virtual('lat').get(function() {
	return Array.isArray(this.location?.coordinates) ? this.location.coordinates[1] : undefined;
});
deliveryPersonSchema.virtual('lng').get(function() {
	return Array.isArray(this.location?.coordinates) ? this.location.coordinates[0] : undefined;
});

module.exports = mongoose.model('DeliveryPerson', deliveryPersonSchema);


