// src/pages/CartPage.jsx
import React from 'react';
import Cart from '../components/Cart/Cart';

const CartPage = ({ cart, onUpdateCart, onBack, user }) => {
  return (
    <Cart
      cart={cart}
      onUpdateCart={onUpdateCart}
      onBack={onBack}
      user={user}
    />
  );
};

export default CartPage;