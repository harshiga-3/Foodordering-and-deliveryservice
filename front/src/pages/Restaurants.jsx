// src/pages/Restaurants.jsx
import React, { useEffect, useState } from 'react';
import RestaurantList from '../components/RestaurantList/RestaurantList';
import { apiConfig } from '../utils/apiConfig';
import { Container, Spinner, Alert } from 'react-bootstrap';

const Restaurants = ({ onBack, onAddToCart }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetch(`${apiConfig.endpoints.restaurants}`).then(r => r.json());
        setRestaurants(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
        <p className="mt-3">Loading restaurants...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <RestaurantList 
      restaurants={restaurants} 
      onBack={onBack}
      onAddToCart={onAddToCart}
    />
  );
};

export default Restaurants;