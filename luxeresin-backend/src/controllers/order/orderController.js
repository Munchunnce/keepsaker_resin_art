import { Order, Cart, Product, Coupon } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import sendEmail from '../../utils/sendEmail.js';
import Joi from 'joi';

const orderController = {
    async placeOrder(req, res, next) {
        // 1. Strict Validation
        const checkoutSchema = Joi.object({
            shippingAddress: Joi.object({
                fullName: Joi.string().trim().required(),
                phone: Joi.string().regex(/^[0-9]{10}$/).required().messages({ 'string.pattern.base': 'Invalid phone number' }),
                pincode: Joi.string().regex(/^[0-9]{6}$/).required(),
                streetAddress: Joi.string().trim().required(),
                city: Joi.string().trim().required(),
                state: Joi.string().trim().required()
            }).required(),
            paymentMethod: Joi.string().valid('COD', 'ONLINE').required(),
            couponCode: Joi.string().trim().uppercase().allow(null, '').optional(),
            utrNumber: Joi.string().trim().allow(null, '').optional()
        });

        const { error, value } = checkoutSchema.validate(req.body);
        if (error) return next(error);

        try {
            // SECURITY: Duplicate UTR Check
            if (value.paymentMethod === 'ONLINE' && value.utrNumber) {
                const existingOrderWithUtr = await Order.findOne({ utrNumber: value.utrNumber });
                if (existingOrderWithUtr) {
                    return next(CustomErrorHandler.badRequest('This UTR/Transaction ID has already been used for another order! Please enter a valid one.'));
                }
            }

            // 2. Fetch User's Cart
            const cart = await Cart.findOne({ user: req.user._id });
            if (!cart || cart.items.length === 0) {
                return next(CustomErrorHandler.badRequest('Your cart is empty!'));
            }

            let itemsTotal = 0;
            const orderItems = [];

            // 3. ZERO-TRUST MATH ENGINE & INVENTORY GUARD
            for (let item of cart.items) {
                const product = await Product.findById(item.product);

                if (!product || !product.isActive || !product.inStock) {
                    return next(CustomErrorHandler.badRequest(`Sorry, ${product ? product.name : 'an item'} is out of stock or unavailable.`));
                }

                const basePrice = Number(product.basePrice) || 0;
                const discountPrice = Number(product.discountPrice) || 0;
                const itemBasePrice = (discountPrice > 0 && discountPrice < basePrice) ? discountPrice : basePrice;

                let extraSizePrice = 0;
                let extraAddonsPrice = 0;

                if (item.selectedSize && Array.isArray(product.sizes)) {
                    const sizeObj = product.sizes.find(s => s.sizeLabel === item.selectedSize);
                    if (sizeObj) extraSizePrice = Number(sizeObj.priceModifier) || 0;
                }

                if (Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0 && Array.isArray(product.addons)) {
                    for (let addonEntry of item.selectedAddons) {
                        const addonName = typeof addonEntry === 'string' ? addonEntry : addonEntry?.addonName;
                        const addonObj = product.addons.find(a => a.addonName === addonName);
                        if (addonObj) extraAddonsPrice += Number(addonObj.extraPrice) || 0;
                    }
                }

                const unitPrice = itemBasePrice + extraSizePrice + extraAddonsPrice;
                const qty = Math.max(1, Number(item.quantity) || 1);
                const itemFinalPrice = unitPrice * qty;
                itemsTotal += itemFinalPrice;

                orderItems.push({
                    productId: product._id,
                    name: product.name,
                    image: product.images?.[0] || '',
                    priceAtPurchase: unitPrice,
                    quantity: qty,
                    selectedSize: item.selectedSize,
                    selectedColor: item.selectedColor,
                    selectedAddons: item.selectedAddons,
                    itemFinalPrice: itemFinalPrice
                });
            }

            // 4. ZERO-TRUST COUPON VERIFICATION & 1-USER-1-TIME CHECK
            let discountAmount = 0;
            let validCoupon = null;

            if (value.couponCode) {
                const coupon = await Coupon.findOne({ code: value.couponCode });

                if (!coupon || !coupon.isActive || new Date(coupon.expiryDate) < new Date()) {
                    return next(CustomErrorHandler.badRequest('Applied coupon is invalid or expired.'));
                }

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
                    discountAmount = Math.min(Math.round((itemsTotal * coupon.discountValue) / 100), itemsTotal);
                }

                validCoupon = coupon;
            }

            // 5. Final Billing Math (100% Synced with Cart.jsx & Checkout.jsx)
            const finalSubtotal = Math.max(0, itemsTotal - discountAmount);
            const shippingCharge = (finalSubtotal >= 5000 || finalSubtotal === 0) ? 0 : 250;
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
                couponCode: validCoupon ? validCoupon.code : null,
                paymentMethod: value.paymentMethod,
                orderStatus: 'PLACED',
                utrNumber: value.utrNumber || null
            });

            const savedOrder = await newOrder.save();

            // 7. COD vs ONLINE LIFECYCLE FIX:
            // COD order turant confirm hota hai -> coupon lock + cart clear + admin socket + email
            // ONLINE order ke liye ye sab payment verify hone ke baad hoga (taaki cancel karne par cart/coupon safe rahe)
            if (value.paymentMethod === 'COD') {
                if (validCoupon) {
                    await Coupon.updateOne(
                        { _id: validCoupon._id },
                        { $addToSet: { usedBy: req.user._id } }
                    );
                }

                await Cart.findOneAndDelete({ user: req.user._id });

                const io = req.app.get('io');
                if (io) {
                    io.emit('new-order-placed', savedOrder);
                }

                // Admin COD Order Notification (Non-blocking)
                // const adminEmail = process.env.ADMIN_EMAIL;
                const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_MAIL;
                if (adminEmail) {
                    try {
                        await sendEmail({
                            email: adminEmail,
                            subject: `NEW COD ORDER - ₹${savedOrder.finalTotal} from ${savedOrder.shippingAddress.city}`,
                            message: `
                                <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px dashed #D4AF37;">
                                    <h2 style="color: #333;">New COD Order Received! 🚨</h2>
                                    <p><strong>Order ID:</strong> ${savedOrder._id}</p>
                                    <p><strong>Order Value:</strong> ₹${savedOrder.finalTotal}</p>
                                    <p><strong>Customer:</strong> ${savedOrder.shippingAddress.fullName} (${savedOrder.shippingAddress.phone})</p>
                                    <p><strong>Location:</strong> ${savedOrder.shippingAddress.city}, ${savedOrder.shippingAddress.state}</p>
                                </div>
                            `
                        });
                    } catch (emailErr) {
                        console.error('Admin COD email failed:', emailErr);
                    }
                }
            }

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
                    .populate('user', 'full_name name email')
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

            const existingOrder = await Order.findById(id);
            if (!existingOrder) {
                return next(CustomErrorHandler.notFound('Order not found!'));
            }

            // SMART COD LOGIC: DELIVERED hone par PENDING payment COMPLETED mark karo
            if (value.orderStatus === 'DELIVERED' && !value.paymentStatus) {
                value.paymentStatus = 'COMPLETED';
            }

            // SAFE CANCEL LOGIC: Sirf tab FAILED mark karo jab payment PENDING tha (COMPLETED paid orders ko corrupt mat karo)
            if (value.orderStatus === 'CANCELLED' && !value.paymentStatus && existingOrder.paymentStatus === 'PENDING') {
                value.paymentStatus = 'FAILED';
            }

            const updatedOrder = await Order.findByIdAndUpdate(id, value, { new: true })
                .populate('user', 'full_name name email');

            // REAL-TIME MAGIC: Notify Customer's 'My Orders' Page immediately!
            const io = req.app.get('io');
            if (io) {
                io.emit('order-status-updated', updatedOrder);
            }

            return res.status(200).json({
                success: true,
                message: `Order status updated to ${updatedOrder.orderStatus} (Payment: ${updatedOrder.paymentStatus})`,
                data: updatedOrder
            });
        } catch (err) {
            return next(err);
        }
    },

    // 5. CANCEL ORDER (Customer Action — Sirf PLACED ya PROCESSING mein allowed)
    async cancelOrder(req, res, next) {
        try {
            const { id } = req.params;

            const order = await Order.findById(id);
            if (!order) {
                return next(CustomErrorHandler.notFound('Order not found!'));
            }

            // SECURITY: Customer sirf apna hi order cancel kar sakta hai
            if (order.user.toString() !== req.user._id.toString()) {
                return next(CustomErrorHandler.unAuthorized('You are not authorized to cancel this order.'));
            }

            if (order.orderStatus === 'CANCELLED') {
                return next(CustomErrorHandler.badRequest('This order is already cancelled.'));
            }

            if (!['PLACED', 'PROCESSING'].includes(order.orderStatus)) {
                return next(
                    CustomErrorHandler.badRequest(
                        `Order cannot be cancelled after it is ${order.orderStatus.toLowerCase()}.`
                    )
                );
            }

            order.orderStatus = 'CANCELLED';

            // Unpaid/COD -> FAILED | Prepaid (COMPLETED) -> COMPLETED hi rahega taaki Admin refund track kar sake
            if (order.paymentStatus === 'PENDING') {
                order.paymentStatus = 'FAILED';
            }

            await order.save();

            const updatedOrder = await Order.findById(order._id).populate('user', 'full_name name email');

            // LIVE SOCKET: AdminOrders aur Customer dono par turant CANCELLED sync hoga
            const io = req.app.get('io');
            if (io) {
                io.emit('order-status-updated', updatedOrder);
                io.emit('order-cancelled-by-customer', updatedOrder);
            }

            // Admin Email Alert (Non-blocking)
            const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_MAIL;
            if (adminEmail) {
                try {
                    await sendEmail({
                        email: adminEmail,
                        subject: `ORDER CANCELLED - #${updatedOrder._id.toString().slice(-6).toUpperCase()}`,
                        message: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px dashed #ef4444;">
                                <h2 style="color: #ef4444;">Order Cancelled by Customer ⚠️</h2>
                                <p><strong>Order ID:</strong> ${updatedOrder._id}</p>
                                <p><strong>Customer:</strong> ${updatedOrder.shippingAddress?.fullName} (${updatedOrder.shippingAddress?.phone})</p>
                                <p><strong>Order Value:</strong> ₹${updatedOrder.finalTotal}</p>
                                <p><strong>Payment:</strong> ${updatedOrder.paymentMethod} (${updatedOrder.paymentStatus})</p>
                                ${
                                    updatedOrder.paymentStatus === 'COMPLETED'
                                        ? '<p style="color: #d97706;"><strong>Action Needed:</strong> This was a prepaid Razorpay order. Please process refund.</p>'
                                        : ''
                                }
                            </div>
                        `
                    });
                } catch (emailErr) {
                    console.error('Admin cancel email failed:', emailErr);
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Order cancelled successfully.',
                data: updatedOrder
            });
        } catch (err) {
            return next(err);
        }
    }
};

export default orderController;