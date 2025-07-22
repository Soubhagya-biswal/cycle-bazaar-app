import express from 'express';
import Cart from '../models/cart.model.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET a user's cart
router.route('/').get(protect, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id }).populate('items.cycleId');
        if (cart) {
            res.json(cart);
        } else {
            res.json({ items: [] });
        }
    } catch (error) {
        res.status(500).send('Something went wrong');
    }
});

// POST to add an item to the cart
router.route('/add').post(protect, async (req, res) => {
    const { cycleId, quantity } = req.body;
    const userId = req.user._id;
    try {
        let cart = await Cart.findOne({ userId });
        if (cart) {
            const itemIndex = cart.items.findIndex(p => p.cycleId.toString() === cycleId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({ cycleId, quantity });
            }
        } else {
            cart = new Cart({ userId, items: [{ cycleId, quantity }] });
        }
        await cart.save();
        await cart.populate('items.cycleId');
        return res.status(201).send(cart);
    } catch (err) {
        res.status(500).send("Something went wrong");
    }
});

// DELETE to remove an item from the cart
router.route('/remove/:itemId').delete(protect, async (req, res) => {
    const { itemId } = req.params;
    const userId = req.user._id;
    try {
        let cart = await Cart.findOne({ userId });
        if (cart) {
            cart.items = cart.items.filter(item => item.cycleId.toString() !== itemId);
            await cart.save();
            await cart.populate('items.cycleId');
            res.json(cart);
        } else {
            res.status(404).json({ message: "Cart not found" });
        }
    } catch (error) {
        res.status(500).send("Something went wrong");
    }
});

export default router;