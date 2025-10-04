import React, { useEffect, useRef, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { apiConfig, makeAuthenticatedRequest } from '../utils/apiConfig';
import Form from 'react-bootstrap/Form';

const INTERVAL_MS = 30000;

const DeliveryLocationShare = () => {
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [orderId, setOrderId] = useState('');
  const intervalRef = useRef(null);

  const postLocation = async (coords) => {
    try {
      await fetch(`${apiConfig.baseURL}/api/tracking/update/${encodeURIComponent(orderId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(JSON.parse(localStorage.getItem('fd_auth')||'{}')?.token ? { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('fd_auth')||'{}')?.token}` } : {}) },
        body: JSON.stringify({ lat: coords.latitude, lng: coords.longitude })
      }).then(r => r.json());
      setLastUpdate(new Date());
    } catch (e) {
      setError(e.message || 'Failed to update location');
    }
  };

  const tick = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => postLocation(pos.coords),
      (err) => setError(err.message || 'Unable to get location'),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  };

  const start = () => {
    if (!orderId) { setError('Enter an orderId to share location'); return; }
    setError('');
    setActive(true);
    tick();
    intervalRef.current = setInterval(tick, INTERVAL_MS);
  };

  const stop = () => {
    setActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => () => stop(), []);

  return (
    <section className="py-4">
      <Container>
        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">Delivery Location Sharing</h5>
          </Card.Header>
          <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <p className="text-muted">Send your GPS every 30 seconds while delivering orders.</p>
            <Form.Group className="mb-3" controlId="orderIdInput">
              <Form.Label>Order ID</Form.Label>
              <Form.Control type="text" placeholder="Enter orderId (e.g. 123456)" value={orderId} onChange={e => setOrderId(e.target.value)} />
            </Form.Group>
            <div className="d-flex gap-2">
              {!active ? (
                <Button variant="success" onClick={start}>
                  <i className="bi bi-play-fill me-1"></i>
                  Start Sharing
                </Button>
              ) : (
                <Button variant="warning" onClick={stop}>
                  <i className="bi bi-pause-fill me-1"></i>
                  Pause Sharing
                </Button>
              )}
            </div>
            <div className="mt-3 text-muted">
              Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : '—'}
            </div>
          </Card.Body>
        </Card>
      </Container>
    </section>
  );
};

export default DeliveryLocationShare;


