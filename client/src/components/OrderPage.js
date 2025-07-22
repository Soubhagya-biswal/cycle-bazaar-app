/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom'; // useSearchParams imported
import { Row, Col, ListGroup, Image, Card, Alert, Button, Form } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm.js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function OrderPage() {
    const { id: orderId } = useParams();
    const [searchParams] = useSearchParams(); // Hook to read query parameters
    const isAdminView = searchParams.get('adminView') === 'true'; // Check if adminView query param is 'true'

    // --- NEW CONSOLE.LOGS FOR DEBUGGING ---
    console.log('OrderPage: Full searchParams object:', searchParams.toString()); // Log the raw query string
    console.log('OrderPage: adminView param value:', searchParams.get('adminView')); // Log the value of 'adminView' param
    console.log('OrderPage: isAdminView (boolean):', isAdminView); // Log the boolean result
    // --- END CONSOLE.LOGS ---

    const { userInfo } = useContext(AuthContext);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clientSecret, setClientSecret] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to load order details.');
            }
            setOrder(data);
            setSelectedStatus(data.status);

            if (!data.isPaid && data.paymentMethod === 'Stripe' && !clientSecret) {
                const paymentRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders/${orderId}/create-payment-intent`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${userInfo.token}` },
                });
                const paymentData = await paymentRes.json();
                if (!paymentRes.ok) {
                    throw new Error(paymentData.message || 'Failed to create payment intent');
                }
                setClientSecret(paymentData.clientSecret);
            }
        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo) {
            fetchOrder();
        }
    }, [orderId, userInfo]);

    const paymentSuccessHandler = () => {
        fetchOrder();
    };

    const updateOrderStatusHandler = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
                body: JSON.stringify({ status: selectedStatus }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update order status');
            }
            fetchOrder();

        } catch (err) {
            setError(err.message);
            console.error("Error updating order status:", err);
            setLoading(false);
        }
    };

    const markAsPaidHandler = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders/${orderId}/pay`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to mark order as paid');
            }
            fetchOrder();

        } catch (err) {
            setError(err.message);
            console.error("Error marking as paid:", err);
            setLoading(false);
        }
    };
       const cancelOrderHandler = async () => {
        const reason = window.prompt("Please provide a reason for cancellation:");
        if (reason) {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders/${orderId}/cancel`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userInfo.token}`
                    },
                    body: JSON.stringify({ reason })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Could not request cancellation');
                }
                
                alert('Cancellation request sent successfully!');
                fetchOrder(); // Order details ko refresh karo
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        }
    };
    return loading ? (
        <h2>Loading Order...</h2>
    ) : error ? (
        <Alert variant='danger'>{error}</Alert>
    ) : order ? (
        <>
            <h1>Order #{order._id}</h1>
            <Row>
                <Col md={8}>
                    <ListGroup variant='flush'>
                        <ListGroup.Item>
                            <h2>Shipping</h2>
                            <p><strong>Name: </strong> {order.user.name}</p>
                            <p><strong>Email: </strong> <a href={`mailto:${order.user.email}`}>{order.user.email}</a></p>
                            <p><strong>Address: </strong>{order.shippingAddress.address}, {order.shippingAddress.city}{' '}{order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
                            <Alert variant={
                                order.status === 'Delivered' ? 'success' :
                                order.status === 'Cancelled' ? 'danger' :
                                'info'
                            }>
                                Status: {order.status}
                                {order.status === 'Delivered' && order.deliveredAt && (
                                    ` on ${new Date(order.deliveredAt).toLocaleString()}`
                                )}
                            </Alert>
                            {order.isRefunded ? (
    <Alert variant='info'>Refunded on {new Date(order.refundedAt).toLocaleString()}</Alert>
) : order.isPaid ? (
    <Alert variant='success'>Paid on {new Date(order.paidAt).toLocaleString()}</Alert>
) : (
    <Alert variant='warning'>Not Paid</Alert>
)}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <h2>Payment Method</h2>
                            <p><strong>Method: </strong>{order.paymentMethod}</p>
                            {order.isPaid ? null : order.paymentMethod === 'COD' ? <Alert variant='info'>Pay on Delivery</Alert> : null}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <h2>Order Items</h2>
                            {order.orderItems.length === 0 ? (
                                <Alert variant="info">Order is empty</Alert>
                            ) : (
                                <ListGroup variant="flush">
                                    {order.orderItems.map((item, index) => (
                                        <ListGroup.Item key={index}>
                                            <Row className="align-items-center">
                                                <Col md={2}>
                                                    <Image
                                                        src={
                                                            item.image.startsWith("http")
                                                                ? item.image
                                                                : `${process.env.REACT_APP_API_BASE_URL}${item.image}`
                                                        }
                                                        alt={item.name}
                                                        fluid
                                                        rounded
                                                    />
                                                </Col>
                                                <Col>
                                                    <Link to={`/product/${item.product}`}>{item.name}</Link>
                                                </Col>
                                                <Col md={4}>
                                                    {item.qty} x ₹{item.price} = ₹{Number(item.qty) * Number(item.price)}
                                                </Col>
                                            </Row>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </ListGroup.Item>
                    </ListGroup>
                </Col>
                <Col md={4}>
                    <Card>
                        <ListGroup variant='flush'>
                            <ListGroup.Item><h2>Order Summary</h2></ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Items</Col>
                                    <Col>₹{order.itemsPrice}</Col>
                                </Row>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    <Col>Shipping</Col>
                                    <Col>₹{order.shippingPrice}</Col>
                                </Row>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    <Col>Tax</Col>
                                    <Col>₹{order.taxPrice}</Col>
                                </Row>
                            </ListGroup.Item>

                            <ListGroup.Item><Row><Col>Total</Col><Col>₹{order.totalPrice}</Col></Row></ListGroup.Item>

                            {!order.isPaid && order.paymentMethod === 'Stripe' && (
                                <ListGroup.Item>
                                    {clientSecret && stripePromise && (
                                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                                            <CheckoutForm order={order} clientSecret={clientSecret} onPaymentSuccess={paymentSuccessHandler} />
                                        </Elements>
                                    )}
                                </ListGroup.Item>
                                    )}
                                    

                            {/* --- ADMIN STATUS UPDATE SECTION (CONDITIONAL RENDERING) --- */}
                            {/* Will only show if user is admin AND came from Admin List (via query param) */}
                            {userInfo && userInfo.isAdmin && isAdminView && (
                                <ListGroup.Item>
                                    <h3>Update Status</h3>
                                    <Form.Control
                                        as='select'
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className='mb-3'
                                        disabled={loading}
                                    >
                                        <option value="Processing">Processing</option>
                                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                                            <>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Out for Delivery">Out for Delivery</option>
                                            </>
                                        )}
                                        {order.isPaid && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                                            <option value="Delivered">Delivered</option>
                                        )}
                                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                                            <option value="Cancelled">Cancelled</option>
                                        )}
                                        {order.status === 'Delivered' && <option value="Delivered">Delivered</option>}
                                        {order.status === 'Cancelled' && <option value="Cancelled">Cancelled</option>}
                                    </Form.Control>
                                    <Button
                                        type='button'
                                        className='btn btn-block'
                                        onClick={updateOrderStatusHandler}
                                        disabled={loading || selectedStatus === order.status}
                                    >
                                        Update Order Status
                                    </Button>
                                </ListGroup.Item>
                            )}
                                  {/* --- USER CANCEL ORDER SECTION --- */}
                            {order.status === 'Processing' && !isAdminView && (
                                <ListGroup.Item className="d-grid">
                                    <Button type='button' variant='danger' onClick={cancelOrderHandler} disabled={loading}>
                                        Cancel Order
                                    </Button>
                                </ListGroup.Item>
                            )}
                            {/* --- ADMIN MARK AS PAID SECTION (CONDITIONAL RENDERING) --- */}
                            {/* Will only show if user is admin AND came from Admin List (via query param) */}
                            {userInfo && userInfo.isAdmin && isAdminView && order.paymentMethod === 'COD' && !order.isPaid && (
                                <ListGroup.Item>
                                    <Button
                                        type='button'
                                        className='btn btn-block btn-success'
                                        onClick={markAsPaidHandler}
                                        disabled={loading}
                                    >
                                        Mark As Paid
                                    </Button>
                                </ListGroup.Item>
                            )}
                            {/* --- END ADMIN SECTIONS --- */}

                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </>
    ) : null;
}

export default OrderPage;