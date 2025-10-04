import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Nav } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../utils/api';
import DeliveryMap from '../components/DeliveryMap';
import './DeliveryDashboard.css';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('assigned');

  useEffect(() => {
    fetchData();
    // Refresh every 20 seconds for real-time updates
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assigned, completed] = await Promise.all([
        orderAPI.getAssignedOrders(),
        orderAPI.getCompletedOrders(),
      ]);
      setAssignedOrders(assigned || []);
      setCompletedOrders(completed || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to fetch orders: ' + (err.message || 'Unknown error'));
      setAssignedOrders([]);
      setCompletedOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      await fetchData(); // Refresh the list
    } catch (err) {
      console.error('Failed to update order status:', err);
      setError('Failed to update order status: ' + (err.message || 'Unknown error'));
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    const colors = {
      pending: 'warning',
      confirmed: 'secondary',
      preparing: 'info',
      out_for_delivery: 'primary',
      delivered: 'success',
      cancelled: 'danger',
    };
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return <Badge bg={colors[s] || 'secondary'}>{labels[s] || status}</Badge>;
  };

  const getNextStatus = (currentStatus) => {
    const s = String(currentStatus || '').toLowerCase();
    if (s === 'confirmed' || s === 'preparing') return 'out_for_delivery';
    if (s === 'out_for_delivery') return 'delivered';
    return null;
  };

  const canUpdateStatus = (status) => {
    const s = String(status || '').toLowerCase();
    return ['confirmed', 'preparing', 'out_for_delivery'].includes(s);
  };

  // ---- Helpers and computed delivery stats ----
  const toDate = (d) => new Date(d);
  const isSameDay = (a, b) => {
    try {
      const da = toDate(a), db = toDate(b);
      return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
    } catch { return false; }
  };
  const isWithinDays = (date, days) => {
    try {
      const d = toDate(date).getTime();
      const now = Date.now();
      return d >= now - days * 24 * 60 * 60 * 1000 && d <= now;
    } catch { return false; }
  };
  const isSameMonth = (date, ref = new Date()) => {
    try {
      const d = toDate(date);
      return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
    } catch { return false; }
  };
  const sl = (s) => String(s || '').toLowerCase();

  const assignedNowDelivering = (assignedOrders || []).filter(o => sl(o.orderStatus) === 'out_for_delivery').length;
  const assignedPendingPickup = (assignedOrders || []).filter(o => ['confirmed', 'preparing'].includes(sl(o.orderStatus))).length;
  const deliveredOrders = (completedOrders || []).filter(o => sl(o.orderStatus) === 'delivered');

  const deliveredTodayCount = deliveredOrders.filter(o => isSameDay(o.updatedAt || o.createdAt, new Date())).length;
  const deliveredWeekCount = deliveredOrders.filter(o => isWithinDays(o.updatedAt || o.createdAt, 7)).length;
  const deliveredMonthCount = deliveredOrders.filter(o => isSameMonth(o.updatedAt || o.createdAt)).length;

  const avgDeliveryMinsToday = (() => {
    const todayDelivered = deliveredOrders.filter(o => isSameDay(o.updatedAt || o.createdAt, new Date()));
    const durations = todayDelivered.map(o => (toDate(o.updatedAt || Date.now()) - toDate(o.createdAt)) / 60000).filter(n => Number.isFinite(n) && n >= 0);
    if (!durations.length) return 0;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  })();

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading delivery dashboard...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-3">
        <Col md={3} className="mb-3">
          <Card>
            <Card.Body>
              <Nav className="flex-column" variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'assigned')}>
                <Nav.Item>
                  <Nav.Link eventKey="assigned">Assigned Orders</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="completed">Completed Orders</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="profile">Profile</Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>
        <Col md={9}>
          <Row className="mb-4">
            <Col>
              <h1 className="dashboard-title">Delivery Dashboard</h1>
              <p className="dashboard-subtitle">
                Welcome, {user?.name || 'Delivery Staff'}! Here are your assigned delivery orders.
              </p>
            </Col>
          </Row>

          {/* Stats Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="stats-card">
                <Card.Body className="text-center">
                  <h3 className="stats-number">{assignedOrders.length}</h3>
                  <p className="stats-label">Total Assigned Orders</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stats-card">
                <Card.Body className="text-center">
                  <h3 className="stats-number">{assignedNowDelivering}</h3>
                  <p className="stats-label">Currently Delivering</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stats-card">
                <Card.Body className="text-center">
                  <h3 className="stats-number">{deliveredTodayCount}</h3>
                  <p className="stats-label">Completed Today</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stats-card">
                <Card.Body className="text-center">
                  <h3 className="stats-number">{assignedPendingPickup}</h3>
                  <p className="stats-label">Pending Pickup</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Extra Stats */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="stats-card">
                <Card.Body className="text-center">
                  <h3 className="stats-number">{deliveredWeekCount}</h3>
                  <p className="stats-label">Delivered This Week</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stats-card">
                <Card.Body className="text-center">
                  <h3 className="stats-number">{deliveredMonthCount}</h3>
                  <p className="stats-label">Delivered This Month</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stats-card">
                <Card.Body className="text-center">
                  <h3 className="stats-number">{avgDeliveryMinsToday || 0} min</h3>
                  <p className="stats-label">Avg Time Today</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="stats-card">
                <Card.Body className="text-center">
                  <h3 className="stats-number">{deliveredOrders.length}</h3>
                  <p className="stats-label">Total Delivered</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Assigned Orders */}
      {activeTab === 'assigned' && (
      <Card>
        <Card.Header>
          <h4 className="mb-0">
            <i className="bi bi-truck me-2"></i>
            Assigned Delivery Orders
          </h4>
        </Card.Header>
        <Card.Body>
          {assignedOrders.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-truck display-4 text-muted"></i>
              <h5 className="mt-3">No assigned orders</h5>
              <p className="text-muted">
                You don't have any delivery orders assigned to you at the moment.
              </p>
            </div>
          ) : (
            <Row>
              {assignedOrders.map(order => (
                <Col key={order._id} lg={6} className="mb-3">
                  <Card className="delivery-order-card">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="mb-1">Order #{order.orderId}</h5>
                          <p className="text-muted mb-0">
                            <i className="bi bi-calendar me-1"></i>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(order.orderStatus)}
                      </div>

                      <div className="mb-3">
                        <strong>Restaurant:</strong>
                        <p className="text-muted mb-2">Restaurant ID: {order.restaurantId}</p>
                      </div>

                      {/* Map + ETA */}
                      {order.restaurantLatLng && order.deliveryLatLng && (
                        <div className="mb-3">
                          <DeliveryMap
                            apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}
                            restaurantLatLng={order.restaurantLatLng}
                            deliveryLatLng={order.deliveryLatLng}
                            onEta={(eta) => (order.__eta = eta)}
                          />
                          {order.__eta && (
                            <div className="small text-muted mt-2">
                              Distance {order.__eta.distanceText}, ETA {order.__eta.durationText}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mb-3">
                        <strong>Items to Deliver:</strong>
                        <ul className="mb-2 mt-1">
                          {order.items.map((item, idx) => (
                            <li key={idx}>
                              {item.name} x {item.quantity}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-3">
                        <div className="row">
                          <div className="col-6">
                            <strong>Total Amount:</strong>
                            <p className="text-primary fw-bold mb-0">₹{Number(order.finalAmount || order.totalAmount || 0).toFixed(2)}</p>
                          </div>
                          <div className="col-6">
                            <strong>Order Time:</strong>
                            <p className="text-muted mb-0">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <div className="order-status-info">
                          <small className="text-muted">
                            Current Status: <strong>{order.orderStatus}</strong>
                          </small>
                        </div>
                        {canUpdateStatus(order.orderStatus) && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateOrderStatus(order.orderId, getNextStatus(order.orderStatus))}
                          >
                            <i className="bi bi-arrow-right me-1"></i>
                            {sl(order.orderStatus) === 'confirmed' && 'Start Delivery'}
                            {sl(order.orderStatus) === 'preparing' && 'Start Delivery'}
                            {sl(order.orderStatus) === 'out_for_delivery' && 'Mark Delivered'}
                          </Button>
                        )}
                        {['confirmed', 'preparing'].includes(sl(order.orderStatus)) && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="ms-2"
                            onClick={() => updateOrderStatus(order.orderId, 'out_for_delivery')}
                          >
                            Start Delivery
                          </Button>
                        )}
                        {sl(order.orderStatus) === 'delivered' && (
                          <Badge bg="success" className="px-3 py-2">
                            <i className="bi bi-check-circle me-1"></i>
                            Delivered
                          </Badge>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>
      )}

      {activeTab === 'completed' && (
        <Card>
          <Card.Header>
            <h4 className="mb-0">Completed Orders</h4>
          </Card.Header>
          <Card.Body>
            {completedOrders.length === 0 ? (
              <p className="text-muted mb-0">No completed orders yet.</p>
            ) : (
              <Row>
                {completedOrders.map(order => (
                  <Col key={order._id} md={6} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0">Order #{order.orderId}</h6>
                          {getStatusBadge(order.orderStatus)}
                        </div>
                        <div className="small text-muted">Delivered on {new Date(order.updatedAt).toLocaleString()}</div>
                        <div className="mt-2"><strong>Total:</strong> ₹{Number(order.finalAmount || order.totalAmount || 0).toFixed(2)}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card.Body>
        </Card>
      )}

      {activeTab === 'profile' && (
        <Card>
          <Card.Header><h4 className="mb-0">Profile</h4></Card.Header>
          <Card.Body>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Role:</strong> {user?.role}</p>
          </Card.Body>
        </Card>
      )}

        </Col>
      </Row>

      {/* Delivery Instructions */}
      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-info-circle me-2"></i>
            Delivery Instructions
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Order Status Flow:</h6>
              <div className="status-flow">
                <div className="status-step">
                  <Badge bg="secondary">Confirmed</Badge>
                  <i className="bi bi-arrow-right"></i>
                  <Badge bg="primary">Out for Delivery</Badge>
                  <i className="bi bi-arrow-right"></i>
                  <Badge bg="success">Delivered</Badge>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <h6>Important Notes:</h6>
              <ul className="delivery-notes">
                <li>Always confirm the order details before pickup</li>
                <li>Handle food packages with care</li>
                <li>Update status promptly for customer tracking</li>
                <li>Contact customer if delivery address is unclear</li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DeliveryDashboard;
