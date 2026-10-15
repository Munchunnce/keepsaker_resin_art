import CustomErrorHandler from "../services/CustomErrorHandler.js";
import JwtService from "../services/JwtService.js";

const auth = async (req, res, next) => {
    let authHeader = req.headers.authorization;
    
    // 1. Edge Case Check: Header hona chahiye aur "Bearer " se start hona chahiye
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(CustomErrorHandler.unAuthorized('Authorization header missing or invalid format'));
    }

    // 2. Token Extract karna
    const token = authHeader.split(' ')[1];

    // 3. Edge Case Check: Space ke baad actual token hona chahiye (khali nahi)
    if (!token) {
        return next(CustomErrorHandler.unAuthorized('Token not found'));
    }

    try {
        // 4. Token Verify karna
        const { _id, role } = await JwtService.verify(token); // JWT_SECRET internally use ho raha hoga
        
        // 5. req object mein inject karna (ES6 shorthand - clean and professional)
        req.user = { _id, role };
        
        next();
    } catch (err) {
        // Token expire ho gaya ya galat hai
        return next(CustomErrorHandler.unAuthorized('Invalid or expired token'));
    }
}

export default auth;