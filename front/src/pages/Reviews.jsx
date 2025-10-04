import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Form } from 'react-bootstrap';
import { reviewsAPI, foodAPI, restaurantAPI } from '../utils/api';
import ReviewForm from '../components/ReviewForm/ReviewForm';

const Reviews = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formTarget, setFormTarget] = useState({ itemType: 'restaurant', itemId: '' });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ rating: 5, comment: '' });
  const [saving, setSaving] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reviewsAPI.getUserReviews();
      const arr = Array.isArray(data) ? data : (data?.reviews || []);
      setReviews(arr);
    } catch (e) {
      setError(e.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNewReview = async () => {
    setShowForm(true);
    try {
      // Load choices only once per session
      if (restaurants.length === 0) {
        const r = await restaurantAPI.getAll();
        setRestaurants(Array.isArray(r) ? r : []);
      }
      if (foods.length === 0) {
        const f = await foodAPI.getAll();
        setFoods(Array.isArray(f) ? f : []);
      }
    } catch {}
  };

  const handleSubmit = async (reviewData) => {
    const payload = {
      ...reviewData,
      reviewType: formTarget.itemType,
      ...(formTarget.itemType === 'food' 
          ? { foodId: formTarget.itemId }
          : { restaurantId: formTarget.itemId }),
    };
    await reviewsAPI.createReview(payload);
    setShowForm(false);
    await load();
  };

  const startEdit = (rev) => {
    setEditingId(rev._id);
    setEditDraft({ rating: rev.rating, comment: rev.comment || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ rating: 5, comment: '' });
  };

  const saveEdit = async () => {
    try {
      setSaving(true);
      await reviewsAPI.updateReview(editingId, {
        rating: editDraft.rating,
        comment: editDraft.comment,
      });
      setSaving(false);
      setEditingId(null);
      await load();
    } catch (e) {
      setSaving(false);
      setError(e.message || 'Failed to update review');
    }
  };

  const removeReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await reviewsAPI.deleteReview(id);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to delete review');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
        <p className="mt-3">Loading reviews...</p>
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
                <i className="ri-star-smile-line me-2"></i>
                My Reviews
              </h1>
              <p className="mb-0 opacity-75">View and write your reviews</p>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>{error}</Alert>
        )}

        <Row className="mb-4">
          <Col className="text-end">
            <Button variant="danger" onClick={openNewReview}>
              <i className="ri-add-line me-1"></i> New Review
            </Button>
          </Col>
        </Row>

        {showForm && (
          <Row className="mb-4">
            <Col lg={8} className="mx-auto">
              <Card className="border-0 rounded-4 shadow-sm">
                <Card.Body>
                  {/* Target selectors */}
                  <Row className="mb-3">
                    <Col md={5} className="mb-2 mb-md-0">
                      <Form.Label className="fw-semibold">Review Type</Form.Label>
                      <Form.Select
                        value={formTarget.itemType}
                        onChange={(e)=>{
                          const type = e.target.value;
                          setFormTarget({ itemType: type, itemId: '' });
                        }}
                      >
                        <option value="restaurant">Restaurant</option>
                        <option value="food">Food</option>
                      </Form.Select>
                    </Col>
                    <Col md={7}>
                      <Form.Label className="fw-semibold">{formTarget.itemType === 'food' ? 'Food' : 'Restaurant'}</Form.Label>
                      <Form.Select
                        value={formTarget.itemId}
                        onChange={(e)=>setFormTarget(t=>({ ...t, itemId: e.target.value }))}
                      >
                        <option value="">Select {formTarget.itemType === 'food' ? 'food' : 'restaurant'}</option>
                        {(formTarget.itemType === 'food' ? foods : restaurants).map((opt)=> {
                          const val = formTarget.itemType === 'food'
                            ? (opt?._id || opt?.id || opt?.foodId)
                            : (opt?._id || opt?.id || opt?.restaurantId);
                          return (
                            <option key={val || opt?.name} value={val || ''}>{opt?.name}</option>
                          );
                        })}
                      </Form.Select>
                    </Col>
                  </Row>

                  <ReviewForm
                    itemId={formTarget.itemId}
                    itemType={formTarget.itemType}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowForm(false)}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {reviews.length === 0 ? (
          <Card className="border-0 rounded-4 shadow-sm">
            <Card.Body className="text-center text-muted">No reviews yet.</Card.Body>
          </Card>
        ) : (
          <Row>
            {reviews.map((rev) => {
              const title = rev.reviewType === 'food' ? (rev.foodId?.name || 'Food') : (rev.restaurantId?.name || 'Restaurant');
              const img = rev.reviewType === 'food' ? (rev.foodId?.image) : (rev.restaurantId?.image);
              const date = new Date(rev.createdAt).toLocaleString();
              const isEditing = editingId === rev._id;
              return (
                <Col key={rev._id} lg={6} className="mb-3">
                  <Card className="order-card border-0 rounded-4 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="d-flex align-items-start gap-3">
                          {img ? (
                            <img src={img} alt={title} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />
                          ) : (
                            <div style={{ width: 56, height: 56, borderRadius: 8, background: '#F3F4F6' }} />
                          )}
                          <div>
                            <div className="fw-semibold">{title} Review</div>
                            <div className="small text-muted">{date}</div>
                          </div>
                        </div>
                        <Badge bg="warning">{rev.rating}★</Badge>
                      </div>

                      {!isEditing ? (
                        <div className="mt-3 text-muted">{rev.comment}</div>
                      ) : (
                        <div className="mt-3">
                          <Form>
                            <Form.Group className="mb-2">
                              <Form.Label className="fw-semibold mb-1">Rating</Form.Label>
                              <Form.Select value={editDraft.rating} onChange={(e)=>setEditDraft(d=>({...d, rating: Number(e.target.value)}))}>
                                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-semibold mb-1">Comment</Form.Label>
                              <Form.Control as="textarea" rows={3} value={editDraft.comment} onChange={(e)=>setEditDraft(d=>({...d, comment: e.target.value}))} />
                            </Form.Group>
                          </Form>
                        </div>
                      )}

                      <div className="d-flex gap-2 mt-3 justify-content-end">
                        {!isEditing ? (
                          <>
                            <Button size="sm" variant="outline-secondary" onClick={()=>startEdit(rev)}><i className="ri-pencil-line me-1"></i>Edit</Button>
                            <Button size="sm" variant="outline-danger" onClick={()=>removeReview(rev._id)}><i className="ri-delete-bin-line me-1"></i>Delete</Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={saving}>Cancel</Button>
                            <Button size="sm" variant="danger" onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                          </>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Reviews;


