import { Review, Product, Order } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import Joi from 'joi';

const reviewController = {
    // 1. ADD / UPDATE REVIEW
    async addReview(req, res, next) {
        const reviewSchema = Joi.object({
            rating: Joi.number().min(1).max(5).required(),
            comment: Joi.string().max(500).required(),
            productId: Joi.string().required()
        });

        const { error, value } = reviewSchema.validate(req.body);
        if (error) return next(error);

        try {
            // Kya user ne ye product kharida hai aur order DELIVERED hai?
            const hasPurchased = await Order.findOne({
                user: req.user._id,
                orderStatus: 'DELIVERED', 
                'orderItems.productId': value.productId
            });

            if (!hasPurchased) {
                return next(CustomErrorHandler.badRequest('You can only review products that have been delivered to you.'));
            }

            // Check karo agar pehle se review diya hai
            let review = await Review.findOne({ user: req.user._id, product: value.productId });

            if (review) {
                review.rating = value.rating;
                review.comment = value.comment;
                await review.save();
            } else {
                review = new Review({
                    user: req.user._id,
                    product: value.productId,
                    rating: value.rating,
                    comment: value.comment
                });
                await review.save();
            }

            // --- MATH TIME: Average Rating update karo ---
            const allReviews = await Review.find({ product: value.productId });
            const totalReviews = allReviews.length; //  Yahan FIX kar diya hai
            
            const totalRatingSum = allReviews.reduce((sum, item) => sum + item.rating, 0);
            const averageRating = totalRatingSum / totalReviews;

            // Product model update karo
            await Product.findByIdAndUpdate(value.productId, {
                averageRating: Number(averageRating.toFixed(1)), 
                totalReviews // Yahan FIX kar diya hai
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
                .populate('user', 'full_name') 
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