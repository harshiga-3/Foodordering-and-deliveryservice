// Haversine distance in kilometers between two coordinates
// Inputs expect numeric latitude and longitude in degrees

function toRadians(degrees) {
	return (degrees * Math.PI) / 180;
}

function haversineKm(lat1, lon1, lat2, lon2) {
	if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number' || !Number.isFinite(v))) {
		return Number.POSITIVE_INFINITY;
	}
	const R = 6371; // km
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

module.exports = { haversineKm };


