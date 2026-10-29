import mongoose from 'mongoose';

// 1. Immutable Item Schema (Permanent Record)
// Hum yahan product ki ID ke sath-sath uska naam aur price 'COPY' karke save karenge.
const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // Snapshot of name
    image: { type: String, required: true }, // Snapshot of image
    priceAtPurchase: { type: Number, required: true }, // Us waqt kya price tha (before addons)
    
    // Customizations
    quantity: { type: Number, required: true, min: 1 },
    selectedSize: { type: String, required: true },
    selectedColor: { type: String, required: true },
    selectedAddons: { type: [String], default: [] },
    
    // Total price of THIS specific item (including size + addons)
    itemFinalPrice: { type: Number, required: true } 
});

// 2. Shipping Address Schema (Strict Format)
const shippingSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, match: /^[0-9]{10}$/ }, // Sirf 10 digit number
    pincode: { type: String, required: true, match: /^[0-9]{6}$/ }, // Sirf 6 digit pincode
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true }
}, { _id: false });

// 3. Main Order Schema
const orderSchema = new mongoose.Schema(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        orderItems: [orderItemSchema], // Array of items purchased
        shippingAddress: shippingSchema,
        
        // --- BILLING MATHEMATICS ---
        itemsTotal: { type: Number, required: true, default: 0 },
        shippingCharge: { type: Number, required: true, default: 0 },
        taxAmount: { type: Number, required: true, default: 0 },
        discountAmount: { type: Number, required: true, default: 0 }, // Agar coupon laga toh
        finalTotal: { type: Number, required: true }, // Sab kuch lagne ke baad final amount
        
        // --- PAYMENT & STATUS ---
        paymentMethod: {
            type: String,
            enum: ['COD', 'ONLINE'], // Sirf ye 2 option allow honge
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
            default: 'PENDING'
        },
        // Razorpay / Stripe ki transaction ID yahan save hogi
        transactionId: { type: String },
        utrNumber: { type: String, trim: true },

        orderStatus: {
            type: String,
            enum: ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
            default: 'PLACED' // Resin art hai, isliye PLACED ke baad PROCESSING aayega
        }
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model('Order', orderSchema, 'orders');

export default Order;