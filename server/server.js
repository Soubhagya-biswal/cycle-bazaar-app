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

const app = express();
const port = process.env.PORT || 5000;

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

app.listen(port, () => {
  console.log(`Server successfully started on port ${port}`);
});