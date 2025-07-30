import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Row, Col, Spinner, Alert,Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // To get userInfo and token

function SellerProductListPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteMessage, setDeleteMessage] = useState(''); // For product deletion success
    const [deleteError, setDeleteError] = useState(''); // For product deletion error

    const { userInfo } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect if not logged in or not a seller
    useEffect(() => {
        if (!userInfo || !userInfo.isSeller) {
            navigate('/login'); // Or to a forbidden page
        }
    }, [userInfo, navigate]);

    const fetchSellerProducts = async () => {
        if (!userInfo || !userInfo.isSeller) return;

        setLoading(true);
        setError('');
        setDeleteMessage(''); // Clear messages on new fetch
        setDeleteError('');
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/seller/products`, {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch products');
            }

            setProducts(data);
        } catch (err) {
            setError(err.message || 'Error fetching your products.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch on component mount and on userInfo change
    useEffect(() => {
        fetchSellerProducts();
    }, [userInfo]);

    const deleteProductHandler = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return;
        }

        setLoading(true);
        setDeleteMessage('');
        setDeleteError('');
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/seller/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to delete product');
            }

            setDeleteMessage(data.message || 'Product deleted successfully!');
            fetchSellerProducts(); // Re-fetch products after deletion
        } catch (err) {
            setDeleteError(err.message || 'Error deleting product.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-3">
            <Row className="align-items-center">
                <Col>
                    <h1>My Products</h1>
                </Col>
                <Col className="text-end">
                    <LinkContainer to="/seller/product/create">
                        <Button className="my-3">
                            <i className="fas fa-plus"></i> Create Product
                        </Button>
                    </LinkContainer>
                </Col>
            </Row>

            {loading && <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>}
            {deleteMessage && <Alert variant="success">{deleteMessage}</Alert>}
            {deleteError && <Alert variant="danger">{deleteError}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            {!loading && products.length === 0 && !error && !deleteMessage && (
                <Alert variant="info">You have not listed any products yet. Click "Create Product" to add one.</Alert>
            )}

            {!loading && products.length > 0 && (
                <Table striped bordered hover responsive className="table-sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>BRAND</th>
                            <th>MODEL</th>
                            <th>PRICE</th>
                            <th>STOCK</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product._id}>
                                <td>{product._id}</td>
                                <td>{product.brand}</td>
                                <td>{product.model}</td>
                                <td>₹{product.price.toFixed(2)}</td>
                                <td>{product.stock}</td>
                                <td>
                                    <LinkContainer to={`/seller/product/${product._id}/edit`}>
                                        <Button variant="light" className="btn-sm">
                                            <i className="fas fa-edit"></i> Edit
                                        </Button>
                                    </LinkContainer>
                                    <Button
                                        variant="danger"
                                        className="btn-sm ms-2"
                                        onClick={() => deleteProductHandler(product._id)}
                                    >
                                        <i className="fas fa-trash"></i> Delete
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
}

export default SellerProductListPage;