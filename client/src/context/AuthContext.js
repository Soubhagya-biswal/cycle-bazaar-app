import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        // App load hone par localStorage se user info load karne ki koshish karo
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            setUserInfo(JSON.parse(storedUserInfo));
        }
    }, []);

    const login = (userData) => {
        // User info ko state mein aur localStorage mein save karo
        localStorage.setItem('userInfo', JSON.stringify(userData));
        setUserInfo(userData);
    };

    const logout = () => {
        // User info ko state aur localStorage se hata do
        localStorage.removeItem('userInfo');
        setUserInfo(null);
    };
         const updateWishlist = (newWishlist) => {
        // Pehle, current userInfo ko copy karo
        const updatedUserInfo = { ...userInfo, wishlist: newWishlist };
        // Fir, state aur localStorage dono ko nayi wishlist se update karo
        setUserInfo(updatedUserInfo);
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
    };
    return (
        <AuthContext.Provider value={{ userInfo, login, logout, updateWishlist }}>
            {children}
        </AuthContext.Provider>
    );
};