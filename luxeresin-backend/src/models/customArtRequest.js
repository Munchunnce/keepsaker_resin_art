import mongoose from 'mongoose';

const customArtRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    theme: { type: String, required: true },
    shape: { type: String, required: true },
    customText: { type: String, default: '' },
    dimensions: { type: String, required: true },
    description: { type: String, required: true },
    referenceImage: { type: String, required: true },
    
    // Admin Fields
    status: {
        type: String,
        // 🚀 FIX: Yahan 'ADVANCE_PAID' aur 'AWAITING_ADVANCE' dono add kar diye hain
        enum: [
            'PENDING', 
            'REVIEWING', 
            'ACCEPTED', 
            'AWAITING_ADVANCE', 
            'ADVANCE_PAID', 
            'IN_MAKING', 
            'SHIPPED', 
            'DELIVERED'
        ],
        default: 'PENDING'
    },
    estimatedPrice: { type: Number, default: 0 },
    adminNotes: { type: String, default: '' },

    // Customer Checkout Details (Address + UPI Payment Proof)
    advancePaid: { type: Number, default: 0 },
    utrNumber: { type: String, default: '' },
    shippingAddress: {
        fullName: { type: String, default: '' },
        phone: { type: String, default: '' },
        address: { type: String, default: '' },
        city: { type: String, default: '' },
        pincode: { type: String, default: '' }
    }
}, { timestamps: true });

export default mongoose.model('CustomArtRequest', customArtRequestSchema);