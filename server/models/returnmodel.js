import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order', // Ye is return request ko kis order se jode ga
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Kis user ne return request kiya hai
    required: true,
  },
  reason: {
    type: String, // Return ka karan (e.g., "Damaged item", "Wrong size")
    required: true,
  },
  returnMethod: {
    type: String,
    enum: ['Refund to Original Payment Method', 'Store Credit', 'Bank Transfer'], // User ko refund kaise chahiye
    required: true,
  },
  // Ye fields tabhi fill honge jab returnMethod 'Bank Transfer' ho ya manual refund ho
  bankDetails: {
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },
    // **Important Security Note:** Directly card numbers, CVVs, ya expiry dates ko
    // database mein store karna HIGHLY RISKY hai aur PCI DSS compliance issues create karega.
    // Agar aapko refund original payment method mein karna hai (jaise credit card),
    // toh aapko payment gateway (e.g., Stripe, Razorpay) ke refund APIs ka use karna chahiye,
    // jismein aapko raw card details ki zaroorat nahi padti, bas original transaction ID ya token.
    // Isliye, maine yahan card-specific fields nahi diye hain.
    // Agar aapko asli mein bank account details chahiye (IFSC, Account Number),
    // toh unhe bhi database mein store karne se pehle encrypt karna best practice hai.
  },

  returnStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Refund Processed'], // Return request ka current status
    default: 'Pending', // Shuru mein pending hoga admin review ke liye
  },
  adminNotes: {
    type: String, // Admin ke comments ya notes jab woh request review karega
  },
  returnProcessedDate: {
    type: Date, // Jab return (aur refund) successfully process ho gaya
  },
  returnResolution: {
    type: String, // E.g., "Refund Issued", "Store Credit Applied"
  }
}, { timestamps: true }); // createdAt aur updatedAt fields automatically add ho jayenge

const Return = mongoose.model('Return', returnSchema);

export default Return;