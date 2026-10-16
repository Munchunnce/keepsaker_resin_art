import Joi from "joi";
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
    },
    // 2. UPDATE ADDRESS (New Advanced Logic)
    async updateAddress(req, res, next) {
        // Strict Validation
        const addressSchema = Joi.object({
            fullName: Joi.string().trim().required(),
            phone: Joi.string().regex(/^[0-9]{10}$/).required(),
            pincode: Joi.string().regex(/^[0-9]{6}$/).required(),
            streetAddress: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required()
        });

        const { error, value } = addressSchema.validate(req.body);
        if (error) return next(error);

        try {
            // Find User and Update only the address field
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { address: value },
                { new: true } // Return updated user
            ).select('-password_hash -updatedAt -__v'); // Yahan bhi humne password_hash hide kar diya!

            if (!updatedUser) {
                return next(CustomErrorHandler.notFound('User not found'));
            }

            return res.status(200).json({
                success: true,
                message: 'Address saved successfully for future checkouts!',
                data: updatedUser
            });

        } catch (err) {
            return next(err);
        }
    }
}

export default userController;