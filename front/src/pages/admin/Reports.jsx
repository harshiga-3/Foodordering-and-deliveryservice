import React, { useEffect, useState, useMemo } from 'react';
import { Card, Table, Row, Col, Button, Spinner, Badge } from 'react-bootstrap';
import { FiRefreshCw } from 'react-icons/fi';
import { apiConfig, getAuthHeaders } from '../../utils/apiConfig';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totals: {}, ordersByStatus: {}, topRestaurants: [] });
  const [orders, setOrders] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      const [statsRes, ordersRes, restRes] = await Promise.all([
        fetch(`${apiConfig.endpoints.admin}/stats`, { headers: getAuthHeaders() }),
        fetch(`${apiConfig.endpoints.admin}/orders?limit=200`, { headers: getAuthHeaders() }),
        fetch(`${apiConfig.endpoints.admin}/restaurants/with-counts`, { headers: getAuthHeaders() }),
      ]);
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      if (!ordersRes.ok) throw new Error('Failed to fetch orders');
      if (!restRes.ok) throw new Error('Failed to fetch restaurants');

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      const restData = await restRes.json();

      const ordersArr = Array.isArray(ordersData.orders) ? ordersData.orders : (Array.isArray(ordersData) ? ordersData : []);
      const topRestaurants = (restData.items || [])
        .map(r => ({ id: r._id, name: r.name, orders: r.orderCount || 0, revenue: Number(r.revenue || 0) }))
        .sort((a,b) => b.revenue - a.revenue)
        .slice(0, 10);

      setStats({ totals: statsData.totals || {}, ordersByStatus: statsData.ordersByStatus || {}, topRestaurants });
      setOrders(ordersArr);
    } catch (e) {
      setError(e.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalRevenue = useMemo(() => orders.reduce((sum, o) => {
    const paid = (o.paymentStatus || 'completed') !== 'failed';
    const delivered = (o.orderStatus || '').toLowerCase() === 'delivered';
    if (paid && delivered) return sum + Number(o.finalAmount || o.totalAmount || 0);
    return sum;
  }, 0), [orders]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Reports</h4>
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-secondary" onClick={() => window.print()}>Print</Button>
          <Button size="sm" variant="outline-primary" onClick={fetchData} disabled={loading}>
            <FiRefreshCw className="me-1" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Total Revenue</div>
              <div className="h3 mb-0">₹{totalRevenue.toLocaleString()}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Total Orders</div>
              <div className="h3 mb-0">{Number(stats.totals.orders || orders.length || 0).toLocaleString()}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Restaurants</div>
              <div className="h3 mb-0">{Number(stats.totals.restaurants || 0).toLocaleString()}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Delivery Personnel</div>
              <div className="h3 mb-0">{Number(stats.totals.deliveryPersons || 0).toLocaleString()}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={7} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light border-0"><strong>Orders by Status</strong></Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4"><Spinner animation="border" /></div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {Object.entries(stats.ordersByStatus).map(([k,v]) => (
                    <Badge key={k} bg="secondary" className="p-2">
                      {k}: {v}
                    </Badge>
                  ))}
                  {Object.keys(stats.ordersByStatus).length === 0 && (
                    <div className="text-muted">No data</div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light border-0"><strong>Top Restaurants (by revenue)</strong></Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-4"><Spinner animation="border" /></div>
              ) : stats.topRestaurants.length === 0 ? (
                <div className="text-muted p-3">No data</div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Restaurant</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topRestaurants.map(r => (
                        <tr key={r.id}>
                          <td>{r.name}</td>
                          <td>{r.orders}</td>
                          <td>₹{r.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Reports;
