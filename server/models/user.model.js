import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true }, 
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
    isVerified: { type: Boolean, default: false }, 
wishlist: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cycle'
  }
    ]
, 
shippingAddress: {
        address: { type: String },
        city: { type: String },
        postalCode: { type: String },
        country: { type: String },
    },
    
    isSeller: {
        type: Boolean,
        required: true,
        default: false 
    },
    sellerApplicationStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none' 
    },
    sellerApplicationDetails: {
        businessName: { type: String },
        businessDescription: { type: String },
        email: { type: String }, 
        phoneNumber: { type: String },
        businessAddress: { type: String },
        gstin: { type: String } 
    },
    isTwoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        
        type: String 
    }
    
}, {
    timestamps: true
});


userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});


userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;