import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProfilePage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const { userInfo, login } = useContext(AuthContext); // login function ko use karenge to update user info

    useEffect(() => {
        if (userInfo) {
            setName(userInfo.name);
            setEmail(userInfo.email);
        } else {
            // Agar user logged in nahi hai to use login page par bhej do
            // This logic can be improved with Protected Routes later
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
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userInfo.token}`
                    },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data || 'Could not update profile');
                }
                
                // Update the global state and localStorage with the new user info
                // We need to create a new token if password is changed, but for now this is simpler
                login({ ...userInfo, name: data.name, email: data.email }); 
                setMessage('Profile Updated Successfully!');

            } catch (err) {
                setError(err.message);
            }
        }
    };

    return (
        <Row className="justify-content-md-center">
            <Col md={6}>
                <h2>User Profile</h2>
                {message && <Alert variant='success'>{message}</Alert>}
                {error && <Alert variant='danger'>{error}</Alert>}
                <Form onSubmit={submitHandler}>
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
                        <Button type='submit' variant='primary'>
                            Update Profile
                        </Button>
                        <Link to="/address" className="d-block">
                            <Button variant='secondary' className="w-100">
                                Manage Address
                            </Button>
                        </Link>
                    </div>
                </Form>
            </Col>
        </Row>
    );
}

export default ProfilePage;