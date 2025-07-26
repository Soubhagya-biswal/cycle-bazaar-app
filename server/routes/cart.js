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
// POST to add an item to the cart
router.route('/add').post(protect, async (req, res) => {
    // 👇️ NAYA: 'variantId' ko req.body se nikala
    const { cycleId, quantity, variantId } = req.body;
    const userId = req.user._id;

    try {
        let cart = await Cart.findOne({ userId });

        if (cart) {
            // 👇️ NAYA: itemIndex dhoondhte samay 'variantId' ko bhi check karein
            // Agar variantId bheja gaya hai, to cycleId aur variantId dono match hone chahiye
            // Agar variantId nahi bheja gaya hai, to sirf cycleId match hona chahiye aur variantId bhi na ho (null/undefined)
            const itemIndex = cart.items.findIndex(p =>
                p.cycleId.toString() === cycleId &&
                (variantId ? (p.variantId && p.variantId.toString() === variantId) : !p.variantId)
            );

            if (itemIndex > -1) {
                // Item cart mein maujood hai (same cycleId aur same variantId)
                cart.items[itemIndex].quantity += quantity;
            } else {
                // Item cart mein nahi hai, naya item add karein
                // 👇️ NAYA: 'variantId' ko items.push mein add kiya
                cart.items.push({ cycleId, quantity, variantId });
            }
        } else {
            // Naya cart banayein
            // 👇️ NAYA: 'variantId' ko naye cart item mein add kiya
            cart = new Cart({ userId, items: [{ cycleId, quantity, variantId }] });
        }

        await cart.save();

        // 👇️ START: NAYA CORRECTED POPULATE BLOCK YAHAN 👇️
        await cart.populate({
            path: 'items.cycleId', // Correct: this populates the Cycle document itself
            select: 'model brand price imageUrl variants' // Correct: select variants from the Cycle
        });
        // 👆️ END: NAYA CORRECTED POPULATE BLOCK YAHAN 👆️
        // Populate items.cycleId with variants, then populate the specific variant if variantId is present
        await cart.populate({
            path: 'items.cycleId', // Populate the cycle object first
            select: 'brand model price imageUrl variants' // Make sure 'variants' field is selected
        });

        // Ab aapke cart mein items.cycleId populated hoga, jiske andar variants array hoga.
        // Frontend mein ab aap cycleId.variants array ko iterate karke item.variantId se match kar sakte hain
        // to retrieve the specific variant's details (color, size, additionalPrice etc.)

        return res.status(201).send(cart);
    } catch (err) {
        console.error("Error adding to cart:", err); // Better error logging
        res.status(500).send("Something went wrong while adding to cart.");
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
router.put('/update-quantity', protect, async (req, res) => {
    const { cycleId, quantity, variantId } = req.body;
    const userId = req.user._id;

    try {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for this user' });
        }

        const itemIndex = cart.items.findIndex(item =>
            item.cycleId.toString() === cycleId &&
            (variantId ? (item.variantId && item.variantId.toString() === variantId) : !item.variantId)
        );

        if (itemIndex > -1) {
            if (quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = quantity;
            }
            await cart.save();

            // 👇️ THIS IS THE EXACT PLACE. REPLACE THE OLD POPULATE LINE WITH THIS BLOCK 👇️
            await cart.populate({
                path: 'items.cycleId',
                select: 'model brand price imageUrl variants' // 'variants' field ko bhi select karein
            });
            // 👆️ END OF REPLACE BLOCK 👆️

            return res.json(cart);
        } else {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

    } catch (error) {
        console.error("Error updating cart quantity:", error);
        res.status(500).json({ message: 'Server error: Could not update cart quantity' });
    }
});
export default router;