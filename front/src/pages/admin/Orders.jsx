import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, InputGroup, Row, Spinner, Table } from 'react-bootstrap';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';
import { apiConfig, getAuthHeaders } from '../../utils/apiConfig';

const statusVariant = (s) => {
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

const Orders = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [updatingId, setUpdatingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true); setError('');
      const res = await fetch(`${apiConfig.endpoints.admin}/orders`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      const list = Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []);
      setOrders(list);
    } catch (e) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Delete this order? This action cannot be undone.')) return;
    try {
      setDeletingId(orderId);
      // Prefer admin endpoint if available
      const res = await fetch(`${apiConfig.endpoints.admin}/orders/${orderId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete order');
      setOrders(prev => prev.filter(o => o.orderId !== orderId));
    } catch (e) {
      setError(e.message || 'Failed to delete order');
    } finally {
      setDeletingId('');
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch(`${apiConfig.endpoints.admin}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      // update local state optimistically
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, orderStatus: newStatus } : o));
    } catch (e) {
      setError(e.message || 'Failed to update status');
    } finally {
      setUpdatingId('');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(o => {
      if (status && (o.orderStatus || '').toLowerCase() !== status) return false;
      if (!q) return true;
      const parts = [o.orderId, o.userDetails?.name, o.user?.name, o.restaurantId?.name].map(x => (x || '').toString().toLowerCase());
      return parts.some(x => x.includes(q));
    });
  }, [orders, query, status]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Orders</h4>
        <Button size="sm" variant="outline-primary" onClick={fetchOrders} disabled={loading}>
          <FiRefreshCw className="me-1" /> Refresh
        </Button>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={6}>
              <Form.Label>Search</Form.Label>
              <InputGroup>
                <InputGroup.Text><FiSearch /></InputGroup.Text>
                <Form.Control placeholder="Order id, customer, restaurant" value={query} onChange={(e)=>setQuery(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Label>Status</Form.Label>
              <Form.Select value={status} onChange={(e)=>setStatus(e.target.value)}>
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="out_for_delivery">Out for delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : error ? (
            <div className="text-danger p-3">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-muted p-3">No orders found</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Restaurant</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o._id}>
                      <td>#{o.orderId}</td>
                      <td>{o.userDetails?.name || o.user?.name || 'Guest'}</td>
                      <td>{o.restaurantId?.name || '-'}</td>
                      <td>₹{Number(o.finalAmount || o.totalAmount || 0).toLocaleString()}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg={statusVariant(o.orderStatus)}>{o.orderStatus || 'pending'}</Badge>
                          <Form.Select
                            size="sm"
                            value={(o.orderStatus || '').toLowerCase()}
                            disabled={updatingId === o.orderId}
                            onChange={(e)=> updateStatus(o.orderId, e.target.value)}
                            style={{ maxWidth: 180 }}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="out_for_delivery">Out for delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </Form.Select>
                        </div>
                      </td>
                      <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
                      <td className="text-end">
                        <a className="btn btn-outline-secondary btn-sm me-2" href={`/tracking/${o.orderId}`} target="_blank" rel="noreferrer">Track</a>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => deleteOrder(o.orderId)}
                          disabled={deletingId === o.orderId}
                        >
                          {deletingId === o.orderId ? 'Deleting...' : 'Delete'}
                        </Button>
                      </td>
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

export default Orders;
