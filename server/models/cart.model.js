import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    // Har cart ek user se juda hoga
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Har user ka ek hi cart hoga
    },
    // Cart ke andar ke items ka array
    items: [
        {
            cycleId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Cycle',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1, // Kam se kam 1 item hona chahiye
                default: 1
            }
        }
    ]
}, {
    timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;