import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Badge, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderTracking.css';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [location, setLocation] = useState(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  
  const mapRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Load order tracking data
  useEffect(() => {
    const loadTrackingData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tracking/order/${orderId}`);
        const data = await response.json();
        
        if (response.ok) {
          setTrackingData(data);
          if (data.location) {
            setLocation(data.location);
          }
        } else {
          setError(data.message || 'Failed to load tracking data');
        }
      } catch (err) {
        setError('Failed to load tracking data');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadTrackingData();
    }
  }, [orderId]);

  // Initialize Google Maps
  useEffect(() => {
    if (location && !map) {
      initializeMap();
    }
  }, [location, map]);

  // Set up real-time updates
  useEffect(() => {
    if (orderId) {
      setupRealTimeUpdates();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [orderId]);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: { lat: location.lat, lng: location.lng },
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    const markerInstance = new window.google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: mapInstance,
      title: 'Delivery Driver',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#4CAF50" stroke="#fff" stroke-width="2"/>
            <path d="M20 8l-8 12h6v8h4v-8h6l-8-12z" fill="#fff"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 20)
      }
    });

    setMap(mapInstance);
    setMarker(markerInstance);
  };

  const setupRealTimeUpdates = () => {
    // For demo purposes, we'll simulate real-time updates
    // In production, you would use WebSocket or Server-Sent Events
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/tracking/order/${orderId}`);
        const data = await response.json();
        
        if (response.ok && data.location) {
          setLocation(data.location);
          updateMapLocation(data.location);
        }
      } catch (err) {
        console.error('Error updating location:', err);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  };

  const updateMapLocation = (newLocation) => {
    if (map && marker) {
      const newPosition = { lat: newLocation.lat, lng: newLocation.lng };
      marker.setPosition(newPosition);
      map.setCenter(newPosition);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'secondary',
      confirmed: 'primary',
      preparing: 'warning',
      out_for_delivery: 'info',
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

  const calculateEstimatedTime = () => {
    if (!trackingData?.order?.createdAt) return null;
    
    const orderTime = new Date(trackingData.order.createdAt);
    const now = new Date();
    const elapsed = now - orderTime;
    const estimatedDelivery = new Date(orderTime.getTime() + (45 * 60 * 1000)); // 45 minutes
    const remaining = estimatedDelivery - now;
    
    if (remaining > 0) {
      const minutes = Math.ceil(remaining / (1000 * 60));
      return `${minutes} minutes`;
    }
    return 'Any moment now';
  };

  if (loading) {
    return (
      <Container className="order-tracking-container">
        <div className="text-center py-5">
          <Spinner animation="border" size="lg" />
          <h4 className="mt-3">Loading order tracking...</h4>
        </div>
      </Container>
    );
  }

  if (error || !trackingData) {
    return (
      <Container className="order-tracking-container">
        <Alert variant="danger" className="text-center">
          <h4>Unable to Track Order</h4>
          <p>{error || 'Order not found'}</p>
          <Button variant="outline-danger" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="order-tracking-container">
      <Row className="justify-content-center">
        <Col lg={10}>
          {/* Header */}
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <i className="fas fa-truck me-2"></i>
                  Order Tracking
                </h4>
                <Badge bg={getStatusColor(trackingData.order.status)} className="fs-6">
                  {getStatusText(trackingData.order.status)}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h5>Order Details</h5>
                  <p><strong>Order #:</strong> {trackingData.order.id.slice(-8)}</p>
                  <p><strong>Total:</strong> ${trackingData.order.totalAmount}</p>
                  <p><strong>Restaurant:</strong> {trackingData.restaurant.name}</p>
                  <p><strong>Ordered:</strong> {new Date(trackingData.order.createdAt).toLocaleString()}</p>
                </Col>
                <Col md={6}>
                  <h5>Delivery Information</h5>
                  {trackingData.driver ? (
                    <>
                      <p><strong>Driver:</strong> {trackingData.driver.name}</p>
                      <p><strong>Phone:</strong> {trackingData.driver.phone}</p>
                    </>
                  ) : (
                    <p className="text-muted">Driver not assigned yet</p>
                  )}
                  <p><strong>Estimated Delivery:</strong> {calculateEstimatedTime() || 'Calculating...'}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Map */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-map me-2"></i>
                Live Location
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div 
                ref={mapRef} 
                className="tracking-map"
                style={{ height: '400px', width: '100%' }}
              >
                {!window.google && (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="text-center">
                      <Spinner animation="border" />
                      <p className="mt-2">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Status Timeline */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-clock me-2"></i>
                Order Status Timeline
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="timeline">
                {['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'].map((status, index) => {
                  const isActive = trackingData.order.status === status;
                  const isCompleted = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'].indexOf(trackingData.order.status) > index;
                  
                  return (
                    <div key={status} className={`timeline-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                      <div className="timeline-marker">
                        <i className={`fas ${isCompleted ? 'fa-check' : 'fa-circle'}`}></i>
                      </div>
                      <div className="timeline-content">
                        <h6>{getStatusText(status)}</h6>
                        {isActive && location && (
                          <p className="text-muted small">
                            Last updated: {new Date(location.updatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>

          {/* Location Info */}
          {location && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Driver Location
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Coordinates:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                    <p><strong>Last Updated:</strong> {new Date(location.updatedAt).toLocaleString()}</p>
                  </div>
                  <div className="col-md-6">
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <i className="fas fa-external-link-alt me-1"></i>
                      Open in Google Maps
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Actions */}
          <div className="text-center">
            <Button
              variant="outline-primary"
              onClick={() => navigate('/')}
              className="me-2"
            >
              <i className="fas fa-home me-1"></i>
              Back to Home
            </Button>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-sync-alt me-1"></i>
              Refresh
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderTracking;
