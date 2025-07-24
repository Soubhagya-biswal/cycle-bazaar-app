import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ListGroup, Button, Alert, Row, Col, Image } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

function MyReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userInfo } = useContext(AuthContext);

    const fetchMyReviews = async () => {
        if (!userInfo) return;
        try {
            setLoading(true);
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/myreviews`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch reviews');
            setReviews(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyReviews();
    }, [userInfo]);

    const deleteReviewHandler = async (cycleId, reviewId) => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/${cycleId}/reviews/${reviewId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to delete review');
                }
                alert('Review deleted successfully');
                fetchMyReviews(); // Refresh the reviews list
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    };

    return (
        <>
            <h1 className="my-4">My Reviews</h1>
            {loading ? (
                <p>Loading reviews...</p>
            ) : error ? (
                <Alert variant='danger'>{error}</Alert>
            ) : reviews.length === 0 ? (
                <Alert variant="info">You have not submitted any reviews yet.</Alert>
            ) : (
                <ListGroup variant="flush">
                    {reviews.map(review => (
                        <ListGroup.Item key={review._id} className="p-0 mb-3">
                            {/* NAYA CODE: review-box div add kiya gaya hai */}
                            <div className="review-box">
                                <Row className="align-items-center">
                                    <Col md={2}>
                                        <Link to={`/cycle/${review.cycleId}`}>
                                            <Image src={review.cycleImageUrl} alt={review.cycleModel} fluid rounded />
                                        </Link>
                                    </Col>
                                    <Col md={8}>
                                        <h5><Link to={`/cycle/${review.cycleId}`}>{review.cycleBrand} {review.cycleModel}</Link></h5>
                                        <p className="mb-1"><strong>Rating:</strong> {review.rating} ★</p>
                                        <p className="review-comment">"{review.comment}"</p>
                                        <small className="review-date">Reviewed on: {new Date(review.createdAt).toLocaleDateString()}</small>
                                    </Col>
                                    <Col md={2} className="d-flex align-items-center justify-content-end">
                                        <Button variant="danger" size="sm" onClick={() => deleteReviewHandler(review.cycleId, review._id)}>
                                            Delete
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </>
    );
}

export default MyReviewsPage;