import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            required: [true, 'Slug is required for SEO URLs'],
            unique: true,
            lowercase: true,
            // Example: Agar name "Resin Wall Clocks" hai, toh slug "resin-wall-clocks" hoga
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            type: String, 
            // AWS S3 ya Cloudinary ka URL save karenge
            required: [true, 'Category image URL is required'],
        },
        isActive: {
            type: Boolean,
            default: true, // Pro-Tip: Soft delete concept (Admin category ko hide kar sakta hai bina delete kiye)
        }
    },
    {
        timestamps: true,
    }
);

const Category = mongoose.model('Category', categorySchema, 'categories');

export default Category;