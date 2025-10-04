import { resolvePublicImage } from '../utils/imageUtils';
// src/pages/FoodItem.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import { menuItems } from '../data/menuItems.js';
import FavoriteButton from '../components/FavoriteButton/FavoriteButton';
// import RazorpayPayment from '../components/RazorpayPayment'; // Payment integration disabled
// import { generateOrderId } from '../utils/paymentUtils';
import './FoodItem.css';

const FoodItem = ({ onAddToCart, cart, user }) => {
  const [searchParams] = useSearchParams();
  const [filteredItems, setFilteredItems] = useState([]);
  const [filters, setFilters] = useState({
    veg: false,
    nonVeg: false,
    desserts: false,
    beverages: false,
    snacks: false
  });
  // const [showPayment, setShowPayment] = useState(false); // Payment integration disabled
  const [selectedItem, setSelectedItem] = useState(null);
  // const [paymentLoading, setPaymentLoading] = useState(false);

  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    let items = menuItems;
    
    console.log('Initial menuItems:', items.length);
    console.log('Sample item:', items[0]);

    // Apply search filter
    if (searchQuery) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filters
    if (filters.veg) {
      items = items.filter(item => item.isVeg);
    }
    if (filters.nonVeg) {
      items = items.filter(item => !item.isVeg);
    }
    if (filters.desserts) {
      items = items.filter(item => 
        item.category.toLowerCase().includes('dessert') ||
        item.category.toLowerCase().includes('sweet')
      );
    }
    if (filters.beverages) {
      items = items.filter(item => 
        item.category.toLowerCase().includes('beverage') ||
        item.category.toLowerCase().includes('drink')
      );
    }
    if (filters.snacks) {
      items = items.filter(item => 
        item.category.toLowerCase().includes('snack') ||
        item.category.toLowerCase().includes('starter')
      );
    }

    console.log('Filtered items:', items.length);
    setFilteredItems(items);
  }, [searchQuery, filters]);

  const handleFilterChange = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const clearFilters = () => {
    setFilters({
      veg: false,
      nonVeg: false,
      desserts: false,
      beverages: false,
      snacks: false
    });
  };

  const handlePayNow = (item) => {
    if (!user) {
      alert('Please login to proceed');
      return;
    }
    setSelectedItem(item);
    // Payment flow disabled - save without payment
    alert('Payment coming soon. Your order has been saved without payment.');
  };

  // Payment integration handlers removed

  const getRandomOffer = () => {
    const offers = [
      "20% OFF",
      "Buy 1 Get 1 Free",
      "30% OFF",
      "Free Delivery",
      "50% OFF",
      "Special Discount"
    ];
    return offers[Math.floor(Math.random() * offers.length)];
  };

  console.log('Rendering FoodItem component');
  console.log('filteredItems:', filteredItems.length);
  console.log('user:', user);
  
  // Add a simple fallback to see if component renders
  if (!filteredItems || filteredItems.length === 0) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <h2>Food Items</h2>
          <p>Loading food items...</p>
          <p>Debug: menuItems count: {menuItems?.length || 0}</p>
          <p>Debug: filteredItems count: {filteredItems?.length || 0}</p>
          <p>Debug: searchQuery: {searchQuery}</p>
          <p>Debug: filters: {JSON.stringify(filters)}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        {/* Sidebar Filters */}
        <Col lg={3} md={4} className="mb-4">
          <Card className="filter-sidebar">
            <Card.Header>
              <h5 className="mb-0">Filters</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Food Type</Form.Label>
                  <div>
                    <Form.Check
                      type="checkbox"
                      id="veg-filter"
                      label="Vegetarian"
                      checked={filters.veg}
                      onChange={() => handleFilterChange('veg')}
                    />
                    <Form.Check
                      type="checkbox"
                      id="non-veg-filter"
                      label="Non-Vegetarian"
                      checked={filters.nonVeg}
                      onChange={() => handleFilterChange('nonVeg')}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Categories</Form.Label>
                  <div>
                    <Form.Check
                      type="checkbox"
                      id="desserts-filter"
                      label="Desserts"
                      checked={filters.desserts}
                      onChange={() => handleFilterChange('desserts')}
                    />
                    <Form.Check
                      type="checkbox"
                      id="beverages-filter"
                      label="Beverages"
                      checked={filters.beverages}
                      onChange={() => handleFilterChange('beverages')}
                    />
                    <Form.Check
                      type="checkbox"
                      id="snacks-filter"
                      label="Snacks"
                      checked={filters.snacks}
                      onChange={() => handleFilterChange('snacks')}
                    />
                  </div>
                </Form.Group>

                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={clearFilters}
                  className="w-100"
                >
                  Clear Filters
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col lg={9} md={8}>
          {/* Search Results Header */}
          <div className="mb-4">
            <h2>
              {searchQuery ? `Search Results for "${searchQuery}"` : 'All Food Items'}
            </h2>
            <p className="text-muted">
              {filteredItems.length} items found
            </p>
          </div>

          {/* Food Items Grid */}
          <Row>
            {filteredItems.map(item => (
              <Col lg={4} md={6} sm={6} key={item.id} className="mb-4">
                <Card className="food-item-card h-100">
                  <div className="position-relative">
                    <Card.Img
                      variant="top"
                      src={resolvePublicImage(item.image, '/images/placeholder.svg')}
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.src = resolvePublicImage('/images/placeholder.svg'); }}
                    />
                    
                                         {/* Favourite Button - Only visible on Food Items page */}
                     <FavoriteButton
                       itemId={item.id}
                       itemType="food"
                       itemData={item}
                       size="sm"
                       enableLocalStorage={true}
                     />
                    
                    {/* Offer Badge */}
                    <Badge 
                      bg="danger" 
                      className="position-absolute top-0 start-0 m-2"
                    >
                      {getRandomOffer()}
                    </Badge>

                    {/* Veg/Non-Veg Badge */}
                    <Badge 
                      bg={item.isVeg ? "success" : "danger"} 
                      className="position-absolute top-0 end-0 m-2"
                      style={{ top: '16px', right: '64px' }}
                    >
                      {item.isVeg ? "VEG" : "NON-VEG"}
                    </Badge>

                    {/* Rating Badge */}
                    <Badge 
                      bg="warning" 
                      text="dark" 
                      className="position-absolute bottom-0 start-0 m-2"
                    >
                      ⭐ {item.rating}
                    </Badge>
                  </div>

                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="h6 mb-2">{item.name}</Card.Title>
                    <Card.Text className="text-muted small flex-grow-1">
                      {item.description}
                    </Card.Text>
                    
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-danger fw-bold fs-5">{item.price}</span>
                        <small className="text-muted">{item.category}</small>
                      </div>
                      
                      <div className="d-flex gap-2">
                        <Button 
                          variant="danger" 
                          size="sm" 
                          className="flex-fill"
                          onClick={() => onAddToCart(item)}
                        >
                          <i className="bi bi-cart-plus me-2"></i>
                          Add to Cart
                        </Button>
                        
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="flex-fill"
                          onClick={() => handlePayNow(item)}
                          
                        >
                          <i className="bi bi-credit-card me-2"></i>
                          Order
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* No Results Message */}
          {filteredItems.length === 0 && (
            <div className="text-center py-5">
              <h4 className="text-muted">No food items found</h4>
              <p className="text-muted">Try adjusting your search or filters</p>
            </div>
          )}
        </Col>
      </Row>
      
      {/* Payment modal disabled */}
    </Container>
  );
};

export default FoodItem;
