import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxLength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // FAANG Rule: Email must be unique
      trim: true,
      lowercase: true,
      index: true, // B-Tree indexing for blazing fast login searches
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password_hash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Security: DB se user fetch karte waqt password automatically hide rahega
    },
    role: {
      type: String,
      enum: ['Customer', 'Admin'],
      default: 'Customer',
    },
  },
  {
    timestamps: true, // Automatically createdAt aur updatedAt manage karega
  }
);

const User = mongoose.model('User', userSchema, 'users'); // Explicitly specify collection name to avoid pluralization issues
export default User;