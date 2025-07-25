/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Card, Alert, Button, Form } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm.js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

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

    // --- NAYE STATE VARIABLES RETURN FUNCTIONALITY KE LIYE ---
    const [showReturnForm, setShowReturnForm] = useState(false); // Return form ko dikhane/chhipane ke liye
    const [returnReason, setReturnReason] = useState(''); // User dwara diya gaya return ka karan
    const [returnMethod, setReturnMethod] = useState(''); // Refund ka tarika (e.g., Bank Transfer, Store Credit)
    const [bankDetails, setBankDetails] = useState({ // Bank transfer ke liye details
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: ''
    });
    const [returnRequestSuccess, setReturnRequestSuccess] = useState(false); // Return request successful hone par message
    // --- NAYE STATE VARIABLES KA END ---


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

            // --- NAYA LOGIC FOR RETURN WINDOW (Agar backend se returnDeadline nahi aa raha hai) ---
            // Yahan hum return deadline ko frontend par calculate kar rahe hain,
            // lekin ideally ye backend se hi aana chahiye jab order deliver ho.
            if (data.status === 'Delivered' && !data.returnDeadline) {
                 // Example: Agar database mein returnDeadline nahi hai, toh yahan calculate kar sakte hain
                 // aur display kar sakte hain. Backend mein deliveredAt set hone par returnDeadline bhi set ho.
                const deliveredDate = new Date(data.deliveredAt);
                const calculatedReturnDeadline = new Date(deliveredDate);
                calculatedReturnDeadline.setDate(deliveredDate.getDate() + 7); // 7 din ka return window example
                data.returnDeadline = calculatedReturnDeadline.toISOString(); // Frontend use ke liye add kiya
                setOrder(data); // Updated order state
            }
            // --- NAYA LOGIC END ---

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

    // --- MARK AS PAID HANDLER (JO GALTI SE REMOVE HO GAYA THA) ---
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
            fetchOrder(); // Order details ko refresh karo
            alert('Order marked as paid successfully!');

        } catch (err) {
            setError(err.message);
            console.error("Error marking as paid:", err);
            setLoading(false);
        }
    };
    // --- MARK AS PAID HANDLER END ---

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

    // --- NAYA HANDLER FUNCTION RETURN REQUEST KE LIYE ---
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
            setError(null); // Puraane errors clear karein

            const payload = {
                orderId: order._id,
                reason: returnReason,
                returnMethod: returnMethod,
                // Bank details sirf tab bhejein jab return method 'Bank Transfer' ho
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

            setReturnRequestSuccess(true); // Success message dikhane ke liye
            setShowReturnForm(false); // Form hide karein
            setReturnReason(''); // Fields reset karein
            setReturnMethod('');
            setBankDetails({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' }); // Bank details reset
            fetchOrder(); // Order details ko refresh karein naye return status ke liye

        } catch (err) {
            setError(err.message);
            console.error("Error requesting return:", err);
        } finally {
            setLoading(false);
        }
    };
    // --- NAYA HANDLER FUNCTION KA END ---


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
                                order.status === 'Delivered' || order.status === 'Refund Processed' ? 'success' : // Refunded orders bhi green dikhenge
                                order.status === 'Cancelled' || order.status === 'Return Rejected' ? 'danger' : // Rejected returns bhi red dikhenge
                                'info'
                            }>
                                Status: {order.status}
                                {order.status === 'Delivered' && order.deliveredAt && (
                                    ` on ${new Date(order.deliveredAt).toLocaleString()}`
                                )}
                                {/* NAYA: Return Request Date dikhayein */}
                                {order.status === 'Return Requested' && order.returnRequestDate && (
                                    ` (Requested on ${new Date(order.returnRequestDate).toLocaleDateString()})`
                                )}
                                {/* NAYA: Return Processed Date dikhayein */}
                                {order.status === 'Refund Processed' && order.refundedAt && ( // Assuming refundedAt is used for general refunds
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
                            {/* Ye section tab dikhega jab user admin ho AND woh admin list se aaya ho (query param ke through) */}
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
                                        {/* Existing options */}
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

                                        {/* --- NAYE OPTIONS FOR RETURN STATUSES (ADMIN KE LIYE) --- */}
                                        {/* Ye options tabhi dikhenge jab order 'Delivered' ya return process mein ho */}
                                        {(order.status === 'Delivered' || order.status === 'Return Requested' || order.status === 'Return Approved' || order.status === 'Return Rejected' || order.status === 'Refund Processed') && (
                                            <>
                                                <option value="Return Requested">Return Requested</option>
                                                <option value="Return Approved">Return Approved</option>
                                                <option value="Return Rejected">Return Rejected</option>
                                                <option value="Refund Processed">Refund Processed</option>
                                            </>
                                        )}
                                        {/* --- NAYE OPTIONS KHATAM --- */}

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
                                <ListGroup.Item className="d-grid"> {/* d-grid for full width button */}
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


                            {/* --- USER CANCEL ORDER SECTION --- */}
                            {/* Existing cancellation button */}
                            {order.status === 'Processing' && !isAdminView && (
                                <ListGroup.Item className="d-grid">
                                    <Button type='button' variant='danger' onClick={cancelOrderHandler} disabled={loading}>
                                        Cancel Order
                                    </Button>
                                </ListGroup.Item>
                            )}
                            
                            {/* --- **NAYA: USER RETURN ORDER SECTION** --- */}
                            {/* 'Request Return' button tab dikhega jab:
                                1. Order 'Delivered' ho.
                                2. Admin view na ho.
                                3. Order ke liye abhi tak koi return request initiate na hua ho.
                                4. Return deadline abhi cross na hui ho.
                            */}
                            {order.status === 'Delivered' && !isAdminView && !order.returnInitiated && (
                                <ListGroup.Item className="d-grid">
                                    <Button
                                        type='button'
                                        variant='primary'
                                        onClick={() => setShowReturnForm(true)}
                                        // Button disabled hoga agar loading ho ya return window band ho gayi ho
                                        disabled={loading || (order.returnDeadline && new Date() > new Date(order.returnDeadline))}
                                    >
                                        Request Return
                                        {/* Return deadline dikhayein agar available ho */}
                                        {order.returnDeadline && ` (within ${new Date(order.returnDeadline).toLocaleDateString()})`}
                                    </Button>
                                    {/* Agar return window band ho gayi hai toh message dikhayein */}
                                    {order.returnDeadline && new Date() > new Date(order.returnDeadline) && (
                                        <Alert variant="danger" className="mt-2">Return window has closed for this order.</Alert>
                                    )}
                                </ListGroup.Item>
                            )}

                            {/* **NAYA: Return Request Form (Modal ya inline)** */}
                            {/* Ye form tab dikhega jab user ne "Request Return" button click kiya ho, aur admin view na ho */}
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
                                                    // Agar method change ho to bank details reset kar do
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

                                        {/* Bank Details fields tabhi dikhenge jab 'Bank Transfer' select kiya ho */}
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

                            {/* NAYA: Agar return already requested ya processed hai toh uska status dikhayein */}
                            {order.returnInitiated && (order.status === 'Return Requested' || order.status === 'Return Approved' || order.status === 'Return Rejected' || order.status === 'Refund Processed') && (
                                <ListGroup.Item>
                                    <Alert variant={order.status === 'Return Rejected' ? 'danger' : order.status === 'Refund Processed' ? 'success' : 'info'}>
                                        Return Status: <strong>{order.status}</strong>
                                        {order.returnRequestDate && ` (Requested on ${new Date(order.returnRequestDate).toLocaleDateString()})`}
                                        {order.returnId && ` | Return ID: ${order.returnId}`}
                                        {/* Yahan aap adminNotes dikha sakte hain agar aap order schema mein adminNotes populte karte hain
                                            ya return details ko alag se fetch karte hain. Abhi ke liye yeh conceptual hai. */}
                                        {/* {order.status === 'Return Rejected' && order.returnDetails && order.returnDetails.adminNotes && (
                                            <p className="mt-2">Admin Note: {order.returnDetails.adminNotes}</p>
                                        )} */}
                                    </Alert>
                                </ListGroup.Item>
                            )}
                            {/* --- END USER RETURN ORDER SECTION --- */}

                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </>
    ) : null;
}

export default OrderPage;