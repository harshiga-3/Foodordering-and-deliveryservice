import { resolvePublicImage } from '../../utils/imageUtils';
import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { apiConfig } from '../../utils/apiConfig';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import './RestaurantMenuModal.css';

const RestaurantMenuModal = ({ 
  show, 
  onHide, 
  restaurant, 
  onAddToCart 
}) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && restaurant) {
      loadMenuItems();
    }
  }, [show, restaurant]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError('');
      const url = `${apiConfig.endpoints.foods}?restaurantId=${restaurant._id || restaurant.id}`;
      console.log('Loading menu items from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Menu items received:', data);
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading menu items:', e);
      setError(e.message || 'Failed to load menu items');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    if (onAddToCart) {
      onAddToCart(item);
    }
  };

  const renderStars = (rating, size = 'sm') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <i key={i} className={`bi bi-star-fill text-warning ${size === 'lg' ? 'fs-4' : size === 'md' ? 'fs-5' : 'fs-6'}`}></i>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <i key="half" className={`bi bi-star-half text-warning ${size === 'lg' ? 'fs-4' : size === 'md' ? 'fs-5' : 'fs-6'}`}></i>
      );
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <i key={`empty-${i}`} className={`bi bi-star text-warning ${size === 'lg' ? 'fs-4' : size === 'md' ? 'fs-5' : 'fs-6'}`}></i>
      );
    }

    return stars;
  };

  const groupMenuItemsByCategory = (items) => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
  };

  const menuByCategory = groupMenuItemsByCategory(menuItems);

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered
      className="restaurant-menu-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <div className="d-flex align-items-center">
            <img 
              src={resolvePublicImage(restaurant?.image, '/images/placeholder.svg')} 
              alt={restaurant?.name}
              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', marginRight: '15px' }}
              onError={(e) => { e.currentTarget.src = resolvePublicImage('/images/placeholder.svg'); }}
            />
            <div>
              <h4 className="mb-0">{restaurant?.name}</h4>
              <small className="text-muted">{restaurant?.cuisine} • {restaurant?.location}</small>
            </div>
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
            <p className="mt-3">Loading menu items...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-emoji-frown display-1 text-muted"></i>
            <h5 className="mt-3 text-muted">No menu items available</h5>
            <p className="text-muted">This restaurant hasn't added any food items yet.</p>
          </div>
        ) : (
          <div>
            {Object.entries(menuByCategory).map(([category, items]) => (
              <div key={category} className="mb-4">
                <h5 className="category-title mb-3">
                  <i className="bi bi-utensils me-2"></i>
                  {category}
                </h5>
                <Row>
                  {items.map((item) => (
                    <Col key={item._id || item.id} md={6} lg={4} className="mb-3">
                      <Card className="h-100 food-item-card">
                        <Card.Img 
                          variant="top" 
                          src={resolvePublicImage(item.image, '/images/placeholder.svg')}
                          style={{ height: '150px', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.src = resolvePublicImage('/images/placeholder.svg'); }}
                        />
                        <Card.Body className="d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Card.Title className="h6 mb-0">{item.name}</Card.Title>
                            <FavoriteButton
                              itemId={item._id || item.id}
                              itemType="food"
                              itemData={item}
                              size="sm"
                            />
                          </div>
                          
                          {/* Rating Display */}
                          <div className="d-flex align-items-center mb-2">
                            <div className="d-flex align-items-center me-2">
                              {renderStars(item.rating || 0, 'sm')}
                            </div>
                            <span className="text-muted small">
                              {item.rating ? `${item.rating} (${Math.floor(Math.random() * 50) + 10})` : 'No ratings'}
                            </span>
                          </div>
                          
                          <Card.Text className="text-muted small flex-grow-1">
                            {item.description}
                          </Card.Text>
                          
                          <div className="mt-auto">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="text-danger fw-bold fs-5">₹{item.price}</span>
                              <Badge bg={item.isVeg ? 'success' : 'danger'} className="px-2 py-1">
                                {item.isVeg ? 'VEG' : 'NON-VEG'}
                              </Badge>
                            </div>
                            <Button 
                              variant="danger" 
                              size="sm" 
                              className="w-100 rounded-pill"
                              onClick={() => handleAddToCart(item)}
                            >
                              <i className="bi bi-cart-plus me-1"></i>
                              Add to Cart
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
        <Button 
          variant="danger" 
          onClick={() => {
            onHide();
            // Navigate to full restaurant page
            window.location.href = `/restaurant/${restaurant?._id || restaurant?.id}`;
          }}
        >
          View Full Menu
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RestaurantMenuModal;
