// src/components/FoodDetail/FoodDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { useAuth } from '../../context/AuthContext';
import { resolvePublicImage } from '../../utils/imageUtils';
import './FoodDetail.css';

const FoodDetail = ({ foodId, onBack, onAddToCart }) => {
  const navigate = useNavigate();
  const { API_BASE } = useAuth();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  
  useEffect(() => {
    fetchFoodDetails();
    checkFavoriteStatus();
  }, [foodId]);

  const fetchFoodDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/foods/${foodId}`);
      if (!response.ok) throw new Error('Food not found');
      
      const data = await response.json();
      setFood(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const token = localStorage.getItem('fd_auth') ? JSON.parse(localStorage.getItem('fd_auth')).token : '';
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/favorites/check/${foodId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.isFavorited);
        setFavoriteId(data.favoriteId);
      }
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };

  const toggleFavorite = async () => {
    try {
      const token = localStorage.getItem('fd_auth') ? JSON.parse(localStorage.getItem('fd_auth')).token : '';
      if (!token) {
        navigate('/login');
        return;
      }

      const method = isFavorite ? 'DELETE' : 'POST';
      const url = isFavorite 
        ? `${API_BASE}/api/favorites/${foodId}`
        : `${API_BASE}/api/favorites`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: method === 'POST' ? JSON.stringify({ foodId }) : undefined
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        if (isFavorite) {
          setFavoriteId(null);
        } else {
          const data = await response.json();
          setFavoriteId(data._id);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleAddToCart = () => {
    if (food) {
      onAddToCart(food);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading food details...</p>
      </Container>
    );
  }

  if (error || !food) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          <h2 className="mb-4">Food item not found</h2>
          <p>{error || 'The requested food item could not be found.'}</p>
          <Button variant="outline-danger" onClick={onBack}>
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Button variant="outline-secondary" onClick={onBack} className="mb-4">
        <i className="bi bi-arrow-left me-2"></i>Back to Menu
      </Button>

      {/* Food Details */}
      <Card className="mb-4 food-detail-card">
        <Row className="g-0">
          <Col md={6}>
            <img 
              src={resolvePublicImage(food.image, '/images/placeholder.svg')} 
              alt={food.name}
              className="img-fluid rounded-start h-100"
              style={{ objectFit: 'cover', minHeight: '300px' }}
              onError={(e) => { e.currentTarget.src = resolvePublicImage('/images/placeholder.svg'); }}
            />
          </Col>
          <Col md={6}>
            <Card.Body className="h-100 d-flex flex-column">
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <Card.Title className="display-6 mb-0">{food.name}</Card.Title>
                  <Button
                    variant={isFavorite ? "danger" : "outline-danger"}
                    size="sm"
                    onClick={toggleFavorite}
                    className="favorite-btn-detail"
                  >
                    <i className={`bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                  </Button>
                </div>
                
                <Card.Text className="text-muted lead mb-3">{food.description}</Card.Text>
                <h3 className="text-success mb-3">₹{food.price}</h3>
                
                <div className="mb-4">
                  <Badge bg={food.isVeg ? "success" : "danger"} className="me-2 fs-6">
                    {food.isVeg ? "🟢 VEG" : "🔴 NON-VEG"}
                  </Badge>
                  <Badge bg="secondary" className="me-2 fs-6">
                    {food.category}
                  </Badge>
                  {food.foodType && (
                    <Badge bg="info" className="me-2 fs-6">
                      {food.foodType}
                    </Badge>
                  )}
                  {food.tags && food.tags.map(tag => (
                    <Badge bg="light" text="dark" key={tag} className="me-2 fs-6">
                      {tag}
                    </Badge>
                  ))}
                  <Badge bg="warning" text="dark" className="me-2 fs-6">
                    <i className="bi bi-star-fill me-1"></i>
                    {food.rating || 0}
                  </Badge>
                </div>

                {food.restaurantName && (
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">Restaurant</h6>
                    <Badge bg="primary" className="fs-6">
                      <i className="bi bi-shop me-1"></i>
                      {food.restaurantName}
                    </Badge>
                  </div>
                )}

                {food.preparationTime && (
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">Preparation Time</h6>
                    <Badge bg="info" className="fs-6">
                      <i className="bi bi-clock me-1"></i>
                      {food.preparationTime} minutes
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="d-flex gap-3">
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={handleAddToCart}
                  className="flex-grow-1"
                >
                  <i className="bi bi-cart-plus me-2"></i>Add to Cart
                </Button>
                
                <Button 
                  variant="outline-primary" 
                  size="lg"
                  onClick={() => navigate('/food')}
                >
                  <i className="bi bi-list me-2"></i>View All Foods
                </Button>
              </div>
            </Card.Body>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default FoodDetail;