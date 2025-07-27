import React, { useContext, useState, useEffect } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Button, Card, Alert, Form } from 'react-bootstrap';
import { CartContext } from '../context/CartContext'; 


function CartPage() {
    // Ab hum state seedhe context se lenge
    const { cartItems, removeFromCart, updateCartItemQuantity } = useContext(CartContext);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
     console.log('Cart items received in CartPage:', cartItems); 
    const calculateSubtotal = () => {
        if (!cartItems) return 0;
        return cartItems.reduce((acc, item) => {
            // 👇️ NAYA: Variant ki price calculate karein
            const basePrice = item.cycleId.price;
            const chosenVariant = item.variantId // Agar item mein variantId hai
                ? item.cycleId.variants.find(v => v._id === item.variantId) // to us variant ko dhoondo
                : null; // warna null

            const effectivePrice = basePrice + (chosenVariant ? (chosenVariant.additionalPrice || 0) : 0);
            // 👆️ NAYA: Variant ki price calculate karein
            return acc + item.quantity * effectivePrice;
        }, 0).toFixed(2);
    };

    const removeFromCartHandler = (cycleId, variantId = null) => { // 👇️ NAYA: 'variantId' parameter add kiya
        if (window.confirm('Are you sure you want to remove this item?')) {
            // 👇️ NAYA: 'variantId' bhi pass karein
            removeFromCart(cycleId, variantId);
        }
    };
       const navigate = useNavigate();

    const checkoutHandler = () => {
        navigate('/shipping');
    };
    const applyCouponHandler = async () => {
        setLoading(true);
        setError('');
        try {
            // Token ko localStorage se lena zaroori hai
            const userInfo = localStorage.getItem('userInfo') 
                ? JSON.parse(localStorage.getItem('userInfo')) 
                : null;

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
            
            setAppliedCoupon(data);
            alert('Coupon applied successfully!');
            
        } catch (err) {
            setError(err.message);
            setAppliedCoupon(null); // Galti hone par purana coupon hata do
        } finally {
            setLoading(false);
        }
    };
    const subtotal = Number(calculateSubtotal());

    useEffect(() => {
        if (appliedCoupon) {
            let calculatedDiscount = 0;
            if (appliedCoupon.discountType === 'percentage') {
                calculatedDiscount = (subtotal * appliedCoupon.discountValue) / 100;
            } else { // fixed
                calculatedDiscount = appliedCoupon.discountValue;
            }
            // Yeh check karega ki discount subtotal se zyada na ho
            setDiscount(Math.min(calculatedDiscount, subtotal));
        } else {
            setDiscount(0);
        }
    }, [appliedCoupon, subtotal]);

    const grandTotal = (subtotal - discount).toFixed(2);
    // 👆️ YEH CALCULATION WALA CODE ADD KAR 👆️
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
                        {cartItems.map(item => (
                            <ListGroup.Item key={item.cycleId._id}>
                                <Row className="align-items-center">
                                    <Col md={2}>
                                        <Image src={item.cycleId.imageUrl} alt={item.cycleId.model} fluid rounded />
                                    </Col>
                                    <Col md={3}>
                                        <Link to={`/cycle/${item.cycleId._id}`}>{item.cycleId.brand} {item.cycleId.model}</Link>
                                        {/* 👇️ START: NAYA VARIANT DETAILS DISPLAY YAHAN 👇️ */}
                                        {item.variantId && item.cycleId.variants && item.cycleId.variants.length > 0 && (
                                            (() => { // IIFE to find the variant details
                                                const chosenVariant = item.cycleId.variants.find(
                                                    v => v._id === item.variantId
                                                );
                                                return chosenVariant ? (
                                                    <div style={{ fontSize: '0.8em', color: '#6c757d' }}>
                                                        ({chosenVariant.color} - {chosenVariant.size})
                                                    </div>
                                                ) : null;
                                            })()
                                        )}
                                    </Col>
                                    <Col md={2}>₹{item.cycleId.price}
                                        {/* 👇️ NAYA: Price display adjusted for variant additionalPrice 👇️ */}
                                        {(() => { // IIFE to calculate price
                                            const basePrice = item.cycleId.price;
                                            const chosenVariant = item.variantId
                                                ? item.cycleId.variants.find(v => v._id === item.variantId)
                                                : null;
                                            const effectivePrice = basePrice + (chosenVariant ? (chosenVariant.additionalPrice || 0) : 0);
                                            return `₹${effectivePrice.toFixed(2)}`;
                                        })()}
                                    </Col>
                                    <Col md={2} className="d-flex align-items-center"> {/* flexbox ताकि बटन और टेक्स्ट एक लाइन में हों */}
    <Button
        variant="outline-secondary"
        size="sm" 
        onClick={() => updateCartItemQuantity(item.cycleId._id, item.quantity - 1, item.variantId)} // 👇️ NAYA: item.variantId add kiya
        disabled={item.quantity === 1} 
        className="me-2" 
    >
        <i className="fa-solid fa-minus"></i>
    </Button>
    {item.quantity}
    <Button
        variant="outline-secondary"
        size="sm" 
        onClick={() => updateCartItemQuantity(item.cycleId._id, item.quantity + 1, item.variantId)} // 👇️ NAYA: item.variantId add kiya
        className="ms-2" 
    >
        <i className="fa-solid fa-plus"></i>
    </Button>
</Col>
                                    <Col md={2}>
                                        <Button type="button" variant="light" onClick={() => removeFromCartHandler(item.cycleId._id)}>
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Col>
            <Col md={4}>
                <Card>
                    <ListGroup variant="flush">
                        <ListGroup.Item>
                            <h2>Order Summary</h2>
                        </ListGroup.Item>

                        <ListGroup.Item>
                            <Row>
                                <Col>Subtotal</Col>
                                <Col className="text-end">₹{subtotal.toFixed(2)}</Col>
                            </Row>
                        </ListGroup.Item>
                        
                        {/* Coupon Code Section */}
                        <ListGroup.Item>
                            <Form>
                                <Form.Group controlId='coupon'>
                                    <Form.Label>Have a Coupon?</Form.Label>
                                    <div className="d-flex">
                                        <Form.Control
                                            type='text'
                                            placeholder='Enter code'
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                        />
                                        <Button 
                                            type='button' 
                                            onClick={applyCouponHandler} 
                                            disabled={loading || !couponCode}
                                            className="ms-2"
                                        >
                                            {loading ? '...' : 'Apply'}
                                        </Button>
                                    </div>
                                </Form.Group>
                                {error && <Alert variant='danger' className='mt-2 small p-2'>{error}</Alert>}
                            </Form>
                        </ListGroup.Item>

                        {/* Discount and Grand Total Section */}
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
                                <Col className="text-end"><strong>₹{grandTotal}</strong></Col>
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