import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Table, ListGroup, Form } from 'react-bootstrap';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiConfig, makeAuthenticatedRequest } from '../utils/apiConfig';
import { reviewsAPI, userAPI } from '../utils/api';
import ReviewForm from '../components/ReviewForm/ReviewForm';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalOrders: 0, totalFavorites: 0, cartItems: 0, recentOrders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [activeReview, setActiveReview] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => { if (user) loadDashboardData(); }, [user]);
  useEffect(() => {
    const onChange = () => loadDashboardData();
    window.addEventListener('favorites:changed', onChange);
    window.addEventListener('orders:changed', onChange);
    window.addEventListener('cart:changed', onChange);
    return () => {
      window.removeEventListener('favorites:changed', onChange);
      window.removeEventListener('orders:changed', onChange);
      window.removeEventListener('cart:changed', onChange);
    };
  }, []);

  const loadDashboardData = async () => {
    setLoading(true); setError('');
    try {
      let favoritesCount = 0; let favoritesList = [];
      try { const favResp = await makeAuthenticatedRequest(apiConfig.endpoints.favorites); favoritesCount = favResp.length; favoritesList = favResp; } catch {}
      let ordersCount = 0; let ordersList = [];
      try { const ordersResponse = await makeAuthenticatedRequest(`${apiConfig.endpoints.orders}/my-orders`); const arr = Array.isArray(ordersResponse?.orders) ? ordersResponse.orders : (Array.isArray(ordersResponse) ? ordersResponse : []); ordersCount = arr.length; ordersList = arr; } catch {}
      const cartLocal = JSON.parse(localStorage.getItem('cart') || '[]');
      setStats({ totalOrders: ordersCount, totalFavorites: favoritesCount, cartItems: cartLocal.length, recentOrders: [] });
      setOrders(ordersList); setCartItems(cartLocal); setFavorites(favoritesList);
      try { const reviews = await reviewsAPI.getUserReviews(); setUserReviews(Array.isArray(reviews) ? reviews : (reviews?.reviews || [])); } catch {}
      try { const me = await userAPI.getProfile(); setProfile(me); } catch {}
    } catch (e) { setError(e.message || 'Failed to load dashboard data'); } finally { setLoading(false); }
  };

  const pendingCount = orders.filter(o => (o.orderStatus || '').toLowerCase() === 'pending').length || 0;
  const cartCount = cartItems.length || 0; const favoritesCount = favorites.length || 0; const reviewsCount = userReviews.length || 0;

  if (loading) return (
    <Container className="py-5 text-center"><Spinner animation="border" variant="danger" size="lg" /><p className="mt-3">Loading your dashboard...</p></Container>
  );

  return (
    <div className="user-dashboard">
      <Container fluid className="py-4">
        <Row>
          {/* Sidebar */}
          <Col lg={3} className="mb-4">
            <Card className="sidebar-card">
              <div className="p-4 border-bottom user-profile">
                <div className="avatar mb-3"><i className="fa-regular fa-user" /></div>
                <h5 className="text-center">{user?.name || 'User'}</h5>
                <p className="text-center mb-0">{user?.email || ''}</p>
              </div>
              <ListGroup variant="flush" className="sidebar-nav">
                <ListGroup.Item
                  as={NavLink}
                  end
                  to="/dashboard"
                  className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                >
                  <i className="fa-solid fa-gauge-high me-2"></i>Dashboard
                </ListGroup.Item>
                <ListGroup.Item
                  as={NavLink}
                  to="/orders"
                  className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                >
                  <i className="fa-regular fa-rectangle-list me-2"></i>Orders
                </ListGroup.Item>
                <ListGroup.Item
                  as={NavLink}
                  to="/cart"
                  className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                >
                  <i className="fa-solid fa-cart-shopping me-2"></i>Cart
                </ListGroup.Item>
                <ListGroup.Item
                  as={NavLink}
                  to="/favorites"
                  className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                >
                  <i className="fa-regular fa-heart me-2"></i>Favorites
                </ListGroup.Item>
                <ListGroup.Item
                  as={NavLink}
                  to="/reviews"
                  className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                >
                  <i className="fa-regular fa-star me-2"></i>Reviews
                </ListGroup.Item>
                <ListGroup.Item
                  as={NavLink}
                  to="/account"
                  className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                >
                  <i className="fa-solid fa-user-gear me-2"></i>Account
                </ListGroup.Item>
              </ListGroup>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={9}>
            <div className="main-content p-3 p-md-4">
              {/* Header */}
              <div className="mb-4">
                <h2 className="mb-2" style={{ color: '#212529' }}>Dashboard</h2>
                <div style={{ height: 3, width: 72, background: '#D32F2F', borderRadius: 9999 }} />
              </div>

              {/* Metrics */}
              <Row className="g-4 mb-4">
                <Col md={6} xl={3}><Card className="stats-card h-100"><Card.Body className="text-center"><div className="stats-icon mb-2"><i className="fa-solid fa-hourglass-half fa-2x"></i></div><div className="display-6 fw-bold" style={{ color: '#D32F2F' }}>{pendingCount}</div><div className="text-muted">Pending Orders</div></Card.Body></Card></Col>
                <Col md={6} xl={3}><Card className="stats-card h-100"><Card.Body className="text-center"><div className="stats-icon mb-2"><i className="fa-solid fa-cart-shopping fa-2x"></i></div><div className="display-6 fw-bold" style={{ color: '#D32F2F' }}>{cartCount}</div><div className="text-muted">Cart Items</div></Card.Body></Card></Col>
                <Col md={6} xl={3}><Card className="stats-card h-100"><Card.Body className="text-center"><div className="stats-icon mb-2"><i className="fa-regular fa-heart fa-2x"></i></div><div className="display-6 fw-bold" style={{ color: '#D32F2F' }}>{favoritesCount}</div><div className="text-muted">Favorites</div></Card.Body></Card></Col>
                <Col md={6} xl={3}><Card className="stats-card h-100"><Card.Body className="text-center"><div className="stats-icon mb-2"><i className="fa-regular fa-star fa-2x"></i></div><div className="display-6 fw-bold" style={{ color: '#D32F2F' }}>{reviewsCount}</div><div className="text-muted">Reviews</div></Card.Body></Card></Col>
              </Row>

              {/* Recent Orders */}
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0" style={{ color: '#374151' }}>Recent Orders</h5>
                  <Link to="/orders"><Button variant="outline-danger" size="sm"><i className="fa-regular fa-eye me-2"></i>View All</Button></Link>
                </Card.Header>
                <Card.Body>
                  <Table responsive bordered hover className="mb-0 orders-table">
                    <thead>
                      <tr><th>Order ID</th><th>Date</th><th>Status</th><th>Total</th><th>Delivery Partner</th></tr>
                    </thead>
                    <tbody>
                      {(orders.slice(0,6)).map(o => (
                        <tr key={o._id}>
                          <td>#{o.orderId}</td>
                          <td>{new Date(o.createdAt).toLocaleString()}</td>
                          <td>
                            <Badge bg={(o.orderStatus === 'delivered' || o.orderStatus === 'confirmed') ? 'success' : (o.orderStatus === 'pending' ? 'warning' : 'secondary')}>
                              {(o.orderStatus || 'pending').replace('_',' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td>₹{(o.finalAmount ?? o.totalAmount)}</td>
                          <td>{o.assignedTo ? (o.assignedTo.name || o.assignedTo.email || 'Assigned') : 'Not assigned'}</td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan={5} className="text-center text-muted">No recent orders</td></tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {/* Favorites + Cart empty states */}
              <Row className="g-4 mb-4">
                <Col md={6}><Card className="shadow-sm h-100"><Card.Header className="bg-white border-0"><h5 className="mb-0">Your Favorites</h5></Card.Header><Card.Body className="text-center">{favorites.length === 0 ? (<div className="py-4"><i className="fa-regular fa-heart fa-2x text-muted mb-2"></i><p className="text-muted mb-3">No favorites yet</p><Link to="/food"><Button variant="danger"><i className="fa-solid fa-compass me-2"></i>Browse</Button></Link></div>) : (<div className="text-muted">You have {favorites.length} favorite items</div>)}</Card.Body></Card></Col>
                <Col md={6}><Card className="shadow-sm h-100"><Card.Header className="bg-white border-0"><h5 className="mb-0">Your Cart</h5></Card.Header><Card.Body className="text-center">{cartCount === 0 ? (<div className="py-4"><i className="fa-solid fa-cart-shopping fa-2x text-muted mb-2"></i><p className="text-muted mb-3">Your cart is empty.</p><Link to="/food"><Button variant="danger"><i className="fa-solid fa-utensils me-2"></i>Start Ordering</Button></Link></div>) : (<div className="text-muted">You have {cartCount} item(s) in cart</div>)}</Card.Body></Card></Col>
              </Row>

              {/* Newsletter */}
              <Card className="footer-card p-3 p-md-4">
                <Row className="gy-3 align-items-center">
                  <Col md={8}><h5 className="mb-1" style={{ color: '#212529' }}>Tamil Nadu Eats</h5><div className="text-muted small">Delivering authentic Tamil Nadu cuisine to your doorstep.</div></Col>
                  <Col md={4}>
                    <Form className="d-flex gap-2">
                      <Form.Control type="email" placeholder="Your Email" className="newsletter-input" />
                      <Button variant="warning" className="text-dark fw-semibold"><i className="fa-regular fa-paper-plane me-2"></i>Subscribe</Button>
                    </Form>
                  </Col>
                </Row>
              </Card>

              {error && (<Alert variant="danger" className="mt-4" dismissible onClose={() => setError('')}><i className="fa-solid fa-triangle-exclamation me-2"></i>{error}</Alert>)}
              {reviewSuccess && (<Alert variant="success" className="mt-3" dismissible onClose={() => setReviewSuccess('')}><i className="fa-regular fa-circle-check me-2"></i>{reviewSuccess}</Alert>)}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default UserDashboard;
