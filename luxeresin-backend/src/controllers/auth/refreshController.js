import Joi from 'joi';
import { RefreshToken, User } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import JwtService from '../../services/JwtService.js';
import { REFRESH_SECRET } from '../../config/index.js';

const refreshController = {
  async refresh(req, res, next) {
    // 1. Validate request body
    const refreshSchema = Joi.object({
      refresh_token: Joi.string().required(),
    });

    const { error, value } = refreshSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    // 2. Database
    let refreshToken;
    try {
        refreshToken = await RefreshToken.findOne({ token: value.refresh_token });
        if(!refreshToken) {
            return next(CustomErrorHandler.unAuthorized('Invalid refresh token'));
        }

        let userId;
        try {
            const { _id, role } = await JwtService.verify(refreshToken.token, REFRESH_SECRET);
            userId = _id;
        } catch (err) {
            return next(CustomErrorHandler.unAuthorized('Invalid refresh token'));
        }

        const user = await User.findOne({ _id: userId});
        if(!user){
            return next(CustomErrorHandler.unAuthorized('No user found'));
        }

        // . Generate JWT token
            const access_token = JwtService.sign({
                _id: user._id,
                role: user.role,
            });

            // refresh token generation
            // Refresh token
            const refresh_token = JwtService.sign({ _id: user._id, role: user.role, }, REFRESH_SECRET, '7d');
            
            //Database whitelist for refresh token
            await RefreshToken.create({ token: refresh_token });

            // . Return response
            return res.status(200).json({
                message: 'Login successful',
                access_token,
                refresh_token
            });
    } catch (err) {
        return next(new Error('Something went wrong in the database' + err.message));
    }
  },
};


export default refreshController;