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
    },
    // --- GET ALL PRODUCTS (The World-Class Masterpiece) ---
    async index(req, res, next) {
        try {
            // 1. URL se queries nikalna (with default values for pagination)
            let { page = 1, limit = 12, search, category, sort, minPrice, maxPrice } = req.query;

            // 2. Dynamic Query Engine
            let filter = { isActive: true }; // SECURITY: Sirf Active products dikhao public ko!

            // Text Search (Name mein search karna, case-insensitive)
            if (search) {
                filter.name = { $regex: search, $options: 'i' }; 
            }

            // Category Filter
            if (category) {
                filter.category = category;
            }

            // Price Range Filter (e.g. ₹500 se ₹2000 tak)
            if (minPrice || maxPrice) {
                filter.basePrice = {};
                if (minPrice) filter.basePrice.$gte = Number(minPrice); // Greater than or equal
                if (maxPrice) filter.basePrice.$lte = Number(maxPrice); // Less than or equal
            }

            // 3. Dynamic Sorting Engine
            let sortOption = { createdAt: -1 }; // Default: Naye products pehle dikhao
            if (sort === 'price_low') sortOption = { basePrice: 1 };
            if (sort === 'price_high') sortOption = { basePrice: -1 };
            if (sort === 'top_rated') sortOption = { averageRating: -1 };

            // 4. Pagination Math
            const skip = (Number(page) - 1) * Number(limit);

            // 5. The Magic Execution (Parallel Processing for Ultra-Fast Response)
            const [products, totalProducts] = await Promise.all([
                Product.find(filter)
                    .populate('category', 'name slug') // FAANG Trick: Category ka naam automatically le aao!
                    .select('-__v') // Database ka kachra hide karo
                    .sort(sortOption)
                    .skip(skip)
                    .limit(Number(limit)),
                Product.countDocuments(filter) // Total products kitne hain (Pagination ke liye zaroori)
            ]);

            // 6. Pro-Level Response format for Frontend
            return res.status(200).json({
                success: true,
                message: 'Products fetched successfully',
                data: products,
                meta: { // Metadata for Pagination UI
                    totalProducts,
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalProducts / Number(limit)),
                    limit: Number(limit)
                }
            });

        } catch (err) {
            return next(err);
        }
    }
};

export default productController;