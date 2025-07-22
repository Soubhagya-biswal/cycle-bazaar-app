/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useContext } from 'react';
import { Table, Button, Row, Col, Alert } from 'react-bootstrap';
// Removed: import { LinkContainer } from 'react-router-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // <-- ADD Link here


function OrderListScreen() {
    const { userInfo } = useContext(AuthContext);
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders`, {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to fetch all orders');
            }

            const data = await response.json();
            setOrders(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
            console.error("Error fetching all orders:", err);
        }
    };

    const deleteHandler = async (orderId) => {
        if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            try {
                setLoading(true);
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders/${orderId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to delete order');
                }

                fetchAllOrders();

            } catch (err) {
                setError(err.message);
                console.error("Error deleting order:", err);
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            fetchAllOrders();
        } else {
            navigate('/login');
        }
    }, [userInfo, navigate]);

    return (
        <Row>
            <Col md={12}>
                <h1>Orders</h1>
                {loading ? (
                    <p>Loading orders...</p>
                ) : error ? (
                    <Alert variant='danger'>{error}</Alert>
                ) : orders.length === 0 ? (
                    <p>No orders found.</p>
                ) : (
                    <Table striped bordered hover responsive className='table-sm'>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>USER</th>
                                <th>DATE</th>
                                <th>TOTAL</th>
                                <th>PAID</th>
                                <th>DELIVERED</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order._id}>
                                    <td>{order._id}</td>
                                    <td>{order.user ? order.user.name : 'N/A'}</td>
                                    <td>{order.createdAt.substring(0, 10)}</td>
                                    <td>₹{order.totalPrice}</td>
                                    <td>
                                        {order.isPaid ? (
                                            order.paidAt ? order.paidAt.substring(0, 10) : <i className='fas fa-check' style={{ color: 'green' }}></i>
                                        ) : (
                                            <i className='fas fa-times' style={{ color: 'red' }}></i>
                                        )}
                                    </td>
                                    <td>
                                        {order.isDelivered ? (
                                            order.deliveredAt ? order.deliveredAt.substring(0, 10) : <i className='fas fa-check' style={{ color: 'green' }}></i>
                                        ) : (
                                            <i className='fas fa-times' style={{ color: 'red' }}></i>
                                        )}
                                    </td>
                                    <td>
                                        {/* --- REPLACED LINKCONTAINER WITH LINK --- */}
                                        <Link to={`/order/${order._id}?adminView=true`} className='btn btn-sm btn-light'>Details</Link>
                                        {/* --- END REPLACEMENT --- */}
                                        {' '}
                                        <Button
                                            variant='danger'
                                            className='btn-sm'
                                            onClick={() => deleteHandler(order._id)}
                                            disabled={loading}
                                        >
                                            <i className='fas fa-trash'></i>
                                        </Button>
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

export default OrderListScreen;