import mongoose from 'mongoose';

// 1. Chhota Schema: Size aur uske hisaab se price badhana
const sizeSchema = new mongoose.Schema({
    sizeLabel: { type: String, required: true }, 
    priceModifier: { type: Number, required: true, default: 0 } 
}, { _id: false });

// 2. Chhota Schema: Add-ons aur unka extra charge
const addonSchema = new mongoose.Schema({
    addonName: { type: String, required: true }, 
    extraPrice: { type: Number, required: true, default: 0 } 
}, { _id: false });

// 3. Main Product Schema
const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
        },
        slug: {
            type: String,
            required: [true, 'Product slug is required'],
            unique: true,
            lowercase: true,
        },
        description: {
            type: String,
            required: [true, 'Product description is required'],
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category', 
            required: true,
        },
        
        // --- PRICING & OFFERS ---
        basePrice: {
            type: Number,
            required: [true, 'Base price is required'],
        },
        discountPrice: {
            type: Number,
            default: 0, // Agar 0 hai, matlab koi offer nahi hai
        },
        discountPercentage: {
            type: Number,
            default: 0, // e.g., 20 means 20% off
        },

        images: {
            type: [String],
            required: true,
        },
        
        // --- CUSTOMIZATION MATRIX ---
        colors: { type: [String], default: [] },
        sizes: [sizeSchema], 
        addons: [addonSchema], 

        // --- INVENTORY & TIMING ---
        leadTimeDays: { 
            type: Number, 
            default: 5, 
        },
        inStock: {
            type: Boolean,
            default: true,
        },

        // --- RATINGS & REVIEWS SUMMARY ---
        averageRating: {
            type: Number,
            default: 0, // Shuru mein rating 0 hogi
            min: 0,
            max: 5
        },
        totalReviews: {
            type: Number,
            default: 0, // Shuru mein 0 reviews honge
        },

        isActive: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model('Product', productSchema, 'products');

export default Product;