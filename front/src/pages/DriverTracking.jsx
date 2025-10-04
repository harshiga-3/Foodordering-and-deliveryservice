import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Spinner, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import './DriverTracking.css';

const DriverTracking = () => {
  const { user, token } = useAuth();
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [order, setOrder] = useState(null);
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [watchId, setWatchId] = useState(null);
  
  const eventSourceRef = useRef(null);
  const intervalRef = useRef(null);

  // Check if user is a driver
  useEffect(() => {
    if (user && user.role !== 'delivery' && user.role !== 'driver') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setLocationPermission('granted');
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Unable to get your location. Please check location permissions.');
        setLocationPermission('denied');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Start watching location
  const startLocationWatch = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Error watching location:', error);
        setError('Error watching location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
    
    setWatchId(watchId);
  };

  // Stop watching location
  const stopLocationWatch = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // Share location manually
  const shareLocation = async () => {
    if (!location || !orderId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/tracking/update/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          status: (order?.status || order?.orderStatus) || 'out_for_delivery'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Location shared successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to share location');
      }
    } catch (err) {
      setError('Failed to share location');
    } finally {
      setLoading(false);
    }
  };

  // Start auto-update
  const startAutoUpdate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tracking/start-auto-update/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setAutoUpdate(true);
        setSuccess('Auto-update started! Location will be shared every 2 minutes.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to start auto-update');
      }
    } catch (err) {
      setError('Failed to start auto-update');
    } finally {
      setLoading(false);
    }
  };

  // Stop auto-update
  const stopAutoUpdate = async () => {
    try {
      const response = await fetch(`/api/tracking/stop-auto-update/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setAutoUpdate(false);
        setSuccess('Auto-update stopped.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to stop auto-update');
      }
    } catch (err) {
      setError('Failed to stop auto-update');
    }
  };

  // Go online/offline
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
          isOnline: newStatus,
          lat: location?.lat,
          lng: location?.lng
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsOnline(newStatus);
        setSuccess(`You are now ${newStatus ? 'online' : 'offline'}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      setError('Failed to update status');
    }
  };

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

  // Load order details
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          setOrder(data.order || data);
        } else {
          setError(data.message || 'Failed to load order');
        }
      } catch (err) {
        setError('Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationWatch();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (loading && !order) {
    return (
      <Container className="driver-tracking-container">
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-3">Loading order details...</p>
        </div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="driver-tracking-container">
        <Alert variant="danger">
          <h4>Order Not Found</h4>
          <p>The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button variant="outline-danger" onClick={() => navigate('/driver-dashboard')}>
            Back to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="driver-tracking-container">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          {/* Header */}
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <i className="fas fa-motorcycle me-2"></i>
                Driver Tracking
              </h4>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-1">Order #{order._id.slice(-8)}</h5>
                  <Badge bg={order.status === 'delivered' ? 'success' : 'warning'}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <Button
                  variant={isOnline ? 'success' : 'outline-secondary'}
                  size="sm"
                  onClick={toggleOnlineStatus}
                >
                  <i className={`fas fa-circle me-1 ${isOnline ? 'text-success' : 'text-muted'}`}></i>
                  {isOnline ? 'Online' : 'Offline'}
                </Button>
              </div>
              
              <div className="order-details">
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>Total:</strong> ${order.totalAmount}</p>
                <p><strong>Address:</strong> {formatAddress(order.deliveryAddress)}</p>
              </div>
            </Card.Body>
          </Card>

          {/* Location Sharing */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-map-marker-alt me-2"></i>
                Location Sharing
              </h5>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
              {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
              
              <div className="location-controls">
                <div className="mb-3">
                  <Button
                    variant="primary"
                    onClick={getCurrentLocation}
                    disabled={loading}
                    className="me-2"
                  >
                    {loading ? <Spinner size="sm" /> : <i className="fas fa-location-arrow me-1"></i>}
                    Get Current Location
                  </Button>
                  
                  <Button
                    variant="success"
                    onClick={shareLocation}
                    disabled={!location || loading}
                    className="me-2"
                  >
                    <i className="fas fa-share me-1"></i>
                    Share Location
                  </Button>
                </div>

                {location && (
                  <div className="location-info mb-3">
                    <p className="text-muted mb-1">Current Location:</p>
                    <p className="mb-0">
                      <i className="fas fa-map-pin me-1"></i>
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </div>
                )}

                <div className="auto-update-controls">
                  <h6>Auto-Update Location</h6>
                  <p className="text-muted small">
                    Automatically share your location every 2 minutes
                  </p>
                  
                  <div className="d-flex gap-2">
                    <Button
                      variant={autoUpdate ? 'danger' : 'success'}
                      onClick={autoUpdate ? stopAutoUpdate : startAutoUpdate}
                      disabled={!location || loading}
                    >
                      <i className={`fas ${autoUpdate ? 'fa-stop' : 'fa-play'} me-1`}></i>
                      {autoUpdate ? 'Stop Auto-Update' : 'Start Auto-Update'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Order Status Update */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-clipboard-list me-2"></i>
                Update Order Status
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="status-buttons">
                <Button
                  variant={order.status === 'confirmed' ? 'primary' : 'outline-primary'}
                  className="me-2 mb-2"
                  onClick={() => updateOrderStatus('confirmed')}
                >
                  Confirmed
                </Button>
                <Button
                  variant={order.status === 'preparing' ? 'warning' : 'outline-warning'}
                  className="me-2 mb-2"
                  onClick={() => updateOrderStatus('preparing')}
                >
                  Preparing
                </Button>
                <Button
                  variant={order.status === 'out_for_delivery' ? 'info' : 'outline-info'}
                  className="me-2 mb-2"
                  onClick={() => updateOrderStatus('out_for_delivery')}
                >
                  Out for Delivery
                </Button>
                <Button
                  variant={order.status === 'delivered' ? 'success' : 'outline-success'}
                  className="me-2 mb-2"
                  onClick={() => updateOrderStatus('delivered')}
                >
                  Delivered
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Navigation */}
          <div className="text-center">
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/driver-dashboard')}
              className="me-2"
            >
              <i className="fas fa-arrow-left me-1"></i>
              Back to Dashboard
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );

  // Update order status
  async function updateOrderStatus(newStatus) {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: newStatus })
      });

      const data = await response.json();
      
      if (response.ok) {
        setOrder({ ...order, orderStatus: newStatus, status: newStatus });
        setSuccess(`Order status updated to ${newStatus.replace('_', ' ')}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to update order status');
      }
    } catch (err) {
      setError('Failed to update order status');
    } finally {
      setLoading(false);
    }
  }
};

export default DriverTracking;
