import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [shippingAddress, setShippingAddress] = useState({});
    // NAYA STATE: Payment method ke liye, localStorage se load karte hue
    const paymentMethodFromStorage = localStorage.getItem('paymentMethod') ? JSON.parse(localStorage.getItem('paymentMethod')) : '';
    const [paymentMethod, setPaymentMethod] = useState(paymentMethodFromStorage);
    const { userInfo } = useContext(AuthContext);

    useEffect(() => {
        const storedAddress = localStorage.getItem('shippingAddress');
    if (storedAddress) {
        setShippingAddress(JSON.parse(storedAddress));
    }
        const fetchCartItems = async () => {
            if (userInfo) {
                try {
                    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cart`, {
                        headers: { 'Authorization': `Bearer ${userInfo.token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setCartItems(data.items || []);
                    }
                } catch (error) {
                    console.error("Failed to fetch cart on login", error);
                }
            } else {
                setCartItems([]);
            }
        };
        fetchCartItems();
    }, [userInfo]);

    const addToCart = async (cycleId, quantity) => {
        if (!userInfo) {
            alert('Please login to add items to the cart');
            return;
        }
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ cycleId, quantity })
            });
            if (!res.ok) {
                throw new Error('Failed to add item to cart');
            }
            const data = await res.json();
            setCartItems(data.items);
            alert('Item added to cart!');
        } catch (error) {
            console.error(error);
            alert('Could not add item to cart.');
        }
    };

    const removeFromCart = async (cycleId) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cart/remove/${cycleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });
            if (!res.ok) throw new Error('Failed to remove item');
            const data = await res.json();
            setCartItems(data.items);
            alert('Item removed from cart');
        } catch (error) {
            console.error(error);
            alert('Could not remove item from cart.');
        }
    };
       const saveShippingAddress = (data) => {
        localStorage.setItem('shippingAddress', JSON.stringify(data));
        setShippingAddress(data);
    };
    // NAYA FUNCTION: Payment method save karne ke liye
    const savePaymentMethod = (data) => {
        localStorage.setItem('paymentMethod', JSON.stringify(data));
        setPaymentMethod(data);
    };
    const clearCart = () => {
    localStorage.removeItem('cartItems');
    setCartItems([]);
};
    return (
<CartContext.Provider value={{ cartItems, shippingAddress,paymentMethod, addToCart, removeFromCart, saveShippingAddress,savePaymentMethod,clearCart }}>
            {children}
        </CartContext.Provider>
    );
};