import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import DeliveryMap from '../components/DeliveryMap';
import { apiConfig, makeAuthenticatedRequest } from '../utils/apiConfig';

const STATUS_FLOW = ['ordered','confirmed','preparing','ready','out_for_delivery','delivered'];

const statusLabel = (s) => ({
  ordered: 'Ordered',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered'
}[s] || s);

const POLL_INTERVAL_MS = 30000;

const OrderTracker = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eta, setEta] = useState(null);

  const [courier, setCourier] = useState(null);

  const [geoRestaurant, setGeoRestaurant] = useState(null);
  const [geoDelivery, setGeoDelivery] = useState(null);

  const [simLoading, setSimLoading] = useState(false);
  const [simMsg, setSimMsg] = useState('');

  const fetchOrder = async () => {
    try {
      setError('');
      const base = apiConfig.baseURL;
      const token = JSON.parse(localStorage.getItem('fd_auth') || '{}')?.token;

      // If authenticated, try the richer orders endpoint first
      if (token) {
        try {
          const data = await makeAuthenticatedRequest(`${apiConfig.endpoints.orders}/${id}`);
          const ord = data?.order || data;
          setOrder(ord);
          return;
        } catch (_) {
          // fall back to public endpoint below
        }
      }

      // Public tracking endpoint (no auth required)
      const res = await fetch(`${base}/api/tracking/order/${id}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Failed to load order (${res.status})`);
      }
      const data = await res.json();
      const ord = data?.order || {};
      // Normalize minimal tracking response to expected shape
      setOrder({
        _id: ord.id || ord._id || id,
        orderId: ord.orderId || id,
        orderStatus: ord.status || ord.orderStatus,
        items: ord.items || [],
        total: ord.finalAmount || ord.totalAmount || ord.total,
        restaurant: data.restaurant || null,
        delivery: data.driver || null,
        deliveryAddress: ord.deliveryAddress || data.deliveryAddress,
        restaurantLatLng: ord.restaurantLatLng,
        deliveryLatLng: ord.deliveryLatLng,
      });
    } catch (e) {
      setError(e.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const t = setInterval(fetchOrder, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [id]);

  const restaurantLatLng = useMemo(() => (
    order?.restaurant?.location || order?.restaurantLatLng || geoRestaurant
  ), [order, geoRestaurant]);
  const deliveryLatLng = useMemo(() => (
    order?.delivery?.location || order?.deliveryLatLng || geoDelivery
  ), [order, geoDelivery]);

  // Geocode fallback using OpenStreetMap Nominatim (no API key)
  useEffect(() => {
    if (!order) return;

    const geocode = async (q) => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const arr = await res.json();
        if (Array.isArray(arr) && arr[0]) {
          return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
        }
      } catch {}
      return null;
    };

    const toAddressString = (addr) => {
      if (!addr) return '';
      if (typeof addr === 'string') return addr;
      const { street, city, state, pincode, landmark } = addr;
      return [street, city, state, pincode, landmark].filter(Boolean).join(', ');
    };

    // Geocode restaurant if missing
    (async () => {
      if (!restaurantLatLng) {
        const restAddr = order?.restaurant?.address || order?.restaurant?.locationText || order?.restaurantAddress;
        const q = toAddressString(restAddr) || order?.restaurant?.name;
        if (q) {
          const p = await geocode(q);
          if (p) setGeoRestaurant(p);
        }
      }

      // Geocode delivery if missing
      if (!deliveryLatLng) {
        const delAddr = order?.delivery?.address || order?.userDetails?.address || order?.deliveryAddress;
        const q = toAddressString(delAddr);
        if (q) {
          const p = await geocode(q);
          if (p) setGeoDelivery(p);
        }
      }
    })();
  }, [order, restaurantLatLng, deliveryLatLng]);

  // Subscribe to SSE for courier location
  useEffect(() => {
    if (!id) return;
    const token = JSON.parse(localStorage.getItem('fd_auth') || '{}')?.token;
    const es = new EventSource(`${apiConfig.baseURL}/api/tracking/stream/${id}?token=${encodeURIComponent(token || '')}`, { withCredentials: false });
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg?.type === 'location') setCourier(msg.payload);
      } catch {}
    };
    es.onerror = () => {};
    return () => es.close();
  }, [id]);

  const currentStatus = order?.status || order?.orderStatus;
  const history = order?.statusHistory || [];

  // If no courier position yet, initialize at restaurant so path is visible immediately
  useEffect(() => {
    if (!courier && restaurantLatLng) {
      setCourier(restaurantLatLng);
    }
  }, [courier, restaurantLatLng]);

  const startSimulation = async () => {
    try {
      setSimMsg('');
      setSimLoading(true);
      const token = JSON.parse(localStorage.getItem('fd_auth') || '{}')?.token;
      const res = await fetch(`${apiConfig.baseURL}/api/tracking/simulate/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to start simulation');
      setSimMsg(`Simulation started for ${data.durationSeconds || 120}s`);
    } catch (e) {
      setSimMsg(e.message || 'Failed to start simulation');
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <section className="py-4">
      <Container>
        {loading ? (
          <div className="text-center"><Spinner animation="border" /></div>
        ) : error ? (
          <Alert variant="danger" className="text-center">{error}</Alert>
        ) : order ? (
          <Row className="g-4">
            <Col lg={8}>
              <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Order #{order._id || id}</h5>
                    <small className="text-muted">{order.restaurant?.name}</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="primary">{statusLabel(currentStatus)}</Badge>
                    {currentStatus !== 'delivered' && (
                      <Button size="sm" variant="outline-primary" disabled={simLoading} onClick={startSimulation}>
                        {simLoading ? 'Starting…' : 'Start Simulation'}
                      </Button>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  {restaurantLatLng && deliveryLatLng ? (
                    <DeliveryMap
                      restaurantLatLng={restaurantLatLng}
                      deliveryLatLng={deliveryLatLng}
                      courierLatLng={courier}
                      onDistanceEta={setEta}
                    />
                  ) : (
                    <div className="text-muted text-center">Map not available</div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <small className="text-muted d-block">ETA</small>
                      <div className="fw-semibold">{eta ? `${eta.durationText} (${eta.distanceText})` : 'Calculating...'}</div>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block">Delivery Person</small>
                      <div className="fw-semibold">{order.delivery?.name || 'Assigned'}</div>
                    </div>
                  </div>
                </Card.Body>
                {simMsg && (
                  <Card.Footer>
                    <small className="text-muted">{simMsg}</small>
                  </Card.Footer>
                )}
              </Card>

              <Card className="shadow-sm mt-4">
                <Card.Header>
                  <h6 className="mb-0">Status Timeline</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex flex-column gap-3">
                    {STATUS_FLOW.map((s, idx) => {
                      const h = history.find(x => x.status === s);
                      const reached = STATUS_FLOW.indexOf(currentStatus) >= idx;
                      return (
                        <div key={s} className="d-flex align-items-center">
                          <i className={`bi ${reached ? 'bi-check-circle-fill text-success' : 'bi-circle'} me-2`}></i>
                          <div className="flex-grow-1">
                            <div className="fw-semibold">{statusLabel(s)}</div>
                            <small className="text-muted">{h?.timestamp ? new Date(h.timestamp).toLocaleString() : '-'}</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="shadow-sm">
                <Card.Header><h6 className="mb-0">Order Items</h6></Card.Header>
                <Card.Body>
                  {(order.items || []).map((it, i) => (
                    <div key={i} className="d-flex justify-content-between mb-2">
                      <div>{it.name} × {it.quantity || 1}</div>
                      <div>₹{(it.price || 0) * (it.quantity || 1)}</div>
                    </div>
                  ))}
                  <hr />
                  <div className="d-flex justify-content-between">
                    <div className="fw-semibold">Total</div>
                    <div className="fw-semibold">₹{order.total || 0}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : null}
      </Container>
    </section>
  );
};

export default OrderTracker;


