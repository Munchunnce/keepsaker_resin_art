import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
        type: String, 
        required: true,
        unique: true,
    },
    // 1: Linked token to specific User
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
  },
  {
    timestamps: true, // Changed to true. Debugging aur TTL ke liye timestamps zaroori hain
  }
);

// 2: TTL Index - MongoDB automatically delete karega is document ko 7 din (604800 seconds) baad
// 7 days = 7 * 24 * 60 * 60 = 604800 seconds
refreshTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

// Conventionally collections plural hoti hain, isliye 'refreshTokens' kar diya
const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema, 'refreshTokens'); 

export default RefreshToken;