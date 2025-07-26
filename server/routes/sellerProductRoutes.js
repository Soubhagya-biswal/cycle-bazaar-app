import express from 'express';
import asyncHandler from 'express-async-handler'; // npm install express-async-handler if not already
import Cycle from '../models/cycle.model.js'; // Your Cycle model
import { protect, seller } from '../middleware/authMiddleware.js'; // protect and a new 'seller' middleware

const router = express.Router();

// @desc    Get all products for the logged-in seller
// @route   GET /api/seller/products
// @access  Private/Seller
router.get('/', protect, seller, asyncHandler(async (req, res) => {
    // req.user._id will come from the 'protect' middleware after token verification
    const products = await Cycle.find({ seller: req.user._id });
    res.json(products);
}));
  router.get('/:id', protect, seller, asyncHandler(async (req, res) => {
    const cycle = await Cycle.findById(req.params.id); // Get product ID from URL parameters

    if (cycle) { // If product is found
        // Ensure the logged-in seller is the owner of this product
        // This is a critical security check
        if (cycle.seller.toString() !== req.user._id.toString()) {
            res.status(401); // Unauthorized
            throw new Error('Not authorized: You do not own this product');
        }
        res.json(cycle); // Send the product details to the frontend
    } else { // If product is not found
        res.status(404); // Not Found
        throw new Error('Product not found');
    }
}));

router.post('/', protect, seller, asyncHandler(async (req, res) => {
    // Frontend se product details lenge
    const { brand, model, price, imageUrl, description, stock } = req.body;

    // Basic validation
    if (!brand || !model || !price || !description || stock === undefined || stock === null) {
        res.status(400);
        throw new Error('Please provide all required product details: brand, model, price, description, and stock.');
    }

    const cycle = new Cycle({
        brand,
        model,
        price,
        imageUrl: imageUrl || '/images/sample.jpg', // Default image if not provided
        description,
        stock,
        seller: req.user._id, // Logged-in seller will be the owner
        numReviews: 0,
        rating: 0,
        reviews: []
        
    });

    const createdCycle = await cycle.save();
    res.status(201).json(createdCycle); 

}));


router.put('/:id', protect, seller, asyncHandler(async (req, res) => {
    const { brand, model, price, imageUrl, description, stock } = req.body;
    const cycleId = req.params.id;

    const cycle = await Cycle.findById(cycleId);

    if (cycle) {
        // Ensure the logged-in seller is the owner of this product
        if (cycle.seller.toString() !== req.user._id.toString()) {
            res.status(401); // Unauthorized
            throw new Error('You are not authorized to update this product');
        }

        cycle.brand = brand || cycle.brand;
        cycle.model = model || cycle.model;
        cycle.price = price || cycle.price;
        cycle.imageUrl = imageUrl || cycle.imageUrl;
        cycle.description = description || cycle.description;
        cycle.stock = stock !== undefined && stock !== null ? stock : cycle.stock; // Handle 0 stock correctly

        const updatedCycle = await cycle.save();
        res.json(updatedCycle);

    } else {
        res.status(404);
        throw new Error('Product not found');
    }
}));

// @desc    Delete a product
// @route   DELETE /api/seller/products/:id
// @access  Private/Seller
router.delete('/:id', protect, seller, asyncHandler(async (req, res) => {
    const cycle = await Cycle.findById(req.params.id);

    if (cycle) {
        // Ensure the logged-in seller is the owner of this product
        if (cycle.seller.toString() !== req.user._id.toString()) {
            res.status(401); // Unauthorized
            throw new Error('You are not authorized to delete this product');
        }
        await cycle.deleteOne(); // Use deleteOne()
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
}));

export default router;