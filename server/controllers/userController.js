import asyncHandler from 'express-async-handler'; // Import asyncHandler for error handling
import User from '../models/user.model.js'; // Import your User model

// @desc    Get all users (for Admin)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  // Find all users
  const users = await User.find({});
  res.json(users);
});
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id); // Find user by ID from URL params

  if (user) {
    // Prevent admin from deleting themselves
    if (user.isAdmin) {
      res.status(400); // Bad Request
      throw new Error('Cannot delete admin user');
    }

    await user.deleteOne(); // Use deleteOne() for Mongoose 6+
    res.json({ message: 'User removed' });
  } else {
    res.status(404); // Not Found
    throw new Error('User not found');
  }
});
const toggleWishlist = asyncHandler(async (req, res) => {
    const { cycleId } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        const index = user.wishlist.indexOf(cycleId);
        let message = '';

        if (index > -1) {
            // Item is already in wishlist, so remove it
            user.wishlist.splice(index, 1);
            message = 'Removed from wishlist';
        } else {
            // Item is not in wishlist, so add it
            user.wishlist.push(cycleId);
            message = 'Added to wishlist';
        }

        await user.save();
        res.json({ message, wishlist: user.wishlist });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});
const getWishlist = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('wishlist');

    if (user) {
        res.json(user.wishlist);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

export {
  getAllUsers,
  deleteUser,
  toggleWishlist,
  getWishlist
};