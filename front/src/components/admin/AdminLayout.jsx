import React, { useState, useEffect } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';
import { FiMenu, FiBell, FiSettings, FiUser, FiMoon, FiSun } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/AdminDashboard.css';
import { getAuthHeaders, apiConfig } from '../../utils/apiConfig';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when route changes / resize
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.innerWidth < 992) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 992) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    });

    // Set initial sidebar state based on screen size
    if (window.innerWidth >= 992) {
      setSidebarOpen(true);
    }

    // Remove mock notifications. SSE will populate notifications in real-time.

    return () => {
      window.removeEventListener('resize', () => {});
    };
  }, []);

  // Close sidebar on Escape key (mobile)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarOpen && window.innerWidth < 992) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  // Fetch basic counts for sidebar badges
  useEffect(() => {
    let mounted = true;
    const fetchCounts = async () => {
      try {
        const res = await fetch(`${apiConfig.endpoints.admin}/stats`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const byStatus = data?.ordersByStatus || {};
        const openStatuses = ['pending','confirmed','processing','preparing','shipped','out_for_delivery'];
        const openCount = openStatuses.reduce((sum, s) => sum + Number(byStatus[s] || 0), 0);
        if (mounted) setOrdersCount(openCount);
      } catch {}
    };
    fetchCounts();
    const id = setInterval(fetchCounts, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Real-time admin notifications via SSE
  useEffect(() => {
    if (!token) return;
    let es;
    try {
      es = new EventSource(`${apiConfig.endpoints.admin}/stream?token=${encodeURIComponent(token)}`);
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          let message = 'Update';
          if (evt?.type === 'order_created') {
            const amt = Number(evt?.payload?.finalAmount || 0).toLocaleString();
            message = `New order #${evt?.payload?.orderId} • ₹${amt}`;
          } else if (evt?.type === 'order_status') {
            message = `Order #${evt?.payload?.orderId} status: ${evt?.payload?.orderStatus}`;
          }
          setNotifications((prev) => [{ id: Date.now(), message, time: new Date().toLocaleTimeString(), read: false }, ...prev].slice(0, 50));
        } catch {}
      };
    } catch {}
    return () => { try { es && es.close(); } catch {} };
  }, [token]);

  // Update unread count when notifications change
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Handle user logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`admin-container ${sidebarOpen ? 'sidebar-open' : ''}`} data-theme={theme}>
      {/* Sidebar */}
      <AdminSidebar show={sidebarOpen} onToggle={toggleSidebar} ordersCount={ordersCount} />
      {/* Backdrop for mobile when sidebar is open */}
      {sidebarOpen && (
        <div className="sidebar-backdrop d-lg-none" onClick={toggleSidebar} aria-hidden="true"></div>
      )}
      
      {/* Main Content */}
      <div className="main-content">
        {/* Top Navigation */}
        <Navbar bg="light" expand="lg" className="mb-4 shadow-sm">
          <Container fluid>
            <Button 
              variant="link" 
              className="me-3 p-0"
              onClick={toggleSidebar}
              aria-label="Toggle navigation"
            >
              <FiMenu size={24} />
            </Button>
            
            <Navbar.Brand href="/admin" className="d-none d-md-block">
              <h5 className="mb-0">Admin Dashboard</h5>
            </Navbar.Brand>
            
            <div className="ms-auto d-flex align-items-center">
              {/* Theme Toggle */}
              <Button 
                variant="link" 
                className="me-2 text-dark"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
              </Button>

              {/* Print */}
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="me-3"
                onClick={() => window.print()}
                aria-label="Print"
              >
                Print
              </Button>
              
              {/* Notifications */}
              <div className="dropdown me-3">
                <Button 
                  variant="link" 
                  className="position-relative p-0 text-dark"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                >
                  <FiBell size={20} />
                  {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unreadCount}
                      <span className="visually-hidden">unread notifications</span>
                    </span>
                  )}
                </Button>
                
                {showNotifications && (
                  <div className="dropdown-menu dropdown-menu-end shadow" style={{ width: '320px' }}>
                    <div className="dropdown-header d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Notifications</h6>
                      {unreadCount > 0 && (
                        <button 
                          className="btn btn-link btn-sm p-0 text-primary"
                          onClick={markAllAsRead}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="dropdown-divider"></div>
                    
                    {notifications.length > 0 ? (
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notifications.map(notification => (
                          <div 
                            key={notification.id}
                            className={`dropdown-item ${!notification.read ? 'bg-light' : ''}`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="d-flex align-items-start">
                              <div className="flex-shrink-0 me-2">
                                <div className={`rounded-circle p-1 ${!notification.read ? 'bg-primary text-white' : 'bg-light'}`}>
                                  <FiBell size={16} />
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <p className="mb-1">{notification.message}</p>
                                <small className="text-muted">{notification.time}</small>
                              </div>
                              {!notification.read && (
                                <div className="flex-shrink-0 ms-2">
                                  <span className="badge bg-primary rounded-pill">New</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-3">
                        <FiBell size={32} className="text-muted mb-2" />
                        <p className="mb-0">No new notifications</p>
                      </div>
                    )}
                    
                    <div className="dropdown-divider"></div>
                    <a className="dropdown-item text-center text-primary" href="#">
                      View all notifications
                    </a>
                  </div>
                )}
              </div>
              
              {/* User Dropdown */}
              <div className="dropdown">
                <Button 
                  variant="light" 
                  className="d-flex align-items-center"
                  id="userDropdown"
                  onClick={() => document.getElementById('userDropdownMenu').classList.toggle('show')}
                >
                  <div className="me-2 d-none d-sm-block">
                    <div className="text-end">
                      <div className="fw-medium">{user?.name || 'Admin'}</div>
                      <small className="text-muted">{user?.email || 'Administrator'}</small>
                    </div>
                  </div>
                  <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                </Button>
                
                <div 
                  id="userDropdownMenu" 
                  className="dropdown-menu dropdown-menu-end shadow"
                  style={{ display: 'none' }}
                >
                  <a className="dropdown-item" href="#">
                    <FiUser className="me-2" /> Profile
                  </a>
                  <a className="dropdown-item" href="#">
                    <FiSettings className="me-2" /> Settings
                  </a>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </Container>
        </Navbar>
        
        {/* Page Content */}
        <Container fluid className="py-3">
          {children}
        </Container>
      </div>
    </div>
  );
};

export default AdminLayout;
