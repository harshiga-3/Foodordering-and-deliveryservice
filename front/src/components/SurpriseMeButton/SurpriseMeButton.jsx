import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { useNavigate } from 'react-router-dom';
import './SurpriseMeButton.css';

const SurpriseMeButton = ({ onAddToCart, onRestaurantClick, className = '', size = 'lg' }) => {
  const { user, token, API_BASE } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [surpriseFood, setSurpriseFood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [budget, setBudget] = useState(500);

  const pickLocalSurprise = async () => {
    try {
      const foodsResp = await fetch(`${API_BASE}/api/foods`).then(r => r.json()).catch(() => null);
      const foods = Array.isArray(foodsResp?.items) ? foodsResp.items : (Array.isArray(foodsResp) ? foodsResp : []);
      if (!foods.length) throw new Error('No foods available');

      let candidates = foods.filter(f => Number(f.price || 0) <= budget);

      try {
        const localProfile = JSON.parse(localStorage.getItem('tasteProfile') || 'null');
        if (localProfile?.preferences) {
          const pref = localProfile.preferences;
          candidates = candidates.map(f => {
            let score = 0;
            if (pref.categories && pref.categories.includes(String(f.category).toLowerCase())) score += 2;
            if (pref.cuisines && f.restaurant?.cuisine) {
              const cuisines = String(f.restaurant.cuisine).split(',').map(s => s.trim());
              if (cuisines.some(c => pref.cuisines.includes(c))) score += 2;
            }
            if (typeof f.rating === 'number') score += f.rating / 2;
            return { f, score };
          }).sort((a, b) => b.score - a.score).slice(0, 10).map(x => x.f);
        }
      } catch {}

      if (!candidates.length) candidates = foods;
      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      return {
        food: selected,
        message: 'Handpicked for you!',
        isSurprise: true,
        reason: 'Matched to your budget and preferences'
      };
    } catch (e) {
      return null;
    }
  };

  const handleSurpriseMe = async () => {
    setLoading(true);
    setError(null);
    setSurpriseFood(null);

    // If user or token is missing, use local fallback flow without blocking
    if (!user || !token) {
      const localPick = await pickLocalSurprise();
      if (localPick) {
        setSurpriseFood(localPick);
        setShowModal(true);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE}/api/surprise-me?maxPrice=${budget}&minRating=4.0`, {
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {}
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setSurpriseFood(data);
      setShowModal(true);
    } catch (err) {
      // Fallback to local selection
      const localPick = await pickLocalSurprise();
      if (localPick) {
        setSurpriseFood(localPick);
        setShowModal(true);
        setError(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (surpriseFood && onAddToCart) {
      onAddToCart(surpriseFood.food);
      setShowModal(false);
    }
  };

  const handleViewRestaurant = () => {
    if (surpriseFood && onRestaurantClick) {
      onRestaurantClick(surpriseFood.food.restaurantId);
      setShowModal(false);
    }
  };

  const handleTryAgain = () => {
    setError(null);
    setSurpriseFood(null);
    handleSurpriseMe();
  };

  const getBudgetOptions = () => [
    { value: 300, label: 'Under ₹300' },
    { value: 500, label: 'Under ₹500' },
    { value: 800, label: 'Under ₹800' },
    { value: 1000, label: 'Under ₹1000' },
    { value: 1500, label: 'Under ₹1500' }
  ];

  return (
    <>
      <div className={`surprise-me-container ${className}`}>
        <Button
          variant="warning"
          size={size}
          onClick={handleSurpriseMe}
          disabled={loading}
          className="surprise-me-btn"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Finding Surprise...
            </>
          ) : (
            <>
              <i className="bi bi-gift me-2"></i>
              Surprise Me! 🎁
            </>
          )}
        </Button>
        
        <div className="budget-selector mt-3">
          <small className="text-muted d-block mb-2">Set your budget:</small>
          <div className="budget-options">
            {getBudgetOptions().map(option => (
              <button
                key={option.value}
                className={`budget-option ${budget === option.value ? 'active' : ''}`}
                onClick={() => setBudget(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        className="surprise-modal"
      >
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            <i className="bi bi-gift me-2"></i>
            Surprise for You! 🎉
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {error ? (
            <div className="p-4 text-center">
              <Alert variant="danger" className="mb-4">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
              <Button variant="outline-primary" onClick={handleTryAgain}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Try Again
              </Button>
            </div>
          ) : surpriseFood ? (
            <div className="surprise-food-display">
              <div className="surprise-message p-4 bg-light text-center">
                <h5 className="text-warning mb-2">
                  <i className="bi bi-star-fill me-1"></i>
                  {surpriseFood.message}
                </h5>
                {surpriseFood.reason && (
                  <p className="text-muted mb-0">{surpriseFood.reason}</p>
                )}
              </div>
              
              <Card className="border-0">
                <div className="row g-0">
                  <div className="col-md-4">
                    <img
                      src={surpriseFood.food.image}
                      alt={surpriseFood.food.name}
                      className="img-fluid rounded-start h-100 object-cover"
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="col-md-8">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h4 className="card-title mb-1">{surpriseFood.food.name}</h4>
                        <Badge bg="success" className="fs-6">
                          <i className="bi bi-star-fill me-1"></i>
                          {surpriseFood.food.rating}
                        </Badge>
                      </div>
                      
                      <p className="text-muted mb-3">{surpriseFood.food.description}</p>
                      
                      <div className="food-details mb-3">
                        <div className="row g-2">
                          <div className="col-6">
                            <small className="text-muted">Restaurant:</small>
                            <div className="fw-semibold">{surpriseFood.food.restaurant?.name || 'Unknown'}</div>
                          </div>
                          <div className="col-6">
                            <small className="text-muted">Cuisine:</small>
                            <div className="fw-semibold">{surpriseFood.food.restaurant?.cuisine || 'N/A'}</div>
                          </div>
                          <div className="col-6">
                            <small className="text-muted">Category:</small>
                            <div className="fw-semibold text-capitalize">{surpriseFood.food.category}</div>
                          </div>
                          <div className="col-6">
                            <small className="text-muted">Type:</small>
                            <div className="fw-semibold">
                              {surpriseFood.food.isVeg ? (
                                <Badge bg="success">Vegetarian</Badge>
                              ) : (
                                <Badge bg="danger">Non-Vegetarian</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="price-section">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="h4 text-primary mb-0">₹{surpriseFood.food.price}</span>
                            <small className="text-muted d-block">Price</small>
                          </div>
                          <div className="text-end">
                            <small className="text-muted">Preparation Time</small>
                            <div className="fw-semibold">
                              <i className="bi bi-clock me-1"></i>
                              {surpriseFood.food.preparationTime || 20} mins
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {surpriseFood && (
            <>
              <Button variant="outline-primary" onClick={handleViewRestaurant}>
                <i className="bi bi-shop me-2"></i>
                View Restaurant
              </Button>
              <Button variant="success" onClick={handleAddToCart}>
                <i className="bi bi-cart-plus me-2"></i>
                Add to Cart
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SurpriseMeButton;
