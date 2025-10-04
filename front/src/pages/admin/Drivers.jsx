import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, InputGroup, Row, Spinner, Table } from 'react-bootstrap';
import { FiRefreshCw, FiSearch, FiTruck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { apiConfig, getAuthHeaders } from '../../utils/apiConfig';

const Drivers = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      const res = await fetch(`${apiConfig.endpoints.admin}/drivers`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch drivers');
      const data = await res.json();
      const list = Array.isArray(data.drivers) ? data.drivers : (Array.isArray(data) ? data : []);
      setDrivers(list);
    } catch (e) {
      setError(e.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drivers.filter(d => {
      if (!q) return true;
      const user = d.userId || {};
      const parts = [user.name, user.email, d.vehicleNo, d.vehicleType].map(x => (x || '').toString().toLowerCase());
      return parts.some(x => x.includes(q));
    });
  }, [drivers, query]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0 d-flex align-items-center gap-2"><FiTruck /> Drivers</h4>
        <Button size="sm" variant="outline-primary" onClick={fetchData} disabled={loading}>
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
                <Form.Control placeholder="Name, email, vehicle" value={query} onChange={(e)=>setQuery(e.target.value)} />
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
            <div className="text-muted p-3">No drivers found</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Driver</th>
                    <th>Email</th>
                    <th>Vehicle</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d._id}>
                      <td>{d.userId?.name || '-'}</td>
                      <td>{d.userId?.email || '-'}</td>
                      <td>{[d.vehicleType, d.vehicleNo].filter(Boolean).join(' • ') || '-'}</td>
                      <td><Badge bg="info">{d.userId?.role || 'delivery'}</Badge></td>
                      <td>
                        <Badge bg="success">Active</Badge>
                      </td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-primary" onClick={() => navigate(`/admin/drivers/${d._id || d.id}`)}>
                          View
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

export default Drivers;
