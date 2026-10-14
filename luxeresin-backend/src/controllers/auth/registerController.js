// import Joi from "joi";
// import CustomErrorHandler from "../../services/CustomErrorHandler.js";
// import { User } from "../../models/index.js";
// import JwtService from "../../services/JwtService.js";

// const registerController = {
//     // user Register
//     async register(req, res, next) {
//         // 1. validate the request
//         // 2. authorise the request
//         // 3. check if user is in the database already
//         // 4. prepare the model
//         // 5. store in database
//         // 6. genrate jwt token
//         // 7. send response

//         // Validation
//         const registerSchema = Joi.object({
//             name: Joi.string().min(3).max(30).required(),
//             email: Joi.string().email().required(),
//             password: Joi.string().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/).required(),
//             repeat_password: Joi.ref('password')
                        
//         });

//         const { error } = registerSchema.validate(req.body);

//         if (error) {
//             return next(error);
//         }
//         // check if user is in the database already
//         // prepare the model
//         // store in database
//         // genrate jwt token
//         try{
//             const exist = await User.findOne({ email: req.body.email });
//             if (exist) {
//                 return next(CustomErrorHandler.alreadyExists('User already exists'));
//             }
//             const user = new User(req.body);
//             await user.save();
//         } catch (err) {
//             return next(err);
//         }

//         const { full_name, email, password_hash } = req.body;
//         // Hash password and generate token
//         // send response
//         const hashedPassword = await bcrypt.hash(password, 10);


//         const user = new User({
//             full_name,
//             email,
//             password_hash: hashedPassword,
//         });

//         let access_token;
//         try {
//             const savedUser = await user.save();
//             //token generation
//             access_token = JwtService.sign({ _id: savedUser._id, role: savedUser.role });
//             res.json({ token: access_token });
//         } catch (error) {
//             return next(error);
//         }
//     }
// };


// export default registerController;


// // import Joi from 'joi';
// // import bcrypt from 'bcrypt';
// // import CustomErrorHandler from '../../services/CustomErrorHandler.js';
// // import { User } from '../../models/index.js';

// // const registerController = {
// //     async register(req, res, next) {
// //         // 1. Validate request
// //         const registerSchema = Joi.object({
// //             name: Joi.string().trim().min(3).max(30).required(),
// //             email: Joi.string().email().required(),
// //             password: Joi.string()
// //                 .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
// //                 .required(),
// //             repeat_password: Joi.string()
// //                 .valid(Joi.ref('password'))
// //                 .required(),
// //         });

// //         const { error, value } = registerSchema.validate(req.body);

// //         if (error) {
// //             return next(error);
// //         }

// //         try {
// //             // 2. Check if user already exists
// //             const email = value.email.trim().toLowerCase();

// //             const exist = await User.findOne({ email });

// //             if (exist) {
// //                 return next(
// //                     CustomErrorHandler.alreadyExists('User already exists')
// //                 );
// //             }

// //             // 3. Hash password BEFORE saving
// //             const hashedPassword = await bcrypt.hash(value.password, 10);

// //             // 4. Map request fields to User schema fields
// //             const user = new User({
// //                 full_name: value.name,
// //                 email,
// //                 password_hash: hashedPassword,
// //             });

// //             // 5. Save user to MongoDB
// //             await user.save();

// //             // 6. Send response without password
// //             return res.status(201).json({
// //                 message: 'User registered successfully',
// //             });
// //         } catch (err) {
// //             if (err.code === 11000) {
// //                 return next(
// //                     CustomErrorHandler.alreadyExists('User already exists')
// //                 );
// //             }

// //             return next(err);
// //         }
// //     },
// // };

// // export default registerController;


import Joi from 'joi';
import bcrypt from 'bcrypt';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import { RefreshToken, User } from '../../models/index.js';
import JwtService from '../../services/JwtService.js';
import { REFRESH_SECRET } from '../../config/index.js';

const registerController = {
    async register(req, res, next) {
        // 1. Validate request
        const registerSchema = Joi.object({
            name: Joi.string().trim().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string()
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
                .required(),
            repeat_password: Joi.string()
                .valid(Joi.ref('password'))
                .required(),
        });

        const { error, value } = registerSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        try {
            // 2. Check if user already exists
            const email = value.email.trim().toLowerCase();

            const exist = await User.findOne({ email });

            if (exist) {
                return next(
                    CustomErrorHandler.alreadyExists('User already exists')
                );
            }

            // 3. Hash password
            const hashedPassword = await bcrypt.hash(value.password, 10);

            // 4. Map request fields to User schema
            const user = new User({
                full_name: value.name,
                email,
                password_hash: hashedPassword,
            });

            // 5. Save user only once
            const savedUser = await user.save();

            // 6. Generate JWT
            const access_token = JwtService.sign({
                _id: savedUser._id,
                role: savedUser.role,
            });

            // Refresh token
            const refresh_token = JwtService.sign(
                {
                    _id: savedUser._id,
                    role: savedUser.role,
                },
                REFRESH_SECRET,
                '7d'
            );

            //Database whitelist for refresh token
            await RefreshToken.create({ token: refresh_token });

            // 7. Send response
            return res.status(201).json({
                message: 'User registered successfully',
                token: access_token,
                refresh_token: refresh_token,
            });
        } catch (err) {
            if (err.code === 11000) {
                return next(
                    CustomErrorHandler.alreadyExists('User already exists')
                );
            }

            return next(err);
        }
    },
};

export default registerController;
