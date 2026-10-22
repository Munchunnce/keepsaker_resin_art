import { Category, Product } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import Joi from 'joi';

const categoryController = {
    // 1. CREATE CATEGORY (Admin Only)
    async store(req, res, next) {
        const categorySchema = Joi.object({
            name: Joi.string().trim().required(),
            description: Joi.string().allow('').optional(),
            image: Joi.string().required(), 
        });

        const { error, value } = categorySchema.validate(req.body);
        if (error) return next(error);

        try {
            const exist = await Category.findOne({ name: value.name });
            if (exist) {
                return next(CustomErrorHandler.alreadyExists('Category with this name already exists'));
            }

            // SEO Friendly Slug Generation
            const slug = value.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

            const category = await Category.create({
                name: value.name,
                slug: slug,
                description: value.description,
                image: value.image
            });

            return res.status(201).json({
                success: true,
                message: 'Category forged successfully',
                data: category
            });

        } catch (err) {
            return next(err);
        }
    },

    // 🚀 2. GET ALL ACTIVE CATEGORIES (Public - Navbar & Home Grid ke liye)
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

    // 🚀 3. GET SINGLE CATEGORY WITH ITS PRODUCTS (Category Page / Collection Page)
    async show(req, res, next) {
        try {
            const category = await Category.findOne({ slug: req.params.slug, isActive: true });
            if (!category) {
                return next(CustomErrorHandler.notFound('Category not found'));
            }

            // Us category ke under aane wale saare products fetch karo
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

    // 🚀 4. UPDATE CATEGORY (Admin Only)
    async update(req, res, next) {
        const updateSchema = Joi.object({
            name: Joi.string().trim().optional(),
            description: Joi.string().allow('').optional(),
            image: Joi.string().optional(),
            isActive: Joi.boolean().optional()
        });

        const { error, value } = updateSchema.validate(req.body);
        if (error) return next(error);

        try {
            let updateData = { ...value };
            if (value.name) {
                updateData.slug = value.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '');
            }

            const updatedCategory = await Category.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedCategory) {
                return next(CustomErrorHandler.notFound('Category not found'));
            }

            return res.status(200).json({
                success: true,
                message: 'Category updated successfully',
                data: updatedCategory
            });
        } catch (err) {
            return next(err);
        }
    },

    // 🚀 5. SOFT DELETE / TOGGLE ACTIVE STATUS (Admin Only)
    async destroy(req, res, next) {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return next(CustomErrorHandler.notFound('Category not found'));
            }

            // Soft delete: Delete karne ki jagah isActive false kar do taaki purane orders safe rahein
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