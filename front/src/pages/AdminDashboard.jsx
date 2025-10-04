import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import AdminLayout from '../components/admin/AdminLayout';

// Import admin components
import AdminHome from './admin/AdminHome';
import Orders from './admin/Orders';
import Restaurants from './admin/Restaurants';
import Drivers from './admin/Drivers';
import RestaurantDetails from './admin/RestaurantDetails';
import Customers from './admin/Customers';
import MenuItems from './admin/MenuItems';
import Reports from './admin/Reports';
import CustomerDetails from './admin/CustomerDetails';
import DriverDetails from './admin/DriverDetails';

// Admin Dashboard Wrapper
const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setError('Access denied. Admins only.');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <div className="mt-3">Loading admin dashboard…</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminHome />} />
        {/* Admin routes */}
        <Route path="orders" element={<Orders />} />
        <Route path="restaurants" element={<Restaurants />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="drivers/:id" element={<DriverDetails />} />
        <Route path="restaurants/:id" element={<RestaurantDetails />} />
        <Route path="menu" element={<MenuItems />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetails />} />
        <Route path="reports" element={<Reports />} />
        
        {/* Catch-all route for admin section */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
