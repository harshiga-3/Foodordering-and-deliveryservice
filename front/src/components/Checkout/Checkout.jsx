// src/components/Checkout/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import './Checkout.css';
import { apiConfig, makeAuthenticatedRequest } from '../../utils/apiConfig';
import StripeCheckout from '../Payment/StripeCheckout';

const Checkout = ({ cart, onOrderSuccess, onClose, user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState('');
  const [orderForPayment, setOrderForPayment] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  // Price utility to support number or formatted string
  const getPriceNumber = (value) => {
    if (typeof value === 'number') return value;
    if (value == null) return 0;
    const str = String(value).trim();
    const cleaned = str.replace(/₹/g, '').replace(/,/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  };

  const formatPrice = (num) => `₹${Number(num || 0).toFixed(2)}`;

  // Calculate price for items considering combo items
  const calculateItemPrice = (item) => {
    if (item.isCombo) {
      return getPriceNumber(item.comboPrice || item.price || 0);
    }
    return getPriceNumber(item.price || 0);
  };

  // Calculate totals
  const safeCart = Array.isArray(cart) ? cart : [];
  const subtotal = safeCart.reduce((sum, item) => {
    const price = calculateItemPrice(item);
    const qty = Number.isFinite(item?.quantity) ? item.quantity : (Number.isFinite(item?.qty) ? item.qty : 1);
    return sum + (price * qty);
  }, 0);

  const gst = subtotal * 0.05; // 5% GST
  const deliveryCharge = subtotal > 500 ? 0 : 50; // Free delivery above ₹500
  const total = subtotal + gst + deliveryCharge;

  const handleAddressChange = (field, value) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };
  const handleUserDetailsChange = (field, value) => {
    setUserDetails(prev => ({ ...prev, [field]: value.trim() }));
  };

  const createOrder = async (paymentMethod = 'stripe') => {
    try {
      // Validate required fields first
      const missingFields = [];
      
      // Check user details
      if (!userDetails.name) missingFields.push('Full Name');
      if (!userDetails.phone) missingFields.push('Phone Number');
      if (!userDetails.email) missingFields.push('Email');
      
      // Check address details
      if (!address.street) missingFields.push('Street Address');
      if (!address.city) missingFields.push('City');
      if (!address.pincode) missingFields.push('Pincode');
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      setLoading(true);
      setError('');
      // Always using Stripe

      // Prepare order payload according to server expectations
      const orderPayload = {
        userDetails: {
          name: userDetails.name.trim(),
          address: `${address.street.trim()}, ${address.city.trim()}, ${address.state.trim()} - ${address.pincode.trim()}`,
          contactNumber: userDetails.phone.trim(),
          email: userDetails.email.trim()
        },
        items: safeCart.map(item => ({
          foodId: item.foodId || item._id || item.id,
          name: item.name,
          price: calculateItemPrice(item),
          quantity: Number.isFinite(item?.quantity) ? item.quantity : (Number.isFinite(item?.qty) ? item.qty : 1),
          isCombo: item.isCombo || false,
          comboItems: item.comboItems || []
        })),
        deliveryAddress: {
          street: address.street.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          pincode: address.pincode.trim(),
          landmark: address.landmark?.trim() || ''
        },
        specialInstructions: '',
        paymentMethod: paymentMethod,
        totalAmount: total
      };
      
      console.log('Creating order with payload:', orderPayload);
      
      try {
        // Create order
        const response = await makeAuthenticatedRequest(
          apiConfig.endpoints.orders,
          'POST',
          orderPayload
        );

        console.log('Order creation response:', response);

        // Handle the case where response is an array (list of orders)
        let orderData;
        if (Array.isArray(response)) {
          // If it's an array, use the first order
          orderData = response[0];
          console.warn('Received array response, using first order:', orderData);
        } else if (response && response.order) {
          // Handle the case where response has an order property
          orderData = response.order;
        } else {
          // Handle the case where the response is the order object directly
          orderData = response;
        }

        if (!orderData) {
          throw new Error('No order data in response');
        }

        const orderId = orderData._id || orderData.orderId;
        if (!orderId) {
          throw new Error('No order ID in response');
        }

        setCreatedOrderId(orderId);
        
        // Initiate Stripe payment flow
        if (paymentMethod === 'stripe') {
          console.log('Initiating Stripe payment for order:', orderId);
          setOrderForPayment(orderData);
          await initiateStripePayment(orderId);
        } else {
          throw new Error(`Invalid payment method: ${paymentMethod}`);
        }
        
        return orderData;
      } catch (error) {
        console.error('Error processing order response:', error);
        throw error;
      }
      
      return response;
    } catch (err) {
      console.error('Order creation error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create order';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const initiateStripePayment = async (orderId) => {
    try {
      console.log('Creating payment intent for order:', orderId);
      const response = await makeAuthenticatedRequest(
        `${apiConfig.endpoints.stripe}/create-payment-intent`,
        'POST',
        { 
          orderId,
          amount: Math.round(total * 100) // Convert to cents
        }
      );
      
      console.log('Payment intent response:', response);
      
      if (response.clientSecret) {
        setPaymentIntentClientSecret(response.clientSecret);
        setShowStripeCheckout(true);
      } else {
        throw new Error('No client secret received from server');
      }
    } catch (err) {
      console.error('Stripe payment initiation error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initialize payment';
      setError(`Payment error: ${errorMessage}`);
      throw err;
    }
  };

  const handleStripeSuccess = (paymentIntentId) => {
    console.log('Stripe payment successful:', paymentIntentId);
    setPaymentCompleted(true);
    setShowStripeCheckout(false);
    if (onOrderSuccess && createdOrderId) {
      onOrderSuccess(createdOrderId, paymentIntentId);
    }
  };

  const handleStripeCancel = () => {
    setShowStripeCheckout(false);
    // You might want to handle order cancellation or status update here
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Set payment method to 'stripe' and proceed with order creation
    await createOrder('stripe');
  };

  if (createdOrderId && paymentCompleted) {
    return (
      <div className="checkout-modal-overlay">
        <div className="checkout-modal">
          <Card className="text-center p-4">
            <Card.Body>
              <div className="mb-4">
                <i className="bi bi-check-circle-fill text-success display-1"></i>
              </div>
              <h3>Order Placed Successfully!</h3>
              <p className="text-muted mb-4">
                Your order has been placed and you will receive a confirmation shortly.
              </p>
              <p className="mb-4">
                <strong>Order ID:</strong> {createdOrderId}
              </p>
              <Button variant="success" onClick={() => onOrderSuccess(createdOrderId)}>
                Track Order
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-modal-overlay">
      <div className="checkout-modal">
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Checkout</h4>
            <Button variant="outline-secondary" size="sm" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </Button>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={8}>
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">Contact Information</h5>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>Full Name *</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter your full name"
                              value={userDetails.name}
                              onChange={(e) => handleUserDetailsChange('name', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Phone Number *</Form.Label>
                            <Form.Control
                              type="tel"
                              placeholder="Enter phone number"
                              value={userDetails.phone}
                              onChange={(e) => handleUserDetailsChange('phone', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email *</Form.Label>
                            <Form.Control
                              type="email"
                              placeholder="Enter email address"
                              value={userDetails.email}
                              onChange={(e) => handleUserDetailsChange('email', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">Delivery Address</h5>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Street Address *</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter street address"
                              value={address.street}
                              onChange={(e) => handleAddressChange('street', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>City *</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter city"
                              value={address.city}
                              onChange={(e) => handleAddressChange('city', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>State</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter state"
                              value={address.state}
                              onChange={(e) => handleAddressChange('state', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Pincode *</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter pincode"
                              value={address.pincode}
                              onChange={(e) => handleAddressChange('pincode', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>Landmark (Optional)</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter landmark for easy delivery"
                              value={address.landmark}
                              onChange={(e) => handleAddressChange('landmark', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">Order Items</h5>
                    </Card.Header>
                    <Card.Body>
                      {safeCart.map((item, index) => {
                        const price = calculateItemPrice(item);
                        const qty = Number.isFinite(item?.quantity) ? item.quantity : 1;
                        const itemTotal = price * qty;

                        return (
                          <div key={item._id || index} className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-1">
                                <h6 className="mb-0 me-2">{item.name}</h6>
                                {item.isCombo && (
                                  <span className="badge bg-success">Combo</span>
                                )}
                              </div>
                              <div className="text-muted small">
                                {item.isCombo && item.items && (
                                  <div>
                                    Includes: {Array.isArray(item.items) ?
                                      item.items.map(i => `${i.name} x${i.quantity}`).join(', ') :
                                      item.items
                                    }
                                  </div>
                                )}
                              </div>
                              <div className="d-flex align-items-center mt-1">
                                <span className="text-success fw-bold">₹{price.toFixed(2)}</span>
                                <span className="text-muted mx-2">×</span>
                                <span>{qty}</span>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold">₹{itemTotal.toFixed(2)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="sticky-top" style={{ top: '20px' }}>
                    <Card.Header>
                      <h5 className="mb-0">Order Summary</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal ({safeCart.length} items):</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>GST (5%):</span>
                        <span>₹{gst.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Delivery Charge:</span>
                        <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}</span>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between fw-bold mb-4">
                        <span>Total:</span>
                        <span className="text-success">₹{total.toFixed(2)}</span>
                      </div>

                      {error && (
                        <Alert variant="danger" className="mt-3">
                          {error}
                        </Alert>
                      )}

                      <div className="text-end mt-4">
                        <Button 
                          variant="outline-secondary" 
                          className="me-2" 
                          onClick={onClose}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="success"
                          onClick={async (e) => {
                            e.preventDefault();
                            await handleSubmit(e);
                          }}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Processing...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-credit-card me-2"></i>
                              Pay with Card
                            </>
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </div>

      {/* Stripe Checkout */}
      {showStripeCheckout && paymentIntentClientSecret && (
        <div className="d-flex justify-content-center">
          <StripeCheckout
            orderId={createdOrderId}
            clientSecret={paymentIntentClientSecret}
            amount={total}
            onCompleted={handleStripeSuccess}
            onCancel={handleStripeCancel}
          />
        </div>
      )}
    </div>
  );
}
;
export default Checkout;
