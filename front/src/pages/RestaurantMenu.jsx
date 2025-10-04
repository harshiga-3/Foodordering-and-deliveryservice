// src/pages/RestaurantMenu.jsx
import React from 'react';
import RestaurantDetail from '../components/RestaurantDetail/RestaurantDetail';

const RestaurantMenu = ({ restaurant, onBack }) => {
  return (
    <RestaurantDetail 
  restaurant={selectedRestaurant} 
  onBack={handleBackToHome}
  onAddToCart={handleAddToCart}
  cart={cart}
/>
  );
};

export default RestaurantMenu;