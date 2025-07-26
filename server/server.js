import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import mongoose from 'mongoose';

// Route imports
import cycleRouter from './routes/cycles.js';
import userRouter from './routes/users.js';
import cartRouter from './routes/cart.js';
import orderRoutes from './routes/orderRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import sellerProductRoutes from './routes/sellerProductRoutes.js';
const app = express();
// --- NAYA CODE YAHAN ADD KIYA HAI ---
// Render automatically provides process.env.PORT.
// Ye console.log aapko Render logs mein batayega ki aapka server kis port par chalne ki koshish kar raha hai.
const port = process.env.PORT || 5000;
console.log(`Server attempting to start on port: ${port}`); // Ye line add ki hai debugging ke liye
// --- NAYA CODE END ---

// NAYA, ZYADA SPECIFIC CORS CONFIGURATION
// NAYA, FLEXIBLE CORS CONFIGURATION
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// API Routes
app.use('/cycles', cycleRouter);
app.use('/api/users', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller/products', sellerProductRoutes);
app.listen(port, () => {
  console.log(`Server successfully started on port ${port}`);
});