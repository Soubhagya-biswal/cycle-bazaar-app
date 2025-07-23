import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
    isVerified: { type: Boolean, default: false }

    , // <-- isVerified field ke baad comma
wishlist: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cycle'
  }
    ]
, // <-- wishlist field ke baad comma
shippingAddress: {
  address: { type: String },
  city: { type: String },
  postalCode: { type: String },
  country: { type: String },
}
}, {
    timestamps: true
});

// Password hash karne wala function
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Password compare karne ke liye
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;