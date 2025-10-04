import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { FiDollarSign, FiShoppingCart, FiRefreshCw, FiHome, FiTruck } from 'react-icons/fi';
import { getAuthHeaders, apiConfig } from '../../utils/apiConfig';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const AdminHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalRestaurants: 0,
    totalDeliveryPersons: 0,
    recentOrders: [],
    revenueSeries: { labels: [], values: [] },
    restaurantsRevenue: []
  });
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats, orders, and restaurant revenue
      const [statsRes, ordersRes, restRes] = await Promise.all([
        fetch(`${apiConfig.endpoints.admin}/stats`, {
          headers: getAuthHeaders()
        }),
        fetch(`${apiConfig.endpoints.admin}/orders`, {
          headers: getAuthHeaders()
        }),
        fetch(`${apiConfig.endpoints.admin}/restaurants/with-counts`, {
          headers: getAuthHeaders()
        })
      ]);
      if (!statsRes.ok) throw new Error('Failed to fetch dashboard stats');
      if (!ordersRes.ok) throw new Error('Failed to fetch recent orders');
      if (!restRes.ok) throw new Error('Failed to fetch restaurant metrics');
      
      const statsData = await statsRes.json();
      const ordersResponse = await ordersRes.json();
      const restData = await restRes.json();

      // Server returns { success, orders } for orders and { success, totals, ordersByStatus } for stats
      const ordersData = Array.isArray(ordersResponse.orders) ? ordersResponse.orders : ordersResponse;
      
      // Safely calculate total revenue - delivered and non-failed payments
      const calculatedRevenue = ordersData.reduce((sum, order) => {
        if (!order) return sum;
        const paid = (order.paymentStatus || 'completed') !== 'failed';
        const delivered = (order.orderStatus || '').toLowerCase() === 'delivered';
        const amount = Number(order.finalAmount || order.totalAmount || 0);
        if (delivered && paid && amount > 0) return sum + amount;
        return sum;
      }, 0);
      
      // Prepare recent orders data (latest first, limit 5)
      const recentOrders = [...ordersData]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5)
        .map(order => ({
          id: order._id || Math.random().toString(36).substr(2, 9),
          customer: order.userDetails?.name || order.user?.name || 'Guest User',
          orderId: `#${order.orderId || (order._id ? order._id.substring(0, 8).toUpperCase() : '')}`,
          date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          amount: Number(order.finalAmount || order.totalAmount || 0),
          status: order.orderStatus || 'pending'
        }));

      // Compute last 7 days revenue series (delivered & paid only)
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setHours(0,0,0,0);
        d.setDate(d.getDate() - (6 - i));
        return d;
      });
      const labels = days.map(d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      const values = days.map(dayStart => {
        const dayEnd = new Date(dayStart.getTime());
        dayEnd.setDate(dayEnd.getDate() + 1);
        return ordersData.reduce((sum, o) => {
          if (!o) return sum;
          const t = new Date(o.createdAt || 0);
          const delivered = (o.orderStatus || '').toLowerCase() === 'delivered';
          const paid = (o.paymentStatus || 'completed') !== 'failed';
          if (t >= dayStart && t < dayEnd && delivered && paid) {
            return sum + Number(o.finalAmount || o.totalAmount || 0);
          }
          return sum;
        }, 0);
      });
      
      const totals = statsData.totals || {};
      const restaurantsRevenue = Array.isArray(restData?.items) ? restData.items
        .map(r => ({ id: r._id, name: r.name, orders: r.orderCount || 0, revenue: Number(r.revenue || 0) }))
        .sort((a,b) => b.revenue - a.revenue) : [];

      setStats({
        totalRevenue: calculatedRevenue,
        totalOrders: Number(totals.orders || ordersData.length || 0),
        totalRestaurants: Number(totals.restaurants || 0),
        totalDeliveryPersons: Number(totals.deliveryPersons || 0),
        recentOrders,
        revenueSeries: { labels, values },
        restaurantsRevenue
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    if (!status) return 'secondary';
    switch ((status || '').toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'processing':
        return 'primary';
      case 'shipped':
        return 'info';
      case 'confirmed':
        return 'primary';
      case 'preparing':
        return 'info';
      case 'out_for_delivery':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading && stats.recentOrders.length === 0) {
    return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading dashboard data...</p>
        </div>
    );
  }

  if (error) {
    return (
        <Alert variant="danger">
          <div className="d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <Button variant="outline-danger" size="sm" onClick={fetchDashboardData}>
              <FiRefreshCw className="me-1" /> Retry
            </Button>
          </div>
        </Alert>
    );
  }

  return (
      <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Dashboard Overview</h4>
          <p className="text-muted mb-0">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Refreshing...
            </>
          ) : (
            <>
              <FiRefreshCw className={`me-1 ${loading ? 'fa-spin' : ''}`} />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col xl={3} md={6} className="mb-4">
          <Card className="h-100 stats-card border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-uppercase text-muted mb-1">Total Revenue</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <div className="placeholder w-75" style={{height: '2rem'}}></div>
                    </div>
                  ) : (
                    <h2 className="card-value mb-0">₹{stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
                  )}
                  <p className="card-change positive small mb-0 mt-2">
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </p>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                  <FiDollarSign size={24} className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="h-100 stats-card border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-uppercase text-muted mb-1">Total Orders</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <div className="placeholder w-50" style={{height: '2rem'}}></div>
                    </div>
                  ) : (
                    <h2 className="card-value mb-0">{stats.totalOrders.toLocaleString()}</h2>
                  )}
                  <p className="card-change positive small mb-0 mt-2">
                    <span>Total orders placed</span>
                  </p>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                  <FiShoppingCart size={24} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="h-100 stats-card border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-uppercase text-muted mb-1">Total Restaurants</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <div className="placeholder w-50" style={{height: '2rem'}}></div>
                    </div>
                  ) : (
                    <h2 className="card-value mb-0">{stats.totalRestaurants.toLocaleString()}</h2>
                  )}
                  <p className="card-change positive small mb-0 mt-2">
                    <span>Active restaurants</span>
                  </p>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                  <FiHome size={24} className="text-info" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="h-100 stats-card border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-uppercase text-muted mb-1">Delivery Personnel</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <div className="placeholder w-50" style={{height: '2rem'}}></div>
                    </div>
                  ) : (
                    <h2 className="card-value mb-0">{stats.totalDeliveryPersons.toLocaleString()}</h2>
                  )}
                  <p className="card-change positive small mb-0 mt-2">
                    <span>Available drivers</span>
                  </p>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                  <FiTruck size={24} className="text-warning" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Per-Restaurant Revenue */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Per-Restaurant Revenue</h5>
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-secondary" onClick={() => window.print()}>Print</Button>
            <Button size="sm" variant="outline-primary" onClick={handleRefresh} disabled={loading}>
              <FiRefreshCw className="me-1" /> Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : stats.restaurantsRevenue.length === 0 ? (
            <div className="text-center py-4 text-muted">No data</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Restaurant</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.restaurantsRevenue.map(r => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.orders}</td>
                      <td>₹{r.revenue.toLocaleString()}</td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-primary" onClick={() => navigate(`/admin/restaurants/${r.id}`)}>Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      {/* Recent Orders */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Orders</h5>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            ) : (
              <FiRefreshCw className="me-1" />
            )}
            Refresh
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          {loading && stats.recentOrders.length === 0 ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading orders...
            </div>
          ) : stats.recentOrders.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No recent orders found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(order => (
                    <tr key={order.id}>
                      <td>{order.orderId}</td>
                      <td>{order.customer}</td>
                      <td>{order.date}</td>
                      <td>₹{order.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td><Badge bg={getStatusBadge(order.status)}>{order.status}</Badge></td>
                      <td className="text-end">
                        <Button variant="outline-primary" size="sm" href={`/admin/orders`}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        {!loading && stats.recentOrders.length > 0 && (
          <Card.Footer className="bg-white border-0 text-end">
            <Button 
              variant="link" 
              className="text-decoration-none"
              onClick={() => {
                window.location.href = '/admin/orders';
              }}
            >
              View All Orders
            </Button>
          </Card.Footer>
        )}
      </Card>

      {/* Sales Chart */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">Revenue (Last 7 days)</h5>
            <small className="text-muted">Sum of delivered & paid orders</small>
          </div>
          <Line 
            data={{
              labels: stats.revenueSeries.labels,
              datasets: [
                {
                  label: 'Revenue',
                  data: stats.revenueSeries.values,
                  borderColor: 'rgba(13,110,253,1)',
                  backgroundColor: 'rgba(13,110,253,0.15)',
                  tension: 0.3,
                  fill: true,
                  pointRadius: 3,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => `₹${Number(ctx.parsed.y||0).toLocaleString()}` } }
              },
              scales: {
                y: { ticks: { callback: v => `₹${Number(v).toLocaleString()}` }, beginAtZero: true },
              }
            }}
          />
        </Card.Body>
      </Card>

      {/* Top Products Section */}
      <Row>
        <Col lg={8} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0">Top Products</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="flex-shrink-0 me-3">
                  <div className="bg-light rounded p-2" style={{ width: '50px', height: '50px' }}></div>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0">Product Name</h6>
                  <small className="text-muted">24 sold this week</small>
                </div>
                <div className="text-end">
                  <div className="fw-bold">$125.99</div>
                  <small className="text-success">+12.5%</small>
                </div>
              </div>
              <div className="d-flex align-items-center mb-3">
                <div className="flex-shrink-0 me-3">
                  <div className="bg-light rounded p-2" style={{ width: '50px', height: '50px' }}></div>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0">Another Product</h6>
                  <small className="text-muted">18 sold this week</small>
                </div>
                <div className="text-end">
                  <div className="fw-bold">$89.50</div>
                  <small className="text-success">+8.3%</small>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0 me-3">
                  <div className="bg-light rounded p-2" style={{ width: '50px', height: '50px' }}></div>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0">Popular Item</h6>
                  <small className="text-muted">15 sold this week</small>
                </div>
                <div className="text-end">
                  <div className="fw-bold">$75.25</div>
                  <small className="text-danger">-2.1%</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      </>
  );
};

export default AdminHome;
