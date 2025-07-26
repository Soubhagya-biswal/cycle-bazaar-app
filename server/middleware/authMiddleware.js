import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next(); // User is an admin, proceed to the next middleware/route handler
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};
const seller = (req, res, next) => {
    // req.user object 'protect' middleware se aata hai
    if (req.user && req.user.isSeller) { // Check karein ki user logged in hai aur 'isSeller' true hai
        next(); // Agar user seller hai, to aage badho (next middleware/route handler par)
    } else {
        res.status(401).json({ message: 'Not authorized as a seller' }); // Agar seller nahi hai, to unauthorized response dein
    }
};
// 👆️ END: NAYA 'SELLER' MIDDLEWARE YAHAN KHATAM HOTA HAI 👆️


export { protect, admin, seller };