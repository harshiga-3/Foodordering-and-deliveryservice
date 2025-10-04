// components/FavoriteRestaurants.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import { apiConfig } from '../../utils/apiConfig';

const FavoriteRestaurants = ({ onRestaurantClick }) => {
  const [favorites, setFavorites] = useState({});
  const navigate = useNavigate();

  const toggleFavorite = (restaurantId, e) => {
    e.stopPropagation();
    setFavorites(prev => ({
      ...prev,
      [restaurantId]: !prev[restaurantId]
    }));
  };

  const handleRestaurantSelect = (restaurant) => {
    onRestaurantClick(restaurant);
    const restaurantId = restaurant._id || restaurant.id;
    navigate(`/restaurant/${restaurantId}`);
  };

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const url = `${apiConfig.endpoints.restaurants}?sortBy=rating&limit=6`;
        const data = await fetch(url).then(r => r.json());
        setRestaurants(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || 'Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="py-5">
      <Container>
        <h2 className="text-center mb-5 fw-bold">Favorite Restaurants</h2>
        
        <Row>
          {loading && <div className="text-center text-muted">Loading restaurants...</div>}
          {error && <div className="text-center text-danger">{error}</div>}
          {!loading && !error && restaurants.map(restaurant => (
            <Col md={6} lg={4} key={restaurant.id} className="mb-4">
              <Card 
                className="h-100 shadow-sm restaurant-card"
                onClick={() => handleRestaurantSelect(restaurant)}
                style={{ cursor: 'pointer' }}
              >
                <div className="position-relative">
                  <Card.Img 
                    variant="top" 
                    src={restaurant.image}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <Button 
                    variant="light" 
                    className="position-absolute top-0 end-0 m-2 rounded-circle"
                    onClick={(e) => toggleFavorite(restaurant._id || restaurant.id, e)}
                  >
                    <i className={`bi ${favorites[restaurant._id || restaurant.id] ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
                  </Button>
                </div>
                
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="mb-0">{restaurant.name}</Card.Title>
                    <Badge bg="danger">{restaurant.rating} ★</Badge>
                  </div>
                  <Card.Text className="text-muted flex-grow-1">{restaurant.cuisine}</Card.Text>
                  <small className="text-muted d-block mb-2">{restaurant.location}</small>
                  
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted">{restaurant.deliveryTime}</small>
                      <small className="text-muted">{restaurant.costForTwo}</small>
                    </div>
                    <Button 
                      variant="danger" 
                      className="w-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestaurantSelect(restaurant);
                      }}
                    >
                      Order Now
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default FavoriteRestaurants;