import User from '../models/user.model.js'; 
import asyncHandler from 'express-async-handler'; 
import sendEmail from '../utils/sendEmail.js'; // 👈 Top me import karo


const getSellerApplications = asyncHandler(async (req, res) => {
    
    const applications = await User.find({
        sellerApplicationStatus: 'pending',
        'sellerApplicationDetails.businessName': { $exists: true } 
    }).select('-password'); 

    res.json(applications);
});

// @desc    Update seller application status (Approve/Reject)
// @route   PUT /api/admin/seller-applications/:userId
// @access  Private/Admin
const updateSellerApplicationStatus = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const { status } = req.body;

    const user = await User.findById(userId);

    if (user) {
        if (!['approved', 'rejected'].includes(status)) {
            res.status(400);
            throw new Error('Invalid status provided. Must be "approved" or "rejected".');
        }

        user.sellerApplicationStatus = status;

        if (status === 'approved') {
            user.isSeller = true;

            // Email bhejo
            const message = `
              <h2>Hi ${user.name},</h2>
              <p>🎉 Great news! Your seller application has been <b>approved</b>.</p>
              <p>You can now access your seller dashboard and start adding products.</p>
              <a href="https://yourwebsite.com/seller/dashboard" target="_blank" style="padding: 10px 20px; background: green; color: white; text-decoration: none; border-radius: 5px;">Go to Seller Dashboard</a>
            `;

            await sendEmail({
              email: user.email,
              subject: 'Seller Application Approved ✅',
              message,
            });
        } else if (status === 'rejected') {
            user.isSeller = false;
            // Optional: Email on rejection
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