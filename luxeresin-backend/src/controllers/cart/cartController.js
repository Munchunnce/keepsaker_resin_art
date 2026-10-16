import { Cart, Product } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import Joi from 'joi';

const cartController = {
    async addItem(req, res, next) {
        // 1. Strict Request Validation
        const cartSchema = Joi.object({
            productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
            quantity: Joi.number().min(1).default(1),
            selectedSize: Joi.string().default('Standard'),
            selectedColor: Joi.string().default('Default'),
            selectedAddons: Joi.array().items(Joi.string()).default([])
        });

        const { error, value } = cartSchema.validate(req.body);
        if (error) return next(error);

        try {
            // 2. THE INVENTORY GUARD (Crash Protection)
            // Pehle check karo ki kya product actually exist karta hai aur Stock mein hai!
            const product = await Product.findById(value.productId);
            if (!product) {
                return next(CustomErrorHandler.notFound('Product not found!'));
            }
            if (!product.isActive || !product.inStock) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Sorry, this product is currently out of stock or unavailable.' 
                });
            }

            // 3. Array Normalization (FAANG Secret)
            // Agar user ne ["LED", "Gold"] bheja, aur DB mein ["Gold", "LED"] hai, toh wo miss-match ho jata hai.
            // Isliye hum dono arrays ko Alphabetically Sort kar denge taaki hamesha perfect match ho.
            const sortedAddons = value.selectedAddons.sort();

            // 4. FIND OR CREATE CART (Using req.user._id from auth middleware)
            let cart = await Cart.findOne({ user: req.user._id });

            if (!cart) {
                // Agar zindagi mein pehli baar user kuch add kar raha hai, toh naya cart banao
                cart = new Cart({
                    user: req.user._id,
                    items: [{
                        product: value.productId,
                        quantity: value.quantity,
                        selectedSize: value.selectedSize,
                        selectedColor: value.selectedColor,
                        selectedAddons: sortedAddons
                    }]
                });
            } else {
                // 5. THE 0.001% DEEP MATCHING ALGORITHM
                // Check karo ki exact yahi configuration cart mein pehle se hai ya nahi
                const existingItemIndex = cart.items.findIndex(item => 
                    item.product.toString() === value.productId &&
                    item.selectedSize === value.selectedSize &&
                    item.selectedColor === value.selectedColor &&
                    JSON.stringify(item.selectedAddons.sort()) === JSON.stringify(sortedAddons)
                );

                if (existingItemIndex > -1) {
                    // Same configuration pehle se hai! Bas quantity badha do.
                    cart.items[existingItemIndex].quantity += value.quantity;
                } else {
                    // Product same ho sakta hai, par size/color alag hai. Naya row add karo!
                    cart.items.push({
                        product: value.productId,
                        quantity: value.quantity,
                        selectedSize: value.selectedSize,
                        selectedColor: value.selectedColor,
                        selectedAddons: sortedAddons
                    });
                }
            }

            const savedCart = await cart.save();

            // 6. FRONTEND-FRIENDLY POPULATION
            // Hum sirf ID save karte hain, lekin response mein hum product ki Photo aur Naam bhejenge 
            // taaki frontend directly cart UI bana sake!
            const populatedCart = await Cart.findById(savedCart._id).populate({
                path: 'items.product',
                select: 'name images basePrice discountPrice slug'
            });

            return res.status(200).json({
                success: true,
                message: 'Item added to cart magically!',
                data: populatedCart
            });

        } catch (err) {
            return next(err);
        }
    }
};

export default cartController;