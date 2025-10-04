import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import SurprisePreferencesModal from '../SurprisePreferencesModal/SurprisePreferencesModal';
import SurpriseResultModal from '../SurpriseResultModal/SurpriseResultModal';
import './SurpriseMeButtonEnhanced.css';

const SurpriseMeButtonEnhanced = ({ 
  onAddToCart, 
  onRestaurantClick, 
  className = '', 
  size = 'lg',
  position = 'header' // 'header' or 'floating'
}) => {
  const { user, token, API_BASE } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [showPreferences, setShowPreferences] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [surpriseData, setSurpriseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('surprisePreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
        setIsFirstTime(false);
      } catch (err) {
        console.error('Error parsing saved preferences:', err);
        setIsFirstTime(true);
      }
    } else {
      setIsFirstTime(true);
    }
  }, []);

  const handleSurpriseClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isFirstTime || !preferences) {
      setShowPreferences(true);
    } else {
      fetchSurprise();
    }
  };

  const handlePreferencesSave = (newPreferences) => {
    setPreferences(newPreferences);
    setIsFirstTime(false);
    fetchSurprise();
  };

  const fetchSurprise = async () => {
    setLoading(true);
    setError(null);
    setSurpriseData(null);

    try {
      const queryParams = new URLSearchParams({
        budget: preferences.budget || 25,
        ...(preferences.dietaryRestrictions?.length > 0 && {
          dietaryRestrictions: preferences.dietaryRestrictions.join(',')
        }),
        ...(preferences.location && {
          latitude: preferences.location.latitude,
          longitude: preferences.location.longitude
        })
      });

      console.log('Fetching surprise with params:', queryParams.toString());

      const response = await fetch(`${API_BASE}/api/restaurants/surprise?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No restaurants available in your area right now. Try again later!');
        } else if (response.status === 400) {
          throw new Error('No dishes found within your budget. Try increasing your budget!');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Surprise data received:', data);
      
      setSurpriseData(data);
      setShowResult(true);
    } catch (err) {
      console.error('Surprise fetch error:', err);
      
      // Fallback: Show demo data if API fails
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        const demoData = createDemoSurprise();
        setSurpriseData(demoData);
        setShowResult(true);
        setError('Using demo data - server not available');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const createDemoSurprise = () => {
    const demoFoods = [
      {
        _id: 'demo-1',
        name: 'Chicken Biryani',
        description: 'Aromatic basmati rice cooked with tender chicken pieces and exotic spices',
        price: Math.min(preferences?.budget || 25, 18),
        rating: 4.5,
        image: 'images/TrendingFood/briyani.jpg',
        category: 'rice',
        isVeg: false,
        preparationTime: 25,
        tags: ['spicy', 'aromatic', 'traditional'],
        restaurant: {
          name: 'Spice Garden',
          cuisine: 'Indian',
          deliveryTime: '30-40 mins',
          rating: 4.3
        },
        restaurantId: 'demo-restaurant-1'
      },
      {
        _id: 'demo-2',
        name: 'Margherita Pizza',
        description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
        price: Math.min(preferences?.budget || 25, 22),
        rating: 4.4,
        image: 'images/TrendingFood/f1.jpg',
        category: 'pizza',
        isVeg: true,
        preparationTime: 20,
        tags: ['cheese', 'tomato', 'italian'],
        restaurant: {
          name: 'Bella Vista',
          cuisine: 'Italian',
          deliveryTime: '25-35 mins',
          rating: 4.2
        },
        restaurantId: 'demo-restaurant-2'
      }
    ];

    const randomFood = demoFoods[Math.floor(Math.random() * demoFoods.length)];
    
    return {
      food: randomFood,
      message: 'Here\'s a delightful surprise just for you! ✨',
      isSurprise: true,
      reason: 'Highly rated and within your budget'
    };
  };

  const handleTryAgain = () => {
    setShowResult(false);
    fetchSurprise();
  };

  const handleOrderNow = (data) => {
    if (onAddToCart && data?.food) {
      onAddToCart(data.food);
    }
    setShowResult(false);
  };

  const handleViewMenu = (restaurantId) => {
    if (onRestaurantClick) {
      onRestaurantClick(restaurantId);
    }
    setShowResult(false);
  };

  const handleAddToCart = (food) => {
    if (onAddToCart) {
      onAddToCart(food);
    }
    setShowResult(false);
  };

  const buttonContent = (
    <Button
      variant="warning"
      size={size}
      onClick={handleSurpriseClick}
      disabled={loading}
      className={`surprise-me-btn-enhanced ${className} ${position}`}
    >
      {loading ? (
        <>
          <div className="spinning-dice me-2">
            <i className="bi bi-dice-6-fill"></i>
          </div>
          Finding...
        </>
      ) : (
        <>
          <i className="bi bi-dice-6-fill me-2"></i>
          Surprise Me! 🎲
        </>
      )}
    </Button>
  );

  const tooltip = (
    <Tooltip id="surprise-tooltip">
      Can't decide? Let us surprise you!
    </Tooltip>
  );

  return (
    <>
      <OverlayTrigger
        placement="bottom"
        delay={{ show: 500, hide: 100 }}
        overlay={tooltip}
      >
        {buttonContent}
      </OverlayTrigger>

      {/* Preferences Modal */}
      <SurprisePreferencesModal
        show={showPreferences}
        onHide={() => setShowPreferences(false)}
        onSave={handlePreferencesSave}
        initialPreferences={preferences}
      />

      {/* Result Modal */}
      <SurpriseResultModal
        show={showResult}
        onHide={() => setShowResult(false)}
        surpriseData={surpriseData}
        loading={loading}
        onOrderNow={handleOrderNow}
        onTryAgain={handleTryAgain}
        onViewMenu={handleViewMenu}
        onAddToCart={handleAddToCart}
      />

      {/* Error Display */}
      {error && !showResult && (
        <div className="surprise-error-alert">
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>
        </div>
      )}
    </>
  );
};

export default SurpriseMeButtonEnhanced;
