import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { foodAPI, restaurantAPI } from '../utils/api';
import FavoriteButton from '../components/FavoriteButton/FavoriteButton';
import Checkout from '../components/Checkout/Checkout';
import './FoodPage.css';
import { resolvePublicImage } from '../utils/imageUtils';
 

const FoodPage = ({ onAddToCart, cart }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addToCartSuccess, setAddToCartSuccess] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Data states
  const [allFoods, setAllFoods] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('all');
  const [isVeg, setIsVeg] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [foodTypeFilter, setFoodTypeFilter] = useState('all');

  // Load data from backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [foods, restaurants] = await Promise.all([
        foodAPI.getAll(),
        restaurantAPI.getAll()
      ]);
      
      setAllFoods(foods);
      setAllRestaurants(restaurants);
    } catch (error) {
      setError('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories, food types, and restaurants for filters
  const uniqueCategories = useMemo(() => {
    const categories = [...new Set(allFoods.map(food => food.category).filter(Boolean))];
    return categories.sort();
  }, [allFoods]);

  const uniqueFoodTypes = useMemo(() => {
    const types = [...new Set(allFoods.map(food => food.foodType).filter(Boolean))];
    return types.sort();
  }, [allFoods]);

  const uniqueRestaurants = useMemo(() => {
    const restaurants = [...new Set(allFoods.map(food => food.restaurantName).filter(Boolean))];
    return restaurants.sort();
  }, [allFoods]);

  // Filter and search foods
  const filteredFoods = useMemo(() => {
    let filtered = [...allFoods];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(food => 
        food.name.toLowerCase().includes(query) ||
        food.restaurantName.toLowerCase().includes(query) ||
        food.description.toLowerCase().includes(query) ||
        (Array.isArray(food.tags) && food.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    if (category !== 'all') {
      filtered = filtered.filter(food => food.category === category);
    }

    if (isVeg !== 'all') {
      const isVegBool = isVeg === 'true';
      filtered = filtered.filter(food => food.isVeg === isVegBool);
    }

    if (restaurantFilter !== 'all') {
      filtered = filtered.filter(food => food.restaurantName === restaurantFilter);
    }

    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter(food => (food.rating || 0) >= minRating);
    }

    if (foodTypeFilter !== 'all') {
      filtered = filtered.filter(food => food.foodType === foodTypeFilter);
    }

    if (priceRange.min !== '') {
      const minPrice = parseFloat(priceRange.min);
      filtered = filtered.filter(food => food.price >= minPrice);
    }

    if (priceRange.max !== '') {
      const maxPrice = parseFloat(priceRange.max);
      filtered = filtered.filter(food => food.price <= maxPrice);
    }

    // Sort foods
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'restaurant':
        filtered.sort((a, b) => a.restaurantName.localeCompare(b.restaurantName));
        break;
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [allFoods, searchQuery, category, isVeg, restaurantFilter, ratingFilter, foodTypeFilter, priceRange, sortBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (category !== 'all') params.set('category', category);
    if (isVeg !== 'all') params.set('isVeg', isVeg);
    if (restaurantFilter !== 'all') params.set('restaurant', restaurantFilter);
    if (ratingFilter !== 'all') params.set('rating', ratingFilter);
    if (foodTypeFilter !== 'all') params.set('foodType', foodTypeFilter);
    if (priceRange.min) params.set('minPrice', priceRange.min);
    if (priceRange.max) params.set('maxPrice', priceRange.max);
    if (sortBy !== 'name') params.set('sort', sortBy);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategory('all');
    setIsVeg('all');
    setSortBy('name');
    setPriceRange({ min: '', max: '' });
    setRestaurantFilter('all');
    setRatingFilter('all');
    setFoodTypeFilter('all');
    setSearchParams({});
  };

  const handleFoodClick = (food) => {
    navigate(`/food/${food._id}`);
  };

  // Unified image resolver: handles base64, backend uploads, public assets
  const resolveImageSrc = (img) => resolvePublicImage(img, '/images/placeholder.svg');

  const handlePayNow = (item) => {
    if (!user) {
      alert('Please login to proceed with payment');
      return;
    }
    setSelectedItem(item);
    setShowCheckout(true);
  };

  const handleOrderSuccess = (orderId, paymentId) => {
    alert(`Order placed successfully! Order ID: ${orderId}, Payment ID: ${paymentId}`);
    onAddToCart(selectedItem);
    setShowCheckout(false);
    setSelectedItem(null);
    // Navigate to order confirmation or dashboard
    navigate('/dashboard');
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" size="lg" />
        <p className="mt-3">Loading delicious foods...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          <h4>Error Loading Data</h4>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadData}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="food-page-container">
      <Container className="py-4">
        {/* Hero Section - Matching Home Page Theme */}
        <Row className="mb-5">
          <Col className="text-center">
            <div className="hero-section bg-danger bg-gradient text-white py-5 rounded-4 shadow">
              <h1 className="display-4 fw-bold mb-3">
                Explore Our Food Menu
              </h1>
              <p className="lead mb-0">
                Discover delicious dishes from the best restaurants
              </p>
            </div>
          </Col>
        </Row>

        {/* Success Alert for Add to Cart */}
        {addToCartSuccess && (
          <Row className="mb-4">
            <Col>
              <Alert variant="success" dismissible onClose={() => setAddToCartSuccess(null)}>
                <i className="bi bi-check-circle me-2"></i>
                {addToCartSuccess}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Search and Filter Panel */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body className="p-4">
            <Form onSubmit={handleSearch}>
              <Row>
                <Col lg={12} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">Search Foods</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by food name, restaurant, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-control-lg"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">Restaurant</Form.Label>
                    <Form.Select
                      value={restaurantFilter}
                      onChange={(e) => setRestaurantFilter(e.target.value)}
                    >
                      <option value="all">All Restaurants</option>
                      {uniqueRestaurants.map(restaurant => (
                        <option key={restaurant} value={restaurant}>{restaurant}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">Food Type</Form.Label>
                    <Form.Select
                      value={foodTypeFilter}
                      onChange={(e) => setFoodTypeFilter(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      {uniqueFoodTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">Category</Form.Label>
                    <Form.Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">Dietary</Form.Label>
                    <Form.Select
                      value={isVeg}
                      onChange={(e) => setIsVeg(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="true">Vegetarian</option>
                      <option value="false">Non-Vegetarian</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">Rating</Form.Label>
                    <Form.Select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value)}
                    >
                      <option value="all">All Ratings</option>
                      <option value="4.5">4.5+ Stars</option>
                      <option value="4.0">4.0+ Stars</option>
                      <option value="3.5">3.5+ Stars</option>
                      <option value="3.0">3.0+ Stars</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">Sort By</Form.Label>
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="name">Name</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Rating</option>
                      <option value="restaurant">Restaurant</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">Min Price</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      min="0"
                    />
                  </Form.Group>
                </Col>
                
                <Col md={3} className="mb-3">
                  <Form.Group>
                    <Form.Label className="fw-bold">Max Price</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      min="0"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col className="text-center">
                  <Button variant="danger" size="lg" type="submit" className="me-3 px-4 rounded-pill">
                    <i className="bi bi-search me-2"></i>
                    Search
                  </Button>
                  <Button variant="outline-secondary" size="lg" onClick={clearFilters} className="px-4 rounded-pill">
                    <i className="bi bi-x-circle me-2"></i>
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {/* Results Count */}
        <Row className="mb-4">
          <Col>
            <div className="results-count-badge">
              <span className="badge bg-danger fs-6 px-3 py-2">
                {filteredFoods.length} food item{filteredFoods.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </Col>
        </Row>

        {/* Food Items Grid */}
        {filteredFoods.length === 0 ? (
          <Row>
            <Col className="text-center py-5">
              <div className="no-results">
                <i className="bi bi-search display-1 text-muted"></i>
                <h4 className="mt-3">No food items found</h4>
                <p className="text-muted">Try adjusting your search criteria or filters</p>
              </div>
            </Col>
          </Row>
        ) : (
          <Row>
            {filteredFoods.map((food) => (
              <Col key={food._id} lg={4} md={6} className="mb-4">
                <Card className="h-100 food-card shadow-sm" onClick={() => handleFoodClick(food)} role="button">
                  <div 
                    className="position-relative" 
                    style={{ 
                      height: '200px', 
                      overflow: 'hidden',
                      backgroundImage: `url(${resolveImageSrc(food.image)}), url(${resolveImageSrc('/images/placeholder.svg')})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: '#eef1f3'
                    }}
                  >
                    <Card.Img
                      variant="top"
                      src={resolveImageSrc(food.image)}
                      alt={food.name}
                      className="food-image"
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      loading="lazy"
                      onClick={() => handleFoodClick(food)}
                      onError={(e) => {
                        // First fallback: public placeholder
                        const fallback = resolveImageSrc('/images/placeholder.svg');
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                          return;
                        }
                        // Second fallback: inline SVG (guaranteed to render)
                        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
                          <defs><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500');</style></defs>
                          <rect width='100%' height='100%' fill='#f8f9fa'/>
                          <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6c757d' font-size='22' font-family='Inter, Arial, sans-serif'>Image unavailable</text>
                        </svg>`;
                        e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
                      }}
                    />
                    <div className="position-absolute top-0 start-0 m-2">
                      <Badge bg={food.isVeg ? 'success' : 'danger'} className="veg-badge">
                        {food.isVeg ? 'Veg' : 'Non-Veg'}
                      </Badge>
                    </div>
                    <div className="position-absolute top-0 end-0 m-2">
                      <FavoriteButton
                        itemId={food._id}
                        itemType="food"
                        itemData={food}
                        size="sm"
                        enableLocalStorage={true}
                      />
                    </div>
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title 
                      className="h5 mb-2 food-title"
                      onClick={() => handleFoodClick(food)}
                      style={{ cursor: 'pointer' }}
                    >
                      {food.name}
                    </Card.Title>
                    
                    <Card.Text className="text-muted small mb-2 flex-grow-1">
                      {food.description}
                    </Card.Text>
                    
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-danger fw-bold fs-5">₹{food.price}</span>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-star-fill text-warning me-1"></i>
                        <span className="text-muted">{food.rating || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <Badge bg="secondary" className="category-badge">
                        {food.category}
                      </Badge>
                      <small className="text-muted">{food.restaurantName}</small>
                    </div>
                    
                    <div className="d-flex gap-2">
                      <Button 
                        variant="danger" 
                        className="flex-fill"
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(food); }}
                      >
                        <i className="bi bi-cart-plus me-2"></i>
                        Add to Cart
                      </Button>
                      
                      <Button 
                        variant="success" 
                        className="flex-fill"
                        onClick={(e) => { e.stopPropagation(); handlePayNow(food); }}
                      >
                        <i className="bi bi-credit-card me-2"></i>
                        Pay Now
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
                      </Row>
          )}
          
          {/* Checkout Modal */}
          {showCheckout && selectedItem && (
            <Checkout
              cart={[selectedItem]}
              onOrderSuccess={handleOrderSuccess}
              onClose={handleCloseCheckout}
              user={user}
            />
          )}
        </Container>
      </div>
    );
  };
  
  export default FoodPage;
