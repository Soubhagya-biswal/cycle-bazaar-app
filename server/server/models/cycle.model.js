import mongoose from 'mongoose';

const cycleSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  imageUrl: {
  type: String,
  required: false,
},
// --- ADD THESE NEW FIELDS ---
description: {
  type: String,
  required: true, // Description should be required
  trim: true,
  default: 'No description provided.' // A default value if not provided
},
stock: {
  type: Number,
  required: true, // Stock should be required
  default: 0,     // Default to 0 if not provided
  min: 0          // Stock cannot be negative
},
  // --- END NEW FIELDS ---
subscribers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ], // <-- Yahan comma (,) laga hai
  priceDropSubscribers: [ // <-- Yeh naya field hai
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true,
});


const Cycle = mongoose.model('Cycle', cycleSchema);

export default Cycle;