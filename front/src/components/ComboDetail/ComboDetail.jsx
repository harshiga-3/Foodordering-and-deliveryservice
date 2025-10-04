import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Badge, Image, Alert, Spinner } from 'react-bootstrap';
import { apiConfig } from '../../utils/apiConfig';
import './ComboDetail.css';

const ComboDetail = ({ onAddToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addToCartSuccess, setAddToCartSuccess] = useState('');

  useEffect(() => {
    const fetchCombo = async () => {
      try {
        const response = await fetch(`${apiConfig.endpoints.combos}/${id}`);
        if (!response.ok) throw new Error('Combo not found');
        const data = await response.json();
        setCombo(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCombo();
  }, [id]);

  const handleAddToCart = () => {
    if (!combo) return;
    
    // Add the entire combo to cart as a single item
    onAddToCart({
      ...combo,
      isCombo: true,
      price: combo.comboPrice,
      quantity: quantity
    });

    setAddToCartSuccess(`${combo.name} added to cart!`);
    setTimeout(() => setAddToCartSuccess(''), 3000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger" className="m-3">{error}</Alert>;
  if (!combo) return <Alert variant="warning" className="m-3">Combo not found</Alert>;

  const savings = combo.originalPrice - combo.comboPrice;
  const savingsPercentage = Math.round((savings / combo.originalPrice) * 100);

  return (
    <Container className="py-4">
      <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-4">
        &larr; Back to Menu
      </Button>

      <Row className="g-4">
        <Col lg={6}>
          <div className="combo-image-container">
            <Image
              src={combo.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0zMDAgMTQwTDM2MCAyMDBIMjQwTDMwMCAxNDBaIiBmaWxsPSIjQ0NDQ0NDIi8+CjxjaXJjbGUgY3g9IjMwMCIgY3k9IjI2MCIgcj0iNDAiIGZpbGw9IiNDQ0NDQ0MiLz4KPHRleHQgeD0iMzAwIiB5PSIzMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+Q29tYm8gT2ZmZXI8L3RleHQ+Cjwvc3ZnPgo='}
              alt={combo.name}
              fluid
              className="combo-image rounded shadow"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0zMDAgMTQwTDM2MCAyMDBIMjQwTDMwMCAxNDBaIiBmaWxsPSIjQ0NDQ0NDIi8+CjxjaXJjbGUgY3g9IjMwMCIgY3k9IjI2MCIgcj0iNDAiIGZpbGw9IiNDQ0NDQ0MiLz4KPHRleHQgeD0iMzAwIiB5PSIzMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+Q29tYm8gT2ZmZXI8L3RleHQ+Cjwvc3ZnPgo=';
              }}
            />
            {savings > 0 && (
              <Badge bg="danger" className="combo-discount-badge">
                {savingsPercentage}% OFF
              </Badge>
            )}
          </div>
        </Col>

        <Col lg={6}>
          <div className="combo-details">
            <h2 className="mb-3">{combo.name}</h2>
            <p className="text-muted mb-4">{combo.description}</p>
            
            <div className="price-section mb-4">
              <h3 className="text-success mb-0">₹{combo.comboPrice}</h3>
              {savings > 0 && (
                <div className="text-muted">
                  <del>₹{combo.originalPrice}</del>
                  <span className="text-danger ms-2">Save ₹{savings}</span>
                </div>
              )}
            </div>

            <div className="combo-items mb-4">
              <h5>What's included:</h5>
              <ul className="list-unstyled">
                {Array.isArray(combo.items) ? (
                  combo.items.map((item, index) => (
                    <li key={index} className="mb-2">
                      <i className="bi bi-check2 text-success me-2"></i>
                      {item.quantity > 1 && <strong>{item.quantity}x </strong>}
                      {item.name || item.foodId?.name}
                      {item.description && <small className="text-muted ms-2">({item.description})</small>}
                    </li>
                  ))
                ) : (
                  <li>{combo.items}</li>
                )}
              </ul>
            </div>

            <div className="quantity-selector mb-4">
              <label className="me-3">Quantity:</label>
              <div className="btn-group" role="group">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <Button variant="light" disabled className="px-4">
                  {quantity}
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="d-grid gap-3">
              <Button 
                variant="danger" 
                size="lg" 
                onClick={handleAddToCart}
                className="py-3"
              >
                <i className="bi bi-cart-plus me-2"></i>
                Add to Cart
              </Button>
              
              <Button 
                variant="outline-primary" 
                size="lg" 
                onClick={handleBuyNow}
                className="py-3"
              >
                <i className="bi bi-lightning-charge-fill me-2"></i>
                Buy Now
              </Button>
            </div>

            {addToCartSuccess && (
              <Alert variant="success" className="mt-3 mb-0">
                {addToCartSuccess}
              </Alert>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ComboDetail;
