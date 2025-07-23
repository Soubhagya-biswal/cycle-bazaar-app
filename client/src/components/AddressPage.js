import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AddressPage() {
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const { userInfo } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAddress = async () => {
            if (!userInfo) {
                navigate('/login');
                return;
            }
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/address`, { // <-- URL Fixed
                    headers: {
                        'Authorization': `Bearer ${userInfo.token}`
                    }
                });
                const data = await res.json();
                if (res.ok) {
                    setAddress(data.address || '');
                    setCity(data.city || '');
                    setPostalCode(data.postalCode || '');
                    setCountry(data.country || '');
                }
            } catch (err) {
                setError('Failed to fetch address.');
            }
        };
        fetchAddress();
    }, [userInfo, navigate]);

    const submitHandler = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/address`, { // <-- URL Fixed
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ address, city, postalCode, country })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Could not update address');
            }
            setMessage('Address updated successfully!');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Row className="justify-content-md-center">
            <Col md={6}>
                <h2>Manage Address</h2>
                <p className="text-muted">This will be your default shipping address.</p>
                {message && <Alert variant='success'>{message}</Alert>}
                {error && <Alert variant='danger'>{error}</Alert>}
                <Form onSubmit={submitHandler}>
                    <Form.Group controlId='address' className="my-3">
                        <Form.Label>Address</Form.Label>
                        <Form.Control type='text' placeholder='Enter address' value={address} onChange={(e) => setAddress(e.target.value)}></Form.Control>
                    </Form.Group>
                    <Form.Group controlId='city' className="my-3">
                        <Form.Label>City</Form.Label>
                        <Form.Control type='text' placeholder='Enter city' value={city} onChange={(e) => setCity(e.target.value)}></Form.Control>
                    </Form.Group>
                    <Form.Group controlId='postalCode' className="my-3">
                        <Form.Label>Postal Code</Form.Label>
                        <Form.Control type='text' placeholder='Enter postal code' value={postalCode} onChange={(e) => setPostalCode(e.target.value)}></Form.Control>
                    </Form.Group>
                    <Form.Group controlId='country' className="my-3">
                        <Form.Label>Country</Form.Label>
                        <Form.Control type='text' placeholder='Enter country' value={country} onChange={(e) => setCountry(e.target.value)}></Form.Control>
                    </Form.Group>
                    <Button type='submit' variant='primary' className="mt-3">
                        Save Address
                    </Button>
                </Form>
            </Col>
        </Row>
    );
}

export default AddressPage;