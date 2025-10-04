import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { userAPI } from '../utils/api';

const Account = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const me = await userAPI.getProfile();
      setProfile(me);
    } catch (e) {
      setError(e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await userAPI.updateProfile({ name: profile.name, phone: profile.phone });
      setSaving(false);
      alert('Profile updated');
    } catch (e) {
      setSaving(false);
      alert(e.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
        <p className="mt-3">Loading profile...</p>
      </Container>
    );
  }

  return (
    <div className="user-dashboard">
      <Container className="py-4">
        <Row className="mb-4">
          <Col className="text-center">
            <div className="bg-danger bg-gradient text-white py-5 rounded-4 shadow">
              <h1 className="display-6 fw-bold mb-2">
                <i className="bi bi-person-gear me-2"></i>
                Account
              </h1>
              <p className="mb-0 opacity-75">Manage your account information</p>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>{error}</Alert>
        )}

        <Row>
          <Col lg={8} className="mx-auto">
            <Card className="border-0 rounded-4 shadow-sm">
              <Card.Body>
                {!profile ? (
                  <div className="text-muted">Unable to load profile.</div>
                ) : (
                  <form onSubmit={onSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Name</label>
                      <input className="form-control" value={profile.name || ''} onChange={(e)=>setProfile({...profile, name: e.target.value})} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Email</label>
                      <input className="form-control" value={profile.email || ''} disabled />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Phone</label>
                      <input className="form-control" value={profile.phone || ''} onChange={(e)=>setProfile({...profile, phone: e.target.value})} />
                    </div>
                    <Button type="submit" variant="danger" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                  </form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Account;


