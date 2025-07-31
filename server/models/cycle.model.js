import mongoose from 'mongoose';
const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

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
  marketPrice: {
  type: Number,
  required: true,
  default: 0
},
ourPrice: {
  type: Number,
  required: true,
  default: 0
},
  imageUrl: {
  type: String,
  required: false,
  },
  seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true, 
    ref: 'User', 
        index: true
    },
description: {
  type: String,
  required: true, 
  trim: true,
  default: 'No description provided.' 
},
stock: {
  type: Number,
  required: true, 
  default: 0,     
  min: 0         
},
   variants: [ 
        {
            color: { type: String, trim: true },
            size: { type: String, trim: true }, 
            additionalPrice: { type: Number, required: true, default: 0 }, 
            variantStock: { type: Number, required: true, default: 0, min: 0 }, 
            
        },
    ],
subscribers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ], 
  priceDropSubscribers: [ 
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
  , 
reviews: [reviewSchema],
rating: {
    type: Number,
    required: true,
    default: 0,
},
numReviews: {
    type: Number,
    required: true,
    default: 0,
}
}, {
  timestamps: true,
});


const Cycle = mongoose.model('Cycle', cycleSchema);

export default Cycle;