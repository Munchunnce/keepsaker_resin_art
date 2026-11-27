import mongoose from 'mongoose';

// 1. Immutable Item Schema (Permanent Snapshot Record)
const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    priceAtPurchase: { type: Number, required: true, min: 0 },

    // Customizations
    quantity: { type: Number, required: true, min: 1 },
    selectedSize: { type: String, default: 'Standard' },
    selectedColor: { type: String, default: 'Default' },
    selectedAddons: { type: [String], default: [] },

    // Total price of THIS specific item (including size + addons * qty)
    itemFinalPrice: { type: Number, required: true, min: 0 }
});

// 2. Shipping Address Schema (Strict Format)
const shippingSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, match: /^[0-9]{10}$/ },
    pincode: { type: String, required: true, match: /^[0-9]{6}$/ },
    streetAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true }
}, { _id: false });

// 3. Main Order Schema
const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        orderItems: {
            type: [orderItemSchema],
            required: true
        },
        shippingAddress: {
            type: shippingSchema,
            required: true
        },

        // --- BILLING MATHEMATICS ---
        itemsTotal: { type: Number, required: true, default: 0, min: 0 },
        shippingCharge: { type: Number, required: true, default: 0, min: 0 },
        taxAmount: { type: Number, required: true, default: 0, min: 0 },
        discountAmount: { type: Number, required: true, default: 0, min: 0 },
        couponCode: { type: String, trim: true, uppercase: true, default: null },
        finalTotal: { type: Number, required: true, min: 0 },

        // --- PAYMENT & STATUS ---
        paymentMethod: {
            type: String,
            enum: ['COD', 'ONLINE'],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
            default: 'PENDING'
        },
        transactionId: { type: String, trim: true, default: null },
        utrNumber: { type: String, trim: true, default: null },

        orderStatus: {
            type: String,
            enum: ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
            default: 'PLACED'
        }
    },
    {
        timestamps: true,
    }
);

// Production Indexes (Fast MyOrders, Admin Pagination & UTR Lookup)
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ utrNumber: 1 });

const Order = mongoose.model('Order', orderSchema, 'orders');

export default Order;