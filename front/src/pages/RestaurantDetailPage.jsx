// src/pages/RestaurantDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import RestaurantDetail from '../components/RestaurantDetail/RestaurantDetail';
import { useAuth } from '../context/AuthContext';

const RestaurantDetailPage = ({ onBack, onAddToCart, cart }) => {
  const { id } = useParams();
  const { API_BASE } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRestaurantDetails();
  }, [id]);

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/restaurants/${id}`);
      if (!response.ok) throw new Error('Restaurant not found');
      
      const data = await response.json();
      const normalized = {
        ...data,
        _id: data?._id || data?.id || data?.restaurantId,
        id: data?.id || data?._id || data?.restaurantId,
        restaurantId: data?.restaurantId || data?._id || data?.id,
      };
      setRestaurant(normalized);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading restaurant details...</p>
      </Container>
    );
  }

  if (error || !restaurant) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          <h2 className="mb-4">Restaurant not found</h2>
          <p>{error || 'The requested restaurant could not be found.'}</p>
          <Button variant="outline-danger" onClick={onBack}>
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <RestaurantDetail 
      restaurant={restaurant}
      onBack={onBack}
      onAddToCart={onAddToCart}
      cart={cart}
    />
  );
};

export default RestaurantDetailPage;
