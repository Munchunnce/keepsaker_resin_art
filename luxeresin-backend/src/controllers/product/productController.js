import { Product, Category } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import Joi from 'joi';
import crypto from 'crypto'; // Node.js ka inbuilt security module

const productController = {
    async store(req, res, next) {
        // 1. FAANG-Level Strict Data Validation (No garbage data allowed)
        const productSchema = Joi.object({
            name: Joi.string().trim().required().max(100),
            description: Joi.string().required(),
            // Regex to strictly allow ONLY valid 24-character MongoDB ObjectIDs
            category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
                'string.pattern.base': 'Invalid Category ID format. System protected from crash.',
            }),
            basePrice: Joi.number().min(1).required(),
            discountPrice: Joi.number().min(0).optional(),
            discountPercentage: Joi.number().min(0).max(100).optional(),
            // Check that images array contains valid URLs
            images: Joi.array().items(Joi.string().uri()).min(1).required(), 
            colors: Joi.array().items(Joi.string().trim()).optional(),
            sizes: Joi.array().items(
                Joi.object({
                    sizeLabel: Joi.string().required(),
                    priceModifier: Joi.number().min(0).default(0)
                })
            ).optional(),
            addons: Joi.array().items(
                Joi.object({
                    addonName: Joi.string().required(),
                    extraPrice: Joi.number().min(0).default(0)
                })
            ).optional(),
            leadTimeDays: Joi.number().min(1).max(30).default(5), // Minimum 1 day, max 30 days
            inStock: Joi.boolean().default(true)
        });

        const { error, value } = productSchema.validate(req.body);
        if (error) return next(error);

        try {
            // 2. ORPHAN PREVENTION: Check if the category actually exists in the database
            const categoryExists = await Category.findById(value.category);
            if (!categoryExists) {
                return next(CustomErrorHandler.notFound('Category not found! Cannot add product to a non-existent category.'));
            }

            // 3. BULLETPROOF SLUG GENERATION: Never crash on duplicate names
            // Base slug: 'radhe-krishna-frame'
            let baseSlug = value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            // Append a 4-character random hex string (e.g., 'a8b2') for absolute uniqueness
            const randomStr = crypto.randomBytes(2).toString('hex'); 
            const generatedSlug = `${baseSlug}-${randomStr}`;

            // 4. Data Insertion
            const product = new Product({
                name: value.name,
                slug: generatedSlug,
                description: value.description,
                category: value.category, 
                basePrice: value.basePrice,
                discountPrice: value.discountPrice || 0,
                discountPercentage: value.discountPercentage || 0,
                images: value.images,
                colors: value.colors || [],
                sizes: value.sizes || [],
                addons: value.addons || [],
                leadTimeDays: value.leadTimeDays,
                inStock: value.inStock
            });

            const savedProduct = await product.save();

            // 5. Professional Response
            return res.status(201).json({
                success: true,
                message: 'Product launched successfully!',
                data: savedProduct
            });

        } catch (err) {
            // 6. Failsafe Error Catching (DB timeout, etc.)
            return next(err);
        }
    }
};

export default productController;