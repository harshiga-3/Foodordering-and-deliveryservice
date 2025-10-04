// components/LoginModal.jsx
import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const LoginModal = ({ show, onHide, onLogin }) => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    role: 'user'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(loginData);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Login to Your Account</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Select Role</Form.Label>
            <Form.Select 
              name="role" 
              value={loginData.role} 
              onChange={handleInputChange}
            >
              <option value="user">User</option>
              <option value="restaurant">Restaurant Owner</option>
              <option value="delivery">Delivery Partner</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email address</Form.Label>
            <Form.Control 
              type="email" 
              placeholder="Enter email" 
              name="email"
              value={loginData.email}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control 
              type="password" 
              placeholder="Password" 
              name="password"
              value={loginData.password}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check type="checkbox" label="Remember me" />
          </Form.Group>

          <div className="text-center mb-3">
            <a href="#forgot-password">Forgot password?</a>
          </div>

          {/* Google Sign In Button */}
          <div className="text-center mb-3">
            <Button 
              variant="outline-danger" 
              className="w-100 mb-2"
              onClick={() => {
                // Handle Google sign in
                console.log('Google sign in clicked');
              }}
            >
              <i className="fab fa-google me-2"></i>
              Continue with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="text-center mb-3">
            <hr className="my-2" />
            <small className="text-muted">OR</small>
            <hr className="my-2" />
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <small className="text-muted">
              Don't have an account?{' '}
              <a href="#signup" className="text-danger text-decoration-none fw-semibold">
                Sign up here
              </a>
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" type="submit" className="w-100">
            Login
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default LoginModal;