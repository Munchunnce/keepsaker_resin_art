import { DEBUG_MODE } from '../config/index.js';
import Joi from 'joi';
import CustomErrorHandler from '../services/CustomErrorHandler.js';

const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    
    // Default 500 Error response
    let data = {
        success: false,
        message: 'Internal server error',
        // PRO FIX: Added err.stack to see the exact line number of the error during development
        ...(DEBUG_MODE === 'true' && { originalError: err.message, stack: err.stack }), 
    }
    
    // 1. Handle Joi Validation Errors
    if (err instanceof Joi.ValidationError) {
        statusCode = 422; // Unprocessable Entity
        data = {
            success: false,
            message: err.message, // Ya fir aap yahan frontend ke liye clean message bhej sakte hain
        }
    }

    // 2. Handle Known Custom Errors
    if (err instanceof CustomErrorHandler) {
        statusCode = err.status;
        data = {
            success: false,
            message: err.message,
        }
    }

    // 3. PRO FIX: Terminal Logging for Unknown Errors
    // Agar error 500 hai, toh iska matlab kuch achanak phata hai (like database down). 
    // Isey terminal mein laal rang se print karna zaroori hai.
    if (statusCode === 500) {
        console.error('🚨 [CRITICAL ERROR]:', err);
    }
    
    return res.status(statusCode).json(data);
};

export default errorHandler;