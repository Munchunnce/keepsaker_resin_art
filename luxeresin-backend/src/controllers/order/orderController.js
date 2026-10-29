import { Order, Cart, Product, Coupon } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import Joi from 'joi';

const orderController = {
    async placeOrder(req, res, next) {
        // 1. Strict Validation: Address, Payment Method + Optional Coupon Code
        const checkoutSchema = Joi.object({
            shippingAddress: Joi.object({
                fullName: Joi.string().trim().required(),
                phone: Joi.string().regex(/^[0-9]{10}$/).required().messages({'string.pattern.base': 'Invalid phone number'}),
                pincode: Joi.string().regex(/^[0-9]{6}$/).required(),
                streetAddress: Joi.string().required(),
                city: Joi.string().required(),
                state: Joi.string().required()
            }).required(),
            paymentMethod: Joi.string().valid('COD', 'ONLINE').required(),
            couponCode: Joi.string().trim().uppercase().allow(null, '').optional(), // NAYA: Coupon Code allowed
            utrNumber: Joi.string().trim().allow(null, '').optional()
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
                
                if (!product || !product.isActive || !product.inStock) {
                    return next(CustomErrorHandler.badRequest(`Sorry, ${product ? product.name : 'an item'} is out of stock or unavailable.`));
                }

                let itemBasePrice = product.discountPrice > 0 ? product.discountPrice : product.basePrice;
                let extraSizePrice = 0;
                let extraAddonsPrice = 0;

                if (item.selectedSize && item.selectedSize !== 'Standard' && product.sizes) {
                    const sizeObj = product.sizes.find(s => s.sizeLabel === item.selectedSize);
                    if (sizeObj) extraSizePrice = sizeObj.priceModifier;
                }

                if (item.selectedAddons && item.selectedAddons.length > 0 && product.addons) {
                    for (let addonName of item.selectedAddons) {
                        const addonObj = product.addons.find(a => a.addonName === addonName);
                        if (addonObj) extraAddonsPrice += addonObj.extraPrice;
                    }
                }

                const itemFinalPrice = (itemBasePrice + extraSizePrice + extraAddonsPrice) * item.quantity;
                itemsTotal += itemFinalPrice;

                orderItems.push({
                    productId: product._id,
                    name: product.name,
                    image: product.images[0],
                    priceAtPurchase: itemBasePrice,
                    quantity: item.quantity,
                    selectedSize: item.selectedSize,
                    selectedColor: item.selectedColor,
                    selectedAddons: item.selectedAddons,
                    itemFinalPrice: itemFinalPrice
                });
            }

            // 🚀 4. ZERO-TRUST COUPON VERIFICATION & 1-USER-1-TIME CHECK
            let discountAmount = 0;
            let validCoupon = null;

            if (value.couponCode) {
                const coupon = await Coupon.findOne({ code: value.couponCode });

                if (!coupon || !coupon.isActive || new Date(coupon.expiryDate) < new Date()) {
                    return next(CustomErrorHandler.badRequest('Applied coupon is invalid or expired.'));
                }

                // Check: Kya is user ne pehle ye coupon use kiya hai?
                const alreadyUsed = coupon.usedBy?.some(
                    (userId) => userId.toString() === req.user._id.toString()
                );
                if (alreadyUsed) {
                    return next(CustomErrorHandler.badRequest('You have already used this coupon code once!'));
                }

                if (itemsTotal < coupon.minCartValue) {
                    return next(CustomErrorHandler.badRequest(`Minimum cart value of ₹${coupon.minCartValue} required for this coupon.`));
                }

                if (coupon.discountType === 'FLAT') {
                    discountAmount = Math.min(coupon.discountValue, itemsTotal);
                } else if (coupon.discountType === 'PERCENTAGE') {
                    discountAmount = Math.round((itemsTotal * coupon.discountValue) / 100);
                }

                validCoupon = coupon;
            }

            // 🚀 5. Final Billing Math (Synced with Cart.jsx & Checkout.jsx)
            const finalSubtotal = Math.max(0, itemsTotal - discountAmount);
            const shippingCharge = finalSubtotal > 5000 ? 0 : 250; // Free shipping over ₹5000
            const taxAmount = 0;
            const finalTotal = finalSubtotal + shippingCharge + taxAmount;

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
                orderStatus: 'PLACED',
                utrNumber: value.utrNumber
            });

            const savedOrder = await newOrder.save();

            // 🚀 7. LOCK COUPON FOR THIS USER (Ab ye user dobara ye coupon nahi laga payega)
            if (validCoupon) {
                await Coupon.updateOne(
                    { _id: validCoupon._id },
                    { $addToSet: { usedBy: req.user._id } }
                );
            }

            // 8. EMPTY THE CART
            await Cart.findOneAndDelete({ user: req.user._id });

            return res.status(201).json({
                success: true,
                message: 'Order placed successfully! We will start crafting your Resin Art soon.',
                data: savedOrder
            });

        } catch (err) {
            return next(err);
        }
    },

    // 2. GET MY ORDERS (Customer ke liye)
    async myOrders(req, res, next) {
        try {
            const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
            
            return res.status(200).json({
                success: true,
                message: 'Your order history fetched',
                data: orders
            });
        } catch (err) {
            return next(err);
        }
    },

    // 3. GET ALL ORDERS (Admin Control Room)
    async allOrders(req, res, next) {
        try {
            let { page = 1, limit = 10 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const [orders, totalOrders] = await Promise.all([
                Order.find()
                    .populate('user', 'name email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit)),
                Order.countDocuments()
            ]);

            return res.status(200).json({
                success: true,
                message: 'All orders fetched for admin',
                data: orders,
                meta: {
                    totalOrders,
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalOrders / Number(limit)),
                    limit: Number(limit)
                }
            });
        } catch (err) {
            return next(err);
        }
    },

    // // 4. UPDATE ORDER STATUS (Admin Action)
    // async updateStatus(req, res, next) {
    //     try {
    //         const { id } = req.params;

    //         const statusSchema = Joi.object({
    //             orderStatus: Joi.string().valid('PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
    //             paymentStatus: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')
    //         });

    //         const { error, value } = statusSchema.validate(req.body);
    //         if (error) return next(error);

    //         const updatedOrder = await Order.findByIdAndUpdate(id, value, { new: true })
    //                                         .populate('user', 'name email');

    //         if (!updatedOrder) {
    //             return next(CustomErrorHandler.notFound('Order not found!'));
    //         }

    //         return res.status(200).json({
    //             success: true,
    //             message: `Order status successfully updated to ${updatedOrder.orderStatus}`,
    //             data: updatedOrder
    //         });
    //     } catch (err) {
    //         return next(err);
    //     }
    // }

    // 4. UPDATE ORDER STATUS (Admin Action)
    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;

            const statusSchema = Joi.object({
                orderStatus: Joi.string().valid('PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
                paymentStatus: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')
            });

            const { error, value } = statusSchema.validate(req.body);
            if (error) return next(error);

            // 🚀 SMART COD LOGIC: Agar order DELIVERED mark ho raha hai, toh payment apne aap COMPLETED ho jayega!
            if (value.orderStatus === 'DELIVERED' && !value.paymentStatus) {
                value.paymentStatus = 'COMPLETED';
            }

            // Agar order CANCELLED ho gaya aur payment PENDING tha, toh FAILED kar do
            if (value.orderStatus === 'CANCELLED' && !value.paymentStatus) {
                value.paymentStatus = 'FAILED';
            }

            const updatedOrder = await Order.findByIdAndUpdate(id, value, { new: true })
                                            .populate('user', 'name email');

            if (!updatedOrder) {
                return next(CustomErrorHandler.notFound('Order not found!'));
            }

            return res.status(200).json({
                success: true,
                message: `Order status updated to ${updatedOrder.orderStatus} (Payment: ${updatedOrder.paymentStatus})`,
                data: updatedOrder
            });
        } catch (err) {
            return next(err);
        }
    }
};

export default orderController;