import { Product, Category } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import Joi from 'joi';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { 
    CLOUDINARY_CLOUD_NAME, 
    CLOUDINARY_API_KEY, 
    CLOUDINARY_API_SECRET 
} from '../../config/index.js'; 

// CLOUDINARY CONFIG (Ab direct config file se data aayega)
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

const productController = {
    async store(req, res, next) {
        try {
            // 1. FILE CHECK
            if (!req.file) {
                return next(CustomErrorHandler.badRequest('Artifact image is strictly required for the vault!'));
            }

            // 2. CLOUDINARY UPLOAD
            const cloudResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'luxeresin_artifacts',
            });

            // 3. SERVER CLEANUP
            fs.unlinkSync(req.file.path);

            // 4. FORMAT DATA
            const formattedBody = {
                ...req.body,
                basePrice: Number(req.body.basePrice),
                discountPrice: Number(req.body.discountPrice) || 0,
                discountPercentage: Number(req.body.discountPercentage) || 0,
                leadTimeDays: Number(req.body.leadTimeDays) || 7,
                inStock: Number(req.body.stock) > 0 ? true : false,
                images: [cloudResult.secure_url],
                colors: req.body.colors ? JSON.parse(req.body.colors) : [],
                sizes: req.body.sizes ? JSON.parse(req.body.sizes) : [],
                addons: req.body.addons ? JSON.parse(req.body.addons) : []
            };

            // 5. VALIDATION
            const productSchema = Joi.object({
                name: Joi.string().trim().required().max(100),
                description: Joi.string().required(),
                category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
                    'string.pattern.base': 'Invalid Category ID format.',
                }),
                basePrice: Joi.number().min(1).required(),
                discountPrice: Joi.number().min(0).optional(),
                discountPercentage: Joi.number().min(0).max(100).optional(),
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
                leadTimeDays: Joi.number().min(1).max(30).default(5),
                inStock: Joi.boolean().default(true)
            }).unknown(); 

            const { error, value } = productSchema.validate(formattedBody);
            if (error) return next(error);

            // 6. ORPHAN PREVENTION
            const categoryExists = await Category.findById(value.category);
            if (!categoryExists) {
                return next(CustomErrorHandler.notFound('Category not found!'));
            }

            // 7. SLUG GENERATION
            let baseSlug = value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const randomStr = crypto.randomBytes(2).toString('hex'); 
            const generatedSlug = `${baseSlug}-${randomStr}`;

            // 8. DB INSERTION
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

            // 9. RESPONSE
            return res.status(201).json({
                success: true,
                message: 'Product launched successfully!',
                data: savedProduct
            });

        } catch (err) {
            // FAILSAFE CLEANUP
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return next(err);
        }
    },

    // --- GET ALL PRODUCTS ---
    async index(req, res, next) {
        try {
            let { page = 1, limit = 12, search, category, sort, minPrice, maxPrice } = req.query;

            let filter = { isActive: true };

            if (search) {
                filter.name = { $regex: search, $options: 'i' }; 
            }

            if (category) {
                filter.category = category;
            }

            if (minPrice || maxPrice) {
                filter.basePrice = {};
                if (minPrice) filter.basePrice.$gte = Number(minPrice);
                if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
            }

            let sortOption = { createdAt: -1 };
            if (sort === 'price_low') sortOption = { basePrice: 1 };
            if (sort === 'price_high') sortOption = { basePrice: -1 };
            if (sort === 'top_rated') sortOption = { averageRating: -1 };

            const skip = (Number(page) - 1) * Number(limit);

            const [products, totalProducts] = await Promise.all([
                Product.find(filter)
                    .populate('category', 'name slug')
                    .select('-__v')
                    .sort(sortOption)
                    .skip(skip)
                    .limit(Number(limit)),
                Product.countDocuments(filter)
            ]);

            return res.status(200).json({
                success: true,
                message: 'Products fetched successfully',
                data: products,
                meta: {
                    totalProducts,
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalProducts / Number(limit)),
                    limit: Number(limit)
                }
            });

        } catch (err) {
            return next(err);
        }
    },

    // 3. GET SINGLE PRODUCT
    async show(req, res, next) {
        try {
            const { slug } = req.params;

            const product = await Product.findOne({ slug, isActive: true })
                .populate('category', 'name slug')
                .select('-__v');

            if (!product) {
                return next(CustomErrorHandler.notFound('Product not found or currently unavailable!'));
            }

            return res.status(200).json({
                success: true,
                message: 'Product details fetched successfully',
                data: product
            });

        } catch (err) {
            return next(err);
        }
    },

    // 4. UPDATE PRODUCT
    async update(req, res, next) {
        try {
            const { id } = req.params;

            const updateSchema = Joi.object({
                name: Joi.string().trim().max(100),
                description: Joi.string(),
                category: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
                basePrice: Joi.number().min(1),
                discountPrice: Joi.number().min(0),
                discountPercentage: Joi.number().min(0).max(100),
                colors: Joi.array().items(Joi.string().trim()),
                sizes: Joi.array().items(Joi.object({
                    sizeLabel: Joi.string().required(),
                    priceModifier: Joi.number().min(0).default(0)
                })),
                addons: Joi.array().items(Joi.object({
                    addonName: Joi.string().required(),
                    extraPrice: Joi.number().min(0).default(0)
                })),
                leadTimeDays: Joi.number().min(1).max(30),
                inStock: Joi.boolean(),
                isActive: Joi.boolean()
            });

            const { error, value } = updateSchema.validate(req.body);
            if (error) return next(error);

            const updatedProduct = await Product.findByIdAndUpdate(id, value, { new: true });

            if (!updatedProduct) {
                return next(CustomErrorHandler.notFound('Product not found!'));
            }

            return res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                data: updatedProduct
            });

        } catch (err) {
            return next(err);
        }
    },

    // 5. DELETE PRODUCT
    async destroy(req, res, next) {
        try {
            const { id } = req.params;

            const product = await Product.findByIdAndDelete(id);

            if (!product) {
                return next(CustomErrorHandler.notFound('Product not found!'));
            }

            return res.status(200).json({
                success: true,
                message: 'Product deleted successfully',
                data: product
            });

        } catch (err) {
            return next(err);
        }
    }
};

export default productController;