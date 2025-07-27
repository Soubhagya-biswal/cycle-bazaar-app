import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Button, Card, Alert, Form } from 'react-bootstrap';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext'; // AuthContext ko import kiya

function CartPage() {
    // Step 1: Sab kuch seedhe context se le rahe hain
    const { 
        cartItems, 
        removeFromCart, 
        updateCartItemQuantity, 
        subtotal, 
        discount, 
        grandTotal, 
        appliedCoupon, 
        applyCoupon,
        clearCoupon
    } = useContext(CartContext);

    const { userInfo } = useContext(AuthContext);
    const navigate = useNavigate();

    // Sirf is page ke input ke liye local state
    const [couponCode, setCouponCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const removeFromCartHandler = (cycleId, variantId = null) => {
        if (window.confirm('Are you sure you want to remove this item?')) {
            removeFromCart(cycleId, variantId);
        }
    };

    const checkoutHandler = () => {
        navigate('/shipping');
    };

    // Step 2: applyCouponHandler ab context ka istemal karega
    const applyCouponHandler = async () => {
        setLoading(true);
        setError('');
        try {
            if (!userInfo) {
                throw new Error('You must be logged in to apply a coupon.');
            }

            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/coupons/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
                body: JSON.stringify({ couponCode }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to apply coupon');
            }
            
            applyCoupon(data); // Context function call kiya
            alert('Coupon applied successfully!');
            
        } catch (err) {
            setError(err.message);
            clearCoupon(); // Galti hone par context se coupon hata do
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1>Shopping Cart</h1>
            <Row>
                <Col md={8}>
                    {cartItems.length === 0 ? (
                        <Alert variant="info">
                            Your cart is empty. <Link to="/">Go Back</Link>
                        </Alert>
                    ) : (
                        <ListGroup variant="flush">
                            {cartItems.map(item => {
                                // Price calculation for each item
                                const basePrice = item.cycleId.price;
                                const chosenVariant = item.variantId && item.cycleId.variants 
                                    ? item.cycleId.variants.find(v => v._id === item.variantId) 
                                    : null;
                                const effectivePrice = basePrice + (chosenVariant ? (chosenVariant.additionalPrice || 0) : 0);
                                
                                return (
                                    <ListGroup.Item key={item.variantId ? `${item.cycleId._id}-${item.variantId}`: item.cycleId._id}>
                                        <Row className="align-items-center">
                                            <Col md={2}>
                                                <Image src={item.cycleId.imageUrl} alt={item.cycleId.model} fluid rounded />
                                            </Col>
                                            <Col md={3}>
                                                <Link to={`/cycle/${item.cycleId._id}`}>{item.cycleId.brand} {item.cycleId.model}</Link>
                                                {chosenVariant && (
                                                    <div style={{ fontSize: '0.8em', color: 'grey' }}>
                                                        ({chosenVariant.color} - {chosenVariant.size})
                                                    </div>
                                                )}
                                            </Col>
                                            <Col md={2}>
                                                ₹{effectivePrice.toFixed(2)}
                                            </Col>
                                            <Col md={3} className="d-flex align-items-center justify-content-center">
                                                <Button
                                                    variant="light"
                                                    size="sm" 
                                                    onClick={() => updateCartItemQuantity(item.cycleId._id, item.quantity - 1, item.variantId)}
                                                    disabled={item.quantity === 1} 
                                                    className="me-2" 
                                                >
                                                    <i className="fas fa-minus"></i>
                                                </Button>
                                                <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                <Button
                                                    variant="light"
                                                    size="sm" 
                                                    onClick={() => updateCartItemQuantity(item.cycleId._id, item.quantity + 1, item.variantId)}
                                                    className="ms-2" 
                                                >
                                                    <i className="fas fa-plus"></i>
                                                </Button>
                                            </Col>
                                            <Col md={2}>
                                                <Button type="button" variant="light" onClick={() => removeFromCartHandler(item.cycleId._id, item.variantId)}>
                                                    <i className="fas fa-trash"></i>
                                                </Button>
                                            </Col>
                                        </Row>
                                    </ListGroup.Item>
                                );
                            })}
                        </ListGroup>
                    )}
                </Col>
                {/* Step 3: Naya Summary Card jo context se values le raha hai */}
                <Col md={4}>
                    <Card>
                        <ListGroup variant="flush">
                            <ListGroup.Item>
                                <h2>Order Summary</h2>
                            </ListGroup.Item>

                            <ListGroup.Item>
                                <Row>
                                    <Col>Subtotal ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} items)</Col>
                                    <Col className="text-end">₹{subtotal.toFixed(2)}</Col>
                                </Row>
                            </ListGroup.Item>
                            
                            <ListGroup.Item>
                                <Form>
                                    <Form.Group controlId='coupon'>
                                        <Form.Label>Have a Coupon?</Form.Label>
                                        <div className="d-flex">
                                            <Form.Control
                                                type='text'
                                                placeholder='Enter code'
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                disabled={!!appliedCoupon}
                                            />
                                            <Button 
                                                type='button' 
                                                onClick={appliedCoupon ? clearCoupon : applyCouponHandler} 
                                                disabled={loading || (!couponCode && !appliedCoupon)}
                                                className="ms-2"
                                                variant={appliedCoupon ? 'danger' : 'primary'}
                                            >
                                                {loading ? '...' : (appliedCoupon ? 'Remove' : 'Apply')}
                                            </Button>
                                        </div>
                                    </Form.Group>
                                    {error && <Alert variant='danger' className='mt-2 small p-2'>{error}</Alert>}
                                </Form>
                            </ListGroup.Item>

                            {appliedCoupon && (
                                 <ListGroup.Item>
                                    <Row>
                                        <Col>Discount ({appliedCoupon.code})</Col>
                                        <Col className="text-end" style={{color: 'green'}}>
                                            - ₹{discount.toFixed(2)}
                                        </Col>
                                    </Row>
                                </ListGroup.Item>
                            )}

                            <ListGroup.Item>
                                <Row>
                                    <Col><strong>Grand Total</strong></Col>
                                    <Col className="text-end"><strong>₹{grandTotal.toFixed(2)}</strong></Col>
                                </Row>
                            </ListGroup.Item>

                            <ListGroup.Item className="d-grid">
                                <Button
                                    type="button"
                                    className="btn-block"
                                    disabled={cartItems.length === 0}
                                    onClick={checkoutHandler}
                                >
                                    Proceed To Checkout
                                </Button>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </>
    );
}

export default CartPage;