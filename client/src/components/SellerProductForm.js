import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // To get userInfo and token

function SellerProductForm() {
    const { id: productId } = useParams(); // URL se product ID lenge agar edit mode hai
    const navigate = useNavigate();
    const { userInfo } = useContext(AuthContext);

    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [price, setPrice] = useState(0);
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [stock, setStock] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // For success messages

    const isEditMode = Boolean(productId); // Check karein ki edit mode hai ya create mode

    // Redirect if not logged in or not a seller
    useEffect(() => {
        if (!userInfo || !userInfo.isSeller) {
            navigate('/login');
        }
    }, [userInfo, navigate]);

    // Fetch product details if in edit mode
    useEffect(() => {
        if (isEditMode && userInfo) { // Only fetch if in edit mode and user is logged in
            const fetchProduct = async () => {
                setLoading(true);
                setError('');
                try {
                    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/seller/products/${productId}`, {
                        headers: {
                            'Authorization': `Bearer ${userInfo.token}`,
                        },
                    });
                    const data = await res.json();

                    if (!res.ok) {
                        throw new Error(data.message || 'Failed to fetch product details');
                    }

                    // Populate form fields with existing product data
                    setBrand(data.brand);
                    setModel(data.model);
                    setPrice(data.price);
                    setImageUrl(data.imageUrl);
                    setDescription(data.description);
                    setStock(data.stock);

                } catch (err) {
                    setError(err.message || 'Error loading product for editing.');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [isEditMode, productId, userInfo]); // Depend on these values

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        const productData = { brand, model, price, imageUrl, description, stock };
        let url = `${process.env.REACT_APP_API_BASE_URL}/api/seller/products`;
        let method = 'POST';

        if (isEditMode) {
            url = `${process.env.REACT_APP_API_BASE_URL}/api/seller/products/${productId}`;
            method = 'PUT';
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`,
                },
                body: JSON.stringify(productData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Failed to ${isEditMode ? 'update' : 'create'} product.`);
            }

            setMessage(data.message || `Product ${isEditMode ? 'updated' : 'created'} successfully!`);
            // Optional: Redirect to seller's product list after success
            navigate('/seller/products');
        } catch (err) {
            setError(err.message || `Error ${isEditMode ? 'updating' : 'creating'} product.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-3">
            <Row className="justify-content-md-center">
                <Col md={6}>
                    <h1>{isEditMode ? 'Edit Product' : 'Create Product'}</h1>
                    {loading && <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>}
                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="brand" className="mb-3">
                            <Form.Label>Brand</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter brand"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="model" className="mb-3">
                            <Form.Label>Model</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter model"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="price" className="mb-3">
                            <Form.Label>Price</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Enter price"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                required
                                min="0"
                            />
                        </Form.Group>

                        <Form.Group controlId="imageUrl" className="mb-3">
                            <Form.Label>Image URL</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter image URL"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                // required is false as it has a default in backend
                            />
                        </Form.Group>

                        <Form.Group controlId="description" className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Enter product description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="stock" className="mb-3">
                            <Form.Label>Stock</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Enter stock quantity"
                                value={stock}
                                onChange={(e) => setStock(Number(e.target.value))}
                                required
                                min="0"
                            />
                        </Form.Group>

                        <Button type="submit" variant="primary" className="w-100 mt-3" disabled={loading}>
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Product' : 'Create Product')}
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default SellerProductForm;