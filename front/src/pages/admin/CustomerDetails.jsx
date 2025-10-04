import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import { apiConfig, getAuthHeaders } from '../../utils/apiConfig';
import { FiRefreshCw } from 'react-icons/fi';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      // Try admin customer details endpoint first
      const res = await fetch(`${apiConfig.endpoints.admin}/customers/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) {
        // Fallback: fetch all customers and find locally (in case backend lacks details route)
        const listRes = await fetch(`${apiConfig.endpoints.admin}/customers/with-counts`, { headers: getAuthHeaders() });
        if (!listRes.ok) throw new Error('Failed to load customer details');
        const data = await listRes.json();
        const items = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
        const found = items.find(c => (c.id || c._id) === id);
        setCustomer(found || null);
      } else {
        const data = await res.json();
        // Normalize potential shapes
        const obj = data.customer || data;
        setCustomer(obj || null);
      }
    } catch (e) {
      setError(e.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const name = useMemo(() => customer?.name || customer?.fullName || '-', [customer]);
  const email = useMemo(() => customer?.email || customer?.user?.email || '-', [customer]);
  const phone = useMemo(() => customer?.phone || customer?.mobile || customer?.contactNumber || customer?.user?.phone || '-', [customer]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-1">Customer Details</h4>
          <small className="text-muted">Basic information</small>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => window.print()}>Print</Button>
          <Button variant="outline-primary" size="sm" onClick={fetchData} disabled={loading}>
            <FiRefreshCw className="me-1" /> Refresh
          </Button>
          <Button variant="link" size="sm" onClick={() => navigate('/admin/customers')}>Back</Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          {loading ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : !customer ? (
            <div className="text-muted">Customer not found</div>
          ) : (
            <Row className="g-3">
              <Col md={6}>
                <div className="text-muted small">Name</div>
                <div className="h5 mb-0">{name}</div>
              </Col>
              <Col md={6}>
                <div className="text-muted small">Email</div>
                <div className="h5 mb-0">{email}</div>
              </Col>
              <Col md={6}>
                <div className="text-muted small">Phone</div>
                <div className="h5 mb-0">{phone}</div>
              </Col>
              <Col md={6}>
                <div className="text-muted small">ID</div>
                <div className="h6 mb-0"><Badge bg="secondary">{id}</Badge></div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default CustomerDetails;
