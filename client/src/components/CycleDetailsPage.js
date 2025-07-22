import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, Image, ListGroup, Card, Button, Alert } from 'react-bootstrap';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

function CycleDetailsPage() {
    const [cycle, setCycle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const { addToCart } = useContext(CartContext);
    const { userInfo, updateWishlist } = useContext(AuthContext);
    const [inWishlist, setInWishlist] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isPriceSubscribed, setIsPriceSubscribed] = useState(false);

    useEffect(() => {
        const fetchCycle = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/${id}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Failed to fetch cycle details');
                }

                setCycle(data);
                if (userInfo && userInfo.wishlist && userInfo.wishlist.includes(data._id)) {
            setInWishlist(true);
                }        
                  // Check if user is subscribed to this cycle's notifications
        if (userInfo && data.subscribers && data.subscribers.includes(userInfo._id)) {
            setIsSubscribed(true);
        } else {
            setIsSubscribed(false);
                }
                // Check if user is subscribed to price drop alerts
        if (userInfo && data.priceDropSubscribers && data.priceDropSubscribers.includes(userInfo._id)) {
            setIsPriceSubscribed(true);
        } else {
            setIsPriceSubscribed(false);
        }
                setLoading(false);
            } catch (err) {
                setError(err.message || 'Error loading cycle details.');
                setLoading(false);
                console.error(err);
            }
        };
        fetchCycle();
    }, [id, userInfo]);

    const addToCartHandler = () => {
        if (cycle.stock > 0) { // Only add to cart if stock is available
            console.log('Add to Cart button clicked!');
            addToCart(cycle._id, 1);
        } else {
            alert('This cycle is currently out of stock!');
        }
    };
     const wishlistHandler = async () => {
        if (!userInfo) {
            alert('Please login to add items to your wishlist');
            return;
        }
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/wishlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ cycleId: cycle._id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Action failed');
            
            // Local state (button ke liye) aur global state (refresh ke liye) dono ko update karo
            setInWishlist(!inWishlist);
            updateWishlist(data.wishlist); 
            
            alert(data.message);
        } catch (error) {
            alert('Failed to update wishlist');
        }
    };

    const notifyMeHandler = async () => {
        if (!userInfo) {
            alert('Please login to subscribe');
            return;
        }

        const method = isSubscribed ? 'DELETE' : 'POST';
        const successMessage = isSubscribed 
            ? 'Successfully unsubscribed from notifications' 
            : 'Successfully subscribed for stock notification';

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/${cycle._id}/subscribe`, {
                method: method,
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Action failed');
            
            setIsSubscribed(!isSubscribed); // Toggle the subscription status
            alert(successMessage);
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };
    const priceDropSubscribeHandler = async () => {
        if (!userInfo) {
            alert('Please login to subscribe to price drop alerts');
            return;
        }

        const method = isPriceSubscribed ? 'DELETE' : 'POST';
        const successMessage = isPriceSubscribed 
            ? 'Successfully unsubscribed from price drop alerts' 
            : 'Successfully subscribed for price drop alerts';

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/${cycle._id}/subscribe-price`, {
                method: method,
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Action failed');
            
            setIsPriceSubscribed(!isPriceSubscribed); // Toggle the subscription status
            alert(successMessage);
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };
    if (loading) {
        return <h2>Loading...</h2>;
    }

    if (error) {
        return <Alert variant='danger'>{error}</Alert>;
    }

    if (!cycle) {
        return <h2>Cycle not found.</h2>;
    }

    return (
        <>
            <Link className='btn btn-light my-3' to='/'>
                Go Back
            </Link>
            <Row>
                <Col md={6}>
                    <Image src={cycle.imageUrl} alt={cycle.model} fluid />
                </Col>
                <Col md={3}>
                    <ListGroup variant='flush'>
                        <ListGroup.Item>
                            <h3>{cycle.brand} {cycle.model}</h3>
                        </ListGroup.Item>
                        <ListGroup.Item>
                            Price: ₹{cycle.price}
                        </ListGroup.Item>
                        {/* --- Display Description --- */}
                        <ListGroup.Item>
                            Description: {cycle.description}
                        </ListGroup.Item>
                        {/* --- END DESCRIPTION --- */}
                    </ListGroup>
                </Col>
                <Col md={3}>
                    <Card>
                        <ListGroup variant='flush'>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Price:</Col>
                                    <Col><strong>₹{cycle.price}</strong></Col>
                                </Row>
                            </ListGroup.Item>
                            {/* --- Display Stock Status --- */}
                            <ListGroup.Item>
                                <Row>
                                    <Col>Status:</Col>
                                    <Col>
                                        {cycle.stock > 0 ? 'In Stock' : 'Out Of Stock'}
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                            {/* --- END STOCK STATUS --- */}
                            <ListGroup.Item className="d-grid gap-2">
                                {cycle.stock > 0 ? (
                                    <Button onClick={addToCartHandler} variant="primary" type='button'>
                                        Add To Cart
                                    </Button>
                                ) : (
                                    <Button
    onClick={notifyMeHandler}
    variant={isSubscribed ? "secondary" : "info"}
    type='button'
>
    {isSubscribed ? 'Subscribed ✓' : 'Notify Me When Available'}
</Button>
                                )}
                                <Button onClick={wishlistHandler} variant="outline-danger" type='button'>
                                    <i className={inWishlist ? 'fas fa-heart' : 'far fa-heart'}></i>
                                    {inWishlist ? ' In Wishlist' : ' Add to Wishlist'}
                                    
                                </Button>
                                <Button
    onClick={priceDropSubscribeHandler}
    variant={isPriceSubscribed ? "outline-secondary" : "outline-warning"}
    type='button'
    className="mt-2"
>
    {isPriceSubscribed ? 'Subscribed to Price Drop' : 'Notify on Price Drop'}
</Button>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </>
    );
}

export default CycleDetailsPage;