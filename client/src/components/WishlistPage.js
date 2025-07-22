import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { AuthContext } from '../context/AuthContext';

function WishlistPage() {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userInfo } = useContext(AuthContext);

    useEffect(() => {
        const fetchWishlist = async () => {
            if (!userInfo) return;

            try {
                setLoading(true);
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/wishlist`, {
                    headers: {
                        'Authorization': `Bearer ${userInfo.token}`
                    }
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Failed to fetch wishlist');
                }
                setWishlist(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [userInfo]);

    return (
        <>
            <h1 className="my-4">My Wishlist</h1>
            {loading ? (
                <p>Loading wishlist...</p>
            ) : error ? (
                <Alert variant='danger'>{error}</Alert>
            ) : wishlist.length === 0 ? (
                <Alert variant="info">
                    Your wishlist is empty.
                </Alert>
            ) : (
                <Row>
                    {wishlist.map(cycle => (
                        <Col key={cycle._id} sm={12} md={6} lg={4} xl={3} className="mb-4">
                            <Card className="h-100">
                                <Card.Img variant="top" src={cycle.imageUrl} style={{ height: '200px', objectFit: 'cover' }} />
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title as="div"><strong>{cycle.brand} {cycle.model}</strong></Card.Title>
                                    <Card.Text as="h3" className="mt-auto">
                                        ₹{cycle.price}
                                    </Card.Text>
                                    <LinkContainer to={`/cycle/${cycle._id}`}>
                                        <Button variant="primary">View Details</Button>
                                    </LinkContainer>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </>
    );
}

export default WishlistPage;