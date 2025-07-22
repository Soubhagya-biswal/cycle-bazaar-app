import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function VerifyEmail() {
    const [message, setMessage] = useState('Verifying your email...');
    const params = useParams(); // Gets the token from the URL

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/verify/${params.token}`)
            .then(res => {
                if (res.ok) {
                    return res.json();
                } else {
                    // If server responds with an error (like 400), throw an error
                    throw new Error('Verification failed');
                }
            })
            .then(data => {
                setMessage('Email verified successfully! You can now log in.');
            })
            .catch(err => {
                setMessage('Invalid or expired verification link. Please register again.');
            });
    }, [params.token]);

    return (
        <div style={{ textAlign: 'center', color: 'white', marginTop: '50px' }}>
            <h1>{message}</h1>
            {message.includes('successfully') && (
                <Link to="/login" className="btn btn-primary mt-3">Go to Login</Link>
            )}
        </div>
    );
}

export default VerifyEmail;