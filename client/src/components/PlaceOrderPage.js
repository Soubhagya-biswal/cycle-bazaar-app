import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Row, Col, ListGroup, Image, Card, Alert } from 'react-bootstrap';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

function PlaceOrderPage() {
    // Step 1: Sab kuch CartContext se aa raha hai
    const { 
        cartItems, 
        shippingAddress, 
        paymentMethod, 
        clearCart,
        subtotal,
        discount,
        grandTotal,
        appliedCoupon
    } = useContext(CartContext);

    const { userInfo } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        // Agar address ya payment method nahi hai to user ko wapas bhejo
        if (!shippingAddress.address) {
            navigate('/shipping');
        } else if (!paymentMethod) {
            navigate('/payment');
        }
    }, [shippingAddress, paymentMethod, navigate]);

    // Step 2: placeOrderHandler ab context se sahi price bhejega
    const placeOrderHandler = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
                body: JSON.stringify({
                    orderItems: cartItems.map(item => {
                        const basePrice = item.cycleId.ourPrice;
                        const chosenVariant = item.variantId && item.cycleId.variants 
                            ? item.cycleId.variants.find(v => v._id === item.variantId) 
                            : null;
                        const effectivePrice = basePrice + (chosenVariant ? (chosenVariant.additionalPrice || 0) : 0);

                        return {
                            cycle: item.cycleId._id,
                            name: `${item.cycleId.brand} ${item.cycleId.model}`,
                            image: item.cycleId.imageUrl,
                            price: effectivePrice, // Item ki sahi price
                            qty: item.quantity,
                            variant: item.variantId,
                        };
                    }),
                    shippingAddress: shippingAddress,
                    paymentMethod: paymentMethod,
                    itemsPrice: subtotal,
                    taxPrice: 0, // Abhi ke liye 0
                    shippingPrice: 0, // Abhi ke liye 0
                    totalPrice: grandTotal,
                    couponApplied: appliedCoupon ? appliedCoupon.code : 'None',
                    discountAmount: discount,
                }),
            });

            const createdOrder = await res.json();
            if (!res.ok) {
                throw new Error(createdOrder.message || 'Could not place order');
            }
            
            clearCart();
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
                            <p><strong>Method: </strong>{paymentMethod}</p>
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
                                                    {item.quantity} x ₹{item.cycleId.ourPrice} = ₹{(item.quantity * item.cycleId.ourPrice).toFixed(2)}
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
                    {/* Step 3: Naya Order Summary Card */}
                    <Card>
                        <ListGroup variant='flush'>
                            <ListGroup.Item>
                                <h2>Order Summary</h2>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Items</Col>
                                    <Col>₹{subtotal.toFixed(2)}</Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Shipping</Col>
                                    <Col>₹0.00</Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Tax</Col>
                                    <Col>₹0.00</Col>
                                </Row>
                            </ListGroup.Item>
                            {appliedCoupon && (
                                <ListGroup.Item>
                                    <Row>
                                        <Col>Discount ({appliedCoupon.code})</Col>
                                        <Col style={{ color: 'green' }}>- ₹{discount.toFixed(2)}</Col>
                                    </Row>
                                </ListGroup.Item>
                            )}
                            <ListGroup.Item>
                                <Row>
                                    <Col><strong>Total</strong></Col>
                                    <Col><strong>₹{grandTotal.toFixed(2)}</strong></Col>
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