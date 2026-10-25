import mongoose from 'mongoose';

const customArtRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    theme: { type: String, required: true }, // e.g., 'Wedding Varmala', 'Geode Clock'
    shape: { type: String, required: true },
    customText: { type: String, default: '' },
    dimensions: { type: String, required: true }, // e.g., '24x24 Inches'
    description: { type: String, required: true }, // Customer's special demands
    referenceImage: { type: String, required: true }, // Cloudinary URL of customer's photo
    status: { 
        type: String, 
        enum: ['PENDING', 'REVIEWING', 'ACCEPTED', 'IN_MAKING', 'SHIPPED', 'DELIVERED'], 
        default: 'PENDING' 
    },
    estimatedPrice: { type: Number, default: 0 }, // Admin final price tay karega
    adminNotes: { type: String, default: '' } // Admin internal notes (e.g., Courier Tracking ID)
}, { timestamps: true });

export default mongoose.model('CustomArtRequest', customArtRequestSchema);