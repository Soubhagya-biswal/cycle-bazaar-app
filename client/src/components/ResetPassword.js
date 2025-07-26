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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            setTimeout(() => navigate('/login'), 3000); 
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
    
    <div className="input-group"> 
        <Form.Control
            type={showPassword ? 'text' : 'password'} 
            placeholder="Enter new password"
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
                    <Form.Group className="mb-3" controlId="confirmPassword">
    <Form.Label>Confirm New Password</Form.Label>
    {/* 👇️ आँख टॉगल के लिए नया कोड यहाँ से शुरू होता है 👇️ */}
    <div className="input-group">
        <Form.Control
            type={showConfirmPassword ? 'text' : 'password'} // यह डायनामिक रूप से इनपुट टाइप को बदलता है
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
        />
        <Button
            variant="outline-secondary"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
            <i className={showConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
        </Button>
    </div>
    {/* 👆️ आँख टॉगल के लिए नया कोड यहाँ समाप्त होता है 👆️ */}
</Form.Group>
                    <Button type="submit" variant="primary" className="w-100 mt-3">Update Password</Button>
                </Form>
            </div>
        </div>
    );
}

export default ResetPassword;