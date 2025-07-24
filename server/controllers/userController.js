import asyncHandler from 'express-async-handler'; 
import User from '../models/user.model.js'; 
import Cycle from '../models/cycle.model.js';


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

    await user.deleteOne(); 
    res.json({ message: 'User removed' });
  } else {
    res.status(404); 
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
            user.wishlist.splice(index, 1);
            message = 'Removed from wishlist';
        } else {
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
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});
const getUserAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user && user.shippingAddress) {
        res.json(user.shippingAddress);
    } else if (user) {
        res.json({}); 
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});
const updateUserAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.shippingAddress = {
            address: req.body.address || user.shippingAddress.address,
            city: req.body.city || user.shippingAddress.city,
            postalCode: req.body.postalCode || user.shippingAddress.postalCode,
            country: req.body.country || user.shippingAddress.country,
        };

        const updatedUser = await user.save();
        res.json(updatedUser.shippingAddress);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});
const getMyReviews = asyncHandler(async (req, res) => {
    
    const cyclesWithUserReviews = await Cycle.find({ 'reviews.user': req.user._id });

    if (cyclesWithUserReviews) {
                const myReviews = cyclesWithUserReviews.flatMap(cycle => 
            cycle.reviews
                .filter(review => review.user.toString() === req.user._id.toString())
                .map(review => ({
                    ...review.toObject(),
                    cycleId: cycle._id,
                    cycleBrand: cycle.brand,
                    cycleModel: cycle.model,
                    cycleImageUrl: cycle.imageUrl
                }))
        );
        res.json(myReviews);
    } else {
        res.json([]);
    }
});
export {
  getAllUsers,
  deleteUser,
  toggleWishlist,
  getWishlist,
  getUserProfile,
  updateUserProfile,
  getUserAddress,
  updateUserAddress,
  getMyReviews ,
};