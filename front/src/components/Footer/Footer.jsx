// components/Footer.jsx
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-5 mt-5">
      <Container>
        <Row>
          <Col md={4} className="mb-4">
            <h5 className="text-danger">Tamil Nadu Foods</h5>
            <p>Delivering authentic Tamil Nadu cuisine to your doorstep.</p>
            <div className="d-flex gap-3">
              <a href="#" className="text-light"><i className="bi bi-facebook"></i></a>
              <a href="#" className="text-light"><i className="bi bi-twitter"></i></a>
              <a href="#" className="text-light"><i className="bi bi-instagram"></i></a>
              <a href="#" className="text-light"><i className="bi bi-linkedin"></i></a>
            </div>
          </Col>
          
          <Col md={2} className="mb-4">
            <h6>Quick Links</h6>
            <ul className="list-unstyled">
              <li><a href="#" className="text-light text-decoration-none">Home</a></li>
              <li><a href="#" className="text-light text-decoration-none">Restaurants</a></li>
              <li><a href="#" className="text-light text-decoration-none">About Us</a></li>
              <li><a href="#" className="text-light text-decoration-none">Contact</a></li>
            </ul>
          </Col>
          
          <Col md={2} className="mb-4">
            <h6>Cities</h6>
            <ul className="list-unstyled">
              <li><a href="#" className="text-light text-decoration-none">Chennai</a></li>
              <li><a href="#" className="text-light text-decoration-none">Coimbatore</a></li>
              <li><a href="#" className="text-light text-decoration-none">Madurai</a></li>
              <li><a href="#" className="text-light text-decoration-none">Trichy</a></li>
            </ul>
          </Col>
          
          <Col md={4}>
            <h6>Contact Us</h6>
            <p><i className="bi bi-geo-alt me-2"></i> 123 Food Street, Chennai</p>
            <p><i className="bi bi-telephone me-2"></i> +91 98765 43210</p>
            <p><i className="bi bi-envelope me-2"></i> info@tamilnadufoods.com</p>
            
            
          </Col>
        </Row>
        
      </Container>
    </footer>
  );
};

export default Footer;