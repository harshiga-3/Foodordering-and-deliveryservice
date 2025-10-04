import React, { useState } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import './ReviewForm.css';

const ReviewForm = ({ 
  itemId, 
  itemType, 
  onSubmit, 
  onCancel, 
  existingReview = null,
  isEditing = false 
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please log in to write a review');
      return;
    }
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    const trimmed = comment.trim();
    if (!trimmed) {
      setError('Please write a comment');
      return;
    }

    // Enforce a sensible minimum to satisfy backend validation
    if (trimmed.length < 10) {
      setError('Comment is too short. Please write at least 10 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reviewData = {
        rating: Number(rating),
        comment: trimmed,
        reviewType: itemType,
        ...(itemType === 'food' ? { foodId: itemId } : { restaurantId: itemId })
      };

      // Guard: ensure a target id is present
      if (!itemId) {
        throw new Error(`Please select a ${itemType === 'food' ? 'food item' : 'restaurant'} to review.`);
      }

      await onSubmit(reviewData);
      
      if (!isEditing) {
        setRating(0);
        setComment('');
      }
    } catch (error) {
      setError(error?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      setRating(0);
      setComment('');
      setError('');
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= (hoveredRating || rating) ? 'filled' : ''}`}
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  if (!user) {
    return (
      <Alert variant="info">
        Please <a href="/login">login</a> to write a review.
      </Alert>
    );
  }

  return (
    <div className="review-form-container">
      <h5 className="mb-3">
        {isEditing ? 'Edit Review' : `Write a Review for this ${itemType}`}
      </h5>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Rating *</Form.Label>
              <div className="stars-container">
                {renderStars()}
                <span className="rating-text ms-2">
                  {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Click to rate'}
                </span>
              </div>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Comment *</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Share your experience with this ${itemType}...`}
            maxLength={500}
            className="review-textarea"
          />
          <Form.Text className="text-muted">
            {comment.length}/500 characters
          </Form.Text>
        </Form.Group>

        <div className="d-flex gap-2">
          <Button
            type="submit"
            variant="danger"
            disabled={loading || rating === 0 || !comment.trim()}
            className="px-4"
          >
            {loading ? 'Submitting...' : (isEditing ? 'Update Review' : 'Submit Review')}
          </Button>
          
          <Button
            type="button"
            variant="outline-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ReviewForm;
