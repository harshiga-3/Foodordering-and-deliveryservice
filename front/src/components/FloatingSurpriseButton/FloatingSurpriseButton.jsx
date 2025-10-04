import React from 'react';
import SurpriseMeButtonEnhanced from '../SurpriseMeButton/SurpriseMeButtonEnhanced';
import './FloatingSurpriseButton.css';

const FloatingSurpriseButton = ({ onAddToCart, onRestaurantClick }) => {
  return (
    <div className="floating-surprise-container">
      <SurpriseMeButtonEnhanced
        onAddToCart={onAddToCart}
        onRestaurantClick={onRestaurantClick}
        position="floating"
        size="lg"
        className="floating-surprise-btn"
      />
    </div>
  );
};

export default FloatingSurpriseButton;
