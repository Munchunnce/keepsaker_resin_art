import { Category, Product } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import Joi from 'joi';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET
} from '../../config/index.js';

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

// Helper: Server se temporary Multer file clean karne ke liye
const removeTempFile = (file) => {
    if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
    }
};

const categoryController = {
    // 1. CREATE CATEGORY (Admin Only - Direct Cloudinary Upload)
    async store(req, res, next) {
        try {
            if (!req.file) {
                return next(CustomErrorHandler.badRequest('Category cover image is required!'));
            }

            const categorySchema = Joi.object({
                name: Joi.string().trim().required(),
                description: Joi.string().allow('').optional(),
            });

            const { error, value } = categorySchema.validate(req.body);
            if (error) {
                removeTempFile(req.file);
                return next(error);
            }

            const slug = value.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

            const exist = await Category.findOne({ slug });
            if (exist) {
                removeTempFile(req.file);
                return next(CustomErrorHandler.alreadyExists('Category with this name already exists'));
            }

            // Cloudinary par upload
            const cloudResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'luxeresin_categories',
            });
            removeTempFile(req.file);

            const category = await Category.create({
                name: value.name,
                slug,
                description: value.description || '',
                image: cloudResult.secure_url
            });

            return res.status(201).json({
                success: true,
                message: 'Category forged successfully',
                data: category
            });
        } catch (err) {
            removeTempFile(req.file);
            return next(err);
        }
    },

    // 2. GET ALL ACTIVE CATEGORIES (Public - Storefront & Dropdowns)
    async index(req, res, next) {
        try {
            const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 });
            return res.status(200).json({
                success: true,
                count: categories.length,
                data: categories
            });
        } catch (err) {
            return next(err);
        }
    },

    // 3. GET ALL CATEGORIES FOR ADMIN (Active + Hidden dono)
    async adminIndex(req, res, next) {
        try {
            const categories = await Category.find().sort({ createdAt: -1 });
            return res.status(200).json({
                success: true,
                count: categories.length,
                data: categories
            });
        } catch (err) {
            return next(err);
        }
    },

    // 4. GET SINGLE CATEGORY WITH ITS PRODUCTS
    async show(req, res, next) {
        try {
            const category = await Category.findOne({ slug: req.params.slug, isActive: true });
            if (!category) {
                return next(CustomErrorHandler.notFound('Category not found'));
            }

            const products = await Product.find({ category: category._id, inStock: true });

            return res.status(200).json({
                success: true,
                data: {
                    category,
                    products
                }
            });
        } catch (err) {
            return next(err);
        }
    },

    // 5. UPDATE CATEGORY (Admin Only - Optional New Image)
    async update(req, res, next) {
        try {
            const updateSchema = Joi.object({
                name: Joi.string().trim().optional(),
                description: Joi.string().allow('').optional(),
                isActive: Joi.boolean().optional()
            });

            const { error, value } = updateSchema.validate(req.body);
            if (error) {
                removeTempFile(req.file);
                return next(error);
            }

            const existingCategory = await Category.findById(req.params.id);
            if (!existingCategory) {
                removeTempFile(req.file);
                return next(CustomErrorHandler.notFound('Category not found'));
            }

            const updateData = { ...value };

            if (value.name) {
                const newSlug = value.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '');

                const duplicate = await Category.findOne({
                    slug: newSlug,
                    _id: { $ne: req.params.id }
                });
                if (duplicate) {
                    removeTempFile(req.file);
                    return next(CustomErrorHandler.alreadyExists('Another category with this name already exists'));
                }
                updateData.slug = newSlug;
            }

            // Agar Admin ne nayi photo select ki hai toh hi Cloudinary par upload karo
            if (req.file) {
                const cloudResult = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'luxeresin_categories',
                });
                removeTempFile(req.file);
                updateData.image = cloudResult.secure_url;
            }

            const updatedCategory = await Category.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true, runValidators: true }
            );

            return res.status(200).json({
                success: true,
                message: 'Category updated successfully',
                data: updatedCategory
            });
        } catch (err) {
            removeTempFile(req.file);
            return next(err);
        }
    },

    // 6. SOFT DELETE / TOGGLE ACTIVE STATUS (Admin Only)
    async destroy(req, res, next) {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return next(CustomErrorHandler.notFound('Category not found'));
            }

            category.isActive = !category.isActive;
            await category.save();

            return res.status(200).json({
                success: true,
                message: `Category status updated to ${category.isActive ? 'Active' : 'Hidden'}`,
                data: category
            });
        } catch (err) {
            return next(err);
        }
    }
};

export default categoryController;