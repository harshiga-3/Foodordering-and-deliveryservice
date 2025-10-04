// src/pages/Dashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import OwnerDashboard from './OwnerDashboard';
import DashboardDelivery from './DashboardDelivery';
import DashboardUser from './DashboardUser';

const Dashboard = () => {
	const { user } = useAuth();
	if (user?.role === 'owner' || user?.role === 'Owner') return <OwnerDashboard />;
	if (user?.role === 'delivery' || user?.role === 'Delivery') return <DashboardDelivery />;
	return <DashboardUser />;
};

export default Dashboard;
