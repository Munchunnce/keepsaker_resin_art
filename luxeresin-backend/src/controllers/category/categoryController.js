import { Category } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';
import Joi from 'joi';

const categoryController = {
    async store(req, res, next) {
        // 1. Validation (Category banate waqt kya-kya details aani chahiye)
        const categorySchema = Joi.object({
            name: Joi.string().trim().required(),
            description: Joi.string().allow('').optional(), // Optional field
            image: Joi.string().required(), // Cloudinary/AWS ka URL aayega yahan
        });

        const { error, value } = categorySchema.validate(req.body);
        if (error) return next(error);

        try {
            const exist = await Category.findOne({ name: value.name });
            if (exist) {
                return next(CustomErrorHandler.alreadyExists('Category with this name already exists'));
            }

            // PRO TIP: SEO friendly 'slug' generate karna (e.g., "Resin Clocks" -> "resin-clocks")
            const slug = value.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-') // spaces aur special chars ko dash (-) se replace karo
                .replace(/(^-|-$)+/g, '');   // shuru aur aakhir ke extra dash hata do

            // 2. Database mein Save karna
            const category = new Category({
                name: value.name,
                slug: slug,
                description: value.description,
                image: value.image
            });

            const savedCategory = await category.save();

            return res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: savedCategory
            });

        } catch (err) {
            return next(err);
        }
    }
};

export default categoryController;