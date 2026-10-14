import Joi from 'joi';
import { RefreshToken, User } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import bcrypt from 'bcrypt';
import JwtService from '../../services/JwtService.js';
import { REFRESH_SECRET } from '../../config/index.js';

const loginController = {
    async login(req, res, next) {
        // 1. Validate request body
        const loginSchema = Joi.object({
            email: Joi.string().trim().email().required(),
            password: Joi.string().required(),
        });

        const { error, value } = loginSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        try {
            // 2. Find user and include password_hash
            const email = value.email.toLowerCase();

            const user = await User.findOne({ email })
                .select('+password_hash');

            if (!user) {
                return next(CustomErrorHandler.wrongCredentials());
            }

            // 3. Verify password
            const isPasswordValid = await bcrypt.compare(
                value.password,
                user.password_hash
            );

            if (!isPasswordValid) {
                return next(CustomErrorHandler.wrongCredentials());
            }

            // 4. Generate JWT token
            const access_token = JwtService.sign({
                _id: user._id,
                role: user.role,
            });

            // refresh token generation
            // Refresh token
            const refresh_token = JwtService.sign({ _id: user._id, role: user.role, }, REFRESH_SECRET, '7d');
            
            //Database whitelist for refresh token
            await RefreshToken.create({ token: refresh_token });

            // 5. Return response
            return res.status(200).json({
                message: 'Login successful',
                access_token,
                refresh_token
            });

        } catch (error) {
            return next(error);
        }
    },

    // Logout controller
    async logout(req, res, next) {
        // 1. Check request body
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                message: 'Request body is missing. Please send refresh_token.',
            });
        }

        // 2. Validate request body
        const refreshSchema = Joi.object({
            refresh_token: Joi.string().required(),
        });

        const { error, value } = refreshSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        try {
            // 3. Delete refresh token from database
            const result = await RefreshToken.deleteOne({
                token: value.refresh_token,
            });

            if (result.deletedCount === 0) {
                return res.status(401).json({
                    message: 'Refresh token not found or already logged out',
                });
            }

            // 4. Send response
            return res.status(200).json({
                message: 'Logout successful',
            });
        } catch (error) {
            return next(
                new Error('Something went wrong while logging out: ' + error.message)
            );
        }
    },
};

export default loginController;