import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Alert from 'react-bootstrap/Alert';
import './TasteBudsQuiz.css';

const TasteBudsQuiz = ({ onComplete, onClose }) => {
  const { user, token, API_BASE } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [savedLocally, setSavedLocally] = useState(false);

  const questions = [
    {
      id: 'cuisines',
      question: 'What cuisines do you enjoy? (Select all that apply)',
      type: 'multiple',
      options: [
        'South Indian', 'North Indian', 'Chinese', 'Italian', 'Mexican', 
        'Thai', 'Continental', 'Fast Food', 'Street Food', 'Desserts'
      ]
    },
    {
      id: 'spiceLevel',
      question: 'How spicy do you like your food?',
      type: 'single',
      options: ['Mild', 'Medium', 'Hot', 'Very Hot']
    },
    {
      id: 'dietaryRestrictions',
      question: 'Do you have any dietary restrictions? (Select all that apply)',
      type: 'multiple',
      options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'None']
    },
    {
      id: 'categories',
      question: 'What food categories do you prefer? (Select all that apply)',
      type: 'multiple',
      options: ['Curries', 'Rice Dishes', 'Breads', 'Snacks', 'Desserts', 'Beverages', 'Soups']
    },
    {
      id: 'priceRange',
      question: 'What\'s your typical budget for a meal?',
      type: 'single',
      options: ['Under ₹100', '₹100-300', '₹300-500', '₹500-800', 'Above ₹800']
    },
    {
      id: 'mealTypes',
      question: 'When do you usually order food? (Select all that apply)',
      type: 'multiple',
      options: ['Breakfast', 'Lunch', 'Dinner', 'Late Night Snacks', 'Anytime']
    },
    {
      id: 'textures',
      question: 'What textures do you enjoy in food? (Select all that apply)',
      type: 'multiple',
      options: ['Crispy', 'Soft', 'Creamy', 'Crunchy', 'Chewy', 'Smooth']
    },
    {
      id: 'flavors',
      question: 'What flavors do you prefer? (Select all that apply)',
      type: 'multiple',
      options: ['Sweet', 'Sour', 'Spicy', 'Bitter', 'Umami', 'Tangy']
    },
    {
      id: 'cookingStyle',
      question: 'What cooking styles do you prefer? (Select all that apply)',
      type: 'multiple',
      options: ['Fried', 'Grilled', 'Steamed', 'Curried', 'Raw/Salad', 'Baked']
    },
    {
      id: 'frequency',
      question: 'How often do you order food?',
      type: 'single',
      options: ['Daily', '2-3 times a week', 'Weekly', 'Monthly', 'Rarely']
    }
  ];

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Convert answers to taste profile format
      const preferences = convertAnswersToPreferences(answers);
      const quizResponses = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
        timestamp: new Date()
      });

      console.log('Submitting taste profile:', { preferences, quizResponses });
      console.log('API Base:', API_BASE);
      console.log('Token present:', !!token);

      // Check if API_BASE is valid
      if (!API_BASE || API_BASE.includes('undefined')) {
        throw new Error('API configuration error. Please check your environment variables.');
      }

      const response = await fetch(`${API_BASE}/api/taste-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          preferences,
          quizResponses
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        // Check if response is HTML (server error page)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Server is not responding properly. Please check if the backend server is running.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const tasteProfile = await response.json();
      console.log('Taste profile saved:', tasteProfile);
      setIsComplete(true);
      
      if (onComplete) {
        onComplete(tasteProfile);
      }
    } catch (err) {
      console.error('Taste profile error:', err);
      
      // If it's a network error or server not responding, show a friendly message
      if (err.message.includes('Failed to fetch') || 
          err.message.includes('NetworkError') || 
          err.message.includes('Server is not responding')) {
        setError('Backend server is not running. Your quiz responses have been saved locally. Please start the backend server to save your taste profile.');
        
        // Save locally as fallback
        const localProfile = {
          preferences: convertAnswersToPreferences(answers),
          quizResponses: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
            timestamp: new Date()
          })),
          isComplete: true,
          completionPercentage: 100,
          savedLocally: true
        };
        
        localStorage.setItem('tasteProfile', JSON.stringify(localProfile));
        console.log('Saved taste profile locally:', localProfile);
        setSavedLocally(true);
        
        // Still show completion after a delay
        setTimeout(() => {
          setIsComplete(true);
          if (onComplete) {
            onComplete(localProfile);
          }
        }, 2000);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const convertAnswersToPreferences = (answers) => {
    const preferences = {};

    // Convert cuisines
    if (answers.cuisines) {
      preferences.cuisines = answers.cuisines;
    }

    // Convert spice level
    if (answers.spiceLevel) {
      preferences.spiceLevel = answers.spiceLevel.toLowerCase().replace(' ', '-');
    }

    // Convert dietary restrictions
    if (answers.dietaryRestrictions) {
      preferences.dietaryRestrictions = answers.dietaryRestrictions
        .filter(restriction => restriction !== 'None')
        .map(restriction => restriction.toLowerCase().replace(' ', '-'));
    }

    // Convert categories
    if (answers.categories) {
      preferences.categories = answers.categories.map(category => 
        category.toLowerCase().replace(' ', '-')
      );
    }

    // Convert price range
    if (answers.priceRange) {
      const priceRanges = {
        'Under ₹100': { min: 0, max: 100 },
        '₹100-300': { min: 100, max: 300 },
        '₹300-500': { min: 300, max: 500 },
        '₹500-800': { min: 500, max: 800 },
        'Above ₹800': { min: 800, max: 2000 }
      };
      preferences.priceRange = priceRanges[answers.priceRange];
    }

    // Convert meal types
    if (answers.mealTypes) {
      preferences.mealTypes = answers.mealTypes.map(meal => 
        meal.toLowerCase().replace(' ', '-')
      );
    }

    // Convert textures
    if (answers.textures) {
      preferences.textures = answers.textures.map(texture => 
        texture.toLowerCase()
      );
    }

    // Convert flavors
    if (answers.flavors) {
      preferences.flavors = answers.flavors.map(flavor => 
        flavor.toLowerCase()
      );
    }

    return preferences;
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  if (isComplete) {
    return (
      <Container className="taste-buds-quiz">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="text-center">
              <Card.Body className="py-5">
                <div className="success-icon mb-4">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                </div>
                <h2 className="text-success mb-3">Taste Profile Created! 🎉</h2>
                <p className="lead mb-4">
                  {savedLocally ? (
                    <>
                      Your personalized taste profile has been saved locally! 
                      <br />
                      <small className="text-muted">
                        (It will be synced to the server when the backend is available)
                      </small>
                    </>
                  ) : (
                    <>
                      Your personalized taste profile has been created successfully. 
                      We'll now show you recommendations tailored to your preferences!
                    </>
                  )}
                </p>
                <Button 
                  variant="success" 
                  size="lg" 
                  onClick={onClose}
                  className="px-5"
                >
                  Start Exploring
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="taste-buds-quiz">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header className="text-center bg-primary text-white">
              <h3 className="mb-0">🍽️ Taste Buds Quiz</h3>
              <p className="mb-0">Help us personalize your food experience</p>
            </Card.Header>
            <Card.Body className="p-4">
              {error && (
                <Alert variant="warning" className="mb-4">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                  {error.includes('Backend server is not running') && (
                    <div className="mt-2">
                      <small>
                        Don't worry! Your quiz responses are saved locally and will be synced when the server is available.
                      </small>
                    </div>
                  )}
                </Alert>
              )}

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Question {currentQuestion + 1} of {questions.length}</span>
                  <span className="text-muted">{Math.round(progress)}% Complete</span>
                </div>
                <ProgressBar now={progress} className="mb-3" />
              </div>

              <div className="question-section mb-4">
                <h4 className="question-text mb-4">{currentQ.question}</h4>
                
                <div className="options-container">
                  {currentQ.options.map((option, index) => {
                    const isSelected = currentQ.type === 'single' 
                      ? answers[currentQ.id] === option
                      : answers[currentQ.id]?.includes(option);

                    return (
                      <div 
                        key={index}
                        className={`option-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (currentQ.type === 'single') {
                            handleAnswer(currentQ.id, option);
                          } else {
                            const currentAnswers = answers[currentQ.id] || [];
                            const newAnswers = currentAnswers.includes(option)
                              ? currentAnswers.filter(ans => ans !== option)
                              : [...currentAnswers, option];
                            handleAnswer(currentQ.id, newAnswers);
                          }
                        }}
                      >
                        <div className="option-content">
                          <span className="option-text">{option}</span>
                          {isSelected && (
                            <i className="bi bi-check-circle-fill text-primary"></i>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="navigation-buttons d-flex justify-content-between">
                <Button 
                  variant="outline-secondary" 
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Previous
                </Button>
                
                <Button 
                  variant="primary" 
                  onClick={handleNext}
                  disabled={!answers[currentQ.id] || (Array.isArray(answers[currentQ.id]) && answers[currentQ.id].length === 0)}
                  className="px-4"
                >
                  {currentQuestion === questions.length - 1 ? (
                    <>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creating Profile...
                        </>
                      ) : (
                        <>
                          Complete Quiz
                          <i className="bi bi-check ms-2"></i>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      Next
                      <i className="bi bi-arrow-right ms-2"></i>
                    </>
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TasteBudsQuiz;
