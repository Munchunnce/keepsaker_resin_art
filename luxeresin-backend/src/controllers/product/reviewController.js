import { Review, Product, Order } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import Joi from 'joi';

const reviewController = {
    // 1. ADD / UPDATE REVIEW (Verified Purchase Logic)
    async addReview(req, res, next) {
        // Validation: Rating sirf 1-5, comment max 500 chars
        const reviewSchema = Joi.object({
            rating: Joi.number().min(1).max(5).required(),
            comment: Joi.string().max(500).required(),
            productId: Joi.string().required()
        });

        const { error, value } = reviewSchema.validate(req.body);
        if (error) return next(error);

        try {
            // PRO-LEVEL SECURITY CHECK: Kya user ne ye product kharida hai?
            const hasPurchased = await Order.findOne({
                user: req.user._id,
                orderStatus: 'DELIVERED', // Order ghar pahuchne ke baad hi review de sakta hai
                'orderItems.productId': value.productId
            });

            if (!hasPurchased) {
                return next(CustomErrorHandler.badRequest('You can only review products that have been delivered to you.'));
            }

            // Check karo agar pehle se review diya hai toh update karo, warna naya banao
            let review = await Review.findOne({ user: req.user._id, product: value.productId });

            if (review) {
                // Update existing review
                review.rating = value.rating;
                review.comment = value.comment;
                await review.save();
            } else {
                // Naya review create karo
                review = new Review({
                    user: req.user._id,
                    product: value.productId,
                    rating: value.rating,
                    comment: value.comment
                });
                await review.save();
            }

            // --- MATH TIME: Average Rating aur Total Reviews update karo ---
            const allReviews = await Review.find({ product: value.productId });
            const numOfReviews = allReviews.length;
            
            // Sabki ratings ka total karo, phir total reviews se divide karo (Average math)
            const totalRatingSum = allReviews.reduce((sum, item) => sum + item.rating, 0);
            const averageRating = totalRatingSum / numOfReviews;

            // Product ko updated math ke sath save karo
            await Product.findByIdAndUpdate(value.productId, {
                averageRating: Number(averageRating.toFixed(1)), // 4.5 jaisa format
                numOfReviews
            });

            return res.status(200).json({
                success: true,
                message: 'Review posted successfully!',
                data: review
            });

        } catch (err) {
            return next(err);
        }
    },

    // 2. GET ALL REVIEWS OF A PRODUCT
    async getProductReviews(req, res, next) {
        try {
            const reviews = await Review.find({ product: req.params.productId })
                .populate('user', 'full_name') // Customer ka naam dikhane ke liye
                .sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                data: reviews
            });
        } catch (err) {
            return next(err);
        }
    }
};

export default reviewController;