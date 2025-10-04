// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero/Hero';
import TrendingFoods from '../components/TrendingFoods/TrendingFoods';
import FavoriteRestaurants from '../components/FavoriteRestaurants/FavoriteRestaurants';
import BestSellingCombos from '../components/BestSellingCombos/BestSellingCombos';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations/PersonalizedRecommendations';

const Home = ({ onRestaurantClick, onAddToCart, cart }) => {
  const navigate = useNavigate();

  const handleRestaurantClick = (restaurantOrId) => {
    try {
      const id = typeof restaurantOrId === 'string' ? restaurantOrId : (restaurantOrId?._id || restaurantOrId?.id);
      if (id) navigate(`/restaurant/${id}`);
    } catch {}
    if (onRestaurantClick) onRestaurantClick(restaurantOrId);
  };

  return (
    <>
      <Hero 
        onRestaurantClick={handleRestaurantClick}
        onAddToCart={onAddToCart}
      />
      <PersonalizedRecommendations 
        onAddToCart={onAddToCart}
        onRestaurantClick={handleRestaurantClick}
      />
      <BestSellingCombos 
        onAddToCart={onAddToCart}
        onRestaurantClick={handleRestaurantClick}
      />
      <TrendingFoods 
        onAddToCart={onAddToCart} 
        cart={cart}
        onRestaurantClick={handleRestaurantClick}
      />
      <FavoriteRestaurants onRestaurantClick={handleRestaurantClick}
        cart={cart}
 />
    </>
  );
};

export default Home;