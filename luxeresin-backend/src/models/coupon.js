import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Coupon code is required'],
            unique: true,
            trim: true,
            uppercase: true, // "diwali" likhega toh bhi "DIWALI" save hoga
        },
        discountType: {
            type: String,
            enum: ['PERCENTAGE', 'FLAT'],
            required: true,
        },
        discountValue: {
            type: Number,
            required: [true, 'Discount value is required'],
            // Agar PERCENTAGE hai toh 1-100 hoga, FLAT hai toh 500, 1000 kuch bhi ho sakta hai
        },
        minCartValue: {
            type: Number,
            default: 0, // Kam se kam kitne ka order hona chahiye is coupon ke liye
        },
        expiryDate: {
            type: Date,
            required: [true, 'Expiry date is required'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        usedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
    },
    {
        timestamps: true,
    }
);

const Coupon = mongoose.model('Coupon', couponSchema, 'coupons');

export default Coupon;