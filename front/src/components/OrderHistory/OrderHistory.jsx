import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { apiConfig, makeAuthenticatedRequest } from '../../utils/apiConfig';
import './OrderHistory.css';
import { orderAPI } from '../../utils/api';
import StripeCheckout from '../Payment/StripeCheckout';

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({}); // { orderId: true/false }
  const [showPay, setShowPay] = useState(false);
  const [payOrder, setPayOrder] = useState({ id: null, amount: 0 });

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${apiConfig.endpoints.orders}/my-orders`);
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (oid) => {
    if (!window.confirm('Remove this order from your history?')) return;
    try {
      await orderAPI.deleteForUser(oid);
      await loadOrders();
    } catch (e) {
      setError(e.message || 'Failed to delete order');
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'preparing') return { bg: '#FFF3CD', color: '#856404', label: 'PREPARING' };
    if (s === 'delivered') return { bg: '#D4EDDA', color: '#155724', label: 'DELIVERED' };
    if (s === 'cancelled') return { bg: '#F8F9FA', color: '#6C757D', label: 'CANCELLED' };
    if (s === 'confirmed') return { bg: '#D4EDDA', color: '#155724', label: 'CONFIRMED' };
    if (s === 'pending') return { bg: '#FFF3CD', color: '#856404', label: 'PENDING' };
    return { bg: '#F8F9FA', color: '#6C757D', label: (status || 'UNKNOWN').toUpperCase() };
  };

  const getPaymentStatusStyle = (p) => {
    const s = (p || '').toLowerCase();
    if (s === 'completed') return { bg: '#D4EDDA', color: '#155724', label: 'PAID' };
    if (s === 'failed') return { bg: '#F8D7DA', color: '#721C24', label: 'FAILED' };
    if (s === 'pending') return { bg: '#FFF3CD', color: '#856404', label: 'PAYMENT PENDING' };
    return { bg: '#F8F9FA', color: '#6C757D', label: (p || 'UNKNOWN').toUpperCase() };
  };

  const getItemsPreview = (items = []) => {
    const parts = items.slice(0, 2).map(it => `${it.quantity}x ${it.name}`);
    const remaining = Math.max(items.length - 2, 0);
    return parts.join(', ') + (remaining > 0 ? ` + ${remaining} more...` : '');
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3">Loading your orders...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Error Loading Orders</h4>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadOrders}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="order-history">
      <Container className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col className="text-center">
            <div className="order-history-header">
              <h1 className="display-5 fw-bold text-primary mb-3">
                <i className="ri-bill-line me-3"></i>
                My Orders
              </h1>
              <p className="lead text-muted">
                {orders.length === 0 
                  ? "You haven't placed any orders yet" 
                  : `You have ${orders.length} order${orders.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </Col>
        </Row>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Row>
            <Col className="text-center py-5">
              <div className="empty-orders">
                <i className="ri-bill-line display-1 text-muted"></i>
                <h4 className="mt-3 text-muted">No orders yet</h4>
                <p className="text-muted mb-4">
                  Start ordering delicious food to see your order history here!
                </p>
                <Button 
                  variant="primary" 
                  size="lg"
                  href="/food"
                >
                  <i className="ri-arrow-right-line me-2"></i>
                  Browse Food Items
                </Button>
              </div>
            </Col>
          </Row>
        ) : (
          <Row>
            {orders.map((order) => {
              const status = getStatusStyle(order.orderStatus);
              const isOpen = !!expanded[order._id];
              return (
              <Col key={order._id} lg={8} className="mb-4 mx-auto">
                  <Card className={`order-card-collapsible ${isOpen ? 'expanded' : 'collapsed'}`}>
                    {/* Collapsed Header Area */}
                    <div className="order-card-top" onClick={() => toggleExpand(order._id)} role="button" tabIndex={0}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="order-id" style={{ color: '#E63946', fontWeight: 600 }}>#{order.orderId}</div>
                        <div className="order-date text-muted" style={{ color: '#495057' }}>{formatDate(order.createdAt)}</div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="order-items-preview text-muted">{getItemsPreview(order.items)}</div>
                        <div className={`chevron ${isOpen ? 'open' : ''}`} aria-hidden>►</div>
                      </div>
                      <div className="d-flex justify-content-end align-items-center gap-2 mt-2">
                        <div className="order-total fw-bold">₹{(order.finalAmount ?? order.totalAmount)?.toFixed ? (order.finalAmount ?? order.totalAmount).toFixed(2) : (order.finalAmount ?? order.totalAmount)}</div>
                        <span className="status-pill" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                        <span className="status-pill" style={{ background: getPaymentStatusStyle(order.paymentStatus).bg, color: getPaymentStatusStyle(order.paymentStatus).color }}>
                          {getPaymentStatusStyle(order.paymentStatus).label}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isOpen && (
                      <div className="order-card-details">
                        <div className="delivery-info">
                          <div className="d-flex flex-column gap-1">
                            <div><i className="ri-user-line me-2"></i><strong>Name:</strong> {order.userDetails?.name}</div>
                            <div><i className="ri-phone-line me-2"></i><strong>Contact:</strong> {order.userDetails?.contactNumber}</div>
                            <div><i className="ri-map-pin-line me-2"></i><strong>Address:</strong> {order.userDetails?.address}</div>
                          </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="price-breakdown-box mt-3">
                          <div className="d-flex justify-content-between"><span>Subtotal</span><span>₹{order.totalAmount?.toFixed?.(2) ?? order.totalAmount}</span></div>
                          <div className="d-flex justify-content-between"><span>Delivery</span><span>{order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge?.toFixed?.(2) ?? order.deliveryCharge}`}</span></div>
                          <div className="d-flex justify-content-between"><span>GST (5%)</span><span>₹{order.gst?.toFixed?.(2) ?? order.gst}</span></div>
                          <hr className="my-2" />
                          <div className="d-flex justify-content-between fw-bold"><span>Total</span><span>₹{order.finalAmount?.toFixed?.(2) ?? order.finalAmount}</span></div>
                        </div>

                        {/* Payment Info */}
                        <div className="mt-3 d-flex flex-wrap gap-3 align-items-center">
                          <div><strong>Payment Method:</strong> {(order.paymentMethod || 'stripe').toUpperCase()}</div>
                          <div>
                            <strong>Payment Status:</strong>{' '}
                            <span className="status-pill" style={{ background: getPaymentStatusStyle(order.paymentStatus).bg, color: getPaymentStatusStyle(order.paymentStatus).color }}>
                              {getPaymentStatusStyle(order.paymentStatus).label}
                            </span>
                          </div>
                        </div>

                        {/* Track Order */}
                        <div className="mt-3 d-flex gap-2 flex-wrap">
                          <Button
                            variant="primary"
                            href={`/tracking/${order.orderId}`}
                          >
                            <i className="ri-map-pin-line me-1"></i>
                            Track Order
                          </Button>

                          {order.paymentMethod === 'stripe' && order.paymentStatus !== 'completed' && (
                            <Button
                              variant="warning"
                              onClick={() => {
                                setPayOrder({ id: order.orderId, amount: order.finalAmount ?? order.totalAmount });
                                setShowPay(true);
                              }}
                            >
                              <i className="ri-bank-card-line me-1"></i>
                              {order.paymentStatus === 'failed' ? 'Retry Payment' : 'Pay Now'}
                            </Button>
                          )}
                        </div>

                        {/* Feedback Section */}
                        <div className="feedback-section mt-3">
                          <div className="mb-2">How was your order?</div>
                          <div className="d-flex flex-wrap gap-2">
                            <Button size="sm" variant="success" className="pill-btn" onClick={() => alert('Thanks!')}><i className="ri-emotion-happy-line me-1"></i>Satisfied</Button>
                            <Button size="sm" variant="secondary" className="pill-btn" onClick={() => alert('Thanks for the feedback!')}><i className="ri-emotion-normal-line me-1"></i>Neutral</Button>
                            <Button size="sm" variant="outline-danger" className="pill-btn" onClick={() => alert('Sorry to hear that!')}><i className="ri-emotion-unhappy-line me-1"></i>Dissatisfied</Button>
                            <Button size="sm" variant="link" className="text-decoration-none write-review-link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>✍️ Write a Review</Button>
                            <Button size="sm" variant="outline-danger" className="ms-auto" onClick={() => deleteOrder(order.orderId)}><i className="ri-delete-bin-line me-1"></i>Delete</Button>
                          </div>
                        </div>
                      </div>
                    )}
                </Card>
              </Col>
              );
            })}
          </Row>
        )}
      </Container>
      {/* Pay Modal */}
      <Modal show={showPay} onHide={() => setShowPay(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Complete Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {payOrder.id && (
            <StripeCheckout
              orderId={payOrder.id}
              amount={payOrder.amount}
              onCompleted={() => {
                setShowPay(false);
                setPayOrder({ id: null, amount: 0 });
                // reload list to reflect updated payment status
                (async () => { await loadOrders(); })();
              }}
              onCancel={() => setShowPay(false)}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default OrderHistory;
