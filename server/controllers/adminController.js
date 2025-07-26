import User from '../models/user.model.js'; // User model import karein
import asyncHandler from 'express-async-handler'; // Errors ko handle karne ke liye (npm install express-async-handler agar nahi hai)

// @desc    Get all pending seller applications
// @route   GET /api/admin/seller-applications
// @access  Private/Admin
const getSellerApplications = asyncHandler(async (req, res) => {
    // Sirf 'pending' status wale users ko fetch karein jinki sellerApplicationDetails maujood ho
    const applications = await User.find({
        sellerApplicationStatus: 'pending',
        'sellerApplicationDetails.businessName': { $exists: true } // Confirm karein ki details bhari hain
    }).select('-password'); // Security ke liye password field ko exclude karein

    res.json(applications);
});

// @desc    Update seller application status (Approve/Reject)
// @route   PUT /api/admin/seller-applications/:userId
// @access  Private/Admin
const updateSellerApplicationStatus = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const { status } = req.body; // Frontend se 'approved' ya 'rejected' status aayega

    const user = await User.findById(userId);

    if (user) {
        // Status ko validate karein
        if (!['approved', 'rejected'].includes(status)) {
            res.status(400);
            throw new Error('Invalid status provided. Must be "approved" or "rejected".');
        }

        user.sellerApplicationStatus = status;

        if (status === 'approved') {
            user.isSeller = true; // Agar approve hua to isSeller ko true karein
            // Optional: Agar aap koi aur action lena chahte hain approval par (jaise email bhej na), to yahan add karein
        } else if (status === 'rejected') {
            user.isSeller = false; // Reject hone par isSeller false hi rahega
            // Optional: Rejection par bhi actions (jaise email) add kar sakte hain
        }

        const updatedUser = await user.save();
        res.json({
            message: `Seller application ${status} successfully`,
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                isSeller: updatedUser.isSeller,
                sellerApplicationStatus: updatedUser.sellerApplicationStatus
            }
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

export {
    getSellerApplications,
    updateSellerApplicationStatus
};