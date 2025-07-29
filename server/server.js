import './config/dotenv-config.js'; // Sabse upar
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import './config/passport-setup.js';

// --- Security Packages Imports ---
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';

// Route imports
import cycleRouter from './routes/cycles.js';
import userRouter from './routes/users.js';
import cartRouter from './routes/cart.js';
import orderRoutes from './routes/orderRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import sellerProductRoutes from './routes/sellerProductRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
const app = express();

const port = process.env.PORT || 5000;

// --- Middlewares ---
app.use(cors({
    origin: ['http://localhost:3000', process.env.FRONTEND_URL]
}));
app.use(express.json());
app.use(passport.initialize());

// --- Security Middlewares ---
app.use(helmet());
app.use(hpp());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Har IP se 15 min mein 100 request
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter); // Yeh limiter saare /api waale routes par lagega

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- API Routes ---
app.use('/cycles', cycleRouter);
app.use('/api/users', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller/products', sellerProductRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/coupons', couponRoutes);

app.listen(port, () => {
  console.log(`Server successfully started on port ${port}`);
});