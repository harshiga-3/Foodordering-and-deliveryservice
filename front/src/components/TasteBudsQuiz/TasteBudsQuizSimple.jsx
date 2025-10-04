import React, { useState, useEffect, useMemo } from 'react';
// import { useAuth } from '../../context/AuthContext';
import { apiConfig } from '../../utils/apiConfig';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Alert from 'react-bootstrap/Alert';
import './TasteBudsQuiz.css';

const TasteBudsQuizSimple = ({ onComplete, onClose }) => {
  // const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState({ cuisines: [], categories: [] });

  useEffect(() => {
    let isMounted = true;
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [restaurantsRes, foodsRes] = await Promise.all([
          fetch(apiConfig.endpoints.restaurants).then(r => r.json()).catch(() => []),
          fetch(apiConfig.endpoints.foods).then(r => r.json()).catch(() => [])
        ]);

        const cuisinesSet = new Set();
        const categoriesSet = new Set();

        if (Array.isArray(restaurantsRes)) {
          restaurantsRes.forEach(r => {
            if (r?.cuisine) {
              String(r.cuisine)
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
                .forEach(c => cuisinesSet.add(c));
            }
            if (Array.isArray(r?.tags)) {
              r.tags.forEach(tag => categoriesSet.add(String(tag).trim()));
            }
          });
        }

        const foods = Array.isArray(foodsRes?.items) ? foodsRes.items : (Array.isArray(foodsRes) ? foodsRes : []);
        foods.forEach(f => {
          if (f?.category) categoriesSet.add(String(f.category).trim());
          if (f?.restaurant?.cuisine) {
            String(f.restaurant.cuisine)
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
              .forEach(c => cuisinesSet.add(c));
          }
        });

        if (isMounted) {
          setDynamicOptions({
            cuisines: Array.from(cuisinesSet).sort(),
            categories: Array.from(categoriesSet).sort()
          });
        }
      } catch {
        // ignore and keep defaults
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    };
    loadOptions();
    return () => { isMounted = false; };
  }, []);

  const defaultCuisineOptions = [
    'South Indian', 'North Indian', 'Chinese', 'Italian', 'Mexican', 
    'Thai', 'Continental', 'Fast Food', 'Street Food', 'Desserts'
  ];

  const defaultCategoryOptions = [
    'Curries', 'Rice Dishes', 'Breads', 'Snacks', 'Desserts', 'Beverages', 'Soups'
  ];

  const cuisineOptions = useMemo(() => (
    dynamicOptions.cuisines.length ? dynamicOptions.cuisines : defaultCuisineOptions
  ), [dynamicOptions.cuisines]);

  const categoryOptions = useMemo(() => (
    dynamicOptions.categories.length ? dynamicOptions.categories : defaultCategoryOptions
  ), [dynamicOptions.categories]);

  const questions = [
    {
      id: 'cuisines',
      question: 'What cuisines do you enjoy? (Select all that apply)',
      type: 'multiple',
      options: cuisineOptions
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
      options: categoryOptions
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

  const handleSubmit = () => {
    setLoading(true);

    // Convert answers to taste profile format
    const preferences = convertAnswersToPreferences(answers);
    const quizResponses = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
      timestamp: new Date()
    }));

    // Create taste profile
    const tasteProfile = {
      preferences,
      quizResponses,
      isComplete: true,
      completionPercentage: 100,
      savedLocally: true,
      userId: 'anonymous'
    };

    // Save to localStorage
    try {
      localStorage.setItem('tasteProfile', JSON.stringify(tasteProfile));
      console.log('Taste profile saved locally:', tasteProfile);
      
      // Show completion
      setTimeout(() => {
        setIsComplete(true);
        if (onComplete) {
          onComplete(tasteProfile);
        }
      }, 1000);
    } catch (err) {
      console.error('Error saving taste profile:', err);
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
                  Your personalized taste profile has been saved successfully! 
                  We'll now show you recommendations tailored to your preferences!
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

export default TasteBudsQuizSimple;
