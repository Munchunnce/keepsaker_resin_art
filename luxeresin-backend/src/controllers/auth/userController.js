import { User } from "../../models/index.js";
import CustomErrorHandler from "../../services/CustomErrorHandler.js";

const userController = {
    async me(req, res, next) {
        try {
            // 1. .lean() added for blazing fast read-only query
            // 2. Exact field names excluded (-password_hash instead of -password)
            const user = await User.findOne({ _id: req.user._id })
                .select('-password_hash -updatedAt -__v')
                .lean(); 

            if (!user) {
                return next(CustomErrorHandler.notFound('User not found'));
            }

            // 3. Consistent JSON response format
            res.status(200).json({
                success: true,
                user, // Redux me directly is user object ko save kar lenge
            });
        } catch (err) {
            return next(CustomErrorHandler.internal('Error fetching user profile'));
        }
    }
}

export default userController;