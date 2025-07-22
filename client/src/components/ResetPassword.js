import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data || 'Something went wrong');
                return;
            }
            setMessage(data.message);
            setTimeout(() => navigate('/login'), 3000); // Redirect to login after 3 seconds
        } catch (err) {
            setError('Server error');
        }
    };

    return (
        <div className="form-container">
            <div className="form-box">
                <h1 className="text-center">Reset Password</h1>
                {message && <Alert variant="success">{message}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="password">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="confirmPassword">
                        <Form.Label>Confirm New Password</Form.Label>
                        <Form.Control type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </Form.Group>
                    <Button type="submit" variant="primary" className="w-100 mt-3">Update Password</Button>
                </Form>
            </div>
        </div>
    );
}

export default ResetPassword;