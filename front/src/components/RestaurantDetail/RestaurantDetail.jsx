import { resolvePublicImage } from '../../utils/imageUtils';
// src/components/RestaurantDetail/RestaurantDetail.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { groupMenuItemsByCategory } from '../../data/menuItems';
import { apiConfig } from '../../utils/apiConfig';
import { parsePrice, calculateCartTotal } from '../../utils/priceUtils';
import { reviewsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import ReviewForm from '../ReviewForm/ReviewForm';
import ReviewList from '../ReviewList/ReviewList';
import ComboCard from '../ComboCard/ComboCard';
import './RestaurantDetail.css';

// Feature flag controlled via env: VITE_SHOW_COMBOS_IN_RESTAURANT (default: true)
const SHOW_COMBOS_IN_RESTAURANT = String(import.meta.env.VITE_SHOW_COMBOS_IN_RESTAURANT ?? 'true') === 'true';

const RestaurantDetail = ({ restaurant, onBack, onAddToCart, cart }) => {
  const [activeTab, setActiveTab] = useState('menu');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id: routeId } = useParams();

  if (!restaurant) {
    return (
      <Container className="py-5 text-center">
        <h2 className="mb-4">Restaurant not found</h2>
        <Button variant="danger" onClick={onBack}>
          Back to Home
        </Button>
      </Container>
    );
  }

  // Load menu items for this restaurant from API
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [combos, setCombos] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(true);
  const [comboError, setComboError] = useState('');

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoadingMenu(true);
        setMenuError('');
        const url = `${apiConfig.endpoints.foods}?restaurantId=${restaurant._id || restaurant.id}`;
        console.log('Loading menu from:', url);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Menu data received:', data);
        setMenuItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error loading menu:', e);
        setMenuError(e.message || 'Failed to load menu');
        setMenuItems([]);
      } finally {
        setLoadingMenu(false);
      }
    };
    if (restaurant) loadMenu();
  }, [restaurant]);

  // Load combos for this restaurant (disabled via flag below)
  useEffect(() => {
    const loadCombos = async () => {
      try {
        setLoadingCombos(true);
        setComboError('');
        const restaurantId = restaurant._id || restaurant.id;
        console.log('Restaurant object:', restaurant);
        console.log('Restaurant ID being used:', restaurantId);
        const url = `${apiConfig.endpoints.combos}?restaurantId=${restaurantId}`;
        console.log('Loading combos from:', url);
        const response = await fetch(url);
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Combo data received:', data);
        console.log('Number of combos found:', data.length);
        setCombos(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error loading combos:', e);
        setComboError(e.message || 'Failed to load combos');
        setCombos([]);
      } finally {
        setLoadingCombos(false);
      }
    };
    if (restaurant && SHOW_COMBOS_IN_RESTAURANT) loadCombos();
  }, [restaurant]);

  const menuByCategory = groupMenuItemsByCategory(menuItems);

  // Load reviews when reviews tab is active
  useEffect(() => {
    if (activeTab === 'reviews') {
      loadReviews();
    }
  }, [activeTab, restaurant.id]);

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      console.log('Loading reviews for restaurant:', restaurant._id || restaurant.id);
      const reviewsData = await reviewsAPI.getRestaurantReviews(restaurant._id || restaurant.id);
      console.log('Reviews data received:', reviewsData);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleAddToCart = (item) => {
    onAddToCart(item);
  };

  const handleAddComboToCart = (combo) => {
    // Add each item in the combo to cart
    combo.items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        onAddToCart({
          ...item,
          _id: item.foodId,
          name: item.name,
          price: item.price,
          restaurantId: combo.restaurantId,
          restaurantName: combo.restaurantId?.name
        });
      }
    });
  };

  const handleViewCart = () => {
    navigate('/cart');
  };

  const calculateTotal = () => {
    return calculateCartTotal(cart);
  };

  const cartItemCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);

  const handleWriteReview = () => {
    setEditingReview(null);
    setShowReviewModal(true);
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      console.log('Restaurant id candidates:', restaurant?._id, restaurant?.id, restaurant?.restaurantId, routeId);
      const restId = String(restaurant._id || restaurant.id || restaurant.restaurantId || routeId || '');
      if (!restId) {
        throw new Error('Could not determine restaurant ID. Please reload the page and try again.');
      }
      const payload = {
        rating: Number(reviewData.rating),
        comment: reviewData.comment,
        reviewType: 'restaurant',
        restaurantId: restId,
        restaurant: restId,
        restaurantID: restId,
      };
      console.log('Submitting review:', payload);
      if (editingReview) {
        await reviewsAPI.updateReview(editingReview._id, payload);
      } else {
        await reviewsAPI.createReview(payload);
      }
      
      setShowReviewModal(false);
      setEditingReview(null);
      loadReviews(); // Reload reviews
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewsAPI.deleteReview(reviewId);
      loadReviews(); // Reload reviews
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  // Calculate rating statistics
  const ratingStats = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = (sum / total).toFixed(1);

    const distribution = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    const percentages = Object.keys(distribution).reduce((acc, rating) => {
      acc[rating] = total > 0 ? Math.round((distribution[rating] / total) * 100) : 0;
      return acc;
    }, {});

    return { average, total, distribution, percentages };
  }, [reviews]);

  // Render stars component
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

  return (
    <Container className="py-4">
      <Button variant="outline-danger" onClick={onBack} className="mb-4">
        <i className="bi bi-arrow-left me-2"></i>Back to Restaurants
      </Button>

      {/* Restaurant Header Card */}
      <Card className="mb-4">
        <Card.Img 
          variant="top" 
          src={resolvePublicImage(restaurant.image, '/images/placeholder.svg')} 
          style={{ height: '300px', objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.src = resolvePublicImage('/images/placeholder.svg'); }}
        />
        
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <Card.Title className="display-6">{restaurant.name}</Card.Title>
              <Card.Text className="text-muted">
                {restaurant.cuisine} • {restaurant.location}
              </Card.Text>
            </div>
            <FavoriteButton
              itemId={restaurant._id || restaurant.id}
              itemType="restaurant"
              itemData={restaurant}
              size="lg"
              className="ms-3"
            />
          </div>
          
          <div className="d-flex align-items-center mb-4">
            <div className="d-flex align-items-center me-4">
              <div className="d-flex align-items-center me-2">
                {renderStars(parseFloat(restaurant.rating), 'md')}
              </div>
              <div className="rating-info">
                <span className="fw-bold fs-5">{restaurant.rating}</span>
                <span className="text-muted ms-1">({ratingStats.total} reviews)</span>
              </div>
            </div>
            <div className="vr me-4"></div>
            <div className="d-flex align-items-center me-4">
              <i className="bi bi-clock text-muted me-1"></i>
              <span className="text-muted">{restaurant.deliveryTime}</span>
            </div>
            <div className="d-flex align-items-center">
              <i className="bi bi-currency-rupee text-muted me-1"></i>
            <span className="text-muted">{restaurant.costForTwo}</span>
            </div>
            <div className="d-flex align-items-center ms-4">
              <Badge 
                bg={restaurant.isOpen ? 'success' : 'danger'}
                className="d-flex align-items-center"
              >
                <i className={`bi ${restaurant.isOpen ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </Badge>
            </div>
          </div>

          <Nav variant="tabs" defaultActiveKey="menu">
            <Nav.Item>
              <Nav.Link eventKey="menu" onClick={() => setActiveTab('menu')}>
                Menu
              </Nav.Link>
            </Nav.Item>
            {SHOW_COMBOS_IN_RESTAURANT && (
              <Nav.Item>
                <Nav.Link eventKey="combos" onClick={() => setActiveTab('combos')}>
                  <i className="bi bi-gift me-1"></i>
                  Special Offers
                </Nav.Link>
              </Nav.Item>
            )}
            <Nav.Item>
              <Nav.Link eventKey="info" onClick={() => setActiveTab('info')}>
                Info
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="reviews" onClick={() => setActiveTab('reviews')}>
                Reviews
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Body>
      </Card>

      {activeTab === 'menu' && (
        <div>
          {loadingMenu && (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status"><span className="visually-hidden">Loading...</span></div>
              <p className="mt-3">Loading menu...</p>
            </div>
          )}
          {menuError && (
            <div className="alert alert-danger">{menuError}</div>
          )}
          {!loadingMenu && !menuError && menuItems.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-egg-fried display-1 text-muted"></i>
              <h4 className="mt-3 text-muted">No menu items available</h4>
              <p className="text-muted">This restaurant hasn't added any food items yet.</p>
            </div>
          )}
          {!loadingMenu && !menuError && menuItems.length > 0 && Object.entries(menuByCategory).map(([category, items]) => (
            <Card key={category} className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">
                    <i className="bi bi-egg-fried me-2"></i>
                    {category}
                  </h4>
                  <Badge bg="light" text="dark" className="fs-6">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <Row>
                  {items.map((item) => (
                    <Col key={item._id || item.id} md={6} lg={4} className="mb-4">
                      <Card className="h-100 food-item-card border-0 shadow-sm">
                        <div className="position-relative">
                        <Card.Img 
                          variant="top" 
                          src={resolvePublicImage(item.image, '/images/placeholder.svg')}
                          style={{ height: '200px', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.src = resolvePublicImage('/images/placeholder.svg'); }}
                        />
                          <div className="position-absolute top-0 end-0 m-2">
                            <FavoriteButton
                              itemId={item._id || item.id}
                              itemType="food"
                              itemData={item}
                              size="sm"
                            />
                          </div>
                          <div className="position-absolute top-0 start-0 m-2">
                            <Badge bg={item.isVeg ? 'success' : 'danger'} className="shadow">
                              {item.isVeg ? 'VEG' : 'NON-VEG'}
                            </Badge>
                          </div>
                        </div>
                        <Card.Body className="d-flex flex-column p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Card.Title className="h6 mb-0 text-dark fw-bold">
                              {item.name}
                            </Card.Title>
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
                          
                          <Card.Text className="text-muted small flex-grow-1 mb-3">
                            {item.description}
                          </Card.Text>
                          
                          <div className="mt-auto">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <span className="text-danger fw-bold fs-5">
                                {typeof item.price === 'number' ? `₹${item.price}` : item.price}
                              </span>
                              {item.tags && item.tags.length > 0 && (
                                <div className="d-flex gap-1">
                                  {item.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} bg="secondary" className="small">
                                      {tag}
                              </Badge>
                                  ))}
                                </div>
                              )}
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
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {SHOW_COMBOS_IN_RESTAURANT && activeTab === 'combos' && (
        <div>
          {loadingCombos && (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status"><span className="visually-hidden">Loading...</span></div>
              <p className="mt-3">Loading combo offers...</p>
            </div>
          )}
          {comboError && (
            <div className="alert alert-danger">{comboError}</div>
          )}
          {!loadingCombos && !comboError && combos.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-gift display-1 text-muted"></i>
              <h4 className="mt-3 text-muted">No combo offers available</h4>
              <p className="text-muted">This restaurant hasn't created any combo offers yet.</p>
            </div>
          )}
          {!loadingCombos && !comboError && combos.length > 0 && (
            <div>
              <div className="mb-4">
                <h4 className="text-primary">
                  <i className="bi bi-gift me-2"></i>
                  Special Combo Offers
                </h4>
                <p className="text-muted">Great deals on meal combinations</p>
              </div>
              <Row>
                {combos.map((combo) => (
                  <Col key={combo._id} md={6} lg={4} className="mb-4">
                    <ComboCard
                      combo={combo}
                      onAddToCart={handleAddComboToCart}
                      onViewDetails={(combo) => {
                        // You can implement a combo details modal here
                        console.log('View combo details:', combo);
                      }}
                    />
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </div>
      )}

      {activeTab === 'info' && (
        <Card>
          <Card.Body>
            <h4>Restaurant Information</h4>
            <Row>
              <Col md={6}>
                <h5>Hours</h5>
                <p>Monday - Friday: 8:00 AM - 10:00 PM</p>
                <p>Saturday - Sunday: 8:00 AM - 11:00 PM</p>
              </Col>
              <Col md={6}>
                <h5>Address</h5>
                <p>123 Restaurant Street</p>
                <p>{restaurant.location}, Tamil Nadu</p>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <h5>Contact</h5>
                <p>Phone: +91 9876543210</p>
                <p>Email: info@{restaurant.name.toLowerCase().replace(/\s+/g, '')}.com</p>
              </Col>
              <Col md={6}>
                <h5>Facilities</h5>
                <p>Home Delivery • Dine-in • Takeaway</p>
                <p>Air Conditioned • Family Section</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {activeTab === 'reviews' && (
        <div>
          {/* Rating Summary Card */}
          <Card className="mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Customer Reviews</h4>
              {user && (
                  <Button variant="danger" onClick={handleWriteReview} className="rounded-pill">
                  <i className="bi bi-star me-2"></i>
                  Write Review
                </Button>
              )}
            </div>
            
              <Row>
                <Col md={4}>
                  <div className="text-center">
                    <div className="display-4 fw-bold text-warning mb-2">
                      {ratingStats.average}
                    </div>
                    <div className="d-flex justify-content-center mb-2">
                      {renderStars(parseFloat(ratingStats.average), 'lg')}
                    </div>
                    <p className="text-muted mb-0">
                      Based on {ratingStats.total} review{ratingStats.total !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Col>
                
                <Col md={8}>
                  <div className="rating-distribution">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="d-flex align-items-center mb-2">
                        <div className="d-flex align-items-center me-2" style={{ width: '60px' }}>
                          <span className="small fw-semibold">{star}</span>
                          <i className="bi bi-star-fill text-warning ms-1"></i>
                        </div>
                        <ProgressBar
                          now={ratingStats.percentages[star]}
                          variant="warning"
                          className="flex-grow-1 me-2"
                          style={{ height: '8px' }}
                        />
                        <span className="small text-muted" style={{ width: '40px' }}>
                          {ratingStats.percentages[star]}%
                        </span>
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Reviews List */}
          <Card>
            <Card.Body>
            {loadingReviews ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading reviews...</p>
              </div>
            ) : (
              <ReviewList
                reviews={reviews}
                onEditReview={handleEditReview}
                onDeleteReview={handleDeleteReview}
                showActions={true}
              />
            )}
          </Card.Body>
        </Card>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed-bottom bg-white shadow-lg p-3 border-top">
          <Container>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-semibold">{cartItemCount} items</span>
                <span className="text-danger fw-bold ms-2">
                  ₹{calculateTotal()}
                </span>
              </div>
              <Button variant="danger" className="rounded-pill" onClick={handleViewCart}>
                View Cart
              </Button>
            </div>
          </Container>
        </div>
      )}

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingReview ? 'Edit Review' : 'Write a Review'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ReviewForm
            itemId={restaurant._id || restaurant.id}
            itemType="restaurant"
            onSubmit={handleSubmitReview}
            onCancel={() => setShowReviewModal(false)}
            existingReview={editingReview}
            isEditing={!!editingReview}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default RestaurantDetail;