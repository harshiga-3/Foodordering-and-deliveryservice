// src/components/RestaurantList/RestaurantList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import './RestaurantList.css';

const RestaurantList = ({ restaurants, onBack }) => {
  const navigate = useNavigate();

  const handleRestaurantSelect = (restaurant) => {
    const id = restaurant._id || restaurant.id;
    navigate(`/restaurant/${id}`);
  };

  return (
    <Container className="py-5">
      <Button variant="outline-danger" onClick={onBack} className="mb-4">
        <i className="bi bi-arrow-left me-2"></i>Back to Home
      </Button>
      
      <h2 className="text-center mb-5">Our Partner Restaurants</h2>
      <Row>
        {restaurants.map(restaurant => (
          <Col md={6} lg={4} key={restaurant._id || restaurant.id} className="mb-4">
            <Card className="h-100 shadow-sm restaurant-card">
              <div className="position-relative">
                <Card.Img 
                  variant="top" 
                  src={restaurant.image} 
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="position-absolute top-0 end-0 m-2">
                  <FavoriteButton
                    itemId={restaurant._id || restaurant.id}
                    itemType="restaurant"
                    itemData={restaurant}
                    size="sm"
                  />
                </div>
              </div>
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <Card.Title className="mb-0">{restaurant.name}</Card.Title>
                  <Badge bg="danger">{restaurant.rating} ★</Badge>
                </div>
                <Card.Text className="text-muted flex-grow-1">
                  {restaurant.cuisine}
                </Card.Text>
                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">{restaurant.location}</small>
                    <small className="text-muted">{restaurant.deliveryTime}</small>
                  </div>
                  <Button 
                    variant="danger" 
                    className="w-100"
                    onClick={() => handleRestaurantSelect(restaurant)}
                  >
                    <i className="bi bi-eye me-1"></i>
                    View Details
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default RestaurantList;