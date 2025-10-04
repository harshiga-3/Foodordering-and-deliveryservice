// server/src/utils/geocode.js
// Lightweight geocoding using OpenStreetMap Nominatim with simple in-memory cache
// CommonJS for consistency with the codebase

const cache = new Map();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function buildAddress(input) {
  if (!input) return '';
  if (typeof input === 'string') return input;
  const { street, city, state, pincode, landmark } = input || {};
  return [street, city, state, pincode, landmark].filter(Boolean).join(', ');
}

async function geocodeAddress(q) {
  const query = (q || '').trim();
  if (!query) return null;
  if (cache.has(query)) return cache.get(query);

  // Basic politeness delay to avoid getting blocked
  await sleep(300);

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  try {
    // Rely on global fetch (Node 18+). If unavailable, add node-fetch.
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'CollegeProject/1.0 (contact@example.com)'
      }
    });
    if (!res.ok) return null;
    const arr = await res.json();
    const result = Array.isArray(arr) && arr[0]
      ? { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) }
      : null;
    cache.set(query, result);
    return result;
  } catch {
    return null;
  }
}

function defaultCityCoords() {
  const lat = Number(process.env.DEFAULT_CITY_LAT) || 13.0827; // Chennai default
  const lng = Number(process.env.DEFAULT_CITY_LNG) || 80.2707;
  return { lat, lng };
}

module.exports = {
  buildAddress,
  geocodeAddress,
  defaultCityCoords,
};
