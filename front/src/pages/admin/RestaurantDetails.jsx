import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Col, Row, Spinner, Table, Alert } from 'react-bootstrap';
import { apiConfig, getAuthHeaders } from '../../utils/apiConfig';
import { FiRefreshCw } from 'react-icons/fi';

const badgeFor = (s) => {
  switch ((s || '').toLowerCase()) {
    case 'delivered': return 'success';
    case 'confirmed': return 'primary';
    case 'preparing': return 'info';
    case 'out_for_delivery': return 'warning';
    case 'cancelled': return 'danger';
    case 'pending':
    default: return 'secondary';
  }
};

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({ restaurant: null, ordersCount: 0, revenue: 0, ordersByStatus: {} });
  const [orders, setOrders] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      const [sres, ores] = await Promise.all([
        fetch(`${apiConfig.endpoints.admin}/restaurants/${id}/summary`, { headers: getAuthHeaders() }),
        fetch(`${apiConfig.endpoints.admin}/restaurants/${id}/orders?limit=100`, { headers: getAuthHeaders() })
      ]);
      if (!sres.ok) throw new Error('Failed to load summary');
      if (!ores.ok) throw new Error('Failed to load orders');
      const sdata = await sres.json();
      const odata = await ores.json();
      setSummary({
        restaurant: sdata.restaurant,
        ordersCount: sdata.ordersCount || 0,
        revenue: sdata.revenue || 0,
        ordersByStatus: sdata.ordersByStatus || {}
      });
      setOrders(Array.isArray(odata.orders) ? odata.orders : (Array.isArray(odata) ? odata : []));
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-1">{summary.restaurant?.name || 'Restaurant'} Details</h4>
          <small className="text-muted">Orders and revenue summary</small>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => window.print()}>Print</Button>
          <Button variant="outline-primary" size="sm" onClick={fetchData} disabled={loading}>
            <FiRefreshCw className="me-1" /> Refresh
          </Button>
          <Button variant="link" size="sm" onClick={() => navigate('/admin/restaurants')}>Back</Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Summary cards */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted text-uppercase small">Total Revenue</div>
                  <div className="h3 mb-0">₹{Number(summary.revenue || 0).toLocaleString()}</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted text-uppercase small">Total Orders</div>
              <div className="h3 mb-0">{Number(summary.ordersCount||0).toLocaleString()}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted text-uppercase small">Status Breakdown</div>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {Object.entries(summary.ordersByStatus).map(([k,v]) => (
                  <Badge key={k} bg={badgeFor(k)}>{k}: {v}</Badge>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Orders table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Orders</h5>
          <div>
            <Button size="sm" variant="outline-primary" onClick={fetchData} disabled={loading}>
              <FiRefreshCw className="me-1" /> Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-4 text-muted">No orders</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td>#{o.orderId}</td>
                      <td>{o.user?.name || o.userDetails?.name || 'Guest'}</td>
                      <td>₹{Number(o.finalAmount || o.totalAmount || 0).toLocaleString()}</td>
                      <td><Badge bg={badgeFor(o.orderStatus)}>{o.orderStatus}</Badge></td>
                      <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default RestaurantDetails;
