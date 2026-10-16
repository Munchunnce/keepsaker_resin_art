import { Order, Cart, Product } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import Joi from 'joi';

const orderController = {
    async placeOrder(req, res, next) {
        // 1. Strict Validation: Hum sirf address aur payment mode mangenge. (Paise nahi mangenge!)
        const checkoutSchema = Joi.object({
            shippingAddress: Joi.object({
                fullName: Joi.string().trim().required(),
                phone: Joi.string().regex(/^[0-9]{10}$/).required().messages({'string.pattern.base': 'Invalid phone number'}),
                pincode: Joi.string().regex(/^[0-9]{6}$/).required(),
                streetAddress: Joi.string().required(),
                city: Joi.string().required(),
                state: Joi.string().required()
            }).required(),
            paymentMethod: Joi.string().valid('COD', 'ONLINE').required()
        });

        const { error, value } = checkoutSchema.validate(req.body);
        if (error) return next(error);

        try {
            // 2. Fetch User's Cart
            const cart = await Cart.findOne({ user: req.user._id });
            if (!cart || cart.items.length === 0) {
                return next(CustomErrorHandler.badRequest('Your cart is empty!'));
            }

            let itemsTotal = 0;
            const orderItems = [];

            // 3. THE MATH ENGINE & INVENTORY GUARD (Zero Trust Policy)
            for (let item of cart.items) {
                const product = await Product.findById(item.product);
                
                // Security Check 1: Kya product sach mein hai aur stock mein hai?
                if (!product || !product.isActive || !product.inStock) {
                    return next(CustomErrorHandler.badRequest(`Sorry, ${product ? product.name : 'an item'} is out of stock or unavailable.`));
                }

                // Base Price (Agar discount hai toh wo lo, warna base price lo)
                let itemBasePrice = product.discountPrice > 0 ? product.discountPrice : product.basePrice;
                let extraSizePrice = 0;
                let extraAddonsPrice = 0;

                // Security Check 2: Size Modifier Verification
                if (item.selectedSize !== 'Standard') {
                    const sizeObj = product.sizes.find(s => s.sizeLabel === item.selectedSize);
                    if (sizeObj) extraSizePrice = sizeObj.priceModifier;
                }

                // Security Check 3: Addons Price Verification
                if (item.selectedAddons && item.selectedAddons.length > 0) {
                    for (let addonName of item.selectedAddons) {
                        const addonObj = product.addons.find(a => a.addonName === addonName);
                        if (addonObj) extraAddonsPrice += addonObj.extraPrice;
                    }
                }

                // Final calculation for this specific item configuration
                const itemFinalPrice = (itemBasePrice + extraSizePrice + extraAddonsPrice) * item.quantity;
                itemsTotal += itemFinalPrice;

                // 4. Create the IMMUTABLE SNAPSHOT (Copy details so future price changes don't affect old orders)
                orderItems.push({
                    productId: product._id,
                    name: product.name,
                    image: product.images[0], // Main image
                    priceAtPurchase: itemBasePrice,
                    quantity: item.quantity,
                    selectedSize: item.selectedSize,
                    selectedColor: item.selectedColor,
                    selectedAddons: item.selectedAddons,
                    itemFinalPrice: itemFinalPrice
                });
            }

            // 5. Final Billing Math (Shipping & Taxes)
            const shippingCharge = itemsTotal > 2000 ? 0 : 150; // Agar 2000 se upar ka bill hai toh Free Delivery!
            const taxAmount = 0; // Agar GST lagana ho toh: (itemsTotal * 18) / 100
            const discountAmount = 0; // (Future mein yahan Coupon ka logic aayega)
            
            const finalTotal = itemsTotal + shippingCharge + taxAmount - discountAmount;

            // 6. Create the Order
            const newOrder = new Order({
                user: req.user._id,
                orderItems,
                shippingAddress: value.shippingAddress,
                itemsTotal,
                shippingCharge,
                taxAmount,
                discountAmount,
                finalTotal,
                paymentMethod: value.paymentMethod,
                orderStatus: 'PLACED' // Resin art ke hisaab se next admin isko 'PROCESSING' karega
            });

            const savedOrder = await newOrder.save();

            // 7. EMPTY THE CART (Bahut zaroori kadam, warna customer double order kar dega galti se)
            await Cart.findOneAndDelete({ user: req.user._id });

            return res.status(201).json({
                success: true,
                message: 'Order placed successfully! We will start crafting your Resin Art soon.',
                data: savedOrder
            });

        } catch (err) {
            return next(err);
        }
    }
};

export default orderController;