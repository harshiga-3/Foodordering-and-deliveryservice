// src/utils/api.js
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:4000/api';

// Helper function to get auth token
const getAuthToken = () => {
  // Try to get token from the auth storage key first
  try {
    const authData = localStorage.getItem('fd_auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.token) {
        return parsed.token;
      }
    }
  } catch (error) {
    console.error('Error parsing auth data:', error);
  }
  
  // Fallback to direct token key
  return localStorage.getItem('token');
};

// Helper function to make authenticated requests
const makeAuthRequest = async (url, options = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    // Try JSON first; if that fails, fall back to text to surface server errors
    let message = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && (errorData.message || errorData.error)) {
        message = errorData.message || errorData.error;
      }
    } catch (_) {
      try {
        const text = await response.text();
        if (text) message = text.substring(0, 500);
      } catch {}
    }
    throw new Error(message);
  }

  // Try to parse JSON; return empty object if none
  try { return await response.json(); } catch { return {}; }
};

// Helper function to make public requests
const makePublicRequest = async (url, options = {}) => {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    let message = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && (errorData.message || errorData.error)) {
        message = errorData.message || errorData.error;
      }
    } catch (_) {
      try {
        const text = await response.text();
        if (text) message = text.substring(0, 500);
      } catch {}
    }
    throw new Error(message);
  }

  try { return await response.json(); } catch { return {}; }
};

// Auth APIs
export const authAPI = {
  login: async (credentials) => {
    return makePublicRequest(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  signup: async (userData) => {
    return makePublicRequest(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getProfile: async () => {
    return makeAuthRequest(`${API_BASE_URL}/auth/profile`);
  },
};

// Restaurant APIs
export const restaurantAPI = {
  // Get all restaurants (public)
  getAll: async () => {
    const data = await makePublicRequest(`${API_BASE_URL}/restaurants`);
    const list = Array.isArray(data)
      ? data
      : (data?.restaurants || data?.items || data?.data || data?.results || []);
    // normalize id fields
    return list.map((r) => ({
      ...r,
      _id: r?._id || r?.id || r?.restaurantId,
      id: r?.id || r?._id || r?.restaurantId,
      restaurantId: r?.restaurantId || r?._id || r?.id,
    }));
  },

  // Get restaurant by ID (public)
  getById: async (id) => {
    return makePublicRequest(`${API_BASE_URL}/restaurants/${id}`);
  },

  // Get restaurants by owner ID (authenticated)
  getByOwner: async (ownerId) => {
    return makeAuthRequest(`${API_BASE_URL}/restaurants/owner/${ownerId}`);
  },

  // Create new restaurant (owner only)
  create: async (restaurantData) => {
    try {
      const response = await makeAuthRequest(`${API_BASE_URL}/restaurants`, {
        method: 'POST',
        body: JSON.stringify(restaurantData),
      });
      return response;
    } catch (error) {
      console.error('Restaurant creation error:', error);
      throw error;
    }
  },

  // Update restaurant (owner only)
  update: async (id, updates) => {
    try {
      const response = await makeAuthRequest(`${API_BASE_URL}/restaurants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return response;
    } catch (error) {
      console.error('Restaurant update error:', error);
      throw error;
    }
  },

  // Delete restaurant (owner only)
  delete: async (id) => {
    try {
      const response = await makeAuthRequest(`${API_BASE_URL}/restaurants/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Restaurant deletion error:', error);
      throw error;
    }
  },

  // Toggle restaurant open/close status (owner only)
  toggleStatus: async (id) => {
    try {
      const url = `${API_BASE_URL}/restaurants/${id}/toggle-status`;
      console.log('Making toggle status request to:', url);
      console.log('Restaurant ID:', id);
      
      const response = await makeAuthRequest(url, {
        method: 'PATCH',
      });
      console.log('Toggle status response:', response);
      return response;
    } catch (error) {
      console.error('Restaurant status toggle error:', error);
      throw error;
    }
  },
};

// Food APIs
export const foodAPI = {
  // Get all foods (public)
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = `${API_BASE_URL}/foods${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await makePublicRequest(url);
    const list = Array.isArray(data)
      ? data
      : (data?.foods || data?.items || data?.data || data?.results || []);
    return list.map((f) => ({
      ...f,
      _id: f?._id || f?.id || f?.foodId,
      id: f?.id || f?._id || f?.foodId,
      foodId: f?.foodId || f?._id || f?.id,
    }));
  },

  // Get food by ID (public)
  getById: async (id) => {
    return makePublicRequest(`${API_BASE_URL}/foods/${id}`);
  },

  // Get foods by owner ID (authenticated)
  getByOwner: async (ownerId) => {
    return makeAuthRequest(`${API_BASE_URL}/foods/owner/${ownerId}`);
  },

  // Create new food (owner only)
  create: async (foodData) => {
    return makeAuthRequest(`${API_BASE_URL}/foods`, {
      method: 'POST',
      body: JSON.stringify(foodData),
    });
  },

  // Update food (owner only)
  update: async (id, updates) => {
    return makeAuthRequest(`${API_BASE_URL}/foods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete food (owner only)
  delete: async (id) => {
    return makeAuthRequest(`${API_BASE_URL}/foods/${id}`, {
      method: 'DELETE',
    });
  },
};

// User APIs
export const userAPI = {
  list: async (role) => {
    const qs = role ? `?role=${encodeURIComponent(role)}` : '';
    return makeAuthRequest(`${API_BASE_URL}/users${qs}`);
  },
  getProfile: async () => {
    return makeAuthRequest(`${API_BASE_URL}/users/profile`);
  },

  updateProfile: async (updates) => {
    return makeAuthRequest(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delivery partner: update availability
  updateAvailability: async (isAvailable) => {
    return makeAuthRequest(`${API_BASE_URL}/users/delivery/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable })
    });
  },

  // Delivery partner: update current location
  updateLocation: async ({ latitude, longitude }) => {
    return makeAuthRequest(`${API_BASE_URL}/users/delivery/location`, {
      method: 'PATCH',
      body: JSON.stringify({ latitude, longitude })
    });
  },

  // List available delivery partners (for owner/admin if needed)
  listAvailableDelivery: async () => {
    return makeAuthRequest(`${API_BASE_URL}/users/delivery/available`);
  },
};

// Order APIs
export const orderAPI = {
  create: async (orderData) => {
    return makeAuthRequest(`${API_BASE_URL}/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  getUserOrders: async () => {
    return makeAuthRequest(`${API_BASE_URL}/orders`);
  },

  getOwnerOrders: async () => {
    return makeAuthRequest(`${API_BASE_URL}/orders`);
  },

  updateStatus: async (orderId, status) => {
    return makeAuthRequest(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Delivery staff endpoints
  getAssignedOrders: async () => {
    return makeAuthRequest(`${API_BASE_URL}/orders/assigned`);
  },

  getCompletedOrders: async () => {
    return makeAuthRequest(`${API_BASE_URL}/orders/completed`);
  },

  // Owner assigns delivery person to an order
  assignDelivery: async (orderId, userId) => {
    return makeAuthRequest(`${API_BASE_URL}/orders/${orderId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedTo: userId }),
    });
  },

  // New: delete from user's history
  deleteForUser: async (orderId) => {
    return makeAuthRequest(`${API_BASE_URL}/orders/${orderId}`, { method: 'DELETE' });
  },

  // New: delete from owner's history
  deleteForOwner: async (orderId) => {
    return makeAuthRequest(`${API_BASE_URL}/orders/${orderId}/owner`, { method: 'DELETE' });
  },
};

// Favorites APIs
export const favoritesAPI = {
  // Get all user favorites
  getAll: async () => {
    return makeAuthRequest(`${API_BASE_URL}/favorites`);
  },

  // Toggle favorite (add/remove)
  toggleFavorite: async (favoriteData) => {
    return makeAuthRequest(`${API_BASE_URL}/favorites`, {
      method: 'POST',
      body: JSON.stringify(favoriteData),
    });
  },

  // Remove favorite by ID
  removeFavorite: async (id) => {
    return makeAuthRequest(`${API_BASE_URL}/favorites/${id}`, {
      method: 'DELETE',
    });
  },

  // Check if item is favorited
  checkFavorite: async (type, itemId) => {
    return makeAuthRequest(`${API_BASE_URL}/favorites/check/${type}/${itemId}`);
  },
};

// Reviews APIs
export const reviewsAPI = {
  // Get reviews for a food item
  getFoodReviews: async (foodId) => {
    return makePublicRequest(`${API_BASE_URL}/reviews/food/${foodId}`);
  },

  // Get reviews for a restaurant
  getRestaurantReviews: async (restaurantId) => {
    return makePublicRequest(`${API_BASE_URL}/reviews/restaurant/${restaurantId}`);
  },

  // Get user's reviews
  getUserReviews: async () => {
    return makeAuthRequest(`${API_BASE_URL}/reviews/user`);
  },

  // Create a new review
  createReview: async (reviewData) => {
    // Normalize payload to be compatible with backend
    const type = reviewData.reviewType || reviewData.type;
    const isFood = (reviewData.itemType || type) === 'food';
    const isRestaurant = (reviewData.itemType || type) === 'restaurant';
    let foodId = reviewData.foodId || (isFood ? reviewData.itemId : undefined);
    let restaurantId = reviewData.restaurantId || (isRestaurant ? reviewData.itemId : undefined);

    // Fallback: derive id from current URL if not provided
    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      if (!restaurantId && isRestaurant) {
        const m = path.match(/\/restaurant\/([^/]+)/i);
        if (m && m[1]) restaurantId = decodeURIComponent(m[1]);
      }
      if (!foodId && isFood) {
        const m = path.match(/\/food\/([^/]+)/i);
        if (m && m[1]) foodId = decodeURIComponent(m[1]);
      }
    } catch {}

    if (!type || (!foodId && !restaurantId)) {
      throw new Error('Missing review target. Please select a food or restaurant.');
    }

    // Try resource-specific endpoints first if possible
    const typeVal = isFood ? 'food' : 'restaurant';
    const minimalBody = { rating: Number(reviewData.rating), comment: reviewData.comment, reviewType: typeVal };
    if (isRestaurant && restaurantId) {
      try {
        return await makeAuthRequest(`${API_BASE_URL}/reviews/restaurant/${encodeURIComponent(restaurantId)}`, {
          method: 'POST',
          body: JSON.stringify({ 
            ...minimalBody, 
            restaurantId, 
            restaurant: restaurantId,
            type: typeVal,
          }),
        });
      } catch (e) {
        const msg = String(e?.message || '');
        // Fall back on 404 OR validation-like errors so we can try generic variants
        if (!(msg.includes('404') || /required|missing|invalid/i.test(msg))) throw e;
      }
    }
    if (isFood && foodId) {
      try {
        return await makeAuthRequest(`${API_BASE_URL}/reviews/food/${encodeURIComponent(foodId)}`, {
          method: 'POST',
          body: JSON.stringify({ 
            ...minimalBody, 
            foodId, 
            food: foodId,
            type: typeVal,
          }),
        });
      } catch (e) {
        const msg = String(e?.message || '');
        if (!(msg.includes('404') || /required|missing|invalid/i.test(msg))) throw e;
      }
    }

    // Build candidate payloads to satisfy varying backends
    const base = {
      rating: Number(reviewData.rating),
      comment: reviewData.comment,
    };
    // typeVal defined above
    const variants = [];
    // Variant A: minimal + reviewType + canonical id keys
    variants.push({ ...base, reviewType: typeVal, ...(foodId ? { foodId } : {}), ...(restaurantId ? { restaurantId } : {}) });
    // Variant B: use alternate id keys without reviewType
    variants.push({ ...base, ...(foodId ? { food: foodId } : {}), ...(restaurantId ? { restaurant: restaurantId } : {}) });
    // Variant C: include type and itemId aliases
    variants.push({ ...base, reviewType: typeVal, type: typeVal, itemId: foodId || restaurantId });
    // Variant D: reviewType + alternate id key explicitly
    if (restaurantId) variants.push({ ...base, reviewType: typeVal, restaurant: restaurantId });
    if (foodId) variants.push({ ...base, reviewType: typeVal, food: foodId });

    const url = `${API_BASE_URL}/reviews`;
    const token = getAuthToken();

    let lastError;
    for (const body of variants) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        });

        // Try parse message on error
        if (!res.ok) {
          let serverMsg = '';
          try { serverMsg = (await res.json()).message || ''; } catch { try { serverMsg = await res.text(); } catch {} }
          // If 500 or validation-like message, try next variant
          if (res.status >= 500 || /required|invalid|missing/i.test(serverMsg || '')) {
            lastError = new Error(serverMsg || `HTTP ${res.status}`);
            continue;
          }
          // For other statuses, throw immediately
          throw new Error(serverMsg || `HTTP ${res.status}`);
        }
        // Success
        try { return await res.json(); } catch { return {}; }
      } catch (e) {
        lastError = e;
      }
    }
    // Exhausted variants
    throw lastError || new Error('Failed to submit review');
  },

  // Update a review
  updateReview: async (reviewId, reviewData) => {
    return makeAuthRequest(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    return makeAuthRequest(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },
};

export default {
  auth: authAPI,
  restaurants: restaurantAPI,
  foods: foodAPI,
  users: userAPI,
  orders: orderAPI,
};
