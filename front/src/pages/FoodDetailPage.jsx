// src/pages/FoodDetailPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import FoodDetail from '../components/FoodDetail/FoodDetail';

const FoodDetailPage = ({ onBack, onAddToCart }) => {
  const { id } = useParams();
  
  return (
    <FoodDetail 
      foodId={id}
      onBack={onBack}
      onAddToCart={onAddToCart}
    />
  );
};

export default FoodDetailPage;