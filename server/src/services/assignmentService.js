const DeliveryPerson = require('../models/DeliveryPerson');
const Restaurant = require('../models/Restaurant');
const { haversineKm } = require('../utils/distance');

/**
 * Find the best delivery partner based on proximity and workload
 * @param {import('mongoose').Types.ObjectId} restaurantId
 * @returns delivery person document or null
 */
async function findBestDeliveryPartner(restaurantId) {
	if (!restaurantId) return null;
	const restaurant = await Restaurant.findById(restaurantId).lean();
	if (!restaurant) return null;

	// Determine restaurant coordinates: prefer locationGeo, else skip
	const [restLng, restLat] = Array.isArray(restaurant.locationGeo?.coordinates)
		? restaurant.locationGeo.coordinates
		: [undefined, undefined];

	// If we have coordinates, we can do a geospatial prefilter; otherwise fall back to all available
	let candidatesQuery = { isAvailable: true };
	let candidates = [];
	if (typeof restLat === 'number' && typeof restLng === 'number' && Number.isFinite(restLat) && Number.isFinite(restLng)) {
		try {
			candidates = await DeliveryPerson.find({
				isAvailable: true,
				location: {
					$near: {
						$geometry: { type: 'Point', coordinates: [restLng, restLat] },
						$maxDistance: 20000 // 20km cap for search
					}
				}
			}).lean();
		} catch (_) {
			// Fallback to non-geo query if index not ready
			candidates = await DeliveryPerson.find(candidatesQuery).lean();
		}
	} else {
		candidates = await DeliveryPerson.find(candidatesQuery).lean();
	}

	if (!Array.isArray(candidates) || candidates.length === 0) return null;

	// Compute distance and sort by (distance asc, activeOrders asc)
	const scored = candidates.map((c) => {
		const [lng, lat] = Array.isArray(c.location?.coordinates) ? c.location.coordinates : [undefined, undefined];
		const distanceKm = (typeof restLat === 'number' && typeof restLng === 'number' && typeof lat === 'number' && typeof lng === 'number')
			? haversineKm(restLat, restLng, lat, lng)
			: Number.POSITIVE_INFINITY;
		return {
			candidate: c,
			distanceKm,
			activeOrders: typeof c.activeOrders === 'number' ? c.activeOrders : 0,
		};
	});

	// Prioritize finite distances first
	scored.sort((a, b) => {
		const da = Number.isFinite(a.distanceKm) ? a.distanceKm : Number.POSITIVE_INFINITY;
		const db = Number.isFinite(b.distanceKm) ? b.distanceKm : Number.POSITIVE_INFINITY;
		if (da !== db) return da - db;
		return a.activeOrders - b.activeOrders;
	});

	return scored[0]?.candidate ? await DeliveryPerson.findById(scored[0].candidate._id) : null;
}

module.exports = { findBestDeliveryPartner };


