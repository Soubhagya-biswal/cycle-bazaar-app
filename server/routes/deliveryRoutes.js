// routes/deliveryRoutes.js

import express from 'express';
import axios from 'axios';

const router = express.Router();

// Helper function to check for weekends (Saturday/Sunday)
const isWeekend = (date) => {
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    return day === 0 || day === 6;
};

// *****************************************************************
// **IMPORTANT**: Apna warehouse/store ka pincode yahan daalein
const ORIGIN_PINCODE = '751030'; // Example: Mumbai
const ORIGIN_STATE = 'ODISHA'; // Example: Maharashtra
// *****************************************************************

router.post('/estimate', async (req, res) => {
    const { pincode: destinationPincode } = req.body;

    if (!/^\d{6}$/.test(destinationPincode)) {
        return res.status(400).json({ message: 'Invalid pincode format.' });
    }

    try {
        // Pincode se location details fetch karein (using a free API)
        const locationResponse = await axios.get(`https://api.postalpincode.in/pincode/${destinationPincode}`);
        
        if (locationResponse.data[0].Status === 'Error' || !locationResponse.data[0].PostOffice) {
            return res.status(404).json({ message: 'Pincode not serviceable.' });
        }

        const destinationState = locationResponse.data[0].PostOffice[0].State.toUpperCase();
        
        // Delivery days ka simple logic
        let transitDays;
        if (destinationState === ORIGIN_STATE) {
            transitDays = 3; // Same state mein 3 din
        } else {
            transitDays = 7; // Dusre state mein 7 din
        }

        // Anumanit delivery date calculate karein
        const processingDays = 1; // Order process karne ka 1 din
        const totalDaysToDeliver = processingDays + transitDays;

        let deliveryDate = new Date();
        let daysAdded = 0;

        while (daysAdded < totalDaysToDeliver) {
            deliveryDate.setDate(deliveryDate.getDate() + 1);
            // Agar weekend nahi hai to hi din count karein
            if (!isWeekend(deliveryDate)) {
                daysAdded++;
            }
        }
        
        // Date ko aache format mein bhejein
        const formattedDate = deliveryDate.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        res.json({ estimatedDate: formattedDate });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

export default router;