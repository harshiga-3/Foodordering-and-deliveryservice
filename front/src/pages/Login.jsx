// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/Auth/GoogleSignInButton';

const Login = () => {
	const { user, login, googleLogin } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	if (user) return <Navigate to="/dashboard" replace />;

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			await login({ email, password });
			navigate('/dashboard');
		} catch (e) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container className="py-5" style={{ maxWidth: 480 }}>
			<Card className="shadow-sm">
				<Card.Body>
					<h3 className="mb-4">Login</h3>
					{error && <Alert variant="danger">{error}</Alert>}
					<Form onSubmit={handleSubmit}>
						<Form.Group className="mb-3">
							<Form.Label>Email</Form.Label>
							<Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Password</Form.Label>
							<Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
						</Form.Group>

						{/* Google Sign In Button */}
						<div className="w-100 mb-3">
							<GoogleSignInButton
								onSuccess={async (credential) => {
									try {
										await googleLogin(credential);
										navigate('/dashboard');
									} catch (e) {
										setError(e.message);
									}
								}}
							/>
						</div>

						{/* Divider */}
						<div className="text-center mb-3">
							<hr className="my-2" />
							<small className="text-muted">OR</small>
							<hr className="my-2" />
						</div>

						<Button type="submit" variant="danger" disabled={loading} className="w-100 mb-3">
							{loading ? 'Logging in...' : 'Login'}
						</Button>

						{/* Sign Up Link */}
						<div className="text-center">
							<small className="text-muted">
								Don't have an account?{' '}
								<a href="/signup" className="text-danger text-decoration-none fw-semibold">
									Sign up here
								</a>
							</small>
						</div>
					</Form>
				</Card.Body>
			</Card>
		</Container>
	);
};

export default Login;
