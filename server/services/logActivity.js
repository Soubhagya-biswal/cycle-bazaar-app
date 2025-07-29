import Activity from '../models/activity.model.js';

/**
 
 * @param {string} userId 
 * @param {string} action 
 * @param {object} [details={}] 
 */
const logActivity = async (userId, action, details = {}) => {
  try {
    const activity = new Activity({
      user: userId,
      action: action,
      details: details,
    });
    await activity.save();
    console.log(`Activity logged: User ${userId} performed ${action}`);
  } catch (error) {
   
    console.error('Failed to log activity:', error);
  }
};

export default logActivity;