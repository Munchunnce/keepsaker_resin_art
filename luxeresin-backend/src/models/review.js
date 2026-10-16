import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        product: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product', 
            required: true 
        },
        rating: { 
            type: Number, 
            required: true, 
            min: 1, 
            max: 5 // Rating sirf 1 se 5 ke beech hogi
        },
        comment: { 
            type: String, 
            required: true,
            trim: true,
            maxLength: 500 // Spam comment na ho isliye max length
        }
    },
    { timestamps: true }
);

// Ek customer ek product par sirf EK hi review de sakta hai (Duplicate roko)
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema, 'reviews');
export default Review;