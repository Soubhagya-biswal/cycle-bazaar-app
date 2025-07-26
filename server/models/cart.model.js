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
            variantId: {
                type: mongoose.Schema.Types.ObjectId,
                // It's not a direct 'ref' to a top-level model,
                // but refers to an _id within the 'variants' array of a 'Cycle'.
                // Mongoose can sometimes populate subdocuments if the main ref is correct.
                // It should be required if product has variants, but optional if not.
                // For simplicity, we'll make it not required at schema level for now.
                required: false // Not all cycles will have variants, so make it optional
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