import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Row, Col, Alert, Spinner, Container, Badge } from 'react-bootstrap'; // 👇️ ADD THIS LINE;
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // To get userInfo and token

function SellerApplicationListPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // For success messages after approval/rejection

    const { userInfo } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect if not logged in or not admin
    useEffect(() => {
        if (!userInfo || !userInfo.isAdmin) {
            navigate('/login'); // Or to a forbidden page
        }
    }, [userInfo, navigate]);

    const fetchApplications = async () => {
        if (!userInfo || !userInfo.isAdmin) return; // Re-check before fetching

        setLoading(true);
        setError('');
        setMessage(''); // Clear previous messages
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/seller-applications`, {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch applications');
            }

            setApplications(data);
        } catch (err) {
            setError(err.message || 'Error fetching seller applications.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch on component mount
    useEffect(() => {
        fetchApplications();
    }, [userInfo]); // Fetch again if userInfo changes (e.g., login/logout)

    const handleStatusUpdate = async (userId, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this application?`)) {
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/seller-applications/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`,
                },
                body: JSON.stringify({ status }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Failed to ${status} application.`);
            }

            setMessage(data.message);
            // Re-fetch applications to update the list
            fetchApplications();

        } catch (err) {
            setError(err.message || `Error updating application status to ${status}.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-3">
            <Row>
                <Col>
                    <h1>Seller Applications</h1>
                    {loading && <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>}
                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    {!loading && applications.length === 0 && !error && (
                        <Alert variant="info">No pending seller applications found.</Alert>
                    )}

                    {!loading && applications.length > 0 && (
                        <Table striped bordered hover responsive className="table-sm">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>NAME</th>
                                    <th>EMAIL</th>
                                    <th>BUSINESS NAME</th>
                                    <th>CONTACT EMAIL</th>
                                    <th>PHONE</th>
                                    <th>ADDRESS</th>
                                    <th>GSTIN</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app._id}>
                                        <td>{app._id}</td>
                                        <td>{app.name}</td>
                                        <td><a href={`mailto:${app.email}`}>{app.email}</a></td>
                                        <td>{app.sellerApplicationDetails?.businessName}</td>
                                        <td>{app.sellerApplicationDetails?.email || 'N/A'}</td>
                                        <td>{app.sellerApplicationDetails?.phoneNumber || 'N/A'}</td>
                                        <td>{app.sellerApplicationDetails?.businessAddress || 'N/A'}</td>
                                        <td>{app.sellerApplicationDetails?.gstin || 'N/A'}</td>
                                        <td>
                                            <Badge bg={app.sellerApplicationStatus === 'pending' ? 'warning' : (app.sellerApplicationStatus === 'approved' ? 'success' : 'danger')}>
                                                {app.sellerApplicationStatus.charAt(0).toUpperCase() + app.sellerApplicationStatus.slice(1)}
                                            </Badge>
                                        </td>
                                        <td>
                                            {app.sellerApplicationStatus === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="success"
                                                        className="btn-sm me-2"
                                                        onClick={() => handleStatusUpdate(app._id, 'approved')}
                                                    >
                                                        <i className="fas fa-check"></i> Approve
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        className="btn-sm"
                                                        onClick={() => handleStatusUpdate(app._id, 'rejected')}
                                                    >
                                                        <i className="fas fa-times"></i> Reject
                                                    </Button>
                                                </>
                                            )}

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default SellerApplicationListPage;