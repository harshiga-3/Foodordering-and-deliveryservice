// src/components/Header/Header.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import CartPopup from '../CartPopup/CartPopup';
import './Header.css';
import { useAuth } from '../../context/AuthContext';

const Header = ({ cartItemsCount, cart, onUpdateCart }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartPopup, setShowCartPopup] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/food?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleCartClick = () => {
    setShowCartPopup(true);
  };

  return (
    <>
      <Navbar bg="white" expand="lg" className="px-3 shadow-sm">
        <Navbar.Brand 
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
          className="brand-logo"
        >
          <i className="bi bi-egg-fried me-2 text-danger"></i>
          <strong>Tamil Nadu Foods</strong>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link onClick={() => navigate('/')} className="nav-link-custom">
              <i className="bi bi-house me-1"></i>Home
            </Nav.Link>
            <Nav.Link onClick={() => navigate('/food')} className="nav-link-custom">
              <i className="bi bi-egg-fried me-1"></i>Food Items
            </Nav.Link>
            <Nav.Link onClick={() => navigate('/restaurants')} className="nav-link-custom">
              <i className="bi bi-shop me-1"></i>Restaurants
            </Nav.Link>
          </Nav>
          
          {/* Search Bar */}
          <Form onSubmit={handleSearch} className="d-flex mx-3 flex-grow-1" style={{ maxWidth: '500px' }}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search for food, restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <Button 
                variant="danger" 
                type="submit"
                className="search-btn"
              >
                <i className="bi bi-search"></i>
              </Button>
            </InputGroup>
          </Form>
          
          {/* Auth Buttons */}
          <div className="d-flex align-items-center gap-2 me-2">
            {!user ? (
              <>
                <Button variant="outline-secondary" onClick={() => navigate('/login')}>Login</Button>
                <Button variant="danger" onClick={() => navigate('/signup')}>Sign Up</Button>
              </>
            ) : (
              <>
                <Button variant="outline-primary" onClick={() => navigate('/dashboard')}>
                  <i className="bi bi-person-circle me-1"></i>
                  {user.name} ({user.role})
                </Button>
                <Button variant="outline-secondary" onClick={logout}>Logout</Button>
              </>
            )}
          </div>

          {/* Cart Button */}
          <div className="d-flex gap-2">
            <Button 
              variant="outline-danger" 
              onClick={handleCartClick}
              className="cart-btn d-flex align-items-center"
            >
              <i className="bi bi-cart3 me-2"></i>
              Cart
              {cartItemsCount > 0 && (
                <Badge bg="danger" className="ms-2 cart-badge">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
          </div>
        </Navbar.Collapse>
      </Navbar>

      {/* Cart Popup */}
      <CartPopup
        show={showCartPopup}
        onHide={() => setShowCartPopup(false)}
        cart={cart}
        onUpdateCart={onUpdateCart}
      />
    </>
  );
};

export default Header;