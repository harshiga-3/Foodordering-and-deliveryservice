// src/components/Cart/Cart.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Checkout from '../Checkout/Checkout';

const Cart = ({ cart, onUpdateCart, onBack, user }) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const navigate = useNavigate();

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = cart.map(item => {
      if (item._id === itemId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    onUpdateCart(updatedCart);
  };

  const handleRemoveItem = (itemId) => {
    const updatedCart = cart.filter(item => item._id !== itemId);
    onUpdateCart(updatedCart);
  };

  const handleCheckout = () => {
    if (user) {
      setShowCheckout(true);
    } else {
      navigate('/login');
    }
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
  };

  const handleOrderSuccess = (orderId) => {
    setShowCheckout(false);
    onUpdateCart([]);
    navigate(`/order-confirmation/${orderId}`);
  };

  // Calculate total price considering combo items
  const calculateItemPrice = (item) => {
    if (item.isCombo) {
      return item.comboPrice || item.price || 0;
    }
    return item.price || 0;
  };

  const total = cart.reduce((sum, item) => {
    const price = calculateItemPrice(item);
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (cart.length === 0) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="text-center p-5">
              <Card.Body>
                <div className="mb-4">
                  <i className="bi bi-cart-x display-1 text-muted"></i>
                </div>
                <h3>Your Cart is Empty</h3>
                <p className="text-muted mb-4">Add some delicious items to your cart and they will appear here.</p>
                <Button variant="primary" onClick={onBack}>
                  <i className="bi bi-arrow-left me-2"></i>
                  Continue Shopping
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <Button variant="outline-secondary" onClick={onBack} className="me-3">
          <i className="bi bi-arrow-left me-2"></i>
          Back
        </Button>
        <h2>Your Cart ({totalItems} items)</h2>
      </div>

      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Cart Items</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {cart.map((item, index) => {
                const price = calculateItemPrice(item);
                const quantity = item.quantity || 1;
                const itemTotal = price * quantity;
                // Create a unique key that includes item type and index to prevent duplicates
                const uniqueKey = item.isCombo 
                  ? `combo-${item._id}-${item.comboPrice}-${index}`
                  : `item-${item._id}`;

                return (
                  <ListGroup.Item key={uniqueKey} className="d-flex align-items-center py-3">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-2">
                        <h6 className="mb-0 me-2">{item.name}</h6>
                        {item.isCombo && (
                          <Badge bg="success" className="me-2">
                            <i className="bi bi-stars me-1"></i>
                            Combo Deal
                          </Badge>
                        )}
                        {item.isCombo && item.originalPrice && (
                          <small className="text-muted">
                            <del>₹{item.originalPrice}</del>
                            <Badge bg="danger" className="ms-2">
                              Save ₹{(item.originalPrice - item.comboPrice).toFixed(2)}
                            </Badge>
                          </small>
                        )}
                      </div>

                      {item.isCombo && item.items && (
                        <div className="mb-2">
                          <small className="text-muted">Includes:</small>
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {Array.isArray(item.items) ? (
                              item.items.map((comboItem, index) => (
                                <Badge key={index} bg="light" text="dark" className="small">
                                  {comboItem.name} x{comboItem.quantity}
                                </Badge>
                              ))
                            ) : (
                              <Badge bg="light" text="dark" className="small">
                                {item.items}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <span className="fw-bold text-success me-2">₹{price.toFixed(2)}</span>
                          <span className="text-muted">×</span>
                          <div className="d-flex align-items-center ms-2">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleQuantityChange(item._id, quantity - 1)}
                              disabled={quantity <= 1}
                            >
                              -
                            </Button>
                            <span className="mx-3">{quantity}</span>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleQuantityChange(item._id, quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="fw-bold me-3">₹{itemTotal.toFixed(2)}</span>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveItem(item._id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="sticky-top" style={{ top: '20px' }}>
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <span>Subtotal ({totalItems} items)</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              <div className="d-flex justify-content-between mb-3">
                <span>Delivery Fee</span>
                <span className="text-success">FREE</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-4">
                <strong>Total</strong>
                <strong>₹{total.toFixed(2)}</strong>
              </div>

              <Button
                variant="success"
                size="lg"
                className="w-100"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Proceed to Checkout
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Checkout Modal */}
      {showCheckout && (
        <Checkout
          cart={cart}
          onOrderSuccess={handleOrderSuccess}
          onClose={handleCloseCheckout}
          user={user}
        />
      )}
    </Container>
  );
};

export default Cart;
