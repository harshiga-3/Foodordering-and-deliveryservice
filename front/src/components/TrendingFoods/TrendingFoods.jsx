import { resolvePublicImage } from '../../utils/imageUtils';
// src/components/TrendingFoods/TrendingFoods.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";

import { apiConfig, makeAuthenticatedRequest } from "../../utils/apiConfig";

const TrendingFoods = ({ onAddToCart, cart }) => {
  const [favorites, setFavorites] = useState({});
  const [trendingFoods, setTrendingFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Toggle Favorite
  const toggleFavorite = (foodId, e) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [foodId]: !prev[foodId] }));
  };

  // Add to cart
  const handleAddToCart = (food, e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(food);
    }
  };

  // Get total items in cart - add safety check
  const getTotalItems = () => {
    if (!cart || !Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  // Handle restaurant navigation
  const handleRestaurantSelect = (restaurantId) => {
    if (restaurantId) {
      navigate(`/restaurant/${restaurantId}`);
    } else {
      navigate(`/restaurants`);
    }
  };

  // Load top-rated foods from API
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const url = `${apiConfig.endpoints.foods}?sortBy=rating`;
        const data = await fetch(url).then(r => r.json());
        console.log('API Response:', data);
        const foods = Array.isArray(data) ? data.slice(0, 6) : [];
        console.log('Processed foods:', foods);
        setTrendingFoods(foods);
      } catch (e) {
        console.error('Error loading foods:', e);
        setError(e.message || "Failed to load trending foods");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="py-5 bg-light">
      <Container>
        <h2 className="text-center mb-5 fw-bold">Trending Tamil Nadu Foods</h2>

        <Row>
          {loading && (
            <div className="text-center text-muted">Loading trending foods...</div>
          )}
          {error && (
            <div className="text-center text-danger">{error}</div>
          )}
          {!loading && !error && trendingFoods.map((food) => (
              <Col md={6} lg={4} key={food._id || food.id} className="mb-4">
                <Card className="h-100 shadow-sm food-card">
                  {/* Food Image */}
                  <div className="position-relative">
                    <Card.Img
                      variant="top"
                      src={resolvePublicImage(food.image, '/images/placeholder.svg')}
                      style={{ height: "200px", objectFit: "cover" }}
                      onError={(e) => { e.currentTarget.src = resolvePublicImage('/images/placeholder.svg'); }}
                    />

                    {/* Favorite Button */}
                    <Button
                      variant="light"
                      className="position-absolute top-0 end-0 m-2 rounded-circle"
                      onClick={(e) => toggleFavorite(food._id || food.id, e)}
                    >
                      <i className={`bi ${favorites[food._id || food.id] ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
                    </Button>

                    {/* Food Badges */}
                    <div className="position-absolute top-0 start-0 m-2">
                      <Badge bg={food.isVeg ? "success" : "danger"} className="me-1">
                        {food.isVeg ? "VEG" : "NON-VEG"}
                      </Badge>
                      <Badge bg="warning" text="dark">
                        <i className="bi bi-star-fill me-1"></i>
                        {food.rating}
                      </Badge>
                    </div>
                  </div>

                  {/* Food Content */}
                  <Card.Body className="d-flex flex-column">
                    <Card.Title>{food.name}</Card.Title>
                    <Card.Text className="text-muted small">{food.description}</Card.Text>
                    
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-danger fw-bold">
                        {typeof food.price === 'number' ? `₹${food.price}` : food.price}
                      </span>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => {
                          const restaurantId = food.restaurantId || food.originalRestaurantId;
                          console.log('Restaurant ID:', restaurantId, 'Food:', food);
                          handleRestaurantSelect(restaurantId);
                        }}
                      >
                        View Restaurant
                      </Button>
                    </div>

                    <Button 
                      variant="danger" 
                      className="mt-2"
                      onClick={(e) => handleAddToCart(food, e)}
                    >
                      <i className="bi bi-cart-plus me-1"></i> Add to Cart
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
        </Row>
      </Container>
    </section>
  );
};

export default TrendingFoods;