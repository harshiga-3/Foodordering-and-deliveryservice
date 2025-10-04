import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, Tabs, Tab, Form } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import './AnalyticsDashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsDashboard = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('today');
  const [analyticsData, setAnalyticsData] = useState({
    dailyOrders: null,
    financialPerformance: null,
    timeAnalytics: null,
    dashboard: null
  });
  const esRef = useRef(null);

  // Load analytics data
  const loadAnalyticsData = async (selectedPeriod = period) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
      
      const [dailyOrdersRes, financialRes, timeRes, dashboardRes] = await Promise.all([
        fetch(`${baseUrl}/api/analytics/daily-orders?period=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/analytics/financial-performance?period=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/analytics/time-analytics?type=all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/analytics/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [dailyOrders, financial, timeAnalytics, dashboard] = await Promise.all([
        dailyOrdersRes.json(),
        financialRes.json(),
        timeRes.json(),
        dashboardRes.json()
      ]);

      setAnalyticsData({
        dailyOrders,
        financialPerformance: financial,
        timeAnalytics,
        dashboard
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'owner' || user?.role === 'Owner') {
      loadAnalyticsData();
    }
  }, [user, token]);

  // Subscribe to real-time analytics via SSE
  useEffect(() => {
    if (!token || !(user?.role === 'owner' || user?.role === 'Owner')) return;
    const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
    // Send token via query param because EventSource can't set Authorization header
    const url = `${baseUrl}/api/analytics/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url, { withCredentials: false });
    esRef.current = es;
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (!msg || !msg.type) return;
        // On any order event, refresh the small parts optimistically
        if (msg.type === 'order_created' || msg.type === 'order_status') {
          // Light refresh: reload daily orders and dashboard
          loadAnalyticsData(period);
        }
      } catch {}
    };
    es.onerror = () => {};
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [token, user, period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    loadAnalyticsData(newPeriod);
  };

  // Chart configurations
  const getStatusChartData = () => {
    if (!analyticsData.dailyOrders?.statusBreakdown) return null;
    
    const { statusBreakdown } = analyticsData.dailyOrders;
    const statusLabels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };

    return {
      labels: Object.keys(statusBreakdown).map(key => statusLabels[key] || key),
      datasets: [{
        label: 'Orders',
        data: Object.values(statusBreakdown),
        backgroundColor: [
          '#ffc107',
          '#17a2b8',
          '#fd7e14',
          '#6f42c1',
          '#28a745',
          '#dc3545'
        ],
        borderWidth: 1
      }]
    };
  };

  const getHourlyChartData = () => {
    if (!analyticsData.timeAnalytics?.hourlyDistribution) return null;
    
    const { hourlyDistribution } = analyticsData.timeAnalytics;
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const data = hours.map(hour => hourlyDistribution[parseInt(hour)] || 0);

    return {
      labels: hours,
      datasets: [{
        label: 'Orders',
        data: data,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        fill: true
      }]
    };
  };

  const getRevenueChartData = () => {
    if (!analyticsData.dashboard?.revenueTrend) return null;
    
    const { revenueTrend } = analyticsData.dashboard;
    
    return {
      labels: revenueTrend.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [{
        label: 'Revenue (₹)',
        data: revenueTrend.map(item => item.revenue),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: true
      }]
    };
  };

  const getPaymentMethodChartData = () => {
    if (!analyticsData.financialPerformance?.paymentMethodBreakdown) return null;
    
    const { paymentMethodBreakdown } = analyticsData.financialPerformance;
    
    return {
      labels: Object.keys(paymentMethodBreakdown).map(key => key.toUpperCase()),
      datasets: [{
        data: Object.values(paymentMethodBreakdown),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0'
        ],
        borderWidth: 1
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      // Card headers already provide titles; hide chart title to avoid duplicate headings
      title: {
        display: false,
      }
    }
  };

  if (user?.role !== 'owner' && user?.role !== 'Owner') {
    return (
      <Container className="py-5 text-center">
        <h3>Access Denied</h3>
        <p className="text-muted">Only restaurant owners can access analytics.</p>
      </Container>
    );
  }

  if (loading && !analyticsData.dashboard) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading analytics...</span>
        </Spinner>
        <p className="mt-3">Loading analytics data...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="analytics-title">Analytics Dashboard</h1>
          <p className="analytics-subtitle">Track your restaurant's performance and insights</p>
          
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible className="mt-2">
              {error}
            </Alert>
          )}

          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              style={{ width: '200px' }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
            </Form.Select>
            
            <Button variant="outline-primary" onClick={() => loadAnalyticsData()}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </Button>
          </div>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="overview" title="Overview">
          <Row className="mb-4">
            {/* Summary Cards */}
            <Col md={3} className="mb-3">
              <Card className="analytics-card">
                <Card.Body className="text-center">
                  <i className="bi bi-shop analytics-icon text-primary"></i>
                  <h3 className="analytics-number">{analyticsData.dashboard?.summary?.totalRestaurants || 0}</h3>
                  <p className="analytics-label">Restaurants</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="analytics-card">
                <Card.Body className="text-center">
                  <i className="bi bi-egg-fried analytics-icon text-success"></i>
                  <h3 className="analytics-number">{analyticsData.dashboard?.summary?.totalFoodItems || 0}</h3>
                  <p className="analytics-label">Food Items</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="analytics-card">
                <Card.Body className="text-center">
                  <i className="bi bi-cart analytics-icon text-warning"></i>
                  <h3 className="analytics-number">{analyticsData.dailyOrders?.totalOrders || 0}</h3>
                  <p className="analytics-label">Orders Today</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="analytics-card">
                <Card.Body className="text-center">
                  <i className="bi bi-currency-rupee analytics-icon text-info"></i>
                  <h3 className="analytics-number">₹{analyticsData.financialPerformance?.dailyRevenue || 0}</h3>
                  <p className="analytics-label">Revenue Today</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5>Order Status Breakdown</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    {getStatusChartData() ? (
                      <Doughnut data={getStatusChartData()} options={chartOptions} />
                    ) : (
                      <div className="text-center text-muted">No data available</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5>Payment Methods</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    {getPaymentMethodChartData() ? (
                      <Doughnut data={getPaymentMethodChartData()} options={chartOptions} />
                    ) : (
                      <div className="text-center text-muted">No data available</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={12} className="mb-4">
              <Card>
                <Card.Header>
                  <h5>Revenue Trend (Last 7 Days)</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    {getRevenueChartData() ? (
                      <Line data={getRevenueChartData()} options={chartOptions} />
                    ) : (
                      <div className="text-center text-muted">No data available</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="orders" title="Order Analysis">
          <Row>
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5>Hourly Order Distribution</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '400px' }}>
                    {getHourlyChartData() ? (
                      <Bar data={getHourlyChartData()} options={chartOptions} />
                    ) : (
                      <div className="text-center text-muted">No data available</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5>Real-time Orders</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {analyticsData.dailyOrders?.realTimeOrders?.length > 0 ? (
                      analyticsData.dailyOrders.realTimeOrders.map((order, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                          <div>
                            <strong>#{order.orderId}</strong>
                            <br />
                            <small className="text-muted">{order.user?.name || 'Unknown'}</small>
                          </div>
                          <div className="text-end">
                            <Badge bg="secondary">{order.orderStatus}</Badge>
                            <br />
                            <small>₹{order.finalAmount || order.totalAmount}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted">No recent orders</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="financial" title="Financial Performance">
          <Row>
            <Col md={4} className="mb-3">
              <Card className="financial-card">
                <Card.Body className="text-center">
                  <i className="bi bi-graph-up analytics-icon text-success"></i>
                  <h3 className="analytics-number">₹{analyticsData.financialPerformance?.dailyRevenue || 0}</h3>
                  <p className="analytics-label">Daily Revenue</p>
                  {analyticsData.financialPerformance?.revenueGainLoss !== undefined && (
                    <small className={analyticsData.financialPerformance.revenueGainLoss >= 0 ? 'text-success' : 'text-danger'}>
                      {analyticsData.financialPerformance.revenueGainLoss >= 0 ? '+' : ''}₹{analyticsData.financialPerformance.revenueGainLoss}
                    </small>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="financial-card">
                <Card.Body className="text-center">
                  <i className="bi bi-calculator analytics-icon text-info"></i>
                  <h3 className="analytics-number">₹{analyticsData.financialPerformance?.orderValueStats?.average?.toFixed(2) || 0}</h3>
                  <p className="analytics-label">Avg Order Value</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="financial-card">
                <Card.Body className="text-center">
                  <i className="bi bi-percent analytics-icon text-warning"></i>
                  <h3 className="analytics-number">₹{analyticsData.financialPerformance?.profitMargins?.toFixed(2) || 0}</h3>
                  <p className="analytics-label">Profit Margins</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5>Order Value Statistics</h5>
                </Card.Header>
                <Card.Body>
                  <div className="row text-center">
                    <div className="col-4">
                      <h4 className="text-success">₹{analyticsData.financialPerformance?.orderValueStats?.highest || 0}</h4>
                      <p className="text-muted">Highest</p>
                    </div>
                    <div className="col-4">
                      <h4 className="text-primary">₹{analyticsData.financialPerformance?.orderValueStats?.average?.toFixed(2) || 0}</h4>
                      <p className="text-muted">Average</p>
                    </div>
                    <div className="col-4">
                      <h4 className="text-info">₹{analyticsData.financialPerformance?.orderValueStats?.lowest || 0}</h4>
                      <p className="text-muted">Lowest</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5>Payment Method Distribution</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '200px' }}>
                    {getPaymentMethodChartData() ? (
                      <Doughnut data={getPaymentMethodChartData()} options={chartOptions} />
                    ) : (
                      <div className="text-center text-muted">No data available</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="trends" title="Time Analytics">
          <Row>
            <Col md={12} className="mb-4">
              <Card>
                <Card.Header>
                  <h5>Daily Revenue Comparison (Last 7 Days)</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '400px' }}>
                    {getRevenueChartData() ? (
                      <Line data={getRevenueChartData()} options={chartOptions} />
                    ) : (
                      <div className="text-center text-muted">No data available</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5>Hourly Distribution</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    {getHourlyChartData() ? (
                      <Bar data={getHourlyChartData()} options={chartOptions} />
                    ) : (
                      <div className="text-center text-muted">No data available</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5>Top Performing Food Items</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {analyticsData.dashboard?.topFoodItems?.length > 0 ? (
                      analyticsData.dashboard.topFoodItems.map((item, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                          <div>
                            <strong>{item.name}</strong>
                          </div>
                          <Badge bg="primary">{item.orderCount} orders</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted">No data available</div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AnalyticsDashboard;
