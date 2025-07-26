import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getSellerApplications,
    updateSellerApplicationStatus
} from '../controllers/adminController.js'; // NAYA CONTROLLER IMPORTS

const router = express.Router();

// Get all pending seller applications (Admin only)
// Route: GET /api/admin/seller-applications
router.route('/seller-applications').get(protect, admin, getSellerApplications);

// Update seller application status (Approve/Reject) (Admin only)
// Route: PUT /api/admin/seller-applications/:userId
router.route('/seller-applications/:userId').put(protect, admin, updateSellerApplicationStatus);


export default router;