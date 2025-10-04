import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import './BestSellingCombos.css';
import { apiConfig } from '../../utils/apiConfig';
import ComboCard from '../ComboCard/ComboCard';

const BestSellingCombos = ({ onAddToCart, onRestaurantClick }) => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCombos = async () => {
      try {
        setLoading(true);
        setError('');
        const url = `${apiConfig.endpoints.combos}/featured/homepage?limit=6`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCombos(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || 'Failed to load combos');
        setCombos([]);
      } finally {
        setLoading(false);
      }
    };
    loadCombos();
  }, []);

  const handleAddComboToCart = (combo) => {
    if (!onAddToCart) return;
    if (Array.isArray(combo.items)) {
      combo.items.forEach((item) => {
        const qty = item.quantity || 1;
        for (let i = 0; i < qty; i++) {
          onAddToCart({
            _id: item.foodId?._id || item.foodId,
            name: item.name,
            price: item.price,
            image: item.foodId?.image,
            restaurantId: combo.restaurantId?._id || combo.restaurantId,
            restaurantName: combo.restaurantId?.name,
          });
        }
      });
    }
  };

  const handleViewDetails = (combo) => {
    const rid = combo?.restaurantId?._id || combo?.restaurantId;
    if (rid && onRestaurantClick) onRestaurantClick(rid);
  };

  const calculateDiscount = (original, discounted) => {
    return Math.round(((original - discounted) / original) * 100);
  };

  return (
    <section className="best-selling-combos py-5">
      <Container>
        <Row className="mb-4">
          <Col className="text-center">
            <h2 className="section-title">Best Selling Food Combos</h2>
            <p className="section-subtitle">
              Discover our most popular food combinations at unbeatable prices
            </p>
          </Col>
        </Row>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status"><span className="visually-hidden">Loading...</span></div>
            <p className="mt-3">Loading combo offers...</p>
          </div>
        )}
        {error && !loading && (
          <div className="alert alert-danger">{error}</div>
        )}
        {!loading && !error && (
          <Row>
            {combos.map((combo) => (
              <Col key={combo._id} lg={4} md={6} className="mb-4">
                <ComboCard
                  combo={combo}
                  showRestaurant={true}
                  onAddToCart={() => handleAddComboToCart(combo)}
                  onViewDetails={() => handleViewDetails(combo)}
                />
              </Col>
            ))}
            {combos.length === 0 && (
              <Col>
                <div className="text-center text-muted py-5">No featured combos available right now.</div>
              </Col>
            )}
          </Row>
        )}

        <Row className="mt-4">
          <Col className="text-center">
            <Button variant="outline-primary" size="lg">
              <i className="bi bi-arrow-right me-2"></i>
              View All Combos
            </Button>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default BestSellingCombos;
