import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import './SurpriseResultModal.css';

const SurpriseResultModal = ({ 
  show, 
  onHide, 
  surpriseData, 
  loading, 
  onOrderNow, 
  onTryAgain, 
  onViewMenu,
  onAddToCart 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (show && surpriseData) {
      setImageLoaded(false);
      setShowAnimation(false);
      // Trigger animation after a short delay
      setTimeout(() => setShowAnimation(true), 100);
    }
  }, [show, surpriseData]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleOrderNow = () => {
    if (onAddToCart && surpriseData?.food) {
      onAddToCart(surpriseData.food);
    }
    if (onOrderNow) {
      onOrderNow(surpriseData);
    }
    onHide();
  };

  const handleViewMenu = () => {
    if (onViewMenu && surpriseData?.food?.restaurantId) {
      onViewMenu(surpriseData.food.restaurantId);
    }
    onHide();
  };

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="rating-stars">
        {[...Array(fullStars)].map((_, i) => (
          <i key={i} className="bi bi-star-fill text-warning"></i>
        ))}
        {hasHalfStar && (
          <i className="bi bi-star-half text-warning"></i>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <i key={i + fullStars + 1} className="bi bi-star text-warning"></i>
        ))}
        <span className="ms-2 fw-semibold">{rating}</span>
      </div>
    );
  };

  const getDeliveryTimeColor = (time) => {
    const minutes = parseInt(time);
    if (minutes <= 30) return 'success';
    if (minutes <= 45) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <Modal 
        show={show} 
        onHide={onHide}
        size="lg"
        centered
        className="surprise-result-modal"
      >
        <Modal.Body className="text-center py-5">
          <div className="loading-container">
            <div className="spinning-dice mb-4">
              <i className="bi bi-dice-6-fill"></i>
            </div>
            <h4 className="text-primary mb-3">Finding something delicious...</h4>
            <p className="text-muted mb-4">
              Our algorithm is searching for the perfect surprise just for you!
            </p>
            <Spinner animation="border" variant="primary" />
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  if (!surpriseData || !surpriseData.food) {
    return (
      <Modal 
        show={show} 
        onHide={onHide}
        size="lg"
        centered
        className="surprise-result-modal"
      >
        <Modal.Body className="text-center py-5">
          <div className="error-container">
            <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
            <h4 className="text-warning mb-3">Oops! No Surprise Found</h4>
            <p className="text-muted mb-4">
              We couldn't find a suitable dish with your current preferences. 
              Try adjusting your budget or dietary restrictions.
            </p>
            <Button variant="outline-primary" onClick={onTryAgain}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Try Again
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  const { food, message, reason } = surpriseData;

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      centered
      className="surprise-result-modal"
    >
      <Modal.Header closeButton className="bg-warning text-dark">
        <Modal.Title>
          <i className="bi bi-gift me-2"></i>
          Your Surprise! 🎉
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {/* Surprise Message */}
        <div className="surprise-message p-4 text-center bg-light">
          <h5 className="text-warning mb-2">
            <i className="bi bi-star-fill me-1"></i>
            {message}
          </h5>
          {reason && (
            <p className="text-muted mb-0 small">{reason}</p>
          )}
        </div>

        {/* Food Card */}
        <div className={`food-card-container ${showAnimation ? 'reveal' : ''}`}>
          <Card className="border-0 shadow-sm">
            <div className="row g-0">
              {/* Food Image */}
              <div className="col-md-5">
                <div className="food-image-container">
                  <img
                    src={food.image}
                    alt={food.name}
                    className={`food-image ${imageLoaded ? 'loaded' : ''}`}
                    onLoad={handleImageLoad}
                  />
                  {!imageLoaded && (
                    <div className="image-placeholder">
                      <Spinner animation="border" size="sm" />
                    </div>
                  )}
                  
                  {/* Food Badges */}
                  <div className="food-badges">
                    <Badge bg="success" className="me-2">
                      <i className="bi bi-star-fill me-1"></i>
                      {food.rating}
                    </Badge>
                    {food.isVeg ? (
                      <Badge bg="success">Vegetarian</Badge>
                    ) : (
                      <Badge bg="danger">Non-Vegetarian</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Food Details */}
              <div className="col-md-7">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h3 className="food-name mb-0">{food.name}</h3>
                    <div className="text-end">
                      <div className="food-price h4 text-primary mb-1">
                        ${food.price}
                      </div>
                      <small className="text-muted">Price</small>
                    </div>
                  </div>

                  <p className="food-description text-muted mb-4">
                    {food.description}
                  </p>

                  {/* Restaurant Info */}
                  <div className="restaurant-info mb-4">
                    <h6 className="mb-3">
                      <i className="bi bi-shop me-2"></i>
                      {food.restaurant?.name || 'Restaurant'}
                    </h6>
                    
                    <Row className="g-3">
                      <Col sm={6}>
                        <div className="info-item">
                          <small className="text-muted d-block">Cuisine</small>
                          <span className="fw-semibold">{food.restaurant?.cuisine || 'N/A'}</span>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="info-item">
                          <small className="text-muted d-block">Category</small>
                          <span className="fw-semibold text-capitalize">{food.category}</span>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="info-item">
                          <small className="text-muted d-block">Rating</small>
                          {getRatingStars(food.rating)}
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="info-item">
                          <small className="text-muted d-block">Prep Time</small>
                          <span className="fw-semibold">
                            <i className="bi bi-clock me-1"></i>
                            {food.preparationTime || 20} mins
                          </span>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Delivery Info */}
                  {food.restaurant?.deliveryTime && (
                    <div className="delivery-info mb-4">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-truck me-2"></i>
                        <span className="me-2">Delivery Time:</span>
                        <Badge 
                          bg={getDeliveryTimeColor(food.restaurant.deliveryTime)}
                          className="fs-6"
                        >
                          {food.restaurant.deliveryTime}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {food.tags && food.tags.length > 0 && (
                    <div className="food-tags mb-4">
                      <small className="text-muted d-block mb-2">Tags:</small>
                      <div className="d-flex flex-wrap gap-1">
                        {food.tags.map((tag, index) => (
                          <Badge key={index} bg="light" text="dark" className="me-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </div>
            </div>
          </Card>
        </div>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <div className="d-flex flex-wrap gap-2 w-100">
          <Button 
            variant="outline-secondary" 
            onClick={onTryAgain}
            className="flex-fill"
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Try Again
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={handleViewMenu}
            className="flex-fill"
          >
            <i className="bi bi-menu-button-wide me-2"></i>
            View Menu
          </Button>
          <Button 
            variant="success" 
            onClick={handleOrderNow}
            className="flex-fill"
          >
            <i className="bi bi-cart-plus me-2"></i>
            Order Now
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default SurpriseResultModal;
