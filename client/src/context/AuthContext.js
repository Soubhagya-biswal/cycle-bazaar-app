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

    // NAYA LOGOUT FUNCTION
    const logout = async () => {
        try {
            // Token ko userInfo se nikalna zaroori hai
            const token = userInfo ? userInfo.token : null;
            if (token) {
                // Backend ko batao ki user logout ho raha hai
                await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            // Agar backend call fail bhi ho jaye, to bhi user ko locally logout kar do
            console.error("Failed to log logout on server, but logging out locally.", error);
        }

        // Backend call ke baad, frontend se user info hata do
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