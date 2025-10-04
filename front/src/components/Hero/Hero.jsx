// src/components/Hero/Hero.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import TasteBudsQuizSimple from '../TasteBudsQuiz/TasteBudsQuizSimple';
import SurpriseMeButton from '../SurpriseMeButton/SurpriseMeButton';
import './Hero.css';

const Hero = ({ onAddToCart, onRestaurantClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showQuiz, setShowQuiz] = useState(false);
  const [hasTasteProfile, setHasTasteProfile] = useState(false);

  const handleQuizComplete = (tasteProfile) => {
    setHasTasteProfile(true);
    setShowQuiz(false);
  };

  const handleStartQuiz = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowQuiz(true);
  };

  return (
    <>
      <section className="bg-danger bg-gradient text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <h1 className="display-4 fw-bold mb-4">
                Authentic Tamil Nadu Food Delivered to You
              </h1>
              <p className="lead mb-4">
                Experience the rich flavors of Tamil Nadu's culinary heritage with our 
                carefully curated dishes from the best local restaurants.
              </p>
              <div className="d-flex flex-wrap gap-2 mb-4 justify-content-center">
                {user && (
                  <Button
                    variant="warning"
                    size="lg"
                    className="px-4 rounded-pill"
                    onClick={handleStartQuiz}
                  >
                    <i className="bi bi-question-circle me-2"></i>
                    Taste Quiz
                  </Button>
                )}
              </div>
              
              {/* Surprise Me Button */}
              <div className="mt-4">
                <SurpriseMeButton 
                  onAddToCart={onAddToCart}
                  onRestaurantClick={onRestaurantClick}
                  className="hero-surprise-btn"
                />
              </div>
            </Col>
            <Col lg={6}>
              <img 
                src="images/TrendingFood/f1.jpg" 
                alt="Tamil Nadu Cuisine" 
                className="img-fluid rounded shadow"
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Taste Buds Quiz Modal */}
      <Modal 
        show={showQuiz} 
        onHide={() => setShowQuiz(false)}
        size="lg"
        centered
        className="taste-quiz-modal"
      >
        <Modal.Body className="p-0">
          <TasteBudsQuizSimple 
            onComplete={handleQuizComplete}
            onClose={() => setShowQuiz(false)}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Hero;