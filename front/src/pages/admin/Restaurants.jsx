import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, InputGroup, Row, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';
import { apiConfig, getAuthHeaders } from '../../utils/apiConfig';

const Restaurants = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      const res = await fetch(`${apiConfig.endpoints.admin}/restaurants/with-counts`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      const data = await res.json();
      const list = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
      setItems(list);
    } catch (e) {
      setError(e.message || 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const deleteRestaurant = async (id) => {
    if (!window.confirm('Delete this restaurant? This will also remove associated menu items.')) return;
    try {
      setDeletingId(id);
      // Use admin endpoint to delete with admin privileges
      let res = await fetch(`${apiConfig.endpoints.admin}/restaurants/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.status === 404) {
        // Fallback if admin route is not available
        res = await fetch(`${apiConfig.endpoints.restaurants}/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
      }
      if (!res.ok) {
        let message = 'Failed to delete restaurant';
        try {
          const data = await res.json();
          if (data?.message) message = data.message;
        } catch {}
        throw new Error(message);
      }
      setItems(prev => prev.filter(r => (r._id || r.id) !== id));
    } catch (e) {
      setError(e.message || 'Failed to delete');
    } finally {
      setDeletingId('');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(r => {
      if (!q) return true;
      const parts = [r.name, r.cuisine, r.address]?.map(x => (x || '').toString().toLowerCase());
      return parts.some(x => x.includes(q));
    });
  }, [items, query]);

  const formatAddress = (addr) => {
    if (!addr) return '-';
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object') {
      const { street, city, state, pincode } = addr;
      return [street, city, state, pincode].filter(Boolean).join(', ') || '-';
    }
    try { return String(addr); } catch { return '-'; }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Restaurants</h4>
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-secondary" onClick={() => window.print()}>Print</Button>
          <Button size="sm" variant="outline-primary" onClick={fetchData} disabled={loading}>
            <FiRefreshCw className="me-1" /> Refresh
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={6}>
              <Form.Label>Search</Form.Label>
              <InputGroup>
                <InputGroup.Text><FiSearch /></InputGroup.Text>
                <Form.Control placeholder="Name, cuisine, address" value={query} onChange={(e)=>setQuery(e.target.value)} />
              </InputGroup>
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
            <div className="text-muted p-3">No restaurants found</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Restaurant</th>
                    <th>Address</th>
                    <th>Cuisine</th>
                    <th>Menu Items</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r._id}>
                      <td>{r.name}</td>
                      <td>{formatAddress(r.address)}</td>
                      <td>{r.cuisine || '-'}</td>
                      <td>{r.foodCount ?? 0}</td>
                      <td>{r.orderCount ?? 0}</td>
                      <td>₹{Number(r.revenue || 0).toLocaleString()}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Badge bg={r.isOpen ? 'success' : 'secondary'}>{r.isOpen ? 'Open' : 'Closed'}</Badge>
                          <Badge bg={r.isActive ? 'primary' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
                        </div>
                      </td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-primary" className="me-2" onClick={() => navigate(`/admin/restaurants/${r._id}`)}>Details</Button>
                        <Button 
                          size="sm" 
                          variant="outline-danger" 
                          onClick={() => deleteRestaurant(r._id || r.id)}
                          disabled={deletingId === (r._id || r.id)}
                        >
                          {deletingId === (r._id || r.id) ? 'Deleting...' : 'Delete'}
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

export default Restaurants;
