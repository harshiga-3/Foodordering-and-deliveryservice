// src/components/CartPopup/CartPopup.jsx
import React from 'react';
import { Modal, Button, ListGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { parsePrice, calculateCartTotal } from '../../utils/priceUtils';
import './CartPopup.css';

const CartPopup = ({ show, onHide, cart, onUpdateCart }) => {
  const navigate = useNavigate();

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    const updatedCart = cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    onUpdateCart(updatedCart);
  };

  const removeItem = (itemId) => {
    const updatedCart = cart.filter(item => item.id !== itemId);
    onUpdateCart(updatedCart);
  };

  const calculateTotal = () => {
    return calculateCartTotal(cart);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const handleCheckout = () => {
    onHide();
    navigate('/cart');
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-cart3 me-2"></i>
          Your Cart ({getTotalItems()} items)
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {cart.length === 0 ? (
          <div className="text-center py-4">
            <i className="bi bi-cart-x display-1 text-muted"></i>
            <h5 className="mt-3 text-muted">Your cart is empty</h5>
            <p className="text-muted">Add some delicious food to get started!</p>
          </div>
        ) : (
          <>
            <ListGroup variant="flush">
              {cart.map((item, idx) => {
                const key = item.id || item._id || item.foodId || `${item.name || 'item'}-${idx}`;
                return (
                <ListGroup.Item key={key} className="cart-item">
                  <div className="d-flex align-items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="cart-item-image me-3"
                    />
                    
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{item.name}</h6>
                      <p className="text-muted small mb-1">{item.description}</p>
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="text-danger fw-bold">{item.price}</span>
                        <Badge bg={item.isVeg ? "success" : "danger"} className="me-2">
                          {item.isVeg ? "VEG" : "NON-VEG"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-center ms-3">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                        className="quantity-btn"
                      >
                        <i className="bi bi-dash"></i>
                      </Button>
                      
                      <span className="mx-3 fw-bold">{item.quantity || 1}</span>
                      
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                        className="quantity-btn"
                      >
                        <i className="bi bi-plus"></i>
                      </Button>
                      
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="ms-2 remove-btn"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </div>
                </ListGroup.Item>
              )})}
            </ListGroup>
            
            <div className="cart-summary mt-3 p-3 bg-light rounded">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold">Subtotal:</span>
                <span className="fw-bold">₹{calculateTotal()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Delivery Fee:</span>
                <span>₹40</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold fs-5">Total:</span>
                <span className="fw-bold fs-5 text-danger">₹{calculateTotal() + 40}</span>
              </div>
            </div>
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Continue Shopping
        </Button>
        {cart.length > 0 && (
          <Button variant="danger" onClick={handleCheckout}>
            <i className="bi bi-credit-card me-2"></i>
            Checkout (₹{calculateTotal() + 40})
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CartPopup;
