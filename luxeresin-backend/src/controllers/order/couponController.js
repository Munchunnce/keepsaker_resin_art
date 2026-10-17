import { Coupon, Cart } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import Joi from 'joi';

const couponController = {
    // 1. CREATE COUPON
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

    // 2. APPLY COUPON (With Live FAANG Math)
    async applyCoupon(req, res, next) {
        const { code } = req.body;
        if (!code) return next(CustomErrorHandler.badRequest('Please enter a coupon code.'));

        try {
            // 1. Cart dhoondo aur Product ki poori details (price, sizes) POPULATE karo
            const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
            
            if (!cart || !cart.items || cart.items.length === 0) {
                return next(CustomErrorHandler.badRequest('Your cart is empty.'));
            }

            // 2. Coupon dhoondo aur checks lagao
            const coupon = await Coupon.findOne({ code: code.toUpperCase() });
            
            if (!coupon) return next(CustomErrorHandler.notFound('Invalid coupon code.'));
            if (!coupon.isActive) return next(CustomErrorHandler.badRequest('This coupon is no longer active.'));
            if (new Date(coupon.expiryDate) < new Date()) return next(CustomErrorHandler.badRequest('This coupon has expired.'));

            // --- ZERO-TRUST LIVE MATH ---
            let currentCartTotal = 0;

            // Har ek item ka price live calculate karo
            for (const item of cart.items) {
                const product = item.product;
                
                // Base price uthao
                let itemPrice = product.discountPrice > 0 ? product.discountPrice : product.basePrice;

                // Size ka extra paisa jodo
                if (item.selectedSize && product.sizes && product.sizes.length > 0) {
                    const sizeData = product.sizes.find(s => s.sizeLabel === item.selectedSize);
                    if (sizeData) itemPrice += sizeData.priceModifier;
                }

                // Addons ka extra paisa jodo
                if (item.selectedAddons && item.selectedAddons.length > 0 && product.addons) {
                    item.selectedAddons.forEach(addonName => {
                        const addonData = product.addons.find(a => a.addonName === addonName);
                        if (addonData) itemPrice += addonData.extraPrice;
                    });
                }

                // Quantity se multiply karke grand total me dalo
                currentCartTotal += (itemPrice * item.quantity);
            }

            // 3. Minimum Order Check
            if (currentCartTotal < coupon.minCartValue) {
                return next(CustomErrorHandler.badRequest(`You need to add ₹${coupon.minCartValue - currentCartTotal} more to use this coupon.`));
            }

            // 4. Discount Math
            let discountAmount = 0;
            if (coupon.discountType === 'FLAT') {
                discountAmount = coupon.discountValue; 
                if (discountAmount > currentCartTotal) discountAmount = currentCartTotal; 
            } else if (coupon.discountType === 'PERCENTAGE') {
                discountAmount = (currentCartTotal * coupon.discountValue) / 100;
            }

            const finalAmountToPay = currentCartTotal - discountAmount;

            return res.status(200).json({
                success: true,
                message: `Hurray! You saved ₹${discountAmount}.`,
                data: {
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