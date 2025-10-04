import React, { useState, useEffect } from 'react';
import './FavouriteButton.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const FavouriteButton = ({ foodItem, userId }) => {
  const [isFavourite, setIsFavourite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if item is already in favourites on component mount
    checkFavouriteStatus();
  }, [foodItem.id, userId]);

  const checkFavouriteStatus = () => {
    if (userId) {
      // Check database for logged-in users
      checkDatabaseFavourite();
    } else {
      // Check local storage for guest users
      checkLocalStorageFavourite();
    }
  };

  const checkDatabaseFavourite = async () => {
    try {
      // Get token from the correct storage key
      const authData = JSON.parse(localStorage.getItem('fd_auth') || '{}');
      const token = authData.token;
      
      if (!token) {
        console.error('No token found in localStorage');
        return;
      }

      const response = await fetch(`${API_BASE}/api/favorites/check/${foodItem.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsFavourite(data.isFavourite || data.isFavorited || false);
      }
    } catch (error) {
      console.error('Error checking favourite status:', error);
    }
  };

  const checkLocalStorageFavourite = () => {
    const favourites = JSON.parse(localStorage.getItem('foodFavorites') || '[]');
    const isInFavourites = favourites.some(fav => fav.id === foodItem.id);
    setIsFavourite(isInFavourites);
  };

  const handleToggleFavourite = async () => {
    setLoading(true);
    
    try {
      if (userId) {
        // Handle database favourite for logged-in users
        await toggleDatabaseFavourite();
      } else {
        // Handle local storage favourite for guest users
        toggleLocalStorageFavourite();
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDatabaseFavourite = async () => {
    try {
      // Get token from the correct storage key
      const authData = JSON.parse(localStorage.getItem('fd_auth') || '{}');
      const token = authData.token;
      
      if (!token) {
        console.error('No token found in localStorage');
        showNotification('Please login to use favorites', 'error');
        return;
      }

      const response = await fetch(`${API_BASE}/api/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          favoriteType: 'food',
          foodId: foodItem.id,
          foodName: foodItem.name,
          foodPrice: foodItem.price,
          foodImage: foodItem.image,
          foodCategory: foodItem.category,
          isVeg: foodItem.isVeg
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newFavouriteState = result.isFavorited || result.isFavourite || false;
        setIsFavourite(newFavouriteState);
        // Show success message
        showNotification(
          newFavouriteState ? 'Added to favourites' : 'Removed from favourites',
          'success'
        );
      } else {
        throw new Error('Failed to update favourite');
      }
    } catch (error) {
      console.error('Error updating favourite:', error);
      showNotification('Failed to update favourite', 'error');
    }
  };

  const toggleLocalStorageFavourite = () => {
    const favourites = JSON.parse(localStorage.getItem('foodFavorites') || '[]');
    
    if (isFavourite) {
      // Remove from favourites
      const updatedFavourites = favourites.filter(fav => fav.id !== foodItem.id);
      localStorage.setItem('foodFavorites', JSON.stringify(updatedFavourites));
      setIsFavourite(false);
      showNotification('Removed from favourites', 'success');
    } else {
      // Add to favourites
      const newFavourite = {
        id: foodItem.id,
        name: foodItem.name,
        price: foodItem.price,
        image: foodItem.image,
        category: foodItem.category,
        isVeg: foodItem.isVeg,
        addedAt: new Date().toISOString()
      };
      favourites.push(newFavourite);
      localStorage.setItem('foodFavorites', JSON.stringify(favourites));
      setIsFavourite(true);
      showNotification('Added to favourites', 'success');
    }
  };

  const showNotification = (message, type) => {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `favourite-notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 9999;
      animation: slideIn 0.3s ease;
      ${type === 'success' ? 'background-color: #10b981;' : 'background-color: #ef4444;'}
    `;
    
    // Add animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 3000);
  };

  return (
    <button
      className={`favourite-btn ${isFavourite ? 'active' : ''} ${loading ? 'loading' : ''}`}
      onClick={handleToggleFavourite}
      disabled={loading}
      title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
    >
      <i className={`bi ${isFavourite ? 'bi-heart-fill' : 'bi-heart'}`}></i>
      {loading && <div className="loading-spinner"></div>}
    </button>
  );
};

export default FavouriteButton;
