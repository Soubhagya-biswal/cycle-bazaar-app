import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [shippingAddress, setShippingAddress] = useState({});
    const paymentMethodFromStorage = localStorage.getItem('paymentMethod') ? JSON.parse(localStorage.getItem('paymentMethod')) : '';
    const [paymentMethod, setPaymentMethod] = useState(paymentMethodFromStorage);
    
    // --- COUPON KA NAYA STATE ---
    const couponFromStorage = localStorage.getItem('appliedCoupon') ? JSON.parse(localStorage.getItem('appliedCoupon')) : null;
    const [appliedCoupon, setAppliedCoupon] = useState(couponFromStorage);
    
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

    // --- NAYI PRICE CALCULATION LOGIC ---
    const { subtotal, discount, grandTotal } = useMemo(() => {
        const subtotalCalc = cartItems.reduce((acc, item) => {
            if (!item.cycleId) return acc;
            const basePrice = item.cycleId.ourPrice;
            const chosenVariant = item.variantId && item.cycleId.variants 
                ? item.cycleId.variants.find(v => v._id === item.variantId) 
                : null;
            const effectivePrice = basePrice + (chosenVariant ? (chosenVariant.additionalPrice || 0) : 0);
            return acc + item.quantity * effectivePrice;
        }, 0);

        let discountCalc = 0;
        if (appliedCoupon) {
            if (appliedCoupon.discountType === 'percentage') {
                discountCalc = (subtotalCalc * appliedCoupon.discountValue) / 100;
            } else { // fixed
                discountCalc = appliedCoupon.discountValue;
            }
        }
        
        discountCalc = Math.min(discountCalc, subtotalCalc);
        const grandTotalCalc = subtotalCalc - discountCalc;

        return {
            subtotal: subtotalCalc,
            discount: discountCalc,
            grandTotal: grandTotalCalc
        };
    }, [cartItems, appliedCoupon]);

    // --- TERA PURANA CODE (BILKUL WAISE KA WAISA) ---
    const addToCart = async (cycleId, quantity, variantId = null) => {
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
                body: JSON.stringify({ cycleId, quantity, variantId })
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

    const removeFromCart = async (cycleId, variantId = null) => {
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

    const updateCartItemQuantity = async (cycleId, quantity, variantId = null) => {
        if (!userInfo) {
            alert('Please login to update cart items');
            return;
        }
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cart/update-quantity`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ cycleId, quantity, variantId })
            });
            if (!res.ok) {
                throw new Error('Failed to update item quantity');
            }
            const data = await res.json();
            setCartItems(data.items);
        } catch (error) {
            console.error("Failed to update cart quantity:", error);
            alert('Could not update cart quantity.');
        }
    };
    
    const saveShippingAddress = (data) => {
        localStorage.setItem('shippingAddress', JSON.stringify(data));
        setShippingAddress(data);
    };

    const savePaymentMethod = (data) => {
        localStorage.setItem('paymentMethod', JSON.stringify(data));
        setPaymentMethod(data);
    };
    // --- TERA PURANA CODE KHATM ---

    // --- NAYE COUPON FUNCTIONS ---
    const applyCoupon = (couponData) => {
        localStorage.setItem('appliedCoupon', JSON.stringify(couponData));
        setAppliedCoupon(couponData);
    };

    const clearCoupon = () => {
        localStorage.removeItem('appliedCoupon');
        setAppliedCoupon(null);
    };

    const clearCart = () => {
        localStorage.removeItem('cartItems'); // Yeh line tere code mein pehle se thi
        setCartItems([]);
        clearCoupon(); // Cart clear hone par coupon bhi हटा do
    };

    // --- NAYI VALUE OBJECT JO PROVIDER KO DI JAYEGI ---
    const value = {
        cartItems,
        shippingAddress,
        paymentMethod,
        appliedCoupon,
        subtotal,
        discount,
        grandTotal,
        addToCart,
        removeFromCart,
        saveShippingAddress,
        savePaymentMethod,
        updateCartItemQuantity,
        clearCart,
        applyCoupon,
        clearCoupon,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};