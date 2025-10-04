// components/SignupModal.jsx
import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tabs from 'react-bootstrap/Tabs'; 
import Tab from 'react-bootstrap/Tab';

const SignupModal = ({ show, onHide, onSignup }) => {
  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    // Restaurant-specific fields
    restaurantName: '',
    restaurantAddress: '',
    fssaiLicense: '',
    // Delivery-specific fields
    vehicleType: '',
    licenseNumber: '',
    vehicleNumber: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSignupData({
      ...signupData,
      [name]: value
    });
  };

  const handleRoleChange = (role) => {
    setSignupData({
      ...signupData,
      role: role
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (signupData.password !== signupData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    
    onSignup(signupData);
  };

  const renderRoleSpecificFields = () => {
    switch(signupData.role) {
      case 'restaurant':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Restaurant Name</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter restaurant name" 
                name="restaurantName"
                value={signupData.restaurantName}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Restaurant Address</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                placeholder="Enter complete address" 
                name="restaurantAddress"
                value={signupData.restaurantAddress}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>FSSAI License Number</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter FSSAI license number" 
                name="fssaiLicense"
                value={signupData.fssaiLicense}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </>
        );
      case 'delivery':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Vehicle Type</Form.Label>
              <Form.Select 
                name="vehicleType" 
                value={signupData.vehicleType}
                onChange={handleInputChange}
                required
              >
                <option value="">Select vehicle type</option>
                <option value="bicycle">Bicycle</option>
                <option value="bike">Motorcycle</option>
                <option value="car">Car</option>
                <option value="scooter">Scooter</option>
              </Form.Select>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>License Number</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Enter license number" 
                    name="licenseNumber"
                    value={signupData.licenseNumber}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vehicle Number</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Enter vehicle number" 
                    name="vehicleNumber"
                    value={signupData.vehicleNumber}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Create an Account</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-4">
            <Form.Label className="mb-2">I want to join as:</Form.Label>
            <div className="d-flex gap-2">
              <Button
                variant={signupData.role === 'user' ? 'danger' : 'outline-secondary'}
                onClick={() => handleRoleChange('user')}
                className="flex-fill"
              >
                <i className="bi bi-person me-1"></i> User
              </Button>
              <Button
                variant={signupData.role === 'restaurant' ? 'danger' : 'outline-secondary'}
                onClick={() => handleRoleChange('restaurant')}
                className="flex-fill"
              >
                <i className="bi bi-shop me-1"></i> Restaurant Owner
              </Button>
              <Button
                variant={signupData.role === 'delivery' ? 'danger' : 'outline-secondary'}
                onClick={() => handleRoleChange('delivery')}
                className="flex-fill"
              >
                <i className="bi bi-bicycle me-1"></i> Delivery Partner
              </Button>
            </div>
          </div>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Enter your name" 
                  name="fullName"
                  value={signupData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control 
                  type="email" 
                  placeholder="Enter email" 
                  name="email"
                  value={signupData.email}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control 
                  type="password" 
                  placeholder="Password" 
                  name="password"
                  value={signupData.password}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control 
                  type="password" 
                  placeholder="Confirm Password" 
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          {renderRoleSpecificFields()}

          <Form.Group className="mb-3">
            <Form.Check 
              type="checkbox" 
              label={
                <>
                  I agree to the <a href="#terms">Terms and Conditions</a> and <a href="#privacy">Privacy Policy</a>
                </>
              } 
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          <Button variant="danger" type="submit">
            Sign Up
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SignupModal;