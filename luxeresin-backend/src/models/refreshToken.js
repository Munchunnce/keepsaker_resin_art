import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {type: String, unique: true,},
  },
  {
    timestamps: false, // Automatically createdAt aurd updatedAt fields ko disable karne ke liye
  }
);

const RefreshToken = mongoose.model('refreshToken', refreshTokenSchema, 'refreshToken'); // Explicitly specify collection name to avoid pluralization issues
export default RefreshToken;