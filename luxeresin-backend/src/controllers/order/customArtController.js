import CustomArtRequest from '../../models/customArtRequest.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const customArtController = {
    // 1. CUSTOMER REQUEST BHEJEGA (Uploads Photo)
    async submitRequest(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload a reference image!' });
            }

            // Cloudinary par customer ki photo save karein
            const cloudResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'luxeresin_custom_requests',
            });

            // Multer ka temporary file delete karein
            fs.unlinkSync(req.file.path);

            const { theme, shape, customText, dimensions, description } = req.body;

            const newRequest = new CustomArtRequest({
                user: req.user._id,
                theme,
                shape,
                customText,
                dimensions,
                description,
                referenceImage: cloudResult.secure_url
            });

            await newRequest.save();

            return res.status(201).json({
                success: true,
                message: 'Your custom masterpiece request has been submitted! Our team will review it.',
                data: newRequest
            });
        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return next(error);
        }
    },

    // 🚀 2. NAYA: CUSTOMER APNI REQUESTS DEKHEGA (Jo pehle miss ho gaya tha)
    async getMyRequests(req, res, next) {
        try {
            // Sirf current logged-in user ki requests aayengi
            const requests = await CustomArtRequest.find({ user: req.user._id })
                .sort({ createdAt: -1 }); 
            
            res.status(200).json({ success: true, data: requests });
        } catch (error) {
            return next(error);
        }
    },

    // Customer Quote Accept Karega (UPI Advance ke liye)
    async acceptQuote(req, res, next) {
        try {
            // Customer sirf apni hi request accept kar sakta hai
            const request = await CustomArtRequest.findOne({ _id: req.params.id, user: req.user._id });
            
            if (!request) {
                return res.status(404).json({ success: false, message: 'Request not found!' });
            }

            // Status update karke AWAITING_ADVANCE kar diya
            request.status = 'AWAITING_ADVANCE'; 
            await request.save();

            res.status(200).json({ 
                success: true, 
                message: 'Quote Accepted! 💎 Our team will WhatsApp you the UPI QR code for the 50% advance.', 
                data: request 
            });
        } catch (error) {
            return next(error);
        }
    },

    // 3. ADMIN SAARI REQUESTS DEKHEGA
    async getAllRequests(req, res, next) {
        try {
            const requests = await CustomArtRequest.find()
                .populate('user', 'full_name email') // User ka naam aur email sath aayega
                .sort({ createdAt: -1 }); // Newest first
            
            res.status(200).json({ success: true, data: requests });
        } catch (error) {
            return next(error);
        }
    },

    // 4. ADMIN STATUS AUR PRICE UPDATE KAREGA
    async updateRequest(req, res, next) {
        try {
            const { status, estimatedPrice, adminNotes } = req.body;
            const request = await CustomArtRequest.findByIdAndUpdate(
                req.params.id,
                { status, estimatedPrice, adminNotes },
                { new: true }
            );
            res.status(200).json({ success: true, message: 'Request updated successfully!', data: request });
        } catch (error) {
            return next(error);
        }
    }
};

export default customArtController;