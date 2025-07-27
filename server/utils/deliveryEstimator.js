import axios from 'axios';

const isWeekend = (date) => {
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    return day === 0 || day === 6;
};


const ORIGIN_STATE = 'ODISHA'; // Apna state daalein

export const calculateEstimatedDelivery = async (destinationPincode) => {
    try {
        const locationResponse = await axios.get(`https://api.postalpincode.in/pincode/${destinationPincode}`);
        if (locationResponse.data[0].Status === 'Error' || !locationResponse.data[0].PostOffice) {
            console.warn(`Pincode ${destinationPincode} not found. Cannot calculate delivery date.`);
            return null; 
        }
        const destinationState = locationResponse.data[0].PostOffice[0].State.toUpperCase();

        let transitDays = (destinationState === ORIGIN_STATE) ? 3 : 7;
        const processingDays = 1;
        const totalDaysToDeliver = processingDays + transitDays;

        let deliveryDate = new Date();
        let daysAdded = 0;
        while (daysAdded < totalDaysToDeliver) {
            deliveryDate.setDate(deliveryDate.getDate() + 1);
            if (!isWeekend(deliveryDate)) {
                daysAdded++;
            }
        }
        return deliveryDate;
    } catch (error) {
        console.error("Error calculating delivery date:", error.message);
        return null; 
    }
};