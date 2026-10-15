import { User } from '../models/index.js';
import CustomErrorHandler from '../services/CustomErrorHandler.js';

const admin = async (req, res, next) => {
    try {
        // req.user._id humein auth.js middleware se milega
        const user = await User.findOne({ _id: req.user._id });
        
        if (user && user.role.toLowerCase() === 'admin') {
            next(); // User admin hai, request ko aage Controller ke paas jaane do
        } else {
            return next(CustomErrorHandler.unAuthorized('Access denied! Admin privileges required.'));
        }
    } catch (err) {
        return next(CustomErrorHandler.internal('Something went wrong while checking admin privileges'));
    }
}

export default admin;