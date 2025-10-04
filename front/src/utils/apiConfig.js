// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    favorites: `${API_BASE_URL}/api/favorites`,
    orders: `${API_BASE_URL}/api/orders`,
    payments: `${API_BASE_URL}/api/payments`,
    stripe: `${API_BASE_URL}/api/stripe`,
    auth: `${API_BASE_URL}/api/auth`,
    foods: `${API_BASE_URL}/api/foods`,
    restaurants: `${API_BASE_URL}/api/restaurants`,
    reviews: `${API_BASE_URL}/api/reviews`,
    users: `${API_BASE_URL}/api/users`,
    combos: `${API_BASE_URL}/api/combos`,
    tracking: `${API_BASE_URL}/api/tracking`,
    admin: `${API_BASE_URL}/api/admin`
  }
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const authData = JSON.parse(localStorage.getItem('fd_auth') || '{}');
  const token = authData.token;
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to make authenticated API calls
export const makeAuthenticatedRequest = async (url, methodOrOptions = {}, maybeBody) => {
  const headers = getAuthHeaders();

  let options = {};
  if (typeof methodOrOptions === 'string') {
    // Support legacy signature: (url, 'POST', body)
    options.method = methodOrOptions.toUpperCase();
    if (maybeBody !== undefined) {
      options.body = typeof maybeBody === 'string' ? maybeBody : JSON.stringify(maybeBody);
    }
  } else if (methodOrOptions && typeof methodOrOptions === 'object') {
    options = { ...methodOrOptions };
    // Auto-stringify body if it's an object
    if (options.body && typeof options.body !== 'string') {
      options.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && (errorData.message || errorData.error)) {
        message = errorData.message || errorData.error;
      }
    } catch (_) {}
    throw new Error(message);
  }

  try { return await response.json(); } catch { return {}; }
};
