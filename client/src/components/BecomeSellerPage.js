import React, { useState, useContext } from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // To get userInfo and token

function BecomeSellerPage() {
    const [businessName, setBusinessName] = useState('');
    const [businessDescription, setBusinessDescription] = useState('');
    const [email, setEmail] = useState(''); // For seller contact email (could pre-fill with user's email if desired)
    const [phoneNumber, setPhoneNumber] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [gstin, setGstin] = useState(''); 
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { userInfo } = useContext(AuthContext); // Get user info from AuthContext
    const navigate = useNavigate();

    // Redirect if not logged in
    if (!userInfo) {
        navigate('/login');
        return null; // Don't render anything until redirect
    }

    // Redirect if already an admin (though Header should hide the link)
    if (userInfo.isAdmin) {
        navigate('/'); // Or to an admin dashboard
        return null;
    }

    // --- IMPORTANT: You might need to add 'isSeller' and 'sellerApplicationStatus' to your userInfo
    //    object in AuthContext (fetched from backend login/profile API).
    //    For now, we'll assume the user is not a seller if !userInfo.isSeller.
    //    If the user has a pending application, you might want to show a different message.
    //    You'll need 'isSeller' and 'sellerApplicationStatus' to be part of the userInfo object returned from login API.
    //    For example: if (userInfo.isSeller) { navigate('/seller-dashboard'); return null; }
    //    If (userInfo.sellerApplicationStatus === 'pending') { return <Alert variant="info">Your seller application is pending review.</Alert>; }
    // ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/apply-seller`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`, // Send user's token for authentication
                },
                body: JSON.stringify({ 
                    businessName, 
                    businessDescription,
                    email,         // Add new fields here
                    phoneNumber,
                    businessAddress,
                    gstin
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit application');
            }

            setMessage(data.message || 'Seller application submitted successfully! Please wait for admin review.');
            setBusinessName('');
            setBusinessDescription('');
            // Optional: You might want to update userInfo in AuthContext here
            // to reflect that the user's application is now pending.
            // This would involve modifying AuthContext as well.

        } catch (err) {
            setError(err.message || 'Server error. Could not submit application.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-3">
            <Row className="justify-content-md-center">
                <Col md={6}>
                    <h1>Become a Seller</h1>
                    <p>Fill out the form below to apply to become a seller on Cycle Bazaar.</p>

                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="businessName" className="mb-3">
                            <Form.Label>Business Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter your business name"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="businessDescription" className="mb-3">
                            <Form.Label>Business Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Describe your business and what you plan to sell"
                                value={businessDescription}
                                onChange={(e) => setBusinessDescription(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="sellerEmail" className="mb-3">
                            <Form.Label>Contact Email</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Enter your business contact email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required // Make it required if necessary
                            />
                        </Form.Group>

                        <Form.Group controlId="phoneNumber" className="mb-3">
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control
                                type="tel" // Use type="tel" for phone numbers
                                placeholder="Enter your business phone number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="businessAddress" className="mb-3">
                            <Form.Label>Business Address</Form.Label>
                            <Form.Control
                                as="textarea" // Use textarea for multi-line address
                                rows={3}
                                placeholder="Enter your full business address"
                                value={businessAddress}
                                onChange={(e) => setBusinessAddress(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="gstin" className="mb-3">
                            <Form.Label>GSTIN (Optional)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter your GSTIN (if applicable)"
                                value={gstin}
                                onChange={(e) => setGstin(e.target.value)}
                                // Not required, as per "Optional" label
                            />
                        </Form.Group>

                        <Button type="submit" variant="primary" className="w-100 mt-3" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default BecomeSellerPage;