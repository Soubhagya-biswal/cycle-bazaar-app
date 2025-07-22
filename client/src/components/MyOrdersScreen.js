import React, { useEffect, useState, useContext } from 'react';
import { Table, Button, Row, Col } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { AuthContext } from '../context/AuthContext';
// You might also need a Loading/Error component if you have them, e.g., import Loader from '../components/Loader'; import Message from '../components/Message';

function MyOrdersScreen() {
    const { userInfo } = useContext(AuthContext); // Get user info from AuthContext

    const [orders, setOrders] = useState([]); // State to hold the user's orders
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null);   // Error state

    // Function to fetch orders (we will create this API endpoint in the backend later)
    const fetchMyOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders/myorders`, { // THIS IS THE NEW API ENDPOINT WE'LL CREATE
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to fetch orders');
            }

            const data = await response.json();
            setOrders(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
            console.error("Error fetching my orders:", err);
        }
    };

    useEffect(() => {
        if (userInfo) {
            fetchMyOrders();
        } else {
            // If user is not logged in, you might want to redirect them to login
            // import { useNavigate } from 'react-router-dom';
            // const navigate = useNavigate();
            // navigate('/login');
        }
    }, [userInfo]); // Depend on userInfo to refetch if user changes (e.g., logs in)

    return (
        <Row>
            <Col md={12}>
                <h1>My Orders</h1>
                {loading ? (
                    <p>Loading orders...</p> // Replace with your Loader component if you have one
                ) : error ? (
                    <p style={{ color: 'red' }}>Error: {error}</p> // Replace with your Message component if you have one
                ) : orders.length === 0 ? (
                    <p>You have not placed any orders yet.</p>
                ) : (
                    <Table striped bordered hover responsive className='table-sm'>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>DATE</th>
                                <th>TOTAL</th>
                                <th>PAID</th>
                                <th>DELIVERED</th>
                                <th></th> {/* For the details button */}
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order._id}>
                                    <td>{order._id}</td>
                                    <td>{order.createdAt.substring(0, 10)}</td> {/* Format date */}
                                    <td>₹{order.totalPrice}</td>
                                    <td>
                                        {order.isPaid ? (
                                            order.paidAt.substring(0, 10)
                                        ) : (
                                            <i className='fas fa-times' style={{ color: 'red' }}></i>
                                        )}
                                    </td>
                                    <td>
                                        {order.isDelivered ? (
                                            order.deliveredAt ? order.deliveredAt.substring(0, 10) : 'Yes'
                                        ) : (
                                            <i className='fas fa-times' style={{ color: 'red' }}></i>
                                        )}
                                    </td>
                                    <td>
                                        <LinkContainer to={`/order/${order._id}`}>
                                            <Button className='btn-sm' variant='light'>
                                                Details
                                            </Button>
                                        </LinkContainer>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Col>
        </Row>
    );
}

export default MyOrdersScreen;