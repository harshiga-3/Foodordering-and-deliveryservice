import React from 'react';
import { Card, Badge, Row, Col, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import './ReviewList.css';

const ReviewList = ({ 
  reviews, 
  onEditReview, 
  onDeleteReview, 
  showActions = true 
}) => {
  const { user } = useAuth();

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? 'filled' : ''}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const handleEdit = (review) => {
    if (onEditReview) {
      onEditReview(review);
    }
  };

  const handleDelete = (review) => {
    if (onDeleteReview && window.confirm('Are you sure you want to delete this review?')) {
      onDeleteReview(review._id);
    }
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="no-reviews">
        <div className="text-center py-5">
          <i className="bi bi-chat-dots display-1 text-muted"></i>
          <h5 className="mt-3 text-muted">No reviews yet</h5>
          <p className="text-muted">Be the first to share your experience!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-list-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">
          <i className="bi bi-star-fill text-warning me-2"></i>
          Customer Reviews ({reviews.length})
        </h5>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted small">Sort by:</span>
          <select className="form-select form-select-sm" style={{ width: 'auto' }}>
            <option>Most Recent</option>
            <option>Highest Rating</option>
            <option>Lowest Rating</option>
            <option>Most Helpful</option>
          </select>
        </div>
      </div>
      
      <div className="reviews-list">
        {reviews.map((review, index) => (
          <Card key={review._id} className="review-card mb-3">
            <Card.Body className="p-4">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="avatar">
                    <i className="bi bi-person-circle"></i>
                  </div>
                  <div className="reviewer-details">
                    <div className="d-flex align-items-center mb-1">
                      <h6 className="reviewer-name mb-0 me-2">
                        {review.userName || (review.userId?.name || 'Anonymous')}
                      </h6>
                      {review.isVerified && (
                        <Badge bg="success" className="verified-badge-small">
                          <i className="bi bi-check-circle me-1"></i>
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="rating-stars">
                      {renderStars(review.rating)}
                      <span className="rating-number ms-2">{review.rating}.0</span>
                      <span className="text-muted ms-2">•</span>
                      <small className="text-muted ms-2">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </small>
                    </div>
                  </div>
                </div>
                
                {showActions && user && user.id === review.userId?._id && (
                  <div className="review-actions">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEdit(review)}
                      className="edit-btn me-2"
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(review)}
                      className="delete-btn"
                    >
                      <i className="bi bi-trash me-1"></i>
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="review-content mt-3">
                <p className="review-comment mb-3">{review.comment}</p>
                
                {/* Helpful Actions */}
                <div className="review-actions-footer">
                  <div className="d-flex align-items-center gap-3">
                    <Button variant="outline-secondary" size="sm" className="helpful-btn">
                      <i className="bi bi-hand-thumbs-up me-1"></i>
                      Helpful ({Math.floor(Math.random() * 20)})
                    </Button>
                    <Button variant="outline-secondary" size="sm" className="helpful-btn">
                      <i className="bi bi-hand-thumbs-down me-1"></i>
                      Not Helpful
                    </Button>
                    <Button variant="outline-secondary" size="sm" className="helpful-btn">
                      <i className="bi bi-flag me-1"></i>
                      Report
                    </Button>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
