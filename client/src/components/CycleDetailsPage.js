import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, Image, ListGroup, Card, Button, Alert, Form } from 'react-bootstrap';
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
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reviewError, setReviewError] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [currentDisplayedPrice, setCurrentDisplayedPrice] = useState(0);
    const [currentDisplayedStock, setCurrentDisplayedStock] = useState(0);
    const [selectedVariantId, setSelectedVariantId] = useState(null);
    const [pincode, setPincode] = useState('');
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [deliveryError, setDeliveryError] = useState('');
    const [estimatedDate, setEstimatedDate] = useState('');
    const [hasReviewed, setHasReviewed] = useState(false);
    const fetchCycle = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/${id}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch cycle details');
            }

            setCycle(data);
            
            setCurrentDisplayedPrice(data.price);
            setCurrentDisplayedStock(data.stock);

            
            if (data.variants && data.variants.length > 0) {
                
                setSelectedColor(data.variants[0].color || '');
                setSelectedSize(data.variants[0].size || '');
                
                setSelectedVariantId(data.variants[0]._id);
                
                setCurrentDisplayedPrice(data.price + (data.variants[0].additionalPrice || 0));
                setCurrentDisplayedStock(data.variants[0].variantStock);
            } else {
                
                setSelectedColor('');
                setSelectedSize('');
                setSelectedVariantId(null);
            }
            

            if (userInfo && userInfo.wishlist && userInfo.wishlist.includes(data._id)) {
                setInWishlist(true);
            } else {
                setInWishlist(false);
            }

            if (userInfo && data.subscribers && data.subscribers.includes(userInfo._id)) {
                setIsSubscribed(true);
            } else {
                setIsSubscribed(false);
            }

            if (userInfo && data.priceDropSubscribers && data.priceDropSubscribers.includes(userInfo._id)) {
                setIsPriceSubscribed(true);
            } else {
                setIsPriceSubscribed(false);
            }
            if (userInfo && data.reviews) {
            const userReview = data.reviews.find(
                (review) => review.user === userInfo._id
            );
            if (userReview) {
                setRating(userReview.rating);
                setComment(userReview.comment);
                setHasReviewed(true);
            } else {
                
                setRating(0);
                setComment('');
                setHasReviewed(false);
            }
        }
            setLoading(false);
        } catch (err) {
            setError(err.message || 'Error loading cycle details.');
            setLoading(false);
            console.error(err);
        }
    }, [id, userInfo]); 
    useEffect(() => {
        fetchCycle();
    }, [fetchCycle]);

    
    useEffect(() => {
        
        console.log(`Comparing: Color='${selectedColor}', Size='${selectedSize}'`);

        if (cycle && cycle.variants && cycle.variants.length > 0) {
            const chosenVariant = cycle.variants.find(
                (v) => 
                    v.color.trim().toLowerCase() === selectedColor.trim().toLowerCase() && 
                    v.size.trim().toLowerCase() === selectedSize.trim().toLowerCase()
            );

            if (chosenVariant) {
                console.log('Variant FOUND:', chosenVariant);
                setCurrentDisplayedPrice(cycle.price + (chosenVariant.additionalPrice || 0));
                setCurrentDisplayedStock(chosenVariant.variantStock);
                setSelectedVariantId(chosenVariant._id);
            } else {
                console.log('Variant NOT found.');
               
                setCurrentDisplayedPrice(cycle.price);
                setCurrentDisplayedStock(0);
                setSelectedVariantId(null);
            }
        }
    }, [selectedColor, selectedSize, cycle]);
         useEffect(() => {
        if (cycle && cycle.variants) {
            
            const availableSizes = cycle.variants
                .filter(v => v.color.trim() === selectedColor.trim())
                .map(v => v.size);

            
            if (availableSizes.length > 0) {
                
                setSelectedSize(availableSizes[0]);
            }
        }
    }, [selectedColor, cycle]); 


    const addToCartHandler = () => {
        
        if (currentDisplayedStock > 0) { 
            console.log('Add to Cart button clicked!');
            addToCart(cycle._id, 1, selectedVariantId);
        } else {
            alert('This cycle is currently out of stock!');
        }
    };

    const checkDeliveryDateHandler = async () => {
       
        if (!/^\d{6}$/.test(pincode)) {
            setDeliveryError('Please enter a valid 6-digit pincode.');
            setEstimatedDate('');
            return;
        }

        setDeliveryLoading(true);
        setDeliveryError('');
        setEstimatedDate('');

        try {
            
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/delivery/estimate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pincode: pincode })
            });

            const data = await res.json();
            if (!res.ok) {
                
                throw new Error(data.message || 'Could not fetch delivery date.');
            }
            
            
            setEstimatedDate(data.estimatedDate);

        } catch (err) {
            setDeliveryError(err.message);
        } finally {
            setDeliveryLoading(false);
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

            setIsSubscribed(!isSubscribed); 
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

            setIsPriceSubscribed(!isPriceSubscribed); 
            alert(successMessage);
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };
    const submitReviewHandler = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/cycles/${id}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ rating, comment })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit review');
            }
            alert(data.message); 
            setHasReviewed(true); 
            fetchCycle(); 
        } catch (err) {
            setReviewError(err.message);
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
                        
                        <ListGroup.Item>
                            Description: {cycle.description}
                        </ListGroup.Item>
                        
                        {cycle.variants && cycle.variants.length > 0 && (
                            <>
                                
                                <ListGroup.Item>
                                    <Row className="align-items-center">
                                        <Col>Color:</Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                value={selectedColor}
                                                onChange={(e) => setSelectedColor(e.target.value)}
                                            >
                                                
                                                {[...new Set(cycle.variants.map(v => v.color))].map(
                                                    (colorOption) => (
                                                        <option key={colorOption} value={colorOption}>
                                                            {colorOption}
                                                        </option>
                                                    )
                                                )}
                                            </Form.Control>
                                        </Col>
                                    </Row>
                                </ListGroup.Item>

                                
                                <ListGroup.Item>
                                    <Row className="align-items-center">
                                        <Col>Size:</Col>
                                        <Col>
                                            <Form.Control
                                                as="select"
                                                value={selectedSize}
                                                onChange={(e) => setSelectedSize(e.target.value)}
                                            >
                                                
                                                {cycle.variants
                                                    .filter(v => v.color === selectedColor)
                                                    .map((sizeOption) => (
                                                        <option key={sizeOption.size} value={sizeOption.size}>
                                                            {sizeOption.size}
                                                        </option>
                                                    ))}
                                            </Form.Control>
                                        </Col>
                                    </Row>
                                </ListGroup.Item>
                            </>
                        )}
                        
                    </ListGroup>
                </Col>
                <Col md={3}> 
                    <Card>
                        <ListGroup variant='flush'>
                            
                            <ListGroup.Item>
                                <Row className="align-items-center mb-2">
                                    <Col xs={5}>Price:</Col> 
                                    <Col xs={7} className="text-end text-nowrap"> 
                                        <strong>₹{currentDisplayedPrice.toFixed(2)}</strong>
                                    </Col>
                                </Row>
                                <Row className="align-items-center">
                                    <Col xs={5}>Status:</Col> 
                                    <Col xs={7} className="text-end text-nowrap"> 
                                        {currentDisplayedStock > 0 ? 'In Stock' : 'Out Of Stock'}
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <div className="d-flex">
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Pincode"
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                        maxLength="6"
                                        className="me-2"
                                    />
                                    <Button onClick={checkDeliveryDateHandler} disabled={deliveryLoading}>
                                        {deliveryLoading ? '...' : 'Check'}
                                    </Button>
                                </div>
                                {deliveryError && <small className="text-danger d-block mt-1">{deliveryError}</small>}
                                {estimatedDate && <small className="text-success d-block mt-1">Estimated delivery: <b>{estimatedDate}</b></small>}
                            </ListGroup.Item>

                            <ListGroup.Item className="d-grid gap-2"> 
                                {currentDisplayedStock > 0 ? (
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
            
            <Row className="mt-5">

                <Col md={6}>
                    <h2>Reviews</h2>
                    {cycle.reviews && cycle.reviews.length > 0 ? (
                        <div className="review-container">
                            {cycle.reviews.map((review) => (
                                <div key={review._id} className="review-box">
                                    <div className="review-author">{review.name}</div>
                                    <div className="review-date">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="review-comment">{review.comment}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Alert variant="info">No Reviews Yet</Alert>
                    )}
                </Col>

                <Col md={6}>
                    <h2>{hasReviewed ? 'Your Review' : 'Write a Customer Review'}</h2>
                    {reviewError && <Alert variant="danger">{reviewError}</Alert>}
                    {userInfo ? (
                        <Form onSubmit={submitReviewHandler}>
                            <Form.Group controlId='rating' className='my-2'>
                                <Form.Label>Rating</Form.Label>
                                <Form.Control as='select' value={rating} onChange={(e) => setRating(e.target.value)}>
                                    <option value=''>Select...</option>
                                    <option value='1'>1 - Poor</option>
                                    <option value='2'>2 - Fair</option>
                                    <option value='3'>3 - Good</option>
                                    <option value='4'>4 - Very Good</option>
                                    <option value='5'>5 - Excellent</option>
                                </Form.Control>
                            </Form.Group>
                            <Form.Group controlId='comment' className='my-2'>
                                <Form.Label>Comment</Form.Label>
                                <Form.Control as='textarea' rows='3' value={comment} onChange={(e) => setComment(e.target.value)}></Form.Control>
                            </Form.Group>
                            <Button type='submit' variant='primary' className="mt-3">Submit Review</Button>
                        </Form>
                    ) : (
                        <Alert>Please <Link to='/login'>sign in</Link> to write a review</Alert>
                    )}
                </Col>
            </Row>
        </>
    );
}

export default CycleDetailsPage;