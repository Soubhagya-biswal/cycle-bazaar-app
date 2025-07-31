import React, { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

function LoginSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            try {
                // Token se user ki details nikalo
                const decodedUserInfo = jwtDecode(token);
                // User data object banao jaisa login function expect karta hai
                const userData = {
                    ...decodedUserInfo,
                    _id: decodedUserInfo.id, // ID ko _id mein daal do
                    token: token
                };
                login(userData); // login function se user ko login karwao
                window.location.href = '/'; 
            } catch (error) {
                console.error("Failed to decode token", error);
                navigate('/login'); // Galti hone par login page par bhej do
            }
        } else {
            navigate('/login'); // Token na milne par login page par bhej do
        }
    }, [searchParams, login, navigate]);

    return (
        <div>
            <h2>Logging you in...</h2>
            <p>Please wait while we redirect you.If the page becomes blank then Please refresh the page</p>
        </div>
    );
}

export default LoginSuccess;