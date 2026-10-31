import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Order } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import sendEmail from '../../utils/sendEmail.js';

// Razorpay Initializer
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentController = {
    
    // 1. GENERATE RAZORPAY ORDER
    async createRazorpayOrder(req, res, next) {
        try {
            const { orderId } = req.body;
            
            // Order fetch karo taaki exact amount pata chal sake (Zero Trust)
            const order = await Order.findById(orderId);
            if (!order) return next(CustomErrorHandler.notFound('Order not found!'));

            const options = {
                amount: Math.round(order.finalTotal * 100), // Razorpay paise mein amount leta hai (₹1 = 100 paise)
                currency: "INR",
                receipt: `receipt_${order._id}`
            };

            const razorpayOrder = await razorpayInstance.orders.create(options);

            // Razorpay ka order ID apne database mein save kar lo
            order.utrNumber = razorpayOrder.id; // Temporary UTR mein save kar rahe hain tracking ke liye
            await order.save();

            return res.status(200).json({
                success: true,
                data: razorpayOrder
            });
        } catch (err) {
            return next(err);
        }
    },

    // 2. VERIFY PAYMENT SIGNATURE (Security Check)
    async verifyPayment(req, res, next) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

            // Crypto se signature verify karo ki payment sach mein success hui hai ya kisi ne hack kiya
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest('hex');

            const isAuthentic = expectedSignature === razorpay_signature;

            if (isAuthentic) {
                // Payment 100% Verified -> Order status update karo
                const updatedOrder = await Order.findByIdAndUpdate(
                    orderId,
                    {
                        paymentStatus: 'COMPLETED',
                        orderStatus: 'PROCESSING', // Paid hone ke baad seedha processing mein daalo
                        utrNumber: razorpay_payment_id // Asli transaction ID save karo
                    },
                    { new: true }
                ).populate('user', 'name email');

                // 🚀 LIVE MAGIC: Admin aur Customer dono ko instant update bhejo
                const io = req.app.get('io');
                if (io) {
                    io.emit('order-status-updated', updatedOrder);
                }
                // ✉️ NODEMAILER: Customer ko Order Confirmation Email bhejo
                try {
                    const emailTemplate = `
                        <div style="font-family: Arial, sans-serif; max-w-md; margin: auto; padding: 20px; border: 1px solid #D4AF37; border-radius: 10px;">
                            <h2 style="color: #D4AF37; text-align: center;">LuxeResin Art</h2>
                            <h3>Order Confirmation 🚀</h3>
                            <p>Hi ${updatedOrder.user.full_name || 'Customer'},</p>
                            <p>Thank you for your premium purchase! Your payment of <strong>₹${updatedOrder.finalTotal}</strong> was successful.</p>
                            <p><strong>Order ID:</strong> ${updatedOrder._id}</p>
                            <p><strong>Transaction ID:</strong> ${razorpay_payment_id}</p>
                            <hr style="border: 0; border-top: 1px solid #eee; my: 20px;">
                            <p style="font-size: 12px; color: #777;">We are preparing your masterpiece. You will receive another update once it is shipped.</p>
                        </div>
                    `;

                    await sendEmail({
                        email: updatedOrder.user.email,
                        subject: `LuxeResin Art - Order Confirmed! (ID: ${updatedOrder._id})`,
                        message: emailTemplate
                    });
                } catch (emailError) {
                    console.error("Email sending failed, but order was placed:", emailError);
                    // Yahan hum order fail nahi kar rahe, taaki customer ka process na ruke
                }

                return res.status(200).json({
                    success: true,
                    message: 'Payment Verified Successfully! ⚡',
                    data: updatedOrder
                });
            } else {
                return next(CustomErrorHandler.badRequest('Invalid Payment Signature! Payment Failed.'));
            }
        } catch (err) {
            return next(err);
        }
    }
};

export default paymentController;