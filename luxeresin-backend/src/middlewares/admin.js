import { User } from '../models/index.js';
import CustomErrorHandler from '../services/CustomErrorHandler.js';

const admin = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.user._id });

        if (user && user?.role?.toLowerCase() === 'admin') {
            return next();
        }

        // 401 ki jagah 403 bhejein taaki axiosInstance token refresh retry loop na chalaye
        return res.status(403).json({
            success: false,
            message: 'Access denied! Admin privileges required.',
        });
    } catch (err) {
        return next(
            CustomErrorHandler.internal('Something went wrong while checking admin privileges')
        );
    }
};

export default admin;