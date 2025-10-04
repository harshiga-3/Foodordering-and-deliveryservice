// Add this to your App.jsx or create a separate component
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';

const FloatingCartButton = ({ cartItemsCount }) => {
  const navigate = useNavigate();

  if (cartItemsCount === 0) return null;

  return (
    <div 
      className="d-lg-none"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000
      }}
    >
      <Button 
        variant="danger" 
        className="rounded-circle p-3"
        style={{
          width: '60px',
          height: '60px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}
        onClick={() => navigate('/cart')}
      >
        <i className="bi bi-cart3 fs-4"></i>
        <Badge 
          bg="light" 
          text="dark"
          style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            fontSize: '0.7rem'
          }}
        >
          {cartItemsCount}
        </Badge>
      </Button>
    </div>
  );
};

export default FloatingCartButton;