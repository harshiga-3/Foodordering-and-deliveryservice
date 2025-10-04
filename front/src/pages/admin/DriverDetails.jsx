import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import { apiConfig, getAuthHeaders } from '../../utils/apiConfig';
import { FiRefreshCw } from 'react-icons/fi';

const DriverDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [driver, setDriver] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      // Attempt specific driver endpoint
      const res = await fetch(`${apiConfig.endpoints.admin}/drivers/${id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDriver(data.driver || data);
      } else {
        // Fallback: fetch list and find by id
        const listRes = await fetch(`${apiConfig.endpoints.admin}/drivers`, { headers: getAuthHeaders() });
        if (!listRes.ok) throw new Error('Failed to load driver');
        const data = await listRes.json();
        const list = Array.isArray(data.drivers) ? data.drivers : (Array.isArray(data) ? data : []);
        const found = list.find(d => (d._id || d.id) === id);
        setDriver(found || null);
      }
    } catch (e) {
      setError(e.message || 'Failed to load driver');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const name = useMemo(() => driver?.userId?.name || driver?.name || '-', [driver]);
  const email = useMemo(() => driver?.userId?.email || driver?.email || '-', [driver]);
  const vehicleNo = useMemo(() => driver?.vehicleNo || driver?.vehicleNumber || '-', [driver]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-1">Driver Details</h4>
          <small className="text-muted">Basic information</small>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => window.print()}>Print</Button>
          <Button variant="outline-primary" size="sm" onClick={fetchData} disabled={loading}>
            <FiRefreshCw className="me-1" /> Refresh
          </Button>
          <Button variant="link" size="sm" onClick={() => navigate('/admin/drivers')}>Back</Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          {loading ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : !driver ? (
            <div className="text-muted">Driver not found</div>
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
                <div className="text-muted small">Vehicle No</div>
                <div className="h5 mb-0">{vehicleNo}</div>
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

export default DriverDetails;
