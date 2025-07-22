import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Row, Col, ListGroup, Image, Card, Alert } from 'react-bootstrap';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

function PlaceOrderPage() {
    const { cartItems, shippingAddress, paymentMethod, clearCart } = useContext(CartContext);
    const { userInfo } = useContext(AuthContext);
    const navigate = useNavigate();

    // Calculate prices
    const itemsPrice = cartItems.reduce((acc, item) => acc + item.cycleId.price * item.quantity, 0);
    const shippingPrice = itemsPrice > 10000 ? 0 : 500;
    const taxPrice = Number((0.18 * itemsPrice).toFixed(2));
    const totalPrice = (itemsPrice + shippingPrice + taxPrice).toFixed(2);

    const placeOrderHandler = async () => {
    try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`,
            },
            body: JSON.stringify({
                orderItems: cartItems.map(item => ({
                    ...item,
                    cycle: item.cycleId._id,
                    name: `${item.cycleId.brand} ${item.cycleId.model}`,
                    image: item.cycleId.imageUrl,
                    price: item.cycleId.price,
                    qty: item.quantity,
                })),
                shippingAddress: shippingAddress,
                paymentMethod: paymentMethod,
                itemsPrice: itemsPrice.toFixed(2),
                taxPrice: taxPrice,
                shippingPrice: shippingPrice.toFixed(2),
                totalPrice: totalPrice,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Could not place order');
        }
        
        const createdOrder = await res.json();
        clearCart();
        
        // This line is changed to redirect to the new order page
        navigate(`/order/${createdOrder._id}`); 

    } catch (error) {
        alert(error.message);
    }
};

    return (
        <>
            <Row>
                <Col md={8}>
                    <ListGroup variant='flush'>
                        <ListGroup.Item>
                            <h2>Shipping</h2>
                            <p>
                                <strong>Address: </strong>
                                {shippingAddress.address}, {shippingAddress.city}{' '}
                                {shippingAddress.postalCode}, {shippingAddress.country}
                            </p>
                        </ListGroup.Item>

                        <ListGroup.Item>
                            <h2>Payment Method</h2>
                            <strong>Method: </strong>
                            {paymentMethod}
                        </ListGroup.Item>

                        <ListGroup.Item>
                            <h2>Order Items</h2>
                            {cartItems.length === 0 ? <Alert variant='info'>Your cart is empty</Alert> : (
                                <ListGroup variant='flush'>
                                    {cartItems.map((item, index) => (
                                        <ListGroup.Item key={index}>
                                            <Row>
                                                <Col md={1}>
                                                    <Image src={item.cycleId.imageUrl} alt={item.cycleId.model} fluid rounded />
                                                </Col>
                                                <Col>
                                                    <Link to={`/cycle/${item.cycleId._id}`}>{item.cycleId.brand} {item.cycleId.model}</Link>
                                                </Col>
                                                <Col md={4}>
                                                    {item.quantity} x ₹{item.cycleId.price} = ₹{(item.quantity * item.cycleId.price).toFixed(2)}
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
                            <ListGroup.Item>
                                <h2>Order Summary</h2>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Items</Col>
                                    <Col>₹{itemsPrice.toFixed(2)}</Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Shipping</Col>
                                    <Col>₹{shippingPrice.toFixed(2)}</Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Tax (18%)</Col>
                                    <Col>₹{taxPrice}</Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Total</Col>
                                    <Col>₹{totalPrice}</Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-grid">
                                <Button
                                    type='button'
                                    className='btn-block'
                                    disabled={cartItems.length === 0}
                                    onClick={placeOrderHandler}
                                >
                                    Place Order
                                </Button>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </>
    );
}

export default PlaceOrderPage;