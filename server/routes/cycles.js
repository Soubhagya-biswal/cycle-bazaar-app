import express from 'express';
const router = express.Router();
import asyncHandler from 'express-async-handler'; // Already imported, keep it
import Cycle from '../models/cycle.model.js'; // Keep this, though controller uses it directly
import { protect, admin } from '../middleware/authMiddleware.js'; // <-- ADD THIS LINE
import { getAllCycles, addCycle, getCycleById, updateCycle, deleteCycle, subscribeToStockNotification, unsubscribeFromStockNotification, subscribeToPriceDrop, unsubscribeFromPriceDrop } from '../controllers/cycleController.js';

// @desc    Get all cycles with pagination
// @route   GET /cycles
// @access  Public
router.route('/').get(getAllCycles);

// @desc    Add a new cycle
// @route   POST /cycles/add
// @access  Private/Admin
router.route('/add').post(protect, admin, addCycle); // <-- MODIFIED: Use addCycle controller, added protect/admin

// @desc    Get a single cycle by ID
// @route   GET /cycles/:id
// @access  Public
router.route('/:id').get(getCycleById); // <-- MODIFIED: Use getCycleById controller

// @desc    Update a cycle
// @route   PUT /cycles/update/:id
// @access  Private/Admin
// Note: Changed from POST to PUT, which is standard for updates
router.route('/update/:id').put(protect, admin, updateCycle); // <-- MODIFIED: Use updateCycle controller, changed to PUT, added protect/admin

// @desc    Delete a cycle
// @route   DELETE /cycles/:id
// @access  Private/Admin
router.route('/:id').delete(protect, admin, deleteCycle); // <-- ADD THIS NEW ROUTE
router.route('/:id/subscribe').post(protect, subscribeToStockNotification);
router.route('/:id/subscribe').delete(protect, unsubscribeFromStockNotification);
router.route('/:id/subscribe-price').post(protect, subscribeToPriceDrop);
router.route('/:id/subscribe-price').delete(protect, unsubscribeFromPriceDrop);
export default router;