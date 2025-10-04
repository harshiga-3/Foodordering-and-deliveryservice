import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import './PersonalizedRecommendations.css';

const PersonalizedRecommendations = ({ onAddToCart, onRestaurantClick }) => {
  const { user, token, API_BASE } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasTasteProfile, setHasTasteProfile] = useState(false);

  useEffect(() => {
    if (user) {
      // Check for locally saved taste profile first
      const localProfile = localStorage.getItem('tasteProfile');
      if (localProfile) {
        try {
          const parsed = JSON.parse(localProfile);
          if (parsed.savedLocally) {
            setHasTasteProfile(true);
            console.log('Found locally saved taste profile');
            return;
          }
        } catch (err) {
          console.error('Error parsing local taste profile:', err);
        }
      }
      
      if (token) {
        fetchRecommendations();
        checkTasteProfile();
      }
    }
  }, [user, token]);

  const checkTasteProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/taste-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const profile = await response.json();
        setHasTasteProfile(profile.isComplete);
      }
    } catch (err) {
      console.error('Error checking taste profile:', err);
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/taste-profile/recommendations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setHasTasteProfile(false);
          return;
        }
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (food) => {
    if (onAddToCart) {
      onAddToCart(food);
    }
  };

  const handleRestaurantClick = (restaurantId) => {
    if (onRestaurantClick) {
      onRestaurantClick(restaurantId);
    }
  };

  if (!user) {
    return null;
  }

  if (!hasTasteProfile) {
    return (
      <section className="personalized-recommendations py-5 bg-light">
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body className="p-5">
                  <div className="mb-4">
                    <i className="bi bi-person-check text-primary" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h3 className="mb-3">Personalize Your Experience</h3>
                  <p className="text-muted mb-4">
                    Take our quick Taste Buds quiz to get personalized food recommendations 
                    tailored just for you!
                  </p>
                  <Button variant="primary" size="lg" className="px-4">
                    <i className="bi bi-question-circle me-2"></i>
                    Take Taste Quiz
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="personalized-recommendations py-5 bg-light">
        <Container>
          <div className="text-center">
            <Spinner animation="border" role="status" className="mb-3">
              <span className="visually-hidden">Loading recommendations...</span>
            </Spinner>
            <p className="text-muted">Loading your personalized recommendations...</p>
          </div>
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section className="personalized-recommendations py-5 bg-light">
        <Container>
          <Alert variant="danger" className="text-center">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        </Container>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section className="personalized-recommendations py-5 bg-light">
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body className="p-5">
                  <div className="mb-4">
                    <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h3 className="mb-3">No Recommendations Yet</h3>
                  <p className="text-muted mb-4">
                    We're still learning about your preferences. Keep ordering and we'll 
                    provide better recommendations!
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    );
  }

  return (
    <section className="personalized-recommendations py-5 bg-light">
      <Container>
        <Row className="mb-4">
          <Col>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-2">
                  <i className="bi bi-heart-fill text-danger me-2"></i>
                  Recommended for You
                </h2>
                <p className="text-muted mb-0">
                  Based on your taste profile and preferences
                </p>
              </div>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={fetchRecommendations}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </Button>
            </div>
          </Col>
        </Row>

        <Row>
          {recommendations.slice(0, 6).map((rec, index) => {
            const food = rec.foodId;
            if (!food) return null;

            return (
              <Col lg={4} md={6} className="mb-4" key={food._id || index}>
                <Card className="h-100 recommendation-card border-0 shadow-sm">
                  <div className="position-relative">
                    <img
                      src={food.image}
                      alt={food.name}
                      className="card-img-top recommendation-image"
                    />
                    <Badge 
                      bg="success" 
                      className="position-absolute top-0 end-0 m-2 recommendation-score"
                    >
                      <i className="bi bi-star-fill me-1"></i>
                      {Math.round(rec.score * 100)}% Match
                    </Badge>
                    <Badge 
                      bg="primary" 
                      className="position-absolute top-0 start-0 m-2"
                    >
                      Recommended
                    </Badge>
                  </div>
                  
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-1">{food.name}</h5>
                      <Badge bg="success" className="ms-2">
                        <i className="bi bi-star-fill me-1"></i>
                        {food.rating}
                      </Badge>
                    </div>
                    
                    <p className="card-text text-muted small mb-2">
                      {food.description.length > 80 
                        ? `${food.description.substring(0, 80)}...` 
                        : food.description
                      }
                    </p>
                    
                    <div className="food-meta mb-3">
                      <div className="row g-1">
                        <div className="col-6">
                          <small className="text-muted d-block">Restaurant</small>
                          <small className="fw-semibold">{food.restaurant?.name || 'Unknown'}</small>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Cuisine</small>
                          <small className="fw-semibold">{food.restaurant?.cuisine || 'N/A'}</small>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Category</small>
                          <small className="fw-semibold text-capitalize">{food.category}</small>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Type</small>
                          <small className="fw-semibold">
                            {food.isVeg ? (
                              <Badge bg="success" className="small">Veg</Badge>
                            ) : (
                              <Badge bg="danger" className="small">Non-Veg</Badge>
                            )}
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="h5 text-primary mb-0">₹{food.price}</span>
                        <small className="text-muted d-block">Price</small>
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">Prep Time</small>
                        <small className="fw-semibold">
                          <i className="bi bi-clock me-1"></i>
                          {food.preparationTime || 20}m
                        </small>
                      </div>
                    </div>
                    
                    {rec.reason && (
                      <div className="recommendation-reason mt-2">
                        <small className="text-info">
                          <i className="bi bi-lightbulb me-1"></i>
                          {rec.reason}
                        </small>
                      </div>
                    )}
                  </Card.Body>
                  
                  <Card.Footer className="bg-transparent border-0 p-3 pt-0">
                    <div className="d-grid gap-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleAddToCart(food)}
                        className="mb-2"
                      >
                        <i className="bi bi-cart-plus me-2"></i>
                        Add to Cart
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => handleRestaurantClick(food.restaurantId)}
                      >
                        <i className="bi bi-shop me-2"></i>
                        View Restaurant
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>

        {recommendations.length > 6 && (
          <Row>
            <Col className="text-center mt-4">
              <Button variant="outline-primary" size="lg">
                View All Recommendations
                <i className="bi bi-arrow-right ms-2"></i>
              </Button>
            </Col>
          </Row>
        )}
      </Container>
    </section>
  );
};

export default PersonalizedRecommendations;
