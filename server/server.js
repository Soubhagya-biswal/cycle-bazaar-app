import express from 'express';
import dotenv from 'dotenv';
dotenv.config(); // Moved to the top to load variables first

import cors from 'cors';
import mongoose from 'mongoose';

// Route imports
import cycleRouter from './routes/cycles.js';
import userRouter from './routes/users.js';
import cartRouter from './routes/cart.js';
import orderRoutes from './routes/orderRoutes.js';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

// Test route
app.get('/', (req, res) => {
  res.send('Cycle Bazaar Backend is running!');
});

app.listen(port, () => {
  console.log(`Server successfully started on port ${port}`);
});