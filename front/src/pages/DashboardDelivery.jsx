// src/pages/DashboardDelivery.jsx
import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Badge, Button, Form } from 'react-bootstrap';
import { orderAPI, userAPI } from '../utils/api';

const allowedStatuses = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const DashboardDelivery = () => {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [isAvailable, setIsAvailable] = useState(true);

	const load = async (showSpinner = false) => {
		if (showSpinner) setLoading(true);
		setError('');
		try {
			const data = await orderAPI.getOwnerOrders();
			setOrders(data);
		} catch (e) {
			setError(e.message);
		} finally {
			if (showSpinner) setLoading(false);
		}
	};

	useEffect(() => {
		load(true);
		const id = setInterval(() => load(false), 5000);
		return () => clearInterval(id);
	}, []);

	const updateStatus = async (id, status) => {
		await orderAPI.updateStatus(id, status);
		await load(false);
	};

	const toggleAvailability = async () => {
		try {
			const next = !isAvailable;
			await userAPI.updateAvailability(next);
			setIsAvailable(next);
		} catch (e) {
			setError(e.message);
		}
	};

	const shareLocationOnce = async () => {
		if (!('geolocation' in navigator)) {
			setError('Geolocation not supported');
			return;
		}
		navigator.geolocation.getCurrentPosition(async (pos) => {
			try {
				await userAPI.updateLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
			} catch (e) {
				setError(e.message);
			}
		}, () => setError('Failed to get location'), { enableHighAccuracy: true, timeout: 10000 });
	};

	return (
		<Container className="py-4">
			<div className="d-flex justify-content-between align-items-center mb-3">
				<h3 className="mb-0">Delivery Dashboard</h3>
				<div className="d-flex gap-2">
					<Button variant={isAvailable ? 'success' : 'outline-secondary'} onClick={toggleAvailability}>
						{isAvailable ? 'Available' : 'Go Available'}
					</Button>
					<Button variant="outline-primary" onClick={shareLocationOnce}>Share Location</Button>
				</div>
			</div>
			{error && <div className="text-danger mb-3">{error}</div>}
			{loading ? (
				<p>Loading...</p>
			) : (
				<Row>
					{orders.map((o) => (
						<Col md={6} key={o._id} className="mb-3">
							<Card className="p-3 h-100">
								<div className="d-flex justify-content-between align-items-start">
									<div>
										<h5>Order {o.orderId}</h5>
										<small className="text-muted">Total ₹{o.finalAmount ?? o.totalAmount}</small>
									</div>
									<Badge bg="secondary">{o.orderStatus}</Badge>
								</div>
								<div className="mt-2">
									<strong>Items:</strong>
									<ul className="mb-2">
										{o.items.map((it, idx) => (
											<li key={idx}>{it.name} x {it.quantity}</li>
										))}
									</ul>
									<Form.Select value={o.orderStatus} onChange={(e) => updateStatus(o.orderId, e.target.value)} style={{ maxWidth: 240 }}>
										{allowedStatuses.map((s) => (
											<option key={s} value={s}>{s}</option>
										))}
									</Form.Select>
								</div>
							</Card>
						</Col>
					))}
				</Row>
			)}
		</Container>
	);
};

export default DashboardDelivery;
