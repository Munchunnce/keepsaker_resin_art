import dotenv from 'dotenv';
dotenv.config();


export const {
    APP_PORT,
    NODE_ENV,
    DEBUG_MODE,
    MONGO_URI,
    JWT_SECRET,
    REFRESH_SECRET,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    SMTP_MAIL,
    SMTP_PASSWORD
} = process.env;


// import dotenv from 'dotenv';

// dotenv.config();

// export const APP_PORT = process.env.APP_PORT || 5000;
// export const NODE_ENV = process.env.NODE_ENV || 'development';
// export const DEBUG_MODE = process.env.DEBUG_MODE || 'false';
// export const MONGO_URI = process.env.MONGO_URI;
// export const JWT_SECRET = process.env.JWT_SECRET;
