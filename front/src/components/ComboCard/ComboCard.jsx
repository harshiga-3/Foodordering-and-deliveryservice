import React from 'react';
import { Card, Button, Badge, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { apiConfig } from '../../utils/apiConfig';
import './ComboCard.css';

const ComboCard = ({ combo, onAddToCart, showRestaurant = false }) => {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    navigate(`/combo/${combo._id}`);
  };
  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart({
        ...combo,
        isCombo: true,
        price: combo.comboPrice,
        quantity: 1
      });
    }
  };

  const savings = combo.originalPrice - combo.comboPrice;
  const savingsPercentage = Math.round((savings / combo.originalPrice) * 100);

  return (
    <Card className="combo-card h-100 shadow-sm" onClick={handleViewDetails} style={{ cursor: 'pointer' }}>
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={combo.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNTAgNzBMMTgwIDEwMEgxMjBMMTUwIDcwWiIgZmlsbD0iI0NDQ0NDQyIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMzAiIHI9IjIwIiBmaWxsPSIjQ0NDQ0NDIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPkNvbWJvIE9mZmVyPC90ZXh0Pgo8L3N2Zz4K'}
          style={{ height: '200px', objectFit: 'cover' }}
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNTAgNzBMMTgwIDEwMEgxMjBMMTUwIDcwWiIgZmlsbD0iI0NDQ0NDQyIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMzAiIHI9IjIwIiBmaWxsPSIjQ0NDQ0NDIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPkNvbWJvIE9mZmVyPC90ZXh0Pgo8L3N2Zz4K';
          }}
        />
        
        {/* Discount Badge */}
        <div className="position-absolute top-0 start-0 m-2">
          <Badge bg="danger" className="combo-discount-badge">
            <i className="bi bi-percent me-1"></i>
            {savingsPercentage}% OFF
          </Badge>
        </div>

        {/* Featured Badge */}
        {combo.isFeatured && (
          <div className="position-absolute top-0 end-0 m-2">
            <Badge bg="warning" text="dark" className="combo-featured-badge">
              <i className="bi bi-star-fill me-1"></i>
              Featured
            </Badge>
          </div>
        )}

        {/* Category Badge */}
        <div className="position-absolute bottom-0 start-0 m-2">
          <Badge bg="primary" className="combo-category-badge">
            {combo.category?.charAt(0).toUpperCase() + combo.category?.slice(1)}
          </Badge>
        </div>
      </div>

      <Card.Body className="d-flex flex-column">
        <div className="mb-2">
          <Card.Title className="h6 mb-1 combo-title">
            {combo.name}
          </Card.Title>
          {showRestaurant && combo.restaurantId && (
            <small className="text-muted d-block">
              <i className="bi bi-shop me-1"></i>
              {combo.restaurantId.name}
            </small>
          )}
        </div>

        <Card.Text className="text-muted small flex-grow-1 mb-3">
          {combo.description}
        </Card.Text>

        {/* Items Preview */}
        <div className="mb-3">
          <small className="text-muted d-block mb-1">Includes:</small>
          {typeof combo.items === 'string' ? (
            <div className="text-muted small">
              {combo.items}
            </div>
          ) : (
            <div className="d-flex flex-wrap gap-1">
              {combo.items?.slice(0, 3).map((item, index) => (
                <Badge key={index} bg="light" text="dark" className="small">
                  {item.name} x{item.quantity}
                </Badge>
              ))}
              {combo.items?.length > 3 && (
                <Badge bg="secondary" className="small">
                  +{combo.items.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Price Section */}
        <div className="mb-3">
          <Row className="align-items-center">
            <Col>
              <div className="d-flex align-items-center gap-2">
                <span className="text-success fw-bold fs-5">
                  ₹{combo.comboPrice}
                </span>
                <span className="text-muted text-decoration-line-through small">
                  ₹{combo.originalPrice}
                </span>
              </div>
              <small className="text-danger fw-bold">
                Save ₹{savings}
              </small>
            </Col>
          </Row>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto">
          <Row className="g-2">
            <Col>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>View full details</Tooltip>}
              >
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="w-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails();
                  }}
                >
                  <i className="bi bi-eye me-1"></i>
                  View Details
                </Button>
              </OverlayTrigger>
            </Col>
            <Col>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Add to cart</Tooltip>}
              >
                <Button
                  variant="danger"
                  size="sm"
                  className="w-100"
                  onClick={handleAddToCart}
                >
                  <i className="bi bi-cart-plus me-1"></i>
                  Add to Cart
                </Button>
              </OverlayTrigger>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ComboCard;
