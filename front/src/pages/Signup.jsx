// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
	const { user, signup } = useAuth();
	const navigate = useNavigate();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState('user');
	// extra fields for owner and delivery
	const [restaurantName, setRestaurantName] = useState('');
	const [restaurantAddress, setRestaurantAddress] = useState('');
	const [fssaiLicense, setFssaiLicense] = useState('');
	const [vehicleType, setVehicleType] = useState('');
	const [licenseNumber, setLicenseNumber] = useState('');
	const [vehicleNumber, setVehicleNumber] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	if (user) return <Navigate to="/dashboard" replace />;

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			const payload = { name, email, password, role };
			if (role === 'owner') {
				payload.ownerDetails = { restaurantName, address: restaurantAddress, fssaiLicense };
			}
			if (role === 'delivery') {
				payload.deliveryDetails = { vehicleType, licenseNumber, vehicleNumber };
			}
			await signup(payload);
			navigate('/dashboard');
		} catch (e) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container className="py-5" style={{ maxWidth: 520 }}>
			<Card className="shadow-sm">
				<Card.Body>
					<h3 className="mb-4">Create Account</h3>
					{error && <Alert variant="danger">{error}</Alert>}
					<Form onSubmit={handleSubmit}>
						<Form.Group className="mb-3">
							<Form.Label>Name</Form.Label>
							<Form.Control value={name} onChange={(e) => setName(e.target.value)} required />
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Email</Form.Label>
							<Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Password</Form.Label>
							<Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
						</Form.Group>
						<Form.Group className="mb-4">
							<Form.Label>Role</Form.Label>
							<Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
								<option value="owner">Restaurant Owner</option>
								<option value="user">User</option>
								<option value="delivery">Delivery Person</option>
							</Form.Select>
						</Form.Group>
						{role === 'owner' && (
							<>
								<Form.Group className="mb-3">
									<Form.Label>Restaurant Name</Form.Label>
									<Form.Control value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} required />
								</Form.Group>
								<Form.Group className="mb-3">
									<Form.Label>Restaurant Address</Form.Label>
									<Form.Control value={restaurantAddress} onChange={(e) => setRestaurantAddress(e.target.value)} required />
								</Form.Group>
								<Form.Group className="mb-4">
									<Form.Label>FSSAI License</Form.Label>
									<Form.Control value={fssaiLicense} onChange={(e) => setFssaiLicense(e.target.value)} required />
								</Form.Group>
							</>
						)}
						{role === 'delivery' && (
							<>
								<Form.Group className="mb-3">
									<Form.Label>Vehicle Type</Form.Label>
									<Form.Control value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required />
								</Form.Group>
								<Form.Group className="mb-3">
									<Form.Label>License Number</Form.Label>
									<Form.Control value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
								</Form.Group>
								<Form.Group className="mb-4">
									<Form.Label>Vehicle Number</Form.Label>
									<Form.Control value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} required />
								</Form.Group>
							</>
						)}
						<Button type="submit" variant="danger" disabled={loading} className="w-100">
							{loading ? 'Creating account...' : 'Sign Up'}
						</Button>
					</Form>
				</Card.Body>
			</Card>
		</Container>
	);
};

export default Signup;
