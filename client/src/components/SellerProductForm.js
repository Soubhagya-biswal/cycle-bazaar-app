import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // To get userInfo and token

function SellerProductForm() {
    const { id: productId } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useContext(AuthContext);

    // Ye saare form fields ke liye states hain
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [price, setPrice] = useState(0); // This will be 'Our Price'
    const [marketPrice, setMarketPrice] = useState(0); // State for Market Price
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [variants, setVariants] = useState([]);
    const [stock, setStock] = useState(0); // **Yeh 'stock' field ab yahan define hai**

    // **Yeh zaroori states hain jo previous errors de rahe the agar missing the**
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // For success messages

    // isEditMode variable bhi yahan define hai
    const isEditMode = Boolean(productId);

    // Redirect if not logged in or not a seller
    useEffect(() => {
        if (!userInfo || !userInfo.isSeller) {
            navigate('/login'); // Or to a forbidden page
        }
    }, [userInfo, navigate]);

    // Fetch product details if in edit mode
    useEffect(() => {
        if (isEditMode && userInfo) {
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

                    setBrand(data.brand);
                    setModel(data.model);
                    setPrice(data.ourPrice); // Backend se 'ourPrice' aayega
                    setMarketPrice(data.marketPrice || 0);
                    setImageUrl(data.imageUrl);
                    setDescription(data.description);
                    setVariants(data.variants || []);
                    setStock(data.stock); // **Ensure stock is loaded in edit mode**

                } catch (err) {
                    setError(err.message || 'Error loading product for editing.');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [isEditMode, productId, userInfo]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        // Filter out empty variants before sending to backend
        // Yeh line ensure karti hai ki agar user ne 'Add Variant' click kiya par kuch bhara nahi,
        // toh woh empty variant backend ko na jaye aur validation error na de.
        const filteredVariants = variants.filter(
            (variant) =>
                variant.color || variant.size || variant.additionalPrice > 0 || variant.variantStock > 0
        );

        // Product data jo backend ko jayega
        const productData = {
            brand,
            model,
            price, // 'ourPrice' ka value
            marketPrice,
            imageUrl,
            description,
            stock, // **'stock' field yahan include kiya hai**
            variants: filteredVariants // Filtered variants bhej rahe hain
        };
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
                // **Yeh line backend se aane wale error ko console mein dikhayegi**
                console.error('Backend Error Response:', data);
                throw new Error(data.message || `Failed to ${isEditMode ? 'update' : 'create'} product.`);
            }

            setMessage(data.message || `Product ${isEditMode ? 'updated' : 'created'} successfully!`);
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

                        <Form.Group controlId="marketPrice" className="mb-3">
                            <Form.Label>Market Price (₹)</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Enter actual market price"
                                value={marketPrice}
                                onChange={(e) => setMarketPrice(Number(e.target.value))}
                                min="0"
                                // 'required' attribute frontend se hata diya hai, default backend mein 0 hai
                            />
                        </Form.Group>

                        <Form.Group controlId="price" className="mb-3">
                            <Form.Label>Our Price (₹)</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Enter your selling price"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                min="0"
                                // 'required' attribute frontend se hata diya hai, default backend mein 0 hai
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

                        {/* **Base Stock field** */}
                        <Form.Group controlId="stock" className="mb-3">
                            <Form.Label>Base Stock</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Enter overall stock for the product (if no variants, this is total stock)"
                                value={stock}
                                onChange={(e) => setStock(Number(e.target.value))}
                                required // Stock field required hai
                                min="0"
                            />
                        </Form.Group>

                        <h4 className="mt-4">Product Variants</h4>
                        <p className="text-muted">Define different colors, sizes, or types for this product.</p>

                        {variants.length === 0 && (
                            <Alert variant="info">No variants added yet. Click "Add Variant" to begin.</Alert>
                        )}

                        {variants.map((variant, index) => (
                            <div key={index} className="mb-3 p-3 border rounded">
                                <Row className="mb-2 align-items-end">
                                    <Col md={5}>
                                        <Form.Group controlId={`variantColor${index}`}>
                                            <Form.Label>Color</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g., Red, Blue"
                                                value={variant.color || ''}
                                                onChange={(e) => {
                                                    const newVariants = [...variants];
                                                    newVariants[index].color = e.target.value;
                                                    setVariants(newVariants);
                                                }}
                                                // Required agar user ne koi bhi variant field touch kiya hai
                                                required={!!(variant.color || variant.size || variant.additionalPrice > 0 || variant.variantStock > 0)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={5}>
                                        <Form.Group controlId={`variantSize${index}`}>
                                            <Form.Label>Size</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g., 26-inch, Large"
                                                value={variant.size || ''}
                                                onChange={(e) => {
                                                    const newVariants = [...variants];
                                                    newVariants[index].size = e.target.value;
                                                    setVariants(newVariants);
                                                }}
                                                required={!!(variant.color || variant.size || variant.additionalPrice > 0 || variant.variantStock > 0)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2} className="d-flex justify-content-end">
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => {
                                                const newVariants = variants.filter((_, i) => i !== index);
                                                setVariants(newVariants);
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group controlId={`variantAdditionalPrice${index}`}>
                                            <Form.Label>Additional Price (₹)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="e.g., 500 (extra cost)"
                                                value={variant.additionalPrice || 0}
                                                onChange={(e) => {
                                                    const newVariants = [...variants];
                                                    newVariants[index].additionalPrice = Number(e.target.value);
                                                    setVariants(newVariants);
                                                }}
                                                required={!!(variant.color || variant.size || variant.additionalPrice > 0 || variant.variantStock > 0)}
                                                min="0"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId={`variantStock${index}`}>
                                            <Form.Label>Stock for this Variant</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="e.g., 10"
                                                value={variant.variantStock || 0}
                                                onChange={(e) => {
                                                    const newVariants = [...variants];
                                                    newVariants[index].variantStock = Number(e.target.value);
                                                    setVariants(newVariants);
                                                }}
                                                required={!!(variant.color || variant.size || variant.additionalPrice > 0 || variant.variantStock > 0)}
                                                min="0"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>
                        ))}

                        <Button
                            variant="outline-primary"
                            className="w-100 mt-2"
                            onClick={() => setVariants([...variants, { color: '', size: '', additionalPrice: 0, variantStock: 0 }])}
                        >
                            Add Variant
                        </Button>
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