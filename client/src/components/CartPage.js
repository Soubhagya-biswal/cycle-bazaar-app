import React, { useContext } from 'react'; // useEffect aur useState hata diya
import { Link, useNavigate } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Button, Card, Alert } from 'react-bootstrap';
import { CartContext } from '../context/CartContext'; // CartContext import kiya


function CartPage() {
    // Ab hum state seedhe context se lenge
    const { cartItems, removeFromCart, updateCartItemQuantity } = useContext(CartContext);
     console.log('Cart items received in CartPage:', cartItems); // YEH NAYI LINE HAI
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
                            <h2>
                                Subtotal ({cartItems.reduce((acc, item) => acc + item.quantity, 0)}) items
                            </h2>
                            ₹{calculateSubtotal()}
                        </ListGroup.Item>
                        <ListGroup.Item className="d-grid">
                                <Button
    type="button"
    className="btn-block"
    disabled={cartItems.length === 0}
    onClick={checkoutHandler}  // <-- Yeh add karein
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