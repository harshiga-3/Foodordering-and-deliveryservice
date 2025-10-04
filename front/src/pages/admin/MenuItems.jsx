import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, InputGroup, Row, Spinner, Table } from 'react-bootstrap';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';
import { apiConfig, getAuthHeaders } from '../../utils/apiConfig';

const MenuItems = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [vegFilter, setVegFilter] = useState('');
  const [restMap, setRestMap] = useState({}); // restaurantId => name
  const [deletingId, setDeletingId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      // Use the public foods endpoint; auth header is okay to include
      const res = await fetch(`${apiConfig.endpoints.foods}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch menu items');
      const data = await res.json();
      const list = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : data.foods || data || []);
      setItems(list);
    } catch (e) {
      setError(e.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const deleteFood = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      setDeletingId(id);
      let res = await fetch(`${apiConfig.endpoints.admin}/foods/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.status === 404) {
        // Fallback: some backends don't expose admin foods delete route
        res = await fetch(`${apiConfig.endpoints.foods}/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
      }
      if (!res.ok) {
        let message = 'Failed to delete item';
        try {
          const data = await res.json();
          if (data?.message) message = data.message;
        } catch {}
        throw new Error(message);
      }
      setItems(prev => prev.filter(x => (x._id || x.id) !== id));
    } catch (e) {
      setError(e.message || 'Failed to delete');
    } finally {
      setDeletingId('');
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Fetch restaurants once to map ID -> name for foods that don't populate restaurant relation
  useEffect(() => {
    let mounted = true;
    const loadRestaurants = async () => {
      try {
        const res = await fetch(`${apiConfig.endpoints.restaurants}`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : data.restaurants || data || []);
        const map = {};
        list.forEach(r => { if (r && (r._id || r.id)) { map[r._id || r.id] = r.name; } });
        if (mounted) setRestMap(map);
      } catch {}
    };
    loadRestaurants();
    return () => { mounted = false; };
  }, []);

  const getRestaurantName = (f) => {
    // Try common shapes first
    const direct = f?.restaurantId?.name || f?.restaurant?.name || f?.restaurantName;
    if (direct) return direct;
    // If restaurantId is an object id or string id, map it
    const rid = typeof f?.restaurantId === 'string' ? f.restaurantId : (f?.restaurantId?._id || f?.restaurantId?.id);
    if (rid && restMap[rid]) return restMap[rid];
    return '-';
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(it => {
      if (category && (it.category || '').toLowerCase() !== category) return false;
      if (vegFilter === 'veg' && !it.isVeg) return false;
      if (vegFilter === 'nonveg' && !!it.isVeg) return false;
      if (!q) return true;
      const parts = [it.name, it.description, getRestaurantName(it), it.category]
        .map(x => (x || '').toString().toLowerCase());
      return parts.some(x => x.includes(q));
    });
  }, [items, query, category, vegFilter, restMap]);

  const categories = useMemo(() => {
    const set = new Set((items || []).map(i => (i.category || '').toLowerCase()).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Menu Items</h4>
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
                <Form.Control placeholder="Name, restaurant, category" value={query} onChange={(e)=>setQuery(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Label>Category</Form.Label>
              <Form.Select value={category} onChange={(e)=>setCategory(e.target.value)}>
                <option value="">All</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Type</Form.Label>
              <Form.Select value={vegFilter} onChange={(e)=>setVegFilter(e.target.value)}>
                <option value="">All</option>
                <option value="veg">Veg</option>
                <option value="nonveg">Non-Veg</option>
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
            <div className="text-muted p-3">No menu items found</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Item</th>
                    <th>Restaurant</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => (
                    <tr key={f._id}>
                      <td>{f.name}</td>
                      <td>{getRestaurantName(f)}</td>
                      <td>{f.category || '-'}</td>
                      <td>₹{Number(f.price || 0).toLocaleString()}</td>
                      <td><Badge bg={f.isVeg ? 'success' : 'danger'}>{f.isVeg ? 'Veg' : 'Non-Veg'}</Badge></td>
                      <td><Badge bg={f.isActive === false ? 'secondary' : 'primary'}>{f.isActive === false ? 'Inactive' : 'Active'}</Badge></td>
                      <td className="text-end">
                        <Button 
                          size="sm" 
                          variant="outline-danger" 
                          onClick={() => deleteFood(f._id || f.id)}
                          disabled={deletingId === (f._id || f.id)}
                        >
                          {deletingId === (f._id || f.id) ? 'Deleting...' : 'Delete'}
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

export default MenuItems;
