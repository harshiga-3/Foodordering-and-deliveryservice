import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { apiConfig, makeAuthenticatedRequest } from '../utils/apiConfig';

const STATUS_FLOW = ['ordered','confirmed','preparing','ready','out_for_delivery','delivered'];

const RestaurantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const data = await makeAuthenticatedRequest(`${apiConfig.endpoints.orders}`);
      const list = Array.isArray(data?.orders) ? data.orders : (Array.isArray(data) ? data : []);
      setOrders(list);
    } catch (e) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const advance = async (order) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];
    await makeAuthenticatedRequest(`${apiConfig.endpoints.orders}/${order._id || order.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next })
    });
    load();
  };

  return (
    <section className="py-4">
      <Container>
        {loading ? (
          <div className="text-center"><Spinner animation="border" /></div>
        ) : error ? (
          <Alert variant="danger" className="text-center">{error}</Alert>
        ) : (
          <Row className="g-3">
            {orders.map(o => (
              <Col lg={6} key={o._id || o.id}>
                <Card className="shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">Order #{o._id || o.id}</div>
                      <small className="text-muted">{o.customer?.name}</small>
                    </div>
                    <Badge bg="secondary">{o.status}</Badge>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-2 text-muted">Items: {(o.items || []).length}</div>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="fw-semibold">Total: ₹{o.total || 0}</div>
                      <Button size="sm" variant="primary" disabled={o.status === 'delivered'} onClick={() => advance(o)}>
                        Advance Status
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </section>
  );
};

export default RestaurantOrders;


