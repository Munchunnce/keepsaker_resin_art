import Joi from 'joi';
import bcrypt from 'bcrypt';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import { RefreshToken, User } from '../../models/index.js';
import JwtService from '../../services/JwtService.js';
import { REFRESH_SECRET, NODE_ENV } from '../../config/index.js'; // NODE_ENV import karein

const registerController = {
    async register(req, res, next) {
        // 1. Validate request (abortEarly: false ensures all errors are sent, not just the first one)
        const registerSchema = Joi.object({
            name: Joi.string().trim().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string()
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
                .required()
                .messages({
                    'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, one number and one special character.'
                }),
            repeat_password: Joi.string()
                .valid(Joi.ref('password'))
                .required()
                .messages({ 'any.only': 'Passwords do not match' }),
        });

        const { error, value } = registerSchema.validate(req.body, { abortEarly: false });

        if (error) {
            return next(error);
        }

        try {
            // 2. Check if user already exists
            const email = value.email.trim().toLowerCase();
            const exist = await User.findOne({ email });

            if (exist) {
                return next(CustomErrorHandler.alreadyExists('Email is already registered'));
            }

            // 3. Hash password (Upgraded to 12 rounds for FAANG level security)
            const hashedPassword = await bcrypt.hash(value.password, 12);

            // 4. Map request fields to User schema
            const user = new User({
                full_name: value.name,
                email,
                password_hash: hashedPassword,
            });

            // 5. Save user
            const savedUser = await user.save();

            // 6. Generate JWT
            const access_token = JwtService.sign({
                _id: savedUser._id,
                role: savedUser.role,
            });

            const refresh_token = JwtService.sign(
                { _id: savedUser._id, role: savedUser.role },
                REFRESH_SECRET,
                '7d'
            );

            // 7. Database whitelist for refresh token (Added User ID for session management)
            await RefreshToken.create({ 
                token: refresh_token,
                userId: savedUser._id // PRO FIX: Link token to user
            });

            // 8. Set Refresh Token in HttpOnly Cookie (XSS Protection)
            res.cookie('refreshToken', refresh_token, {
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days in milliseconds
                httpOnly: true, // PRO FIX: JavaScript cannot access this cookie
                secure: NODE_ENV === 'production', // true on HTTPS, false on localhost
                sameSite: 'strict', // CSRF protection
            });

            // 9. Send response (Send ONLY access_token to frontend React)
            return res.status(201).json({
                success: true,
                message: 'User registered successfully',
                token: access_token, // Frontend will keep this in memory or redux state
            });

        } catch (err) {
            if (err.code === 11000) {
                return next(CustomErrorHandler.alreadyExists('Email is already registered'));
            }
            return next(err);
        }
    },
};

export default registerController;