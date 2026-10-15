import mongoose from 'mongoose';

// 1. Chhota Schema: Size aur uske hisaab se price badhana (e.g. 14-inch par +₹500)
const sizeSchema = new mongoose.Schema({
    sizeLabel: { type: String, required: true }, 
    priceModifier: { type: Number, required: true, default: 0 } 
}, { _id: false }); // _id false kiya taaki har size ki alag ID na bane

// 2. Chhota Schema: Add-ons aur unka extra charge (e.g. LED Light +₹300)
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
        // IMPORTANT: Yeh line is Product ko aapki banayi hui Category se jode gi
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category', 
            required: true,
        },
        basePrice: {
            type: Number,
            required: [true, 'Base price is required'],
        },
        images: {
            type: [String], // Array of Strings: Ek product ki multiple photos ho sakti hain
            required: true,
        },
        
        // --- CUSTOMIZATION MATRIX ---
        colors: { type: [String], default: [] }, // Available colors
        sizes: [sizeSchema], // Size options based on the sub-schema above
        addons: [addonSchema], // Extra add-ons based on the sub-schema above

        // --- INVENTORY & TIMING ---
        leadTimeDays: { 
            type: Number, 
            default: 5, // Resin art banane aur sookhne mein time lagta hai (e.g., 5 days dispatch time)
        },
        inStock: {
            type: Boolean,
            default: true,
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