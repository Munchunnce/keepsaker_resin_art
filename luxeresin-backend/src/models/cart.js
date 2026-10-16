import mongoose from 'mongoose';

// Cart ke andar har ek item ka schema (Item kya-kya information rakhega)
const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    // --- CUSTOMIZATIONS JO USER NE SELECT KIYE ---
    selectedSize: {
        type: String,
        default: 'Standard' // Agar koi size nahi chuna toh default Standard
    },
    selectedColor: {
        type: String,
        default: 'Default'
    },
    selectedAddons: {
        type: [String], // User 1 se zyada addon chun sakta hai (e.g., ["LED", "Gold Flakes"])
        default: []
    }
}, //{ _id: false } // Item ki alag ID nahi banayenge, taaki DB clean rahe
);
// Main Cart Schema (Ek User ka ek hi Cart hoga)
const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true // Ek user ke 2 cart nahi ho sakte
        },
        items: [cartItemSchema], // Upar banaya hua item schema Array mein aayega
        
        // Cart ka total bill DB mein save nahi karte, wo API request ke time calculate karte hain 
        // taaki agar admin product ka price change kare, toh cart ka price apne aap update ho jaye!
    },
    {
        timestamps: true,
    }
);

const Cart = mongoose.model('Cart', cartSchema, 'carts');

export default Cart;