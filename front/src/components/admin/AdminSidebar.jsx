import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = ({ show, onToggle, ordersCount = 0 }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const handleLinkClick = () => {
    try {
      if (typeof window !== 'undefined' && window.innerWidth < 992) {
        onToggle && onToggle();
      }
    } catch {}
  };
  
  const menuItems = [
    { path: '/admin', icon: 'speedometer2', label: 'Dashboard' },
    { path: '/admin/orders', icon: 'cart-check', label: 'Orders', badgeCount: ordersCount },
    { path: '/admin/restaurants', icon: 'shop', label: 'Restaurants' },
    { path: '/admin/menu', icon: 'menu-button-wide', label: 'Menu Items' },
    { path: '/admin/drivers', icon: 'bicycle', label: 'Drivers' },
    { path: '/admin/customers', icon: 'people', label: 'Customers' },
    { path: '/admin/reports', icon: 'graph-up', label: 'Reports' },
  ];

  return (
    <div className={`admin-sidebar ${show ? 'show' : ''}`}>
      <div className="sidebar-header">
        <h3>FoodDash</h3>
        <button className="close-btn" onClick={onToggle}>
          &times;
        </button>
      </div>
      
      <Nav className="flex-column">
        {menuItems.map((item) => {
          const isActive = item.path === '/admin'
            ? (location.pathname === '/admin' || location.pathname === '/admin/')
            : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
          return (
            <Nav.Link 
              key={item.path}
              as={Link}
              to={item.path}
              active={isActive}
              className="d-flex align-items-center"
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={handleLinkClick}
            >
              <i className={`bi bi-${item.icon} me-2`}></i>
              <span>{item.label}</span>
              {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                <span className="badge bg-primary ms-auto">{item.badgeCount}</span>
              )}
            </Nav.Link>
          );
        })}
      </Nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">{(user?.name?.[0] || user?.email?.[0] || 'A').toUpperCase()}</div>
          <div>
            <div className="name">{user?.name || 'Admin'}</div>
            <div className="email">{user?.email || ''}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
