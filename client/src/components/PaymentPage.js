import React, { useState, useContext } from 'react';
import { Form, Button, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

function PaymentPage() {
    const { shippingAddress, paymentMethod, savePaymentMethod } = useContext(CartContext);
    const navigate = useNavigate();

    // Agar user ne shipping address nahi bhara hai, to use wapas bhej do
    if (!shippingAddress.address) {
        navigate('/shipping');
    }

    const [paymentMethodName, setPaymentMethodName] = useState(paymentMethod || 'Razorpay');
    const submitHandler = (e) => {
    e.preventDefault();
    savePaymentMethod(paymentMethodName);
    navigate('/placeorder'); // This line is changed
};
    return (
        <div className="form-container">
            <div className="form-box">
                <h1>Payment Method</h1>
                <Form onSubmit={submitHandler}>
                    <Form.Group>
                        <Form.Label as='legend'>Select Method</Form.Label>
                        <Col className="mt-2">
                            
                            <Form.Check
                          type='radio'
                         label='Pay Online (Card, UPI, Netbanking)'
                          id='Razorpay'
                         name='paymentMethod'
                          value='Razorpay'
                         checked={paymentMethodName === 'Razorpay'}
                           onChange={(e) => setPaymentMethodName(e.target.value)}
                          className="mb-2"
                         ></Form.Check>

                            
                            <Form.Check
                                type='radio'
                                label='Cash on Delivery (COD)'
                                id='COD'
                                name='paymentMethod'
                                value='COD'
                                checked={paymentMethodName === 'COD'}
                                onChange={(e) => setPaymentMethodName(e.target.value)}
                            ></Form.Check>
                        </Col>
                    </Form.Group>
                    <Button type='submit' variant='primary' className="w-100 mt-4">
                        Continue
                    </Button>
                </Form>
            </div>
        </div>
    );
}

export default PaymentPage;