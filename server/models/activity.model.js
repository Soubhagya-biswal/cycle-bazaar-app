import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      // Hum in actions ko track karenge
      enum: [
        'LOGIN',
        'LOGOUT',
        'PLACE_ORDER',
        'CREATE_REVIEW',
        'UPDATE_REVIEW',
        // Future mein aur bhi add kar sakte hain
      ],
    },
    details: {
      // Yahan hum extra jaankari save karenge, jaise Order ID
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true, // Har activity ka time apne aap save ho jayega
  }
);

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;