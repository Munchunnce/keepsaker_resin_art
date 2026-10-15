import { RefreshToken, User } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import JwtService from '../../services/JwtService.js';
import { REFRESH_SECRET, NODE_ENV } from '../../config/index.js';

const refreshController = {
  async refresh(req, res, next) {
    try {
        // 1. Get refresh token from Cookie (No Joi validation needed)
        const currentRefreshToken = req.cookies?.refreshToken;

        if (!currentRefreshToken) {
            return next(CustomErrorHandler.unAuthorized('Refresh token missing'));
        }

        // 2. Check if token exists in Database
        const tokenInDb = await RefreshToken.findOne({ token: currentRefreshToken });
        if (!tokenInDb) {
            return next(CustomErrorHandler.unAuthorized('Invalid refresh token'));
        }

        // 3. Verify JWT Signature
        let userId;
        try {
            const { _id } = await JwtService.verify(tokenInDb.token, REFRESH_SECRET);
            userId = _id;
        } catch (err) {
            return next(CustomErrorHandler.unAuthorized('Refresh token expired or invalid'));
        }

        // 4. Check if User still exists in DB
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return next(CustomErrorHandler.unAuthorized('User no longer exists'));
        }

        // 5. TOKEN ROTATION (Pro-Fix: Delete the old token immediately)
        await RefreshToken.deleteOne({ token: currentRefreshToken });

        // 6. Generate New Tokens
        const access_token = JwtService.sign({
            _id: user._id,
            role: user.role,
        });

        const refresh_token = JwtService.sign(
            { _id: user._id, role: user.role }, 
            REFRESH_SECRET, 
            '7d'
        );
        
        // 7. Whitelist new refresh token in DB (with userId)
        await RefreshToken.create({ 
            token: refresh_token,
            userId: user._id 
        });

        // 8. Set New HttpOnly Cookie
        res.cookie('refreshToken', refresh_token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict',
        });

        // 9. Return ONLY access_token to frontend
        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            access_token,
        });

    } catch (err) {
        return next(new Error('Something went wrong during token refresh: ' + err.message));
    }
  },
};

export default refreshController;