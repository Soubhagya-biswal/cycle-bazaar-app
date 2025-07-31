import React, { useState, useContext } from 'react';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        
        if (!res.ok) {
            
            if (res.status === 429) {
                const errorMessage = await res.text(); 
                setError(errorMessage || 'Too many attempts. Please wait 2 minutes.');
                return;
            }
            
            const data = await res.json();
            setError(data.message || data || 'Login failed');
            return;
        }

        const data = await res.json();
        login(data);
        navigate('/');

    } catch (err) {
        setError('Server error. Please try again later.');
    }
};

    // Google login ke liye backend URL
    const googleLoginUrl = `${process.env.REACT_APP_API_BASE_URL}/api/users/auth/google`;

    return (
        <div className="form-container">
            <div className="form-box">
                <h1 className="text-center">Login</h1>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="email">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="password">
                        <Form.Label>Password</Form.Label>
                        <div className="input-group"> 
                            <Form.Control
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Button
                                variant="outline-secondary" 
                                onClick={() => setShowPassword(!showPassword)} 
                            >
                                <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                            </Button>
                        </div>
                    </Form.Group>
                    <Button type="submit" variant="primary" className="w-100 mt-3">Login</Button>
                </Form>

                {/* Divider */}
                <Row className="my-3">
                    <Col><hr /></Col>
                    <Col xs="auto" className="text-center">OR</Col>
                    <Col><hr /></Col>
                </Row>
                
                {/* Google Login Button */}
                <a href={googleLoginUrl} className="btn btn-danger w-100">
                    <i className="fab fa-google me-2"></i> Continue with Google
                </a>

                <p className="mt-3 text-center">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
                <p className="mt-2 text-center">
                    <Link to="/forgot-password">Forgot Password?</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;