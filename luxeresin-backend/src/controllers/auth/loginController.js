import Joi from 'joi';
import { RefreshToken, User } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import bcrypt from 'bcrypt';
import JwtService from '../../services/JwtService.js';
import { REFRESH_SECRET, NODE_ENV } from '../../config/index.js';

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
            const user = await User.findOne({ email }).select('+password_hash');

            if (!user) {
                return next(CustomErrorHandler.wrongCredentials());
            }

            // 3. Verify password
            const isPasswordValid = await bcrypt.compare(value.password, user.password_hash);
            if (!isPasswordValid) {
                return next(CustomErrorHandler.wrongCredentials());
            }

            // 4. Generate JWT tokens
            const access_token = JwtService.sign({ _id: user._id, role: user.role });
            const refresh_token = JwtService.sign({ _id: user._id, role: user.role }, REFRESH_SECRET, '7d');
            
            // 5. DB whitelist WITH userId (Link token to this specific user)
            await RefreshToken.create({ 
                token: refresh_token,
                userId: user._id // Pro-Fix
            });

            // 6. Set Refresh Token in HttpOnly Cookie (XSS Protection)
            res.cookie('refreshToken', refresh_token, {
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                httpOnly: true, 
                secure: NODE_ENV === 'production', 
                sameSite: 'strict', 
            });

            // 7. Return response (Only access_token goes to Redux Toolkit)
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                access_token,
            });

        } catch (error) {
            return next(error);
        }
    },

    //  LOGOUT CONTROLLER
    async logout(req, res, next) {
        try {
            // 1. Request body ki jagah ab hum seedha Cookie se token uthayenge
            const refreshToken = req.cookies?.refreshToken; // Requires cookie-parser middleware in app.js

            if (!refreshToken) {
                return res.status(401).json({ success: false, message: 'Already logged out or token missing' });
            }

            // 2. Delete refresh token from database
            await RefreshToken.deleteOne({ token: refreshToken });

            // 3. Browser se HttpOnly Cookie ko Hamesha ke liye Clear karein
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: NODE_ENV === 'production',
                sameSite: 'strict',
            });

            // 4. Send response
            return res.status(200).json({
                success: true,
                message: 'Logout successful',
            });
        } catch (error) {
            return next(new Error('Something went wrong while logging out: ' + error.message));
        }
    },
};

export default loginController;