import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, InputGroup, Row, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';
import { apiConfig, getAuthHeaders } from '../../utils/apiConfig';

const Customers = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      const res = await fetch(`${apiConfig.endpoints.admin}/customers/with-counts`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      const list = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
      setItems(list);
    } catch (e) {
      setError(e.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(c => {
      if (!q) return true;
      const parts = [c.name, c.email]?.map(x => (x || '').toString().toLowerCase());
      return parts.some(x => x.includes(q));
    });
  }, [items, query]);

  const totalRevenue = filtered.reduce((s, c) => s + Number(c.revenue || 0), 0);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Customers</h4>
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
                <Form.Control placeholder="Name or email" value={query} onChange={(e)=>setQuery(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={3} className="ms-auto">
              <div className="text-muted small">Total revenue (filtered):</div>
              <div className="h5 mb-0">₹{totalRevenue.toLocaleString()}</div>
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
            <div className="text-muted p-3">No customers found</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id || c._id}>
                      <td>{c.name || '-'}</td>
                      <td>{c.email || '-'}</td>
                      <td>{c.orders ?? 0}</td>
                      <td>₹{Number(c.revenue || 0).toLocaleString()}</td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-primary" onClick={() => navigate(`/admin/customers/${c.id || c._id}`)}>Details</Button>
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

export default Customers;
