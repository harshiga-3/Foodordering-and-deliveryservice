import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './DashboardNav.css';

const DashboardNav = () => {
  return (
    <div className="dashboard-nav">
      <Container className="py-4">
        <Row className="mb-4">
          <Col className="text-center">
            <h1 className="display-5 fw-bold text-primary mb-3">
              <i className="bi bi-person-circle me-3"></i>
              My Dashboard
            </h1>
            <p className="lead text-muted">
              Manage your orders, favorites, and account
            </p>
          </Col>
        </Row>

        <Row>
          <Col lg={4} md={6} className="mb-4">
            <Card className="dashboard-card h-100 shadow-sm">
              <Card.Body className="text-center">
                <div className="dashboard-icon mb-3">
                  <i className="bi bi-receipt display-1 text-primary"></i>
                </div>
                <Card.Title className="h4 mb-3">Order History</Card.Title>
                <Card.Text className="text-muted mb-4">
                  View all your past orders, track delivery status, and manage your order history.
                </Card.Text>
                <Link to="/orders">
                  <Button variant="primary" size="lg" className="w-100">
                    <i className="bi bi-arrow-right me-2"></i>
                    View Orders
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} className="mb-4">
            <Card className="dashboard-card h-100 shadow-sm">
              <Card.Body className="text-center">
                <div className="dashboard-icon mb-3">
                  <i className="bi bi-heart display-1 text-danger"></i>
                </div>
                <Card.Title className="h4 mb-3">My Favorites</Card.Title>
                <Card.Text className="text-muted mb-4">
                  Access your saved favorite food items and quickly reorder them.
                </Card.Text>
                <Link to="/favorites">
                  <Button variant="danger" size="lg" className="w-100">
                    <i className="bi bi-arrow-right me-2"></i>
                    View Favorites
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} className="mb-4">
            <Card className="dashboard-card h-100 shadow-sm">
              <Card.Body className="text-center">
                <div className="dashboard-icon mb-3">
                  <i className="bi bi-cart display-1 text-success"></i>
                </div>
                <Card.Title className="h4 mb-3">Shopping Cart</Card.Title>
                <Card.Text className="text-muted mb-4">
                  Continue shopping or proceed to checkout with items in your cart.
                </Card.Text>
                <Link to="/cart">
                  <Button variant="success" size="lg" className="w-100">
                    <i className="bi bi-arrow-right me-2"></i>
                    View Cart
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col className="text-center">
            <div className="quick-actions">
              <h5 className="mb-3">Quick Actions</h5>
              <div className="d-flex gap-3 justify-content-center">
                <Link to="/food">
                  <Button variant="outline-primary" size="lg">
                    <i className="bi bi-plus-circle me-2"></i>
                    Browse Food Items
                  </Button>
                </Link>
                <Link to="/restaurants">
                  <Button variant="outline-info" size="lg">
                    <i className="bi bi-shop me-2"></i>
                    View Restaurants
                  </Button>
                </Link>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DashboardNav;
