import React, { useState, useContext } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, Alert } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

const CheckoutForm = ({ order, clientSecret, onPaymentSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { userInfo } = useContext(AuthContext);

    const [message, setMessage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
                billing_details: { name: userInfo.name, email: userInfo.email },
            },
        });

        if (error) {
            setMessage(error.message);
            setIsProcessing(false);
        } else if (paymentIntent.status === 'succeeded') {
            // Payment successful, now update the order in our database
            try {
                await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/orders/${order._id}/pay`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userInfo.token}`
                    },
                    body: JSON.stringify(paymentIntent)
                });
                setMessage('Payment Successful!');
                onPaymentSuccess();
            } catch (err) {
                setMessage('Payment succeeded but failed to update order status.');
            }
            setIsProcessing(false);
        }
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            {message && <Alert variant="info">{message}</Alert>}
            <CardElement id="card-element" />
            <Button disabled={isProcessing || !stripe || !elements} id="submit" className="w-100 mt-4" type="submit">
                {isProcessing ? "Processing..." : `Pay ₹${order.totalPrice}`}
            </Button>
        </form>
    );
};

export default CheckoutForm;