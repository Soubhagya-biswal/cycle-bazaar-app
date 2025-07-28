import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Row, Col, Alert, Form } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

function CouponListScreen() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state for creating new coupon
    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState('percentage');
    const [discountValue, setDiscountValue] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [bannerTitle, setBannerTitle] = useState('');
    const [bannerText, setBannerText] = useState('');

    const { userInfo } = useContext(AuthContext);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/coupons`, {
                headers: { Authorization: `Bearer ${userInfo.token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch coupons');
            setCoupons(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const createCouponHandler = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/coupons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
                
                body: JSON.stringify({ 
                    code, 
                    discountType, 
                    discountValue, 
                    expiryDate,
                    isFeatured,
                    bannerTitle,
                    bannerText
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create coupon');
            
            alert('Coupon created successfully!');
            fetchCoupons(); 

            
            setCode('');
            setDiscountType('percentage');
            setDiscountValue('');
            setExpiryDate('');
            setIsFeatured(false);
            setBannerTitle('');
            setBannerText('');
        } catch (err) {
            setError(err.message);
        }
    };

    const deleteCouponHandler = async (id) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/coupons/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${userInfo.token}` },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to delete coupon');
                alert('Coupon deleted!');
                fetchCoupons(); // Refresh list
            } catch (err) {
                setError(err.message);
            }
        }
    };
    const toggleIsFeaturedHandler = async (coupon) => {
        const action = coupon.isFeatured ? 'un-feature' : 'feature';
        if (window.confirm(`Are you sure you want to ${action} this coupon? Only one coupon can be featured at a time.`)) {
            try {
                // Pehle saare dusre coupons ko un-feature karo
                await Promise.all(
                    coupons.map(c => {
                        if (c.isFeatured) {
                            return fetch(`${process.env.REACT_APP_API_BASE_URL}/api/coupons/${c._id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${userInfo.token}`,
                                },
                                body: JSON.stringify({ isFeatured: false }),
                            });
                        }
                        return Promise.resolve();
                    })
                );

                // Ab current coupon ka status toggle karo
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/coupons/${coupon._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                    body: JSON.stringify({ isFeatured: !coupon.isFeatured }), // Status ko ulta kar do
                });
                if (!res.ok) throw new Error('Failed to update coupon feature status');
                
                alert(`Coupon successfully ${action}d!`);
                fetchCoupons(); // List refresh karo
            } catch (err) {
                setError(err.message);
            }
        }
    };
    return (
        <Row>
            <Col md={4}>
                <h2>Create Coupon</h2>
                <Form onSubmit={createCouponHandler}>
                    <Form.Group controlId='code' className='my-3'>
                        <Form.Label>Coupon Code</Form.Label>
                        <Form.Control
                            type='text'
                            placeholder='e.g., SALE10'
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId='discountType' className='my-3'>
                        <Form.Label>Discount Type</Form.Label>
                        <Form.Control as='select' value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                            <option value='percentage'>Percentage</option>
                            <option value='fixed'>Fixed Amount</option>
                        </Form.Control>
                    </Form.Group>

                    <Form.Group controlId='discountValue' className='my-3'>
                        <Form.Label>Discount Value</Form.Label>
                        <Form.Control
                            type='number'
                            placeholder={discountType === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 500 for ₹500'}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId='expiryDate' className='my-3'>
                        <Form.Label>Expiry Date (Optional)</Form.Label>
                        <Form.Control
                            type='date'
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group controlId='isFeatured' className='my-3'>
                        <Form.Check
                            type='checkbox'
                            label='Set as Featured Banner'
                            checked={isFeatured}
                            onChange={(e) => setIsFeatured(e.target.checked)}
                        />
                    </Form.Group>

                    {isFeatured && (
                        <>
                            <Form.Group controlId='bannerTitle' className='my-3'>
                                <Form.Label>Banner Title</Form.Label>
                                <Form.Control
                                    type='text'
                                    placeholder='e.g., DIWALI SALE'
                                    value={bannerTitle}
                                    onChange={(e) => setBannerTitle(e.target.value)}
                                />
                            </Form.Group>
                            <Form.Group controlId='bannerText' className='my-3'>
                                <Form.Label>Banner Text</Form.Label>
                                <Form.Control
                                    as='textarea'
                                    rows={3}
                                    placeholder='e.g., Get flat 20% off...'
                                    value={bannerText}
                                    onChange={(e) => setBannerText(e.target.value)}
                                />
                            </Form.Group>
                        </>
                    )}

                    <Button type='submit' variant='primary'>
                        Create Coupon
                    </Button>
                </Form>
            </Col>
            <Col md={8}>
                <h2>Existing Coupons</h2>
                {loading ? <p>Loading...</p> : error ? <Alert variant='danger'>{error}</Alert> : (
                    <Table striped bordered hover responsive className='table-sm'>
    <thead>
        <tr>
            <th>CODE</th>
            <th>TYPE</th>
            <th>VALUE</th>
            <th>FEATURED</th> {/* Naya Column */}
            <th>ACTIVE</th>
            <th>ACTION</th>
        </tr>
    </thead>
    <tbody>
        {coupons.map((coupon) => (
            <tr key={coupon._id}>
                <td>{coupon.code}</td>
                <td>{coupon.discountType}</td>
                <td>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                <td> {/* Naya Column Data */}
                    {coupon.isFeatured ? <i className='fas fa-star' style={{ color: 'gold' }}></i> : ''}
                </td>
                <td>
                    {coupon.isActive ? <i className='fas fa-check' style={{ color: 'green' }}></i> : <i className='fas fa-times' style={{ color: 'red' }}></i>}
                </td>
                <td>
                    {/* Naya Button */}
                    <Button 
                        variant={coupon.isFeatured ? 'secondary' : 'warning'} 
                        className='btn-sm' 
                        onClick={() => toggleIsFeaturedHandler(coupon)}
                    >
                        <i className={coupon.isFeatured ? 'fas fa-star-slash' : 'fas fa-star'}></i>
                    </Button>
                    <Button variant='danger' className='btn-sm ms-2' onClick={() => deleteCouponHandler(coupon._id)}>
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

export default CouponListScreen;