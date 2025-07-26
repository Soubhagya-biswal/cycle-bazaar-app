import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Table, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // To get userInfo and token

function SellerDashboardPage() {
    const [soldCycles, setSoldCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { userInfo } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect if not logged in or not a seller
    useEffect(() => {
        if (!userInfo || !userInfo.isSeller) {
            navigate('/login'); // Or to a forbidden page
        }
    }, [userInfo, navigate]);

    const fetchSoldCycles = async () => {
        if (!userInfo || !userInfo.isSeller) return; // Re-check before fetching

        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders/sellerorders`, {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch sold cycles');
            }

            // Flatten the data to get individual sold items from all relevant orders
            // Each item will represent a "sold cycle" instance
            const allSoldItems = [];
            data.forEach(order => {
                order.orderItems.forEach(item => {
                    // Make sure item.cycleId and item.cycleId.seller are populated
                    // And specifically check if this item belongs to the logged-in seller
                    if (item.cycleId && item.cycleId.seller && item.cycleId.seller._id === userInfo._id) {
                         allSoldItems.push({
                            orderId: order._id,
                            orderDate: order.createdAt,
                            customerName: order.user ? order.user.name : 'N/A',
                            customerEmail: order.user ? order.user.email : 'N/A',
                            productBrand: item.cycleId.brand,
                            productModel: item.cycleId.model,
                            quantity: item.qty,
                            pricePerUnit: item.price,
                            totalItemPrice: item.qty * item.price,
                            orderStatus: order.status,
                            isPaid: order.isPaid,
                            paymentMethod: order.paymentMethod,
                            // Add any other relevant fields you want to display
                         });
                    }
                });
            });
            setSoldCycles(allSoldItems);

        } catch (err) {
            setError(err.message || 'Error fetching sold cycles.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch on component mount and on userInfo change
    useEffect(() => {
        fetchSoldCycles();
    }, [userInfo]); // Re-run if userInfo changes (e.g., after login/logout)

    return (
        <Container className="py-3">
            <Row>
                <Col>
                    <h1>Seller Dashboard - My Sold Cycles</h1>
                    {loading && <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    {!loading && soldCycles.length === 0 && !error && (
                        <Alert variant="info">You haven't sold any cycles yet, or no orders are visible here.</Alert>
                    )}

                    {!loading && soldCycles.length > 0 && (
                        <Table striped bordered hover responsive className="table-sm">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Order Date</th>
                                    <th>Customer</th>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Total Price</th>
                                    <th>Order Status</th>
                                    <th>Payment Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {soldCycles.map((item, index) => (
                                    <tr key={item.orderId + '-' + index}> {/* Unique key using orderId and index */}
                                        <td>{item.orderId}</td>
                                        <td>{new Date(item.orderDate).toLocaleDateString()}</td>
                                        <td>{item.customerName} ({item.customerEmail})</td>
                                        <td>{item.productBrand} {item.productModel}</td>
                                        <td>{item.quantity}</td>
                                        <td>₹{item.pricePerUnit.toFixed(2)}</td>
                                        <td>₹{item.totalItemPrice.toFixed(2)}</td>
                                        <td>{item.orderStatus}</td>
                                        <td>{item.isPaid ? 'Paid' : 'Unpaid'} ({item.paymentMethod})</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default SellerDashboardPage;