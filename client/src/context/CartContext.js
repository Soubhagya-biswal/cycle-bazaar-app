import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [shippingAddress, setShippingAddress] = useState({});
    const paymentMethodFromStorage = localStorage.getItem('paymentMethod') ? JSON.parse(localStorage.getItem('paymentMethod')) : '';
    const [paymentMethod, setPaymentMethod] = useState(paymentMethodFromStorage);
    
    // --- NAYA COUPON KA STATE ---
    const couponFromStorage = localStorage.getItem('appliedCoupon') ? JSON.parse(localStorage.getItem('appliedCoupon')) : null;
    const [appliedCoupon, setAppliedCoupon] = useState(couponFromStorage);
    // --- NAYA COUPON KA STATE END ---

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
            if (!item.cycleId) return acc; // Agar cycleId null hai to skip karo
            const basePrice = item.cycleId.price;
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
        
        discountCalc = Math.min(discountCalc, subtotalCalc); // Discount subtotal se zyada nahi ho sakta
        const grandTotalCalc = subtotalCalc - discountCalc;

        return {
            subtotal: subtotalCalc,
            discount: discountCalc,
            grandTotal: grandTotalCalc
        };
    }, [cartItems, appliedCoupon]);
    // --- NAYI PRICE CALCULATION LOGIC END ---

    const addToCart = async (cycleId, quantity, variantId = null) => {
        // ... (yeh function waisa hi hai, koi change nahi)
    };

    const removeFromCart = async (cycleId, variantId = null) => {
        // ... (yeh function waisa hi hai, koi change nahi)
    };

    const updateCartItemQuantity = async (cycleId, quantity, variantId = null) => {
        // ... (yeh function waisa hi hai, koi change nahi)
    };
    
    const saveShippingAddress = (data) => {
        localStorage.setItem('shippingAddress', JSON.stringify(data));
        setShippingAddress(data);
    };

    const savePaymentMethod = (data) => {
        localStorage.setItem('paymentMethod', JSON.stringify(data));
        setPaymentMethod(data);
    };

    // --- NAYE COUPON FUNCTIONS ---
    const applyCoupon = (couponData) => {
        localStorage.setItem('appliedCoupon', JSON.stringify(couponData));
        setAppliedCoupon(couponData);
    };

    const clearCoupon = () => {
        localStorage.removeItem('appliedCoupon');
        setAppliedCoupon(null);
    };
    // --- NAYE COUPON FUNCTIONS END ---

    const clearCart = () => {
        // ... iske andar clearCoupon() call karenge ...
        setCartItems([]);
        clearCoupon(); // Cart clear hone par coupon bhi हटा do
    };

    // --- NAYI VALUE OBJECT ---
    const value = {
        cartItems,
        shippingAddress,
        paymentMethod,
        appliedCoupon, // Naya
        subtotal,      // Naya
        discount,      // Naya
        grandTotal,    // Naya
        addToCart,
        removeFromCart,
        saveShippingAddress,
        savePaymentMethod,
        updateCartItemQuantity,
        clearCart,
        applyCoupon,   // Naya
        clearCoupon,   // Naya
    };
    // --- NAYI VALUE OBJECT END ---

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};