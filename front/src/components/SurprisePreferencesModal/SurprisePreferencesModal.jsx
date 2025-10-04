import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import './SurprisePreferencesModal.css';

const SurprisePreferencesModal = ({ show, onHide, onSave, initialPreferences = {} }) => {
  const [budget, setBudget] = useState(initialPreferences.budget || 25);
  const [dietaryRestrictions, setDietaryRestrictions] = useState(initialPreferences.dietaryRestrictions || []);
  const [rememberPreferences, setRememberPreferences] = useState(true);
  const [location, setLocation] = useState(initialPreferences.location || null);

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
    { id: 'vegan', label: 'Vegan', icon: '🌱' },
    { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
    { id: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
    { id: 'nut-free', label: 'Nut-Free', icon: '🥜' },
    { id: 'halal', label: 'Halal', icon: '☪️' },
    { id: 'kosher', label: 'Kosher', icon: '✡️' }
  ];

  const budgetRanges = [
    { min: 5, max: 15, label: 'Budget ($5-$15)', color: 'success' },
    { min: 15, max: 25, label: 'Moderate ($15-$25)', color: 'warning' },
    { min: 25, max: 40, label: 'Premium ($25-$40)', color: 'info' },
    { min: 40, max: 100, label: 'Luxury ($40+)', color: 'danger' }
  ];

  const getBudgetRange = (value) => {
    return budgetRanges.find(range => value >= range.min && value <= range.max) || budgetRanges[1];
  };

  const handleDietaryToggle = (restrictionId) => {
    setDietaryRestrictions(prev => 
      prev.includes(restrictionId) 
        ? prev.filter(id => id !== restrictionId)
        : [...prev, restrictionId]
    );
  };

  const handleSave = () => {
    const preferences = {
      budget,
      dietaryRestrictions,
      rememberPreferences,
      location,
      savedAt: new Date().toISOString()
    };

    if (rememberPreferences) {
      localStorage.setItem('surprisePreferences', JSON.stringify(preferences));
    }

    onSave(preferences);
    onHide();
  };

  const handleSkip = () => {
    const defaultPreferences = {
      budget: 25,
      dietaryRestrictions: [],
      rememberPreferences: false,
      location: null,
      savedAt: new Date().toISOString()
    };
    onSave(defaultPreferences);
    onHide();
  };

  // Get user location
  useEffect(() => {
    if (navigator.geolocation && !location) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or failed:', error);
        }
      );
    }
  }, [location]);

  const currentRange = getBudgetRange(budget);

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      centered
      className="surprise-preferences-modal"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="bi bi-gear me-2"></i>
          Surprise Me Preferences
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="text-center mb-4">
          <h5 className="text-primary mb-2">🎲 Let's personalize your surprise!</h5>
          <p className="text-muted">
            Tell us your preferences so we can find the perfect dish for you.
          </p>
        </div>

        {/* Budget Range */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <i className="bi bi-currency-dollar me-2"></i>
              Budget Range
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="budget-slider-container">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-semibold">Your Budget: ${budget}</span>
                <Badge bg={currentRange.color} className="fs-6">
                  {currentRange.label}
                </Badge>
              </div>
              
              <Form.Range
                min="5"
                max="100"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value))}
                className="budget-slider"
              />
              
              <div className="d-flex justify-content-between text-muted small mt-2">
                <span>$5</span>
                <span>$100+</span>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Dietary Restrictions */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <i className="bi bi-shield-check me-2"></i>
              Dietary Restrictions
            </h6>
          </Card.Header>
          <Card.Body>
            <p className="text-muted small mb-3">
              Select any dietary restrictions or preferences you have:
            </p>
            <Row>
              {dietaryOptions.map((option) => (
                <Col md={6} key={option.id} className="mb-2">
                  <Form.Check
                    type="checkbox"
                    id={option.id}
                    label={
                      <span className="d-flex align-items-center">
                        <span className="me-2">{option.icon}</span>
                        {option.label}
                      </span>
                    }
                    checked={dietaryRestrictions.includes(option.id)}
                    onChange={() => handleDietaryToggle(option.id)}
                    className="dietary-option"
                  />
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        {/* Location */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <i className="bi bi-geo-alt me-2"></i>
              Location
            </h6>
          </Card.Header>
          <Card.Body>
            {location ? (
              <div className="text-success">
                <i className="bi bi-check-circle me-2"></i>
                Location detected! We'll find nearby restaurants.
              </div>
            ) : (
              <div className="text-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Location not available. We'll show restaurants from all areas.
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Remember Preferences */}
        <Card className="mb-4">
          <Card.Body>
            <Form.Check
              type="checkbox"
              id="rememberPreferences"
              label="Remember my preferences for future surprises"
              checked={rememberPreferences}
              onChange={(e) => setRememberPreferences(e.target.checked)}
              className="fs-6"
            />
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="outline-secondary" onClick={handleSkip}>
          Skip for Now
        </Button>
        <Button variant="primary" onClick={handleSave} className="px-4">
          <i className="bi bi-check-lg me-2"></i>
          Save Preferences
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SurprisePreferencesModal;
