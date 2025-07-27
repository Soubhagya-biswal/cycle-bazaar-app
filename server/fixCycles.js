import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Cycle from './models/cycle.model.js'; // Apne model ka sahi path check kar lein

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const fixCycles = async () => {
    await connectDB();

    const DEFAULT_SELLER_ID = '687f0b08a174185d605e1810';

    console.log('Starting script to fix old cycles...');

    try {
        const result = await Cycle.updateMany(
            { seller: { $exists: false } }, // Sirf un cycles ko dhoondo jinmein seller nahi hai
            { $set: { seller: DEFAULT_SELLER_ID } } // Un sab mein default seller set kar do
        );

        console.log(`Script finished.`);
        console.log(`Cycles found that needed a seller: ${result.matchedCount}`);
        console.log(`Cycles successfully updated: ${result.modifiedCount}`);
    } catch (error) {
        console.error('Error updating cycles:', error);
    } finally {
        console.log('Closing database connection.');
        mongoose.connection.close();
        process.exit(0);
    }
};

fixCycles();