import express from 'express';
import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator'; // <-- Step 1: Import kiya
import Cycle from '../models/cycle.model.js';
import { protect, seller } from '../middleware/authMiddleware.js';

const router = express.Router();


router.get('/', protect, seller, asyncHandler(async (req, res) => {
    const products = await Cycle.find({ seller: req.user._id });
    res.json(products);
}));

router.get('/:id', protect, seller, asyncHandler(async (req, res) => {
    const cycle = await Cycle.findById(req.params.id);

    if (cycle) {
        if (cycle.seller.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized: You do not own this product');
        }
        res.json(cycle);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
}));

// --- Step 2: Validation ke rules banaye ---
const productValidationRules = [
    body('brand').trim().not().isEmpty().withMessage('Brand is required.'),
    body('model').trim().not().isEmpty().withMessage('Model is required.'),
    body('marketPrice').isFloat({ min: 0 }).withMessage('Market Price must be a positive number.'),
    body('ourPrice').isFloat({ min: 0 }).withMessage('Our Price must be a positive number.'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a whole number (0 or more).'),
    body('description').trim().not().isEmpty().withMessage('Description is required.'),
    body('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Image URL must be a valid URL.'),
];


router.post(
    '/',
    protect,
    seller,
    productValidationRules, // <-- Step 3: Rules ko route mein lagaya
    asyncHandler(async (req, res) => {
        // --- Step 4: Validation ka result check kiya ---
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { brand, model, marketPrice, ourPrice, stock, imageUrl, description, variants } = req.body;

        const cycle = new Cycle({
            brand,
            model,
            marketPrice,
            ourPrice,
            stock,
            imageUrl: imageUrl || '/images/sample.jpg',
            description,
            seller: req.user._id,
            numReviews: 0,
            rating: 0,
            reviews: [],
            variants
        });

        const createdCycle = await cycle.save();
        res.status(201).json(createdCycle);
    })
);


router.put(
    '/:id',
    protect,
    seller,
    productValidationRules, // <-- Step 3 (Again): Rules ko update route mein bhi lagaya
    asyncHandler(async (req, res) => {
        // --- Step 4 (Again): Validation ka result check kiya ---
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { brand, model, marketPrice, ourPrice, stock, imageUrl, description, variants } = req.body;
        const cycleId = req.params.id;

        const cycle = await Cycle.findById(cycleId);

        if (cycle) {
            if (cycle.seller.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error('You are not authorized to update this product');
            }

            cycle.brand = brand || cycle.brand;
            cycle.model = model || cycle.model;
            cycle.marketPrice = marketPrice === undefined ? cycle.marketPrice : marketPrice;
            cycle.ourPrice = ourPrice === undefined ? cycle.ourPrice : ourPrice;
            cycle.stock = stock === undefined ? cycle.stock : stock;
            cycle.imageUrl = imageUrl || cycle.imageUrl;
            cycle.description = description || cycle.description;
            cycle.variants = variants || cycle.variants;

            const updatedCycle = await cycle.save();
            res.json(updatedCycle);

        } else {
            res.status(404);
            throw new Error('Product not found');
        }
    })
);


router.delete('/:id', protect, seller, asyncHandler(async (req, res) => {
    const cycle = await Cycle.findById(req.params.id);

    if (cycle) {
        if (cycle.seller.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('You are not authorized to delete this product');
        }
        await cycle.deleteOne();
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
}));

export default router;