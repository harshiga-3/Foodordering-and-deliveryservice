// src/components/OffersSection/OffersSection.jsx
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import './OffersSection.css';

const OffersSection = () => {
  const offers = [
    {
      id: 1,
      title: "20% OFF",
      description: "On all orders above ₹200",
      code: "SAVE20",
      validUntil: "31 Dec 2024",
      bgColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      id: 2,
      title: "Buy 1 Get 1 Free",
      description: "On selected desserts",
      code: "BOGO",
      validUntil: "15 Jan 2025",
 // background-color: #dc3545 !important;
      bgColor: "linear-gradient(135deg, #f093fb 0%, #dc3545 100%)"
    },
    {
      id: 3,
      title: "Free Delivery",
      description: "On orders above ₹500",
      code: "FREEDEL",
      validUntil: "30 Dec 2024",
      bgColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    },
    {
      id: 4,
      title: "30% OFF",
      description: "On first order",
      code: "FIRST30",
      validUntil: "31 Jan 2025",
      bgColor: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
    }
  ];

  return (
    <section className="offers-section py-5">
      <Container>
        <div className="text-center mb-5">
          <h2 className="offers-title">Special Offers & Discounts</h2>
          <p className="offers-subtitle">Grab these amazing deals before they expire!</p>
        </div>
        
        <Row>
          {offers.map(offer => (
            <Col lg={3} md={6} sm={6} key={offer.id} className="mb-4">
              <Card className="offer-card h-100">
                <div 
                  className="offer-header"
                  style={{ background: offer.bgColor }}
                >
                  <div className="offer-badge">
                    <Badge bg="light" text="dark" className="offer-code">
                      {offer.code}
                    </Badge>
                  </div>
                  <h3 className="offer-title">{offer.title}</h3>
                </div>
                
                <Card.Body className="d-flex flex-column">
                  <Card.Text className="offer-description">
                    {offer.description}
                  </Card.Text>
                  
                  <div className="mt-auto">
                    <small className="text-muted">
                      Valid until: {offer.validUntil}
                    </small>
                    <div className="mt-2">
                      <Badge bg="warning" text="dark" className="copy-code-btn">
                        Copy Code
                      </Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        
        <div className="text-center mt-4">
          <p className="text-muted">
            <i className="bi bi-info-circle me-2"></i>
            Terms and conditions apply. Offers cannot be combined.
          </p>
        </div>
      </Container>
    </section>
  );
};

export default OffersSection;
