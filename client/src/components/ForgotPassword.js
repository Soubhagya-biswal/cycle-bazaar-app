import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            setMessage(data.message);
        } catch (err) {
            setMessage('Server error, please try again.');
        }
    };

    return (
        <div className="form-container">
            <div className="form-box">
                <h1 className="text-center">Forgot Password</h1>
                <p className="text-center text-muted mb-4">Enter your email and we'll send you a link to reset your password.</p>
                {message && <Alert variant="info">{message}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="email">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control type="email" placeholder="Enter your registered email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </Form.Group>
                    <Button type="submit" variant="primary" className="w-100 mt-3">Send Reset Link</Button>
                </Form>
            </div>
        </div>
    );
}

export default ForgotPassword;