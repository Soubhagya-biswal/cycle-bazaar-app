/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Card, Alert, Button, Form } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';



function OrderPage() {
    const { id: orderId } = useParams();
    const [searchParams] = useSearchParams();
    const isAdminView = searchParams.get('adminView') === 'true';

    console.log('OrderPage: Full searchParams object:', searchParams.toString());
    console.log('OrderPage: adminView param value:', searchParams.get('adminView'));
    console.log('OrderPage: isAdminView (boolean):', isAdminView);

    const { userInfo } = useContext(AuthContext);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clientSecret, setClientSecret] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [returnReason, setReturnReason] = useState(''); 
    const [returnMethod, setReturnMethod] = useState(''); 
    const [bankDetails, setBankDetails] = useState({ 
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: ''
    });
    const [returnRequestSuccess, setReturnRequestSuccess] = useState(false); 
    


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

            
            if (data.status === 'Delivered' && !data.returnDeadline) {
                 
                const deliveredDate = new Date(data.deliveredAt);
                const calculatedReturnDeadline = new Date(deliveredDate);
                calculatedReturnDeadline.setDate(deliveredDate.getDate() + 7); 
                data.returnDeadline = calculatedReturnDeadline.toISOString(); 
                setOrder(data);
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
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const paymentSuccessHandler = () => {
        fetchOrder();
    };
          const razorpayPaymentHandler = async () => {
        try {
            // 1. Backend se Razorpay order details lao
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders/${orderId}/razorpay`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` },
            });
            const razorpayOrder = await res.json();
            if (!res.ok) {
                throw new Error(razorpayOrder.message || 'Failed to create Razorpay order');
            }

            // 2. Razorpay payment window ke options set karo
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Key ID .env file se aayegi
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Cycle Bazaar',
                description: `Order Transaction for #${order._id}`,
                order_id: razorpayOrder.orderId,
                handler: async function (response) {
                    // 3. Payment success hone ke baad, backend par verify karo
                    const verificationRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders/verify-payment`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${userInfo.token}`
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: order._id,
                        }),
                    });

                    const verificationData = await verificationRes.json();
                    if (!verificationRes.ok) {
                        throw new Error(verificationData.message || 'Payment verification failed');
                    }
                    
                    alert('Payment successful!');
                    fetchOrder(); // Page ko refresh karke "Paid" status dikhao
                },
                prefill: {
                    name: userInfo.name,
                    email: userInfo.email,
                },
                theme: {
                    color: '#3399cc',
                },
            };

            // 4. Razorpay window kholo
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            alert(err.message);
        }
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
            alert('Order marked as paid successfully!');

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
                fetchOrder(); 
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        }
    };

   
    const requestReturnHandler = async () => {
        if (!returnReason || !returnMethod) {
            alert('Please select a reason and return method.');
            return;
        }

        if (returnMethod === 'Bank Transfer') {
            if (!bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.bankName) {
                alert('Please fill in all bank details for bank transfer.');
                return;
            }
        }

        try {
            setLoading(true);
            setError(null); 

            const payload = {
                orderId: order._id,
                reason: returnReason,
                returnMethod: returnMethod,
                
                bankDetails: returnMethod === 'Bank Transfer' ? bankDetails : undefined
            };

            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/returns/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to send return request.');
            }

            setReturnRequestSuccess(true); 
            setShowReturnForm(false); 
            setReturnReason(''); 
            setReturnMethod('');
            setBankDetails({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' }); 
            fetchOrder(); 

        } catch (err) {
            setError(err.message);
            console.error("Error requesting return:", err);
        } finally {
            setLoading(false);
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
                                    <p><strong>Address: </strong>{order.shippingAddress.address}, {order.shippingAddress.city}{' '}{order.shippingAddress.postalCode}, {order.shippingAddress.country}
                                    </p>
                                    {!order.isDelivered && order.estimatedDeliveryDate && (
                                <Alert variant='info' className="mt-3">
                                   Estimated Delivery By: <strong>{new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}</strong>
                                </Alert>
                            )}
                            <Alert variant={
                                order.status === 'Delivered' || order.status === 'Refund Processed' ? 'success' : 
                                order.status === 'Cancelled' || order.status === 'Return Rejected' ? 'danger' : 
                                'info'
                            }>
                                Status: {order.status}
                                {order.status === 'Delivered' && order.deliveredAt && (
                                    ` on ${new Date(order.deliveredAt).toLocaleString()}`
                                )}
                                
                                {order.status === 'Return Requested' && order.returnRequestDate && (
                                    ` (Requested on ${new Date(order.returnRequestDate).toLocaleDateString()})`
                                )}
                                
                                {order.status === 'Refund Processed' && order.refundedAt && ( 
                                    ` (Processed on ${new Date(order.refundedAt).toLocaleDateString()})`
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
                                                    <Link to={`/product/${item.cycle}`}>{item.name}</Link>
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

                            {!order.isPaid && order.paymentMethod !== 'COD' && (
                                <ListGroup.Item className="d-grid">
                                    <Button
                                        type='button'
                                        className='btn-block'
                                        onClick={razorpayPaymentHandler}
                                    >
                                        Pay with Razorpay
                                    </Button>
                                </ListGroup.Item>
                            )}
                            
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

                                        {(order.status === 'Delivered' || order.status === 'Return Requested' || order.status === 'Return Approved' || order.status === 'Return Rejected' || order.status === 'Refund Processed') && (
                                            <>
                                                <option value="Return Requested">Return Requested</option>
                                                <option value="Return Approved">Return Approved</option>
                                                <option value="Return Rejected">Return Rejected</option>
                                                <option value="Refund Processed">Refund Processed</option>
                                            </>
                                        )}
                                        

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
                                    {userInfo && userInfo.isAdmin && isAdminView && order.paymentMethod === 'COD' && !order.isPaid && (
                                <ListGroup.Item className="d-grid"> 
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
                            
                            {order.status === 'Processing' && !isAdminView && (
                                <ListGroup.Item className="d-grid">
                                    <Button type='button' variant='danger' onClick={cancelOrderHandler} disabled={loading}>
                                        Cancel Order
                                    </Button>
                                </ListGroup.Item>
                            )}
                            
                        
                            {order.status === 'Delivered' && !isAdminView && !order.returnInitiated && (
                                <ListGroup.Item className="d-grid">
                                    <Button
                                        type='button'
                                        variant='primary'
                                        onClick={() => setShowReturnForm(true)}
                                        
                                        disabled={loading || (order.returnDeadline && new Date() > new Date(order.returnDeadline))}
                                    >
                                        Request Return
                                        
                                        {order.returnDeadline && ` (within ${new Date(order.returnDeadline).toLocaleDateString()})`}
                                    </Button>
                                    {/* Agar return window band ho gayi hai toh message dikhayein */}
                                    {order.returnDeadline && new Date() > new Date(order.returnDeadline) && (
                                        <Alert variant="danger" className="mt-2">Return window has closed for this order.</Alert>
                                    )}
                                </ListGroup.Item>
                            )}

                            
                            {showReturnForm && !isAdminView && (
                                <ListGroup.Item>
                                    <h3>Request Return</h3>
                                    {/* Success/Error messages for return request */}
                                    {returnRequestSuccess && <Alert variant="success">Return request sent successfully! We will review your request shortly.</Alert>}
                                    {error && <Alert variant="danger">{error}</Alert>}

                                    <Form>
                                        <Form.Group controlId="returnReason" className="mb-3">
                                            <Form.Label>Reason for Return</Form.Label>
                                            <Form.Control
                                                as="select"
                                                value={returnReason}
                                                onChange={(e) => setReturnReason(e.target.value)}
                                                required
                                            >
                                                <option value="">Select Reason</option>
                                                <option value="Damaged Product">Damaged Product</option>
                                                <option value="Wrong Item Received">Wrong Item Received</option>
                                                <option value="Size/Fit Issue">Size/Fit Issue</option>
                                                <option value="No Longer Needed">No Longer Needed</option>
                                                <option value="Defective Product">Defective Product</option>
                                                <option value="Other">Other</option>
                                            </Form.Control>
                                        </Form.Group>

                                        <Form.Group controlId="returnMethod" className="mb-3">
                                            <Form.Label>Preferred Return Method</Form.Label>
                                            <Form.Control
                                                as="select"
                                                value={returnMethod}
                                                onChange={(e) => {
                                                    setReturnMethod(e.target.value);
                                                    
                                                    if (e.target.value !== 'Bank Transfer') {
                                                        setBankDetails({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' });
                                                    }
                                                }}
                                                required
                                            >
                                                <option value="">Select Method</option>
                                                <option value="Refund to Original Payment Method">Refund to Original Payment Method (Payment Gateway)</option>
                                                <option value="Store Credit">Store Credit</option>
                                                <option value="Bank Transfer">Bank Transfer (Provide Bank Details Below)</option>
                                            </Form.Control>
                                        </Form.Group>

                                        
                                        {returnMethod === 'Bank Transfer' && (
                                            <>
                                                <hr className="my-3"/>
                                                <h5>Bank Details for Refund</h5>
                                                <Alert variant="info" className="small">Please provide accurate bank details for the refund. Your details will be kept confidential.</Alert>
                                                <Form.Group controlId="accountHolderName" className="mb-3">
                                                    <Form.Label>Account Holder Name</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Enter account holder name"
                                                        value={bankDetails.accountHolderName}
                                                        onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                                                        required={returnMethod === 'Bank Transfer'}
                                                    />
                                                </Form.Group>
                                                <Form.Group controlId="accountNumber" className="mb-3">
                                                    <Form.Label>Account Number</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Enter account number"
                                                        value={bankDetails.accountNumber}
                                                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                                        required={returnMethod === 'Bank Transfer'}
                                                    />
                                                </Form.Group>
                                                <Form.Group controlId="ifscCode" className="mb-3">
                                                    <Form.Label>IFSC Code</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Enter IFSC code"
                                                        value={bankDetails.ifscCode}
                                                        onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                                                        required={returnMethod === 'Bank Transfer'}
                                                    />
                                                </Form.Group>
                                                <Form.Group controlId="bankName" className="mb-3">
                                                    <Form.Label>Bank Name</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Enter bank name"
                                                        value={bankDetails.bankName}
                                                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                                        required={returnMethod === 'Bank Transfer'}
                                                    />
                                                </Form.Group>
                                            </>
                                        )}

                                        <div className="d-grid gap-2 mt-3">
                                            <Button variant="success" onClick={requestReturnHandler} disabled={loading}>
                                                Submit Return Request
                                            </Button>
                                            <Button variant="secondary" onClick={() => setShowReturnForm(false)} disabled={loading}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </Form>
                                </ListGroup.Item>
                            )}

                            
                            {order.returnInitiated && (order.status === 'Return Requested' || order.status === 'Return Approved' || order.status === 'Return Rejected' || order.status === 'Refund Processed') && (
                                <ListGroup.Item>
                                    <Alert variant={order.status === 'Return Rejected' ? 'danger' : order.status === 'Refund Processed' ? 'success' : 'info'}>
                                        Return Status: <strong>{order.status}</strong>
                                        {order.returnRequestDate && ` (Requested on ${new Date(order.returnRequestDate).toLocaleDateString()})`}
                                        {order.returnId && ` | Return ID: ${order.returnId}`}
                                        
                                    </Alert>
                                </ListGroup.Item>
                            )}
                            

                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </>
    ) : null;
}

export default OrderPage;