import React, { useState, useContext } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
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
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data || 'Login failed');
                return;
            }
            login(data); 
            navigate('/'); 
        } catch (err) {
            setError('Server error');
        }
    };

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