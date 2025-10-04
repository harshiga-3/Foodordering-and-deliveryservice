import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { apiConfig, makeAuthenticatedRequest } from '../../utils/apiConfig';
import './FavoriteButton.css';

const FavoriteButton = ({ 
  itemId, 
  itemType, 
  itemData, 
  onFavoriteChange,
  size = 'sm',
  className = '',
  enableLocalStorage = false
}) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [error, setError] = useState(null);

  // Check if item is already favorited on component mount
  useEffect(() => {
    if (user && itemId) {
      checkFavoriteStatus();
    } else if (!user && enableLocalStorage && itemId && itemType === 'food') {
      checkLocalStorageFavorite();
    }
  }, [user, itemId, enableLocalStorage, itemType]);

  // Refresh favorite status when user changes
  useEffect(() => {
    if (itemId) {
      if (user) {
        checkFavoriteStatus();
      } else if (enableLocalStorage && itemType === 'food') {
        checkLocalStorageFavorite();
      }
    }
  }, [user]);

  const checkFavoriteStatus = async () => {
    try {
      console.log('Checking favorite status for item:', itemId);
      
      const result = await makeAuthenticatedRequest(`${apiConfig.endpoints.favorites}/check/${itemId}`);
      console.log('Favorite status response:', result);
      
      // Handle both response formats for backward compatibility
      const isFavorited = result.isFavourite || result.isFavorited || false;
      setIsFavorited(isFavorited);
      setFavoriteId(result.favoriteId);
      console.log('Set favorite status to:', isFavorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      // Don't set error for check status, just assume not favorited
      setIsFavorited(false);
      setFavoriteId(null);
    }
  };

  const checkLocalStorageFavorite = () => {
    try {
      const favorites = JSON.parse(localStorage.getItem('foodFavorites') || '[]');
      const isFavorited = favorites.some(fav => fav.id === itemId);
      setIsFavorited(isFavorited);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  };

  const toggleLocalStorageFavorite = async () => {
    try {
      const favorites = JSON.parse(localStorage.getItem('foodFavorites') || '[]');
      let newFavorites;
      
      if (isFavorited) {
        // Remove from favorites
        newFavorites = favorites.filter(fav => fav.id !== itemId);
        setIsFavorited(false);
      } else {
        // Add to favorites
        const newFavorite = {
          id: itemId,
          name: itemData?.name || 'Unknown Food',
          price: itemData?.price || '₹0',
          image: itemData?.image || '',
          category: itemData?.category || '',
          isVeg: itemData?.isVeg || false,
          addedAt: new Date().toISOString()
        };
        newFavorites = [...favorites, newFavorite];
        setIsFavorited(true);
        
        // If user is logged in, also add to database
        if (user) {
          try {
            const response = await fetch('/api/favorites/add', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                foodId: itemId,
                foodName: itemData?.name || 'Unknown Food',
                foodPrice: itemData?.price || '₹0',
                foodImage: itemData?.image || '',
                foodCategory: itemData?.category || '',
                isVeg: itemData?.isVeg || false
              })
            });

            if (!response.ok) {
              throw new Error('Failed to sync with database');
            }
          } catch (apiError) {
            console.error('Failed to sync with database:', apiError);
            // Continue with local storage even if API fails
          }
        }
      }
      
      localStorage.setItem('foodFavorites', JSON.stringify(newFavorites));
      
      // Notify parent component
      if (onFavoriteChange) {
        onFavoriteChange(isFavorited, null);
      }
      
      // Show success message
      const message = isFavorited 
        ? `Removed ${itemData?.name || 'item'} from favorites!` 
        : `Added ${itemData?.name || 'item'} to favorites!`;
      console.log(message);
      
    } catch (error) {
      console.error('Error updating localStorage:', error);
      setError('Failed to update favorites');
    }
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Toggling favorite for item:', itemId, 'Current state:', isFavorited);

    if (!user) {
      if (enableLocalStorage && itemType === 'food') {
        // Use local storage for guest users on FoodPage
        toggleLocalStorageFavorite();
        return;
      } else {
        // Redirect to login or show login modal
        alert('Please login to add favorites');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await makeAuthenticatedRequest(`${apiConfig.endpoints.favorites}/toggle`, {
        method: 'POST',
        body: JSON.stringify({
          favoriteType: itemType,
          foodId: itemId,
          foodName: itemData?.name,
          foodPrice: itemData?.price,
          foodImage: itemData?.image,
          foodCategory: itemData?.category,
          isVeg: itemData?.isVeg
        })
      });

      console.log('Toggle response:', result);
      
      // Handle both response formats for backward compatibility
      const isFavorited = result.isFavorited || result.isFavourite || false;
      setIsFavorited(isFavorited);
      setFavoriteId(result.favoriteId);
      console.log('Updated favorite status to:', isFavorited);

      // Notify parent component
      if (onFavoriteChange) {
        onFavoriteChange(isFavorited, result.favoriteId);
      }

      // Show success message
      const message = isFavorited 
        ? `Added ${itemData?.name || 'item'} to favorites!` 
        : `Removed ${itemData?.name || 'item'} from favorites!`;
      console.log(message);

      // Emit a global event so dashboards/widgets can refresh immediately
      try {
        window.dispatchEvent(new CustomEvent('favorites:changed', {
          detail: {
            itemId,
            isFavorited,
            favoriteId: result.favoriteId,
          }
        }));
      } catch (e) {
        // no-op
      }

    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError(error.message || 'Failed to toggle favorite');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    if (enableLocalStorage && itemType === 'food') {
      return (
        <Button
          variant="light"
          size={size}
          className={`favorite-btn ${isFavorited ? 'favorited' : ''} ${className}`}
          onClick={handleToggleFavorite}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <i className={`bi ${isFavorited ? 'bi-heart-fill' : 'bi-heart'}`}></i>
        </Button>
      );
    } else {
      return (
        <Button
          variant="light"
          size={size}
          className={`favorite-btn guest ${className}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            alert('Please login to add favorites');
          }}
          title="Login to add favorites"
        >
          <i className="bi bi-heart"></i>
        </Button>
      );
    }
  }

  return (
    <Button
      variant="light"
      size={size}
      className={`favorite-btn ${isFavorited ? 'favorited' : ''} ${loading ? 'loading' : ''} ${className}`}
      onClick={handleToggleFavorite}
      disabled={loading}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <i className={`bi ${isFavorited ? 'bi-heart-fill' : 'bi-heart'}`}></i>
      {loading && <span className="loading-spinner"></span>}
    </Button>
  );
};

export default FavoriteButton;
