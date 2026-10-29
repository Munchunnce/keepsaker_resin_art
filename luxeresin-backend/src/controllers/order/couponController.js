import { Coupon, Cart } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import Joi from 'joi';

const couponController = {
    // 1. CREATE COUPON (Admin)
    async createCoupon(req, res, next) {
        const couponSchema = Joi.object({
            code: Joi.string().trim().uppercase().required(),
            discountType: Joi.string().valid('PERCENTAGE', 'FLAT').required(),
            discountValue: Joi.number().required(),
            minCartValue: Joi.number().default(0),
            expiryDate: Joi.date().required()
        });

        const { error, value } = couponSchema.validate(req.body);
        if (error) return next(error);

        try {
            const exist = await Coupon.findOne({ code: value.code });
            if (exist) return next(CustomErrorHandler.alreadyExist('This coupon code already exists.'));

            const coupon = await Coupon.create(value);
            return res.status(201).json({
                success: true,
                message: 'Coupon created successfully!',
                data: coupon
            });
        } catch (err) {
            return next(err);
        }
    },

    // 🚀 2. GET ALL COUPONS (Admin - Page refresh par saare coupons dikhane ke liye)
    async getAllCoupons(req, res, next) {
        try {
            const coupons = await Coupon.find().sort({ createdAt: -1 });
            return res.status(200).json({
                success: true,
                data: coupons
            });
        } catch (err) {
            return next(err);
        }
    },

    // 🚀 3. DELETE COUPON (Admin - Expired ya galat coupon hatane ke liye)
    async deleteCoupon(req, res, next) {
        try {
            const coupon = await Coupon.findByIdAndDelete(req.params.id);
            if (!coupon) return next(CustomErrorHandler.notFound('Coupon not found.'));

            return res.status(200).json({
                success: true,
                message: 'Coupon deleted successfully!',
                id: req.params.id
            });
        } catch (err) {
            return next(err);
        }
    },

    // 4. APPLY COUPON (Customer Cart - With Live FAANG Math)
    async applyCoupon(req, res, next) {
        const { code } = req.body;
        if (!code) return next(CustomErrorHandler.badRequest('Please enter a coupon code.'));

        try {
            const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
            
            if (!cart || !cart.items || cart.items.length === 0) {
                return next(CustomErrorHandler.badRequest('Your cart is empty.'));
            }

            const coupon = await Coupon.findOne({ code: code.toUpperCase() });
            
            if (!coupon) return next(CustomErrorHandler.notFound('Invalid coupon code.'));
            if (!coupon.isActive) return next(CustomErrorHandler.badRequest('This coupon is no longer active.'));
            if (new Date(coupon.expiryDate) < new Date()) return next(CustomErrorHandler.badRequest('This coupon has expired.'));
            const alreadyUsed = coupon.usedBy?.some(
                (userId) => userId.toString() === req.user._id.toString()
            );
            if (alreadyUsed) {
                return next(CustomErrorHandler.badRequest('You have already used this coupon code once!'));
            }

            // --- ZERO-TRUST LIVE MATH ---
            let currentCartTotal = 0;

            for (const item of cart.items) {
                const product = item.product;
                let itemPrice = product.discountPrice > 0 ? product.discountPrice : product.basePrice;

                if (item.selectedSize && product.sizes && product.sizes.length > 0) {
                    const sizeData = product.sizes.find(s => s.sizeLabel === item.selectedSize);
                    if (sizeData) itemPrice += sizeData.priceModifier;
                }

                if (item.selectedAddons && item.selectedAddons.length > 0 && product.addons) {
                    item.selectedAddons.forEach(addonName => {
                        const addonData = product.addons.find(a => a.addonName === addonName);
                        if (addonData) itemPrice += addonData.extraPrice;
                    });
                }

                currentCartTotal += (itemPrice * item.quantity);
            }

            // 🚀 FIXED TYPO: coupon.minCartValue - currentCartTotal
            if (currentCartTotal < coupon.minCartValue) {
                return next(CustomErrorHandler.badRequest(`You need to add ₹${coupon.minCartValue - currentCartTotal} more to use this coupon.`));
            }

            let discountAmount = 0;
            if (coupon.discountType === 'FLAT') {
                discountAmount = coupon.discountValue; 
                if (discountAmount > currentCartTotal) discountAmount = currentCartTotal; 
            } else if (coupon.discountType === 'PERCENTAGE') {
                discountAmount = Math.round((currentCartTotal * coupon.discountValue) / 100);
            }

            const finalAmountToPay = currentCartTotal - discountAmount;

            return res.status(200).json({
                success: true,
                message: `Hurray! You saved ₹${discountAmount}.`,
                data: {
                    code: coupon.code,
                    originalTotal: currentCartTotal,
                    discountAmount: discountAmount,
                    finalTotal: finalAmountToPay
                }
            });

        } catch (err) {
            return next(err);
        }
    }
};

export default couponController;