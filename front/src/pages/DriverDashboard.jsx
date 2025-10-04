import React, { useState, useEffect, useMemo } from 'react';

import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Table, Collapse } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DeliveryMap from '../components/DeliveryMap';
import { apiConfig } from '../utils/apiConfig';
import './DriverDashboard.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const DriverDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [expanded, setExpanded] = useState({}); // orderId -> bool
  const [locations, setLocations] = useState({}); // orderId -> {lat,lng,updatedAt}
  const [simLoading, setSimLoading] = useState({}); // orderId -> bool

  // Check if user is a delivery/driver
  useEffect(() => {
    if (user && !['delivery', 'driver'].includes(String(user.role))) {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  // Load assigned orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiConfig.endpoints.orders}/assigned`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(data || []);
      } else {
        setError(data.message || 'Failed to load orders');
      }
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Load completed (delivered) orders for metrics
  const loadCompleted = async () => {
    try {
      const response = await fetch(`${apiConfig.endpoints.orders}/completed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setCompletedOrders(Array.isArray(data) ? data : (data?.orders || []));
      }
    } catch (_) {}
  };

  // Toggle online status
  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      const response = await fetch('/api/tracking/driver-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isOnline: newStatus
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsOnline(newStatus);
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      setError('Failed to update status');
    }
  };

  useEffect(() => {
    if (token) {
      loadOrders();
      loadCompleted();
    }
  }, [token]);

  // Periodically refresh order statuses (every 15s)
  useEffect(() => {
    if (!token) return;
    const t = setInterval(() => {
      loadOrders();
      loadCompleted();
    }, 15000);
    return () => clearInterval(t);
  }, [token]);

  // Subscribe to SSE for each order to receive live courier locations
  useEffect(() => {
    const streams = [];
    const tkn = token;
    orders.forEach(o => {
      const id = o.orderId || o._id;
      if (!id) return;
      const es = new EventSource(`${apiConfig.baseURL}/api/tracking/stream/${id}?token=${encodeURIComponent(tkn || '')}`, { withCredentials: false });
      es.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.type === 'location') {
            setLocations(prev => ({ ...prev, [id]: msg.payload }));
          }
        } catch {}
      };
      es.onerror = () => {};
      streams.push(es);
    });
    return () => streams.forEach(s => s.close());
  }, [orders, token]);

  const startSimulation = async (id) => {
    try {
      setSimLoading(prev => ({ ...prev, [id]: true }));
      const res = await fetch(`${apiConfig.baseURL}/api/tracking/simulate/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d.message || 'Failed to start simulation');
      }
    } catch (e) {
      setError(e.message || 'Failed to start simulation');
    } finally {
      setSimLoading(prev => ({ ...prev, [id]: false }));
    }
  };

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
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return statusTexts[status] || status;
  };

  // ---- Derived delivery metrics ----
  const sl = (s) => String(s || '').toLowerCase();
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

  const assignedNowDelivering = (orders || []).filter(o => sl(o.orderStatus) === 'out_for_delivery').length;
  const assignedPendingPickup = (orders || []).filter(o => ['confirmed', 'preparing'].includes(sl(o.orderStatus))).length;
  const deliveredList = (completedOrders || []).filter(o => sl(o.orderStatus) === 'delivered');
  const deliveredTodayCount = deliveredList.filter(o => isSameDay(o.updatedAt || o.createdAt, new Date())).length;
  const deliveredWeekCount = deliveredList.filter(o => isWithinDays(o.updatedAt || o.createdAt, 7)).length;
  const deliveredMonthCount = deliveredList.filter(o => isSameMonth(o.updatedAt || o.createdAt)).length;
  const avgDeliveryMinsToday = (() => {
    const today = deliveredList.filter(o => isSameDay(o.updatedAt || o.createdAt, new Date()));
    const mins = today.map(o => (toDate(o.updatedAt || Date.now()) - toDate(o.createdAt)) / 60000).filter(n => Number.isFinite(n) && n >= 0);
    if (!mins.length) return 0;
    return Math.round(mins.reduce((a, b) => a + b, 0) / mins.length);
  })();

  // Earnings (configurable rule)
  const EARNING_RULE = 'percent'; // 'percent' or 'fixed'
  const EARNING_RATE = 0.2; // 20%
  const EARNING_FIXED = 30; // Rs per delivery if fixed
  const calcEarning = (order) => {
    const amt = Number(order.finalAmount || order.totalAmount || 0);
    return EARNING_RULE === 'percent' ? amt * EARNING_RATE : EARNING_FIXED;
  };
  const earningsToday = deliveredList
    .filter(o => isSameDay(o.updatedAt || o.createdAt, new Date()))
    .reduce((s, o) => s + calcEarning(o), 0);
  const earningsMonth = deliveredList
    .filter(o => isSameMonth(o.updatedAt || o.createdAt))
    .reduce((s, o) => s + calcEarning(o), 0);

  // Acceptance and completion (approx based on order createdAt)
  const assignedTodayTotal = (orders || []).filter(o => isSameDay(o.createdAt, new Date())).length
    + deliveredList.filter(o => isSameDay(o.createdAt, new Date())).length;
  const acceptedToday = (orders || []).filter(o => sl(o.orderStatus) === 'out_for_delivery' && isSameDay(o.createdAt, new Date())).length
    + deliveredList.filter(o => isSameDay(o.createdAt, new Date())).length;
  const deliveredTodayCreated = deliveredList.filter(o => isSameDay(o.createdAt, new Date())).length;
  const acceptanceRate = assignedTodayTotal ? Math.round((acceptedToday / assignedTodayTotal) * 100) : 0;
  const completionRate = assignedTodayTotal ? Math.round((deliveredTodayCreated / assignedTodayTotal) * 100) : 0;

  // On-time rate (uses estimatedDeliveryTime if present, else SLA fallback)
  const SLA_MINUTES = 60;
  const onTimeCount = deliveredList.filter(o => {
    const promised = o.estimatedDeliveryTime ? new Date(o.estimatedDeliveryTime).getTime() : (new Date(o.createdAt).getTime() + SLA_MINUTES * 60000);
    const actual = o.actualDeliveryTime ? new Date(o.actualDeliveryTime).getTime() : new Date(o.updatedAt || o.createdAt).getTime();
    return actual <= promised;
  }).length;
  const onTimeRate = deliveredList.length ? Math.round((onTimeCount / deliveredList.length) * 100) : 0;

  // Deliveries per day chart (toggle 7/30 days)
  const [chartRange, setChartRange] = useState(7);
  const daySeq = Array.from({ length: chartRange }, (_, i) => {
    const d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - (chartRange - 1 - i));
    return d;
  });
  const chartLabels = daySeq.map(d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  const chartDataPoints = daySeq.map(d => deliveredList.filter(o => isSameDay(o.updatedAt || o.createdAt, d)).length);
  const lineData = {
    labels: chartLabels,
    datasets: [{
      label: 'Deliveries',
      data: chartDataPoints,
      borderColor: '#0d6efd',
      fill: false,
      tension: 0.3,
      pointRadius: 3
    }]
  };
  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } }
  };

  // ---- UI helpers ----
  const formatAddress = (addr) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    try {
      const { street, city, state, pincode } = addr || {};
      return [street, city, state, pincode].filter(Boolean).join(', ');
    } catch {
      return '';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <Container className="driver-dashboard-container">
        <div className="text-center py-5">
          <Spinner animation="border" size="lg" />
          <h4 className="mt-3">Loading your orders...</h4>
        </div>
      </Container>
    );
  }

  return (
    <Container className="driver-dashboard-container">
      <Row className="justify-content-center">
        <Col lg={10}>
          {/* Header */}
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <i className="fas fa-motorcycle me-2"></i>
                  Driver Dashboard
                </h4>
                <Button
                  variant={isOnline ? 'success' : 'outline-light'}
                  onClick={toggleOnlineStatus}
                >
                  <i className={`fas fa-circle me-1 ${isOnline ? 'text-success' : 'text-muted'}`}></i>
                  {isOnline ? 'Online' : 'Offline'}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h5>Welcome, {user?.name}!</h5>
                  <p className="text-muted">Manage your assigned orders and track deliveries.</p>
                </Col>
                <Col md={6} className="text-md-end">
                  <Button
                    variant="outline-primary"
                    onClick={loadOrders}
                    disabled={loading}
                  >
                    <i className="fas fa-sync-alt me-1"></i>
                    Refresh Orders
                  </Button>
                </Col>
              </Row>

          {/* Earnings and Rates */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h4 className="mb-1">₹{earningsToday.toFixed(2)}</h4>
                  <div className="text-muted">Earnings Today</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h4 className="mb-1">₹{earningsMonth.toFixed(2)}</h4>
                  <div className="text-muted">Earnings This Month</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h4 className="mb-1">{acceptanceRate}%</h4>
                  <div className="text-muted">Acceptance Rate (today)</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h4 className="mb-1">{completionRate}%</h4>
                  <div className="text-muted">Completion Rate (today)</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* On-time rate and chart */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h4 className="mb-1">{onTimeRate}%</h4>
                  <div className="text-muted">On-time Rate</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={9} className="mb-3">
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>Deliveries per Day</span>
                  <div className="btn-group btn-group-sm" role="group">
                    <Button variant={chartRange === 7 ? 'primary' : 'outline-primary'} onClick={() => setChartRange(7)}>7d</Button>
                    <Button variant={chartRange === 30 ? 'primary' : 'outline-primary'} onClick={() => setChartRange(30)}>30d</Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Line data={lineData} options={lineOptions} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
            </Card.Body>
          </Card>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Stats */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h3 className="mb-1">{orders.length}</h3>
                  <div className="text-muted">Total Assigned</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h3 className="mb-1">{assignedNowDelivering}</h3>
                  <div className="text-muted">Currently Delivering</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h3 className="mb-1">{deliveredTodayCount}</h3>
                  <div className="text-muted">Completed Today</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h3 className="mb-1">{assignedPendingPickup}</h3>
                  <div className="text-muted">Pending Pickup</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Extra stats */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h4 className="mb-1">{deliveredWeekCount}</h4>
                  <div className="text-muted">Delivered This Week</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h4 className="mb-1">{deliveredMonthCount}</h4>
                  <div className="text-muted">Delivered This Month</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h4 className="mb-1">{avgDeliveryMinsToday} min</h4>
                  <div className="text-muted">Avg Time Today</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <h4 className="mb-1">{deliveredList.length}</h4>
                  <div className="text-muted">Total Delivered</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Orders List */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-clipboard-list me-2"></i>
                Assigned Orders ({orders.length})
              </h5>
            </Card.Header>
            <Card.Body>
              {orders.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No Orders Assigned</h5>
                  <p className="text-muted">You don't have any assigned orders at the moment.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Restaurant</th>
                        <th>Contacts</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const id = order.orderId || order._id;
                        const courier = locations[id];
                        const restaurantLatLng = order.restaurantLatLng || (order.restaurantId?.locationGeo && Array.isArray(order.restaurantId.locationGeo.coordinates)
                          ? { lat: order.restaurantId.locationGeo.coordinates[1], lng: order.restaurantId.locationGeo.coordinates[0] }
                          : null);
                        const deliveryLatLng = order.deliveryLatLng;
                        return (
                        <tr key={order._id}>
                          <td>
                            <strong>#{order.orderId || order._id.slice(-8)}</strong>
                          </td>
                          <td>
                            <div>
                              <div>{order.userDetails?.name || 'N/A'}</div>
                              <small className="text-muted d-block">{order.userDetails?.contactNumber}</small>
                              <small className="text-muted">{order.userDetails?.email}</small>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div>{order.restaurantId?.name || 'N/A'}</div>
                              <small className="text-muted d-block">{formatAddress(order.restaurantId?.address) || 'N/A'}</small>
                              <small className="text-muted">{order.restaurantId?.phone || order.restaurantId?.email}</small>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div><small className="text-muted">Rest:</small> {order.restaurantId?.phone || 'N/A'} {order.restaurantId?.email ? `| ${order.restaurantId.email}` : ''}</div>
                            </div>
                          </td>
                          <td>
                            <strong>₹{Number(order.finalAmount || order.totalAmount || 0).toFixed(2)}</strong>
                          </td>
                          <td>
                            <Badge bg={getStatusColor(order.orderStatus)}>
                              {getStatusText(order.orderStatus)}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))}
                              >
                                <i className="fas fa-map-marker-alt me-1"></i>
                                {expanded[id] ? 'Hide' : 'Track'}
                              </Button>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                disabled={!!simLoading[id]}
                                onClick={() => startSimulation(id)}
                              >
                                {simLoading[id] ? 'Starting…' : 'Start Simulation'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Expanded rows with mini maps */}
          {orders.map(order => {
            const id = order.orderId || order._id;
            const courier = locations[id];
            const restaurantLatLng = order.restaurantLatLng || (order.restaurantId?.locationGeo && Array.isArray(order.restaurantId.locationGeo.coordinates)
              ? { lat: order.restaurantId.locationGeo.coordinates[1], lng: order.restaurantId.locationGeo.coordinates[0] }
              : null);
            const deliveryLatLng = order.deliveryLatLng;
            return (
              <Collapse in={!!expanded[id]} key={`exp-${order._id}`}>
                <div>
                  <Card className="mt-3">
                    <Card.Header>
                      <strong>Live Tracking:</strong> #{order.orderId || order._id.slice(-8)}
                    </Card.Header>
                    <Card.Body>
                      {restaurantLatLng && deliveryLatLng ? (
                        <DeliveryMap
                          restaurantLatLng={restaurantLatLng}
                          deliveryLatLng={deliveryLatLng}
                          courierLatLng={courier}
                          onDistanceEta={() => {}}
                        />
                      ) : (
                        <div className="text-muted">Map unavailable for this order (missing coordinates).</div>
                      )}
                      <div className="mt-2 small text-muted">
                        Last courier update: {courier?.updatedAt ? new Date(courier.updatedAt).toLocaleTimeString() : '—'}
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </Collapse>
            );
          })}
        </Col>
      </Row>
    </Container>
  );
};

export default DriverDashboard;
