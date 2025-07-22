import express from 'express';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';
import { protect, admin } from '../middleware/authMiddleware.js'; 
import { getAllUsers, deleteUser, toggleWishlist, getWishlist } from '../controllers/userController.js';

const router = express.Router();
router.route('/').get(protect, admin, getAllUsers);
// Register User
router.route('/register').post(async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json('User with this email already exists');
        }
        const user = new User({ name, email, password });
        await user.save();
        const verificationToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const verificationURL = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

        const message = `<h1>Email Verification</h1><p>Please click the link below to verify your email:</p><a href="${verificationURL}">Verify Email</a>`;
        await sendEmail({ email: user.email, subject: 'Cycle Bazaar - Email Verification', message });
        res.status(201).json({ message: "User registered! Please check your email to verify account." });
    } catch (error) {
        res.status(500).json('Server error');
    }
});

// Verify Email
router.route('/verify/:token').get(async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(400).json('Invalid token.');
        user.isVerified = true;
        await user.save();
        res.status(200).json('Email verified successfully.');
    } catch (error) {
        res.status(400).json('Invalid or expired verification link.');
    }
});

// Login User
router.route('/login').post(async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json('Invalid credentials');
        }
        if (!user.isVerified) {
            return res.status(401).json('Please verify your email before logging in.');
        }
        if (user && (await user.matchPassword(password))) {
            const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
                expiresIn: '1d'
            });
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                token: token
            });
        } else {
            res.status(401).json('Invalid credentials');
        }
    } catch (error) {
        res.status(500).json('Server error');
    }
});

// Forgot Password
router.route('/forgot-password').post(async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: 'If this email is registered, a password reset link has been sent.' });
        }
        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_RESET_SECRET, {
            expiresIn: '10m'
        });
        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const message = `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset. Please click the link below to set a new password:</p>
            <a href="${resetURL}" target="_blank">Reset Password</a>
            <p>This link will expire in 10 minutes.</p>
        `;
        await sendEmail({
            email: user.email,
            subject: 'Cycle Bazaar - Password Reset',
            message
        });
        res.json({ message: 'If this email is registered, a password reset link has been sent.' });
    } catch (error) {
        res.status(500).json('Server error');
    }
});

// Reset Password
router.route('/reset-password/:token').post(async (req, res) => {
    const { password } = req.body;
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_RESET_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(400).json('Invalid token.');
        }
        user.password = password;
        await user.save();
        res.json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        res.status(400).json('Invalid or expired password reset link.');
    }
});
router.route('/:id').delete(protect, admin, deleteUser);
router.route('/wishlist').post(protect, toggleWishlist);
router.route('/wishlist').get(protect, getWishlist);
export default router;