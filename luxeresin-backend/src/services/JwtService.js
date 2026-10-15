import { JWT_SECRET } from '../config/index.js';
import jwt from 'jsonwebtoken';

class JwtService {
    // Sign method (Synchronous - as used in your controllers)
    static sign(payload, secret = JWT_SECRET, expiry = '15m') { // Pro-Tip: Changed 60s to 15m (Industry standard for Access Tokens)
        if (!secret || typeof secret !== 'string') {
            throw new Error('JWT secret is missing or invalid');
        }

        return jwt.sign(payload, secret, {
            expiresIn: expiry,
        });
    }

    // Verify method (Asynchronous - non-blocking for high performance)
    static verify(token, secret = JWT_SECRET) {
        if (!secret || typeof secret !== 'string') {
            throw new Error('JWT secret is missing or invalid');
        }

        // FIX: Wrapped in a Promise taaki mera 'await JwtService.verify()' actual mein non-blocking ban jaye
        return new Promise((resolve, reject) => {
            jwt.verify(token, secret, (err, decoded) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decoded);
                }
            });
        });
    }
}

export default JwtService;