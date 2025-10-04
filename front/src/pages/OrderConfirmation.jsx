import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderConfirmation.css';
import { apiConfig, makeAuthenticatedRequest } from '../utils/apiConfig';
import StripeCheckout from '../components/Payment/StripeCheckout';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object') {
      const { street, city, state, pincode, landmark } = addr;
      const parts = [street, city, state, pincode, landmark].filter(Boolean);
      return parts.join(', ') || 'N/A';
    }
    return String(addr);
  };

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await makeAuthenticatedRequest(`${apiConfig.endpoints.orders}/${orderId}`);
      setOrder(data.order || data);
    } catch (err) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'warning',
      confirmed: 'primary',
      preparing: 'info',
      out_for_delivery: 'success',
      delivered: 'success',
      cancelled: 'danger'
    };
    return statusColors[status] || 'secondary';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'Order Pending',
      confirmed: 'Order Confirmed',
      preparing: 'Preparing Food',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Order Cancelled'
    };
    return statusTexts[status] || status;
  };

  const getPaymentStatusColor = (pstatus) => {
    const map = {
      pending: 'warning',
      completed: 'success',
      failed: 'danger'
    };
    return map[pstatus] || 'secondary';
  };

  const getPaymentStatusText = (pstatus) => {
    const map = {
      pending: 'Payment Pending',
      completed: 'Payment Completed',
      failed: 'Payment Failed'
    };
    return map[pstatus] || (pstatus || 'Unknown');
  };

  const copyTrackingLink = () => {
    const trackingUrl = `${window.location.origin}/tracking/${orderId}`;
    navigator.clipboard.writeText(trackingUrl).then(() => {
      alert('Tracking link copied to clipboard!');
    });
  };

  const [showPayModal, setShowPayModal] = useState(false);
  const canRetryPayment = order && order.paymentMethod === 'stripe' && order.paymentStatus !== 'completed';

  if (loading) {
    return (
      <Container className="order-confirmation-container">
        <div className="text-center py-5">
          <Spinner animation="border" size="lg" />
          <h4 className="mt-3">Loading order details...</h4>
        </div>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="order-confirmation-container">
        <Alert variant="danger" className="text-center">
          <h4>Order Not Found</h4>
          <p>{error || 'The order you\'re looking for doesn\'t exist.'}</p>
          <Button variant="outline-danger" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="order-confirmation-container">
      <Row className="justify-content-center">
        <Col lg={8}>
          {/* Success Header */}
          <Card className="mb-4 success-card">
            <Card.Body className="text-center">
              <div className="success-icon mb-3">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2 className="text-success mb-3">Order Placed Successfully!</h2>
              <p className="lead">Thank you for your order. We'll start preparing it right away.</p>
            </Card.Body>
          </Card>

          {/* Order Details */}
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Order Details</h4>
                <div className="d-flex gap-2 align-items-center">
                  <Badge bg={getStatusColor(order.orderStatus)} className="fs-6">
                    {getStatusText(order.orderStatus)}
                  </Badge>
                  <Badge bg={getPaymentStatusColor(order.paymentStatus)} className="fs-6">
                    {getPaymentStatusText(order.paymentStatus)}
                  </Badge>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>Order Information</h6>
                  <p><strong>Order ID:</strong> {order.orderId || order.id}</p>
                  <p><strong>Total Amount:</strong> ₹{order.finalAmount || order.totalAmount}</p>
                  <p><strong>Order Time:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                  <p><strong>Payment Method:</strong> {order.paymentMethod?.toUpperCase() || 'STRIPE'}</p>
                  <p>
                    <strong>Payment Status:</strong> {' '}
                    <Badge bg={getPaymentStatusColor(order.paymentStatus)}>
                      {getPaymentStatusText(order.paymentStatus)}
                    </Badge>
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Delivery Information</h6>
                  <p><strong>Customer:</strong> {order.customerName || 'N/A'}</p>
                  <p><strong>Phone:</strong> {order.customerPhone || 'N/A'}</p>
                  <p><strong>Address:</strong> {formatAddress(order.deliveryAddress)}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Order Summary */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="order-summary">
                <div className="d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>₹{order.totalAmount}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Delivery Charge:</span>
                  <span>₹{order.deliveryCharge || 0}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>GST (5%):</span>
                  <span>₹{order.gst || 0}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold fs-5">
                  <span>Total:</span>
                  <span>₹{order.finalAmount || order.totalAmount}</span>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Tracking Section */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-truck me-2"></i>
                Track Your Order
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="tracking-info">
                <p className="mb-3">
                  {order.driver ? 
                    'Your order has been assigned to a delivery driver. You can track the real-time location below.' :
                    'Your order is being prepared. A delivery driver will be assigned soon.'
                  }
                </p>
                
                <div className="tracking-actions">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate(`/tracking/${orderId}`)}
                    className="me-3 mb-2"
                  >
                    <i className="fas fa-map-marker-alt me-2"></i>
                    Track Order
                  </Button>
                  
                  <Button
                    variant="outline-secondary"
                    onClick={copyTrackingLink}
                    className="mb-2"
                  >
                    <i className="fas fa-copy me-2"></i>
                    Copy Tracking Link
                  </Button>
                </div>
                
                <div className="tracking-note mt-3">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    You can also access this tracking page anytime using the link above.
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Actions */}
          <div className="text-center">
            <Button
              variant="outline-primary"
              onClick={() => navigate('/orders')}
              className="me-2"
            >
              <i className="fas fa-list me-1"></i>
              View All Orders
            </Button>
            {canRetryPayment && (
              <Button
                variant="warning"
                className="me-2"
                onClick={() => setShowPayModal(true)}
              >
                <i className="fas fa-credit-card me-1"></i>
                {order.paymentStatus === 'failed' ? 'Retry Payment' : 'Pay Now'}
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => navigate('/')}
            >
              <i className="fas fa-home me-1"></i>
              Continue Shopping
            </Button>
          </div>

          {/* Retry Payment Modal */}
          <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Complete Payment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <StripeCheckout
                orderId={orderId}
                amount={order.finalAmount || order.totalAmount}
                onCompleted={() => {
                  setShowPayModal(false);
                  loadOrder();
                }}
                onCancel={() => setShowPayModal(false)}
              />
            </Modal.Body>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderConfirmation;
