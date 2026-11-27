import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Order, Cart, Coupon } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import sendEmail from '../../utils/sendEmail.js';

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentController = {

    // 1. GENERATE RAZORPAY ORDER
    async createRazorpayOrder(req, res, next) {
        try {
            const { orderId } = req.body;
            if (!orderId) {
                return next(CustomErrorHandler.badRequest('Order ID is required.'));
            }

            const order = await Order.findById(orderId);
            if (!order) return next(CustomErrorHandler.notFound('Order not found!'));

            // SECURITY: IDOR Check (User sirf apne order ka payment initiate kar sakta hai)
            if (req.user && order.user.toString() !== req.user._id.toString()) {
                return next(CustomErrorHandler.unAuthorized('Not authorized to pay for this order.'));
            }

            // SECURITY: Already Paid Guard
            if (order.paymentStatus === 'COMPLETED') {
                return next(CustomErrorHandler.badRequest('Payment is already completed for this order.'));
            }

            const amountInPaise = Math.round(Number(order.finalTotal) * 100);
            if (!amountInPaise || amountInPaise < 100) {
                return next(CustomErrorHandler.badRequest('Invalid order amount for online payment.'));
            }

            const options = {
                amount: amountInPaise,
                currency: 'INR',
                receipt: `receipt_${order._id}`
            };

            const razorpayOrder = await razorpayInstance.orders.create(options);

            // Razorpay order ID save karo taaki verifyPayment mein exact binding check ho sake
            order.utrNumber = razorpayOrder.id;
            await order.save();

            return res.status(200).json({
                success: true,
                data: razorpayOrder
            });
        } catch (err) {
            return next(err);
        }
    },

    // 2. VERIFY PAYMENT SIGNATURE (Hardened Zero-Trust Check)
    async verifyPayment(req, res, next) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
                return next(CustomErrorHandler.badRequest('Missing Razorpay verification parameters.'));
            }

            const order = await Order.findById(orderId);
            if (!order) {
                return next(CustomErrorHandler.notFound('Order not found!'));
            }

            // SECURITY 1: Ownership Check
            if (req.user && order.user.toString() !== req.user._id.toString()) {
                return next(CustomErrorHandler.unAuthorized('Not authorized to verify this order.'));
            }

            // SECURITY 2: Idempotency Guard (Duplicate verify call par dubara email/socket na bhejo)
            if (order.paymentStatus === 'COMPLETED') {
                return res.status(200).json({
                    success: true,
                    message: 'Payment already verified.',
                    data: order
                });
            }

            // SECURITY 3 (CRITICAL): Order-ID Binding Check (₹100 payment se ₹50,000 order bypass rokta hai)
            if (order.utrNumber !== razorpay_order_id) {
                return next(CustomErrorHandler.badRequest('Razorpay Order ID mismatch! Verification rejected.'));
            }

            // SECURITY 4: Timing-Safe HMAC Signature Check
            const body = `${razorpay_order_id}|${razorpay_payment_id}`;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body)
                .digest('hex');

            const expectedBuf = Buffer.from(expectedSignature, 'utf8');
            const receivedBuf = Buffer.from(String(razorpay_signature), 'utf8');
            const isAuthentic =
                expectedBuf.length === receivedBuf.length &&
                crypto.timingSafeEqual(expectedBuf, receivedBuf);

            if (!isAuthentic) {
                return next(CustomErrorHandler.badRequest('Invalid Payment Signature! Payment Failed.'));
            }

            // Payment 100% Verified -> Update Order
            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                {
                    paymentStatus: 'COMPLETED',
                    orderStatus: 'PROCESSING',
                    utrNumber: razorpay_payment_id
                },
                { new: true }
            ).populate('user', 'full_name name email');

            // Coupon lock (agar online order par coupon laga tha) + Cart clear
            if (updatedOrder.couponCode) {
                await Coupon.updateOne(
                    { code: updatedOrder.couponCode },
                    { $addToSet: { usedBy: order.user } }
                );
            }
            await Cart.findOneAndDelete({ user: order.user });

            // LIVE MAGIC: Admin aur Customer dono ko instant update bhejo
            const io = req.app.get('io');
            if (io) {
                io.emit('new-order-placed', updatedOrder);
                io.emit('order-status-updated', updatedOrder);
            }

            // NODEMAILER 1: Customer ko Order Confirmation Email
            if (updatedOrder.user?.email) {
                try {
                    const customerName = updatedOrder.user.full_name || updatedOrder.user.name || 'Customer';
                    const emailTemplate = `
                        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 20px; border: 1px solid #D4AF37; border-radius: 10px;">
                            <h2 style="color: #D4AF37; text-align: center;">LuxeResin Art</h2>
                            <h3>Order Confirmation 🚀</h3>
                            <p>Hi ${customerName},</p>
                            <p>Thank you for your premium purchase! Your payment of <strong>₹${updatedOrder.finalTotal}</strong> was successful.</p>
                            <p><strong>Order ID:</strong> ${updatedOrder._id}</p>
                            <p><strong>Transaction ID:</strong> ${razorpay_payment_id}</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #777;">We are preparing your masterpiece. You will receive another update once it is shipped.</p>
                        </div>
                    `;

                    await sendEmail({
                        email: updatedOrder.user.email,
                        subject: `LuxeResin Art - Order Confirmed! (ID: ${updatedOrder._id})`,
                        message: emailTemplate
                    });
                } catch (emailError) {
                    console.error('Customer email sending failed:', emailError);
                }
            }

            // NODEMAILER 2: Admin Notification Email (.env se)
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                try {
                    const adminEmailTemplate = `
                        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px dashed #333;">
                            <h2 style="color: #333;">New Online Order Paid! 🚨</h2>
                            <p><strong>Order ID:</strong> ${updatedOrder._id}</p>
                            <p><strong>Order Value:</strong> ₹${updatedOrder.finalTotal}</p>
                            <p><strong>Transaction ID:</strong> ${razorpay_payment_id}</p>
                            <p><strong>Customer Name:</strong> ${updatedOrder.shippingAddress.fullName}</p>
                            <p><strong>Customer Phone:</strong> ${updatedOrder.shippingAddress.phone}</p>
                            <p><strong>Shipping City:</strong> ${updatedOrder.shippingAddress.city}, ${updatedOrder.shippingAddress.state}</p>
                            <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;">
                            <p>Check the admin dashboard for full details and to process the shipment.</p>
                        </div>
                    `;

                    await sendEmail({
                        email: adminEmail,
                        subject: `NEW PAID ORDER - ₹${updatedOrder.finalTotal} from ${updatedOrder.shippingAddress.city}`,
                        message: adminEmailTemplate
                    });
                } catch (adminEmailError) {
                    console.error('Admin notification email failed:', adminEmailError);
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Payment Verified Successfully! ⚡',
                data: updatedOrder
            });
        } catch (err) {
            return next(err);
        }
    }
};

export default paymentController;