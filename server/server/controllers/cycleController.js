import asyncHandler from 'express-async-handler'; // Import asyncHandler for error handling
import Cycle from '../models/cycle.model.js';
import User from '../models/user.model.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Get all cycles with pagination
// @route   GET /cycles
// @access  Public
const getAllCycles = asyncHandler(async (req, res) => {
    const pageSize = 12;
    const page = Number(req.query.pageNumber) || 1;

    // NAYA CODE: Search keyword ke liye logic
    const keyword = req.query.keyword ? {
        $or: [
            { brand: { $regex: req.query.keyword, $options: 'i' } },
            { model: { $regex: req.query.keyword, $options: 'i' } }
        ]
    } : {};

    // Count aur find mein naya filter (`...keyword`) use kiya gaya hai
    const count = await Cycle.countDocuments({ ...keyword });
    const cycles = await Cycle.find({ ...keyword })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({ cycles, page, pages: Math.ceil(count / pageSize) });
});


// @desc    Add a new cycle
// @route   POST /cycles/add
// @access  Private/Admin
const addCycle = asyncHandler(async (req, res) => {
  const { brand, model, price, imageUrl, description, stock } = req.body; // Include new fields

  const newCycle = new Cycle({
    brand,
    model,
    price: Number(price),
    imageUrl,
    description, // Add description
    stock: Number(stock), // Add stock and ensure it's a Number
  });

  const createdCycle = await newCycle.save();
  res.status(201).json({ message: 'New Cycle added successfully!', cycle: createdCycle });
});


// @desc    Get a single cycle by ID
// @route   GET /cycles/:id
// @access  Public
const getCycleById = asyncHandler(async (req, res) => {
  const cycle = await Cycle.findById(req.params.id);

  if (cycle) {
    res.json(cycle);
  } else {
    res.status(404);
    throw new Error('Cycle not found');
  }
});


// @desc    Update a cycle
// @route   PUT /cycles/update/:id (or PATCH)
// @access  Private/Admin
const updateCycle = asyncHandler(async (req, res) => {
    const { brand, model, price, imageUrl, description, stock } = req.body;

    const cycle = await Cycle.findById(req.params.id);

    if (cycle) {
        const oldStock = cycle.stock;
        const oldPrice = cycle.price; // Purana price save kar lo
        const newPrice = Number(price);

        cycle.brand = brand || cycle.brand;
        cycle.model = model || cycle.model;
        cycle.price = newPrice || cycle.price;
        cycle.imageUrl = imageUrl || cycle.imageUrl;
        cycle.description = description || cycle.description;
        cycle.stock = Number(stock);

        const updatedCycle = await cycle.save();

        // NAYA EMAIL NOTIFICATION LOGIC
        // Check karo ki stock 0 se zyada hua hai aur subscribers hain ya nahi
        if (oldStock === 0 && updatedCycle.stock > 0 && updatedCycle.subscribers.length > 0) {
            
            // Subscribers ki details (email) fetch karo
            await updatedCycle.populate('subscribers', 'email name');

            const emailList = updatedCycle.subscribers.map(user => user.email);
            const emailSubject = `${updatedCycle.brand} ${updatedCycle.model} is back in stock!`;
            const emailMessage = `
                <p>Hi there,</p>
                <p>Good news! The cycle you were waiting for, <strong>${updatedCycle.brand} ${updatedCycle.model}</strong>, is now back in stock.</p>
                <p><a href="http://localhost:3000/cycle/${updatedCycle._id}">Click here to buy it now!</a></p>
                <p>Hurry, stock is limited!</p>
            `;

            // Sabko ek-ek karke email bhejo
            for (const user of updatedCycle.subscribers) {
                try {
                    await sendEmail({
                        email: user.email,
                        subject: emailSubject,
                        message: emailMessage
                    });
                    console.log(`Back-in-stock email sent to ${user.email}`);
                } catch (error) {
                    console.error(`Failed to send email to ${user.email}:`, error);
                }
            }
            
            // Email bhejne ke baad, subscribers ki list khaali kar do
            updatedCycle.subscribers = [];
            await updatedCycle.save();
        }

        // NAYA PRICE DROP NOTIFICATION LOGIC
        if (newPrice < oldPrice && updatedCycle.priceDropSubscribers.length > 0) {
            await updatedCycle.populate('priceDropSubscribers', 'email name');

            const emailSubject = `Price Drop Alert for ${updatedCycle.brand} ${updatedCycle.model}!`;
            const emailMessage = (userName) => `
                <p>Hi ${userName},</p>
                <p>Great news! The price for the cycle you were watching, <strong>${updatedCycle.brand} ${updatedCycle.model}</strong>, has dropped from ₹${oldPrice} to <strong>₹${newPrice}</strong>.</p>
                <p><a href="http://localhost:3000/cycle/${updatedCycle._id}">Click here to check it out!</a></p>
            `;

            for (const user of updatedCycle.priceDropSubscribers) {
                try {
                    await sendEmail({
                        email: user.email,
                        subject: emailSubject,
                        message: emailMessage(user.name)
                    });
                    console.log(`Price drop email sent to ${user.email}`);
                } catch (error) {
                    console.error(`Failed to send price drop email to ${user.email}:`, error);
                }
            }
            updatedCycle.priceDropSubscribers = [];
            await updatedCycle.save();
        }

        res.json({ message: 'Cycle updated!', cycle: updatedCycle });
    } else {
        res.status(404);
        throw new Error('Cycle not found');
    }
});
// @desc    Delete a cycle
// @route   DELETE /cycles/:id
// @access  Private/Admin
const deleteCycle = asyncHandler(async (req, res) => {
  const cycle = await Cycle.findById(req.params.id);

  if (cycle) {
    await cycle.deleteOne(); // Use deleteOne() for Mongoose 6+
    res.json({ message: 'Cycle removed' });
  } else {
    res.status(404);
    throw new Error('Cycle not found');
  }
});
const subscribeToStockNotification = asyncHandler(async (req, res) => {
    const cycle = await Cycle.findById(req.params.id);

    if (cycle) {
        // Check karo ki user pehle se subscribed hai ya nahi
        const isSubscribed = cycle.subscribers.some(sub => sub.toString() === req.user._id.toString());

        if (isSubscribed) {
            res.status(400);
            throw new Error('You are already subscribed to this product');
        }

        cycle.subscribers.push(req.user._id);
        await cycle.save();
        res.json({ message: 'Successfully subscribed for stock notification' });
    } else {
        res.status(404);
        throw new Error('Cycle not found');
    }
});
const unsubscribeFromStockNotification = asyncHandler(async (req, res) => {
    const cycle = await Cycle.findById(req.params.id);

    if (cycle) {
        // User ki ID ko subscribers list se filter karke hata do
        cycle.subscribers = cycle.subscribers.filter(
            (sub) => sub.toString() !== req.user._id.toString()
        );

        await cycle.save();
        res.json({ message: 'Successfully unsubscribed from notifications' });
    } else {
        res.status(404);
        throw new Error('Cycle not found');
    }
});
const subscribeToPriceDrop = asyncHandler(async (req, res) => {
    const cycle = await Cycle.findById(req.params.id);

    if (cycle) {
        const isSubscribed = cycle.priceDropSubscribers.some(sub => sub.toString() === req.user._id.toString());
        if (isSubscribed) {
            res.status(400);
            throw new Error('You are already subscribed to price drop alerts for this product');
        }
        cycle.priceDropSubscribers.push(req.user._id);
        await cycle.save();
        res.json({ message: 'Successfully subscribed for price drop alerts' });
    } else {
        res.status(404);
        throw new Error('Cycle not found');
    }
});

// @desc    Unsubscribe from price drop notification
// @route   DELETE /cycles/:id/subscribe-price
// @access  Private
const unsubscribeFromPriceDrop = asyncHandler(async (req, res) => {
    const cycle = await Cycle.findById(req.params.id);

    if (cycle) {
        cycle.priceDropSubscribers = cycle.priceDropSubscribers.filter(
            (sub) => sub.toString() !== req.user._id.toString()
        );
        await cycle.save();
        res.json({ message: 'Successfully unsubscribed from price drop alerts' });
    } else {
        res.status(404);
        throw new Error('Cycle not found');
    }
});
export {
  getAllCycles,
  addCycle,
  getCycleById,
  updateCycle,
  deleteCycle,
  subscribeToStockNotification,
  unsubscribeFromStockNotification,
  subscribeToPriceDrop,
  unsubscribeFromPriceDrop,
};