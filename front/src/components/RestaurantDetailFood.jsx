import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, ListGroup, Nav } from 'react-bootstrap';
import { parsePrice, calculateCartTotal } from '../../utils/priceUtils';
import './RestaurantDetailFood.css';

const RestaurantDetailFood = ({ restaurant, onBack, onAddToCart, cart }) => {
  const [activeTab, setActiveTab] = useState('menu');
  const [showCart, setShowCart] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [cartItems, setCartItems] = useState(cart || []);

  const addToCart = (item) => {
    const existingItemIndex = cartItems.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex >= 0) {
      const newCart = [...cartItems];
      newCart[existingItemIndex].quantity = (newCart[existingItemIndex].quantity || 1) + 1;
      setCartItems(newCart);
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
    }
    
    if (onAddToCart) {
      onAddToCart(item);
    }
  };

  const removeFromCart = (index) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    setCartItems(newCart);
  };

  const viewFoodDetails = (item) => {
    setSelectedFood(item);
  };

  const closeFoodDetails = () => {
    setSelectedFood(null);
  };

  // Calculate cart total using utility function
  const cartTotal = calculateCartTotal(cartItems);

  // Enhanced menu items with categories and related foods
  const menuItems = [
    {
      id: 1,
      name: "Masala Dosa",
      description: "Crispy crepe filled with spiced potato filling, served with sambar and chutney",
      price: "₹90",
      category: "veg",
      tags: ["breakfast", "popular"],
      image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400",
      related: [2, 5] // Ids of related items
    },
    {
      id: 2,
      name: "Idli Vada",
      description: "Soft steamed rice cakes with crispy lentil donuts, served with sambar and coconut chutney",
      price: "₹80",
      category: "veg",
      tags: ["breakfast"],
      image: "https://images.unsplash.com/photo-1666075115378-3ffc76b48ff7?w=400",
      related: [1, 5]
    },
    {
      id: 3,
      name: "Chettinad Chicken",
      description: "Spicy chicken curry from the Chettinad region with aromatic spices",
      price: "₹220",
      category: "non-veg",
      tags: ["main course", "spicy"],
      image: "https://images.unsplash.com/photo-1632877943287-64636ca57b7e?w=400",
      related: [4, 6]
    },
    {
      id: 4,
      name: "Vegetable Biryani",
      description: "Fragrant basmati rice cooked with mixed vegetables and authentic spices",
      price: "₹180",
      category: "veg",
      tags: ["main course", "rice"],
      image: "https://images.unsplash.com/photo-1633945274309-2c16c9682a8c?w=400",
      related: [3, 6]
    },
    {
      id: 5,
      name: "Filter Coffee",
      description: "Traditional South Indian filter coffee made with decoction and frothed milk",
      price: "₹40",
      category: "veg",
      tags: ["beverage"],
      image: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400",
      related: [1, 2]
    },
    {
      id: 6,
      name: "Gulab Jamun",
      description: "Sweet milk-solid balls in rose-flavored sugar syrup, served warm",
      price: "₹60",
      category: "veg",
      tags: ["dessert"],
      image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400",
      related: [3, 4]
    },
    {
      id: 7,
      name: "Fish Curry",
      description: "Traditional Tamil Nadu fish curry with tamarind and spices",
      price: "₹250",
      category: "seafood",
      tags: ["main course", "spicy"],
      image: "https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=400",
      related: [3, 8]
    },
    {
      id: 8,
      name: "Prawn Fry",
      description: "Crispy fried prawns with traditional Tamil spices",
      price: "₹280",
      category: "seafood",
      tags: ["starter"],
      image: "https://images.unsplash.com/photo-1611599537845-1c7a0091a6e9?w=400",
      related: [3, 7]
    }
  ];

  // Filter menu items by category
  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  // Get related foods for the selected food item
  const relatedFoods = selectedFood 
    ? menuItems.filter(item => selectedFood.related.includes(item.id))
    : [];

  if (!restaurant) {
    return (
      <Container className="py-5 text-center">
        <h2 className="mb-4">Restaurant not found</h2>
        <Button variant="danger" onClick={onBack}>
          Back to Restaurants
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Cart Modal */}
      <Modal show={showCart} onHide={() => setShowCart(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Your Cart</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cartItems.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <>
              <ListGroup variant="flush">
                {cartItems.map((item, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-0">{item.name}</h6>
                      <small>{item.price}</small>
                    </div>
                    <Button variant="outline-danger" size="sm" onClick={() => removeFromCart(index)}>
                      <i className="bi bi-trash"></i>
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <div className="d-flex justify-content-between mt-3">
                <h5>Total:</h5>
                <h5>₹{cartTotal}</h5>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCart(false)}>
            Continue Shopping
          </Button>
          <Button variant="danger" disabled={cartItems.length === 0}>
            Checkout
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button variant="outline-danger" onClick={onBack}>
          <i className="bi bi-arrow-left me-2"></i>Back to Restaurants
        </Button>
        
        <Button variant="danger" onClick={() => setShowCart(true)}>
          <i className="bi bi-cart me-2"></i>
          Cart {cartItems.length > 0 && <Badge bg="light" text="dark">{cartItems.length}</Badge>}
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Img 
          variant="top" 
          src={restaurant.image} 
          style={{ height: '300px', objectFit: 'cover' }}
        />
        
        <Card.Body>
          <Card.Title className="display-6">{restaurant.name}</Card.Title>
          <Card.Text className="text-muted">
            {restaurant.cuisine} • {restaurant.location}
          </Card.Text>
          
          <div className="d-flex align-items-center mb-4">
            <div className="d-flex align-items-center me-4">
              <i className="bi bi-star-fill text-warning me-1"></i>
              <span className="fw-semibold">{restaurant.rating}</span>
            </div>
            <span className="text-muted me-4">{restaurant.deliveryTime}</span>
            <span className="text-muted">{restaurant.costForTwo}</span>
          </div>

          <Nav variant="tabs" defaultActiveKey="menu">
            <Nav.Item>
              <Nav.Link eventKey="menu" onClick={() => setActiveTab('menu')}>
                Menu
              </Nav.Link>
            </Nav.Item>
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
          {/* Category Filter */}
          <div className="mb-4">
            <Form>
              <Form.Label>Filter Food by Category:</Form.Label>
              <div>
                {['all', 'veg', 'non-veg', 'seafood'].map(category => (
                  <Form.Check
                    inline
                    key={category}
                    type="radio"
                    name="foodCategoryFilter"
                    label={category.charAt(0).toUpperCase() + category.slice(1)}
                    checked={selectedCategory === category}
                    onChange={() => setSelectedCategory(category)}
                  />
                ))}
              </div>
            </Form>
          </div>

          {/* Food Details View */}
          {selectedFood ? (
            <Card className="mb-4">
              <Card.Body>
                <Button variant="outline-secondary" onClick={closeFoodDetails} className="mb-3">
                  <i className="bi bi-arrow-left me-1"></i> Back to Menu
                </Button>
                
                <Row>
                  <Col md={4}>
                    <img 
                      src={selectedFood.image} 
                      alt={selectedFood.name}
                      className="img-fluid rounded"
                    />
                  </Col>
                  <Col md={8}>
                    <h3>{selectedFood.name}</h3>
                    <p>{selectedFood.description}</p>
                    <h4 className="text-danger">{selectedFood.price}</h4>
                    
                    <div className="mb-3">
                      <Badge bg="secondary" className="me-2">
                        {selectedFood.category}
                      </Badge>
                      {selectedFood.tags.map(tag => (
                        <Badge bg="light" text="dark" key={tag} className="me-2">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button 
                      variant="danger" 
                      onClick={() => addToCart(selectedFood)}
                    >
                      Add to Cart
                    </Button>
                  </Col>
                </Row>
                
                {/* Related Foods */}
                {relatedFoods.length > 0 && (
                  <div className="mt-4">
                    <h5>You might also like:</h5>
                    <Row>
                      {relatedFoods.map(item => (
                        <Col md={6} key={item.id}>
                          <Card className="mb-3">
                            <Card.Body className="d-flex">
                              <img 
                                src={item.image} 
                                alt={item.name}
                                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                className="rounded me-3"
                              />
                              <div className="flex-grow-1">
                                <h6 className="mb-0">{item.name}</h6>
                                <small className="text-muted">{item.price}</small>
                              </div>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => viewFoodDetails(item)}
                              >
                                View
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </Card.Body>
            </Card>
          ) : (
            /* Menu Items List */
            <Row>
              {filteredMenuItems.map(item => (
                <Col md={6} key={item.id} className="mb-3">
                  <Card>
                    <Card.Body className="d-flex">
                      <div className="flex-grow-1">
                        <Card.Title>{item.name}</Card.Title>
                        <Card.Text className="text-muted">{item.description}</Card.Text>
                        <Card.Text className="text-danger fw-bold">{item.price}</Card.Text>
                        <div>
                          <Badge bg="secondary" className="me-2">
                            {item.category}
                          </Badge>
                          {item.tags.map(tag => (
                            <Badge bg="light" text="dark" key={tag} className="me-1">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    {/*  <div className="ms-3">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                          className="rounded mb-2"
                        />
                        <div className="d-flex flex-column">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            className="mb-2"
                            onClick={() => viewFoodDetails(item)}
                          >
                            Details
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => addToCart(item)}
                          >
                            Add
                          </Button>
                        </div>
                      </div>*/}
                      // In the RestaurantDetail component, modify the button section:
<div className="ms-3">
  <img 
    src={item.image} 
    alt={item.name} 
    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
    className="rounded mb-2"
  />
  <div className="d-flex flex-column">
    <Button 
      variant="outline-primary" 
      size="sm"
      className="mb-2"
      onClick={() => navigate(`/food/${item.id}`)}
    >
      Details
    </Button>
    <Button 
      variant="danger" 
      size="sm"
      onClick={() => handleAddToCart(item)}
    >
      Add
    </Button>
  </div>
</div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
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
        <Card>
          <Card.Body>
            <h4>Customer Reviews</h4>
            
            <div className="border-bottom pb-3 mb-3">
              <div className="d-flex align-items-center mb-2">
                <div className="bg-secondary rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <span className="text-white">RK</span>
                </div>
                <div>
                  <h6 className="mb-0">Ramesh Kumar</h6>
                  <div className="d-flex text-warning">
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-half"></i>
                    <span className="text-dark ms-2">4.5</span>
                  </div>
                </div>
              </div>
              <p className="mb-0">The Masala Dosa here is authentic and crispy. Service was quick even during peak hours.</p>
              <small className="text-muted">Posted 2 weeks ago</small>
            </div>
            
            <div className="border-bottom pb-3 mb-3">
              <div className="d-flex align-items-center mb-2">
                <div className="bg-secondary rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <span className="text-white">PS</span>
                </div>
                <div>
                  <h6 className="mb-0">Priya S</h6>
                  <div className="d-flex text-warning">
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <span className="text-dark ms-2">5.0</span>
                  </div>
                </div>
              </div>
              <p className="mb-0">Best Chettinad Chicken in town! Spice level was perfect and the flavors were amazing.</p>
              <small className="text-muted">Posted 1 month ago</small>
            </div>
            
            <div className="pb-3">
              <div className="d-flex align-items-center mb-2">
                <div className="bg-secondary rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <span className="text-white">MK</span>
                </div>
                <div>
                  <h6 className="mb-0">Mohan K</h6>
                  <div className="d-flex text-warning">
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star-fill"></i>
                    <i className="bi bi-star"></i>
                    <span className="text-dark ms-2">4.0</span>
                  </div>
                </div>
              </div>
              <p className="mb-0">Good food but a bit pricey. The Filter Coffee is a must-try though!</p>
              <small className="text-muted">Posted 3 days ago</small>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default RestaurantDetailFood;