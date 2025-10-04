// src/data/restaurants.js
export const restaurants = [
  {
    id: 1,
    name: "Saravana Bhavan",
    cuisine: "Vegetarian, South Indian",
    rating: "4.5",
    deliveryTime: "25-35 min",
    costForTwo: "₹400 for two",
    image: "images/TrendingFood/h1.jpg",
    location: "Chennai",
    tags: ["veg", "breakfast", "popular"]
  },
  {
    id: 2,
    name: "Anjappar Chettinad",
    cuisine: "Chettinad, Non-Vegetarian",
    rating: "4.3",
    deliveryTime: "35-45 min",
    costForTwo: "₹600 for two",
    image: "images/TrendingFood/h2.jpg",
    location: "Chennai",
    tags: ["non-veg", "spicy", "popular"]
  },
  {
    id: 3,
    name: "Murugan Idli Shop",
    cuisine: "South Indian, Vegetarian",
    rating: "4.7",
    deliveryTime: "20-30 min",
    costForTwo: "₹300 for two",
    image: "images/TrendingFood/h3.jpg",
    location: "Madurai",
    tags: ["veg", "breakfast", "quick"]
  },
  {
    id: 4,
    name: "Rayar's Mess",
    cuisine: "Non-Vegetarian, South Indian",
    rating: "4.6",
    deliveryTime: "40-50 min",
    costForTwo: "₹500 for two",
    image: "/images/TrendingFood/h4.jpg",
    location: "Chennai",
    tags: ["non-veg", "traditional", "spicy"]
  },
  {
    id: 5,
    name: "Sangeetha Vegetarian",
    cuisine: "Vegetarian, South Indian",
    rating: "4.2",
    deliveryTime: "30-40 min",
    costForTwo: "₹450 for two",
    image: "/images/TrendingFood/h5.jpg",
    location: "Coimbatore",
    tags: ["veg", "family", "variety"]
  },
  {
    id: 6,
    name: "A2B - Adyar Ananda Bhavan",
    cuisine: "Vegetarian, South Indian",
    rating: "4.4",
    deliveryTime: "25-35 min",
    costForTwo: "₹500 for two",
    image: "/images/TrendingFood/h6.jpg",
    location: "Chennai",
    tags: ["veg", "sweets", "popular"]
  },
  {
    id: 7,
    name: "Ponnusamy Hotel",
    cuisine: "Chettinad, Non-Vegetarian",
    rating: "4.8",
    deliveryTime: "45-55 min",
    costForTwo: "₹800 for two",
    image: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=400",
    location: "Chennai",
    tags: ["non-veg", "premium", "spicy"]
  },
  {
    id: 8,
    name: "Junior Kuppanna",
    cuisine: "Non-Vegetarian, Tamil Nadu",
    rating: "4.1",
    deliveryTime: "35-45 min",
    costForTwo: "₹550 for two",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    location: "Chennai",
    tags: ["non-veg", "traditional", "value"]
  },
  {
    id: 9,
    name: "Hotel Ramakrishna",
    cuisine: "Vegetarian, South Indian",
    rating: "4.0",
    deliveryTime: "30-40 min",
    costForTwo: "₹350 for two",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400",
    location: "Madurai",
    tags: ["veg", "budget", "traditional"]
  },
  {
    id: 10,
    name: "Kumarakom Restaurant",
    cuisine: "Kerala, South Indian",
    rating: "4.5",
    deliveryTime: "40-50 min",
    costForTwo: "₹600 for two",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    location: "Chennai",
    tags: ["non-veg", "seafood", "kerala"]
  },
  {
    id: 11,
    name: "Nair Mess",
    cuisine: "Non-Vegetarian, Tamil Nadu",
    rating: "4.3",
    deliveryTime: "35-45 min",
    costForTwo: "₹450 for two",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400",
    location: "Chennai",
    tags: ["non-veg", "traditional", "value"]
  },
  {
    id: 12,
    name: "Aasife Biryani",
    cuisine: "Biryani, Non-Vegetarian",
    rating: "4.6",
    deliveryTime: "40-50 min",
    costForTwo: "₹700 for two",
    image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400",
    location: "Chennai",
    tags: ["non-veg", "biryani", "premium"]
  }
];

// Restaurant management functions
const RESTAURANT_STORAGE_KEY = 'fd_custom_restaurants';

export const getRestaurants = () => {
  try {
    const customRestaurants = localStorage.getItem(RESTAURANT_STORAGE_KEY);
    if (customRestaurants) {
      const parsed = JSON.parse(customRestaurants);
      return [...restaurants, ...parsed];
    }
  } catch (error) {
    console.error('Error loading custom restaurants:', error);
  }
  return restaurants;
};

export const addRestaurant = (restaurant) => {
  try {
    const customRestaurants = localStorage.getItem(RESTAURANT_STORAGE_KEY);
    const existing = customRestaurants ? JSON.parse(customRestaurants) : [];
    
    // Generate new ID
    const maxId = Math.max(...restaurants.map(r => r.id), ...existing.map(r => r.id));
    const newRestaurant = {
      ...restaurant,
      id: maxId + 1,
      rating: restaurant.rating || "4.0",
      deliveryTime: restaurant.deliveryTime || "30-40 min",
      costForTwo: restaurant.costForTwo || "₹500 for two"
    };
    
    const updated = [...existing, newRestaurant];
    localStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(updated));
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('restaurantsUpdated'));
    
    return newRestaurant;
  } catch (error) {
    console.error('Error adding restaurant:', error);
    throw error;
  }
};

export const updateRestaurant = (id, updates) => {
  try {
    const customRestaurants = localStorage.getItem(RESTAURANT_STORAGE_KEY);
    if (!customRestaurants) return false;
    
    const existing = JSON.parse(customRestaurants);
    const updated = existing.map(r => r.id === id ? { ...r, ...updates } : r);
    
    localStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(updated));
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('restaurantsUpdated'));
    
    return true;
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return false;
  }
};

export const deleteRestaurant = (id) => {
  try {
    const customRestaurants = localStorage.getItem(RESTAURANT_STORAGE_KEY);
    if (!customRestaurants) return false;
    
    const existing = JSON.parse(customRestaurants);
    const updated = existing.filter(r => r.id !== id);
    
    localStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(updated));
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('restaurantsUpdated'));
    
    return true;
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return false;
  }
};