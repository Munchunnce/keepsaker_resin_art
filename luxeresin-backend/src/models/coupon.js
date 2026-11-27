import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Coupon code is required'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        discountType: {
            type: String,
            enum: ['PERCENTAGE', 'FLAT'],
            required: true,
        },
        discountValue: {
            type: Number,
            required: [true, 'Discount value is required'],
            min: [1, 'Discount value must be greater than 0'],
            validate: {
                validator: function (val) {
                    if (this.discountType === 'PERCENTAGE') {
                        return val <= 100;
                    }
                    return true;
                },
                message: 'Percentage discount cannot exceed 100%',
            },
        },
        minCartValue: {
            type: Number,
            default: 0,
            min: [0, 'Minimum cart value cannot be negative'],
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
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Coupon = mongoose.model('Coupon', couponSchema, 'coupons');

export default Coupon;