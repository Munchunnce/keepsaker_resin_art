import mongoose from 'mongoose';
import { MONGO_URI } from './index.js';

const connectDatabase = async () => {
    try {
        if (!MONGO_URI) {
            throw new Error('MONGO_URI is missing in the .env file');
        }

        const con = await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });

        console.log(`✅ MongoDB Connected: ${con.connection.host}`);
        console.log(`📦 Database: ${con.connection.name}`);

        return con;
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        throw error;
    }
};

export default connectDatabase;
