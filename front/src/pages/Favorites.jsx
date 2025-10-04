import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiConfig, makeAuthenticatedRequest } from '../utils/apiConfig';
import './Favorites.css';

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      // For guest users, load from localStorage
      loadLocalStorageFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      const data = await makeAuthenticatedRequest(apiConfig.endpoints.favorites);
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setError(error.message || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const loadLocalStorageFavorites = () => {
    try {
      const localFavorites = JSON.parse(localStorage.getItem('foodFavorites') || '[]');
      setFavorites(localFavorites);
    } catch (error) {
      console.error('Error loading local favorites:', error);
      setError('Failed to load favorites from local storage');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (foodId) => {
    try {
      if (user) {
        // Remove from database
        await makeAuthenticatedRequest(`${apiConfig.endpoints.favorites}/remove`, {
          method: 'POST',
          body: JSON.stringify({ foodId })
        });
      } else {
        // Remove from localStorage
        const localFavorites = JSON.parse(localStorage.getItem('foodFavorites') || '[]');
        const updatedFavorites = localFavorites.filter(fav => fav.id !== foodId);
        localStorage.setItem('foodFavorites', JSON.stringify(updatedFavorites));
      }

      // Update local state (support both id and foodId shapes)
      setFavorites(prev => prev.filter(fav => (fav.foodId || fav.id) !== foodId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      setError(error.message || 'Failed to remove favorite');
    }
  };

  const addToCart = (item) => {
    alert(`${(item.name || item.foodName || 'Item')} added to cart!`);
  };

  const orderNow = (item) => {
    navigate('/checkout', { state: { singleItem: item } });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3">Loading your favorites...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Error Loading Favorites</h4>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="favorites-page">
      <Container className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col className="text-center">
            <div className="favorites-header">
              <h1 className="display-5 fw-bold text-primary mb-3">
                <i className="ri-heart-3-line me-3"></i>
                My Favorites
              </h1>
              <p className="lead text-muted">
                {favorites.length === 0 
                  ? "You haven't added any favorites yet" 
                  : `You have ${favorites.length} favorite food item${favorites.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </Col>
        </Row>

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <Row>
            <Col className="text-center py-5">
              <div className="empty-favorites">
                <i className="ri-heart-3-line display-1 text-muted"></i>
                <h4 className="mt-3 text-muted">No favorites yet</h4>
                <p className="text-muted mb-4">
                  Start adding your favorite foods to see them here!
                </p>
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => navigate('/food')}
                >
                  <i className="ri-arrow-right-line me-2"></i>
                  Browse Food Items
                </Button>
              </div>
            </Col>
          </Row>
        ) : (
          <Row>
            {favorites.map((item) => {
              const key = item.id || item._id || item.foodId;
              const img = item.image || item.foodImage || '';
              const title = item.name || item.foodName || 'Food Item';
              const price = item.price || item.foodPrice || '';
              const category = item.category || item.foodCategory || '';
              const veg = typeof item.isVeg !== 'undefined' ? item.isVeg : false;
              const addedAt = item.addedAt || item.createdAt;
              const foodId = item.foodId || item.id;

              return (
                <Col key={key} lg={4} md={6} className="mb-4">
                  <Card className="favorite-card h-100 shadow-sm">
                    <div className="position-relative">
                      <Card.Img
                        variant="top"
                        src={img}
                        alt={title}
                        className="favorite-image"
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                      />
                      {/* Remove from favorites button */}
                      <Button
                        variant="danger"
                        size="sm"
                        className="remove-favorite-btn position-absolute top-0 end-0 m-2"
                        onClick={() => removeFavorite(foodId)}
                        title="Remove from favorites"
                      >
                        <i className="ri-heart-3-fill"></i>
                      </Button>

                      {/* Veg/Non-Veg Badge */}
                      <Badge 
                        bg={veg ? 'success' : 'danger'} 
                        className="position-absolute top-0 start-0 m-2"
                      >
                        {veg ? 'VEG' : 'NON-VEG'}
                      </Badge>

                      {/* Category Badge */}
                      <Badge 
                        bg="secondary" 
                        className="position-absolute bottom-0 start-0 m-2"
                      >
                        {category}
                      </Badge>
                    </div>
                    
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="h6 mb-2 favorite-title">
                        {title}
                      </Card.Title>
                      
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="text-primary fw-bold fs-5">{price}</span>
                          {addedAt && (
                            <small className="text-muted">
                              Added: {new Date(addedAt).toLocaleDateString()}
                            </small>
                          )}
                        </div>
                        
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="flex-fill"
                            onClick={() => addToCart(item)}
                          >
                            <i className="ri-shopping-cart-2-line me-2"></i>
                            Add to Cart
                          </Button>
                          
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="flex-fill"
                            onClick={() => orderNow(item)}
                          >
                            <i className="ri-flashlight-line me-2"></i>
                            Order Now
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* Quick Actions */}
        {favorites.length > 0 && (
          <Row className="mt-5">
            <Col className="text-center">
              <div className="quick-actions">
                <h5 className="mb-3">Quick Actions</h5>
                <div className="d-flex gap-3 justify-content-center">
                  <Button 
                    variant="outline-primary"
                    onClick={() => navigate('/food')}
                  >
                    <i className="ri-add-circle-line me-2"></i>
                    Add More Favorites
                  </Button>
                  <Button 
                    variant="outline-success"
                    onClick={() => navigate('/cart')}
                  >
                    <i className="ri-shopping-cart-line me-2"></i>
                    View Cart
                  </Button>
                  <Button 
                    variant="outline-info"
                    onClick={() => navigate('/dashboard')}
                  >
                    <i className="ri-user-3-line me-2"></i>
                    My Dashboard
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Favorites;
