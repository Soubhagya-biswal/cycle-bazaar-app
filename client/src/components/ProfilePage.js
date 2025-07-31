import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Row, Col, Alert, Image, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api.js'; 

function ProfilePage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // --- STEP 1: 2FA ke liye naye state ---
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [otp, setOtp] = useState('');
    const [loading2FA, setLoading2FA] = useState(false);
    // --- YAHAN TAK ---

    const { userInfo, login } = useContext(AuthContext);

    useEffect(() => {
        if (userInfo) {
            setName(userInfo.name);
            setEmail(userInfo.email);
        }
    }, [userInfo]);

    const submitHandler = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
        } else {
            try {
                // fetch ko api.put se badal diya
                const { data } = await api.put('/api/users/profile', { name, email, password });
                
                login({ ...userInfo, name: data.name, email: data.email });
                setMessage('Profile Updated Successfully!');
                setPassword('');
                setConfirmPassword('');

            } catch (err) {
                setError(err.response?.data?.message || 'Could not update profile');
            }
        }
    };

    // --- STEP 2: 2FA ke liye naye functions ---
    const generateQRCodeHandler = async () => {
        setLoading2FA(true);
        setError(null);
        try {
            const { data } = await api.post('/api/users/2fa/generate');
            setQrCodeUrl(data.qrCodeUrl);
            setShow2FASetup(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not generate QR code.');
        } finally {
            setLoading2FA(false);
        }
    };

    const enable2FAHandler = async (e) => {
        e.preventDefault();
        setLoading2FA(true);
        setError(null);
        setMessage(null);
        try {
            const { data } = await api.post('/api/users/2fa/enable', { token: otp });
            setMessage(data.message);
            setShow2FASetup(false);
            // NOTE: User ko logout karke dobara login karna padega 2FA effect mein laane ke liye
            // Ya fir hum AuthContext mein user info update kar sakte hain
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP.');
        } finally {
            setLoading2FA(false);
        }
    };
    // --- YAHAN TAK ---

    return (
        <Row className="justify-content-md-center">
            <Col md={6}>
                <h2>User Profile</h2>
                {message && <Alert variant='success'>{message}</Alert>}
                {error && <Alert variant='danger'>{error}</Alert>}
                <Form onSubmit={submitHandler}>
                    {/* ... (tera purana form waisa hi hai) ... */}
                    <Form.Group controlId='name' className="my-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control type='text' placeholder='Enter name' value={name} onChange={(e) => setName(e.target.value)}></Form.Control>
                    </Form.Group>
                    <Form.Group controlId='email' className="my-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control type='email' placeholder='Enter email' value={email} onChange={(e) => setEmail(e.target.value)}></Form.Control>
                    </Form.Group>
                    <Form.Group controlId='password'>
                        <Form.Label>New Password</Form.Label>
                        <Form.Control type='password' placeholder='Enter new password' value={password} onChange={(e) => setPassword(e.target.value)}></Form.Control>
                    </Form.Group>
                    <Form.Group controlId='confirmPassword'>
                        <Form.Label>Confirm New Password</Form.Label>
                        <Form.Control type='password' placeholder='Confirm new password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}></Form.Control>
                    </Form.Group>
                    <div className="d-grid gap-2 mt-4">
                        <Button type='submit' variant='primary'>Update Profile</Button>
                        <Link to="/address" className="d-block"><Button variant='secondary' className="w-100">Manage Address</Button></Link>
                    </div>
                </Form>

                {/* --- STEP 3: 2FA ka naya section --- */}
                <hr className="my-4" />
                <h2>Two-Factor Authentication (2FA)</h2>
                
                {/* Agar 2FA setup dikh raha hai */}
                {show2FASetup ? (
                    <div>
                        <p>1. Scan this QR code with your authenticator app (like Google Authenticator).</p>
                        {loading2FA && <Spinner animation="border" />}
                        {qrCodeUrl && <Image src={qrCodeUrl} alt="2FA QR Code" fluid />}
                        
                        <p className="mt-3">2. Enter the 6-digit code from your app below.</p>
                        <Form onSubmit={enable2FAHandler}>
                            <Form.Group controlId='otp'>
                                <Form.Label>Verification Code (OTP)</Form.Label>
                                <Form.Control 
                                    type='text' 
                                    placeholder='Enter 6-digit code' 
                                    value={otp} 
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                ></Form.Control>
                            </Form.Group>
                            <div className="d-flex gap-2 mt-3">
                                <Button type='submit' variant='success' disabled={loading2FA}>Verify & Enable</Button>
                                <Button variant='secondary' onClick={() => setShow2FASetup(false)} disabled={loading2FA}>Cancel</Button>
                            </div>
                        </Form>
                    </div>
                ) : (
                    // Agar 2FA setup nahi dikh raha
                    <div className="d-grid">
                        <Button variant='info' onClick={generateQRCodeHandler} disabled={loading2FA}>
                            {loading2FA ? 'Generating...' : 'Enable 2FA'}
                        </Button>
                    </div>
                )}
                
            </Col>
        </Row>
    );
}

export default ProfilePage;