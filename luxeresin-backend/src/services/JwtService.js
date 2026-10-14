import { JWT_SECRET } from '../config/index.js';
import jwt from 'jsonwebtoken';


class JwtService {
    // static sign(payload, expiry = '60s', secret = JWT_SECRET) {
    //     return jwt.sign(payload, secret, { expiresIn: expiry });
    // }
    static sign(payload, secret = JWT_SECRET, expiry = '60s') {
        if (!secret || typeof secret !== 'string') {
            throw new Error('JWT secret is missing or invalid');
        }

        return jwt.sign(payload, secret, {
            expiresIn: expiry,
        });
    }

    // static verify(token, secret = JWT_SECRET) {
    //     return jwt.verify(token, secret);
    // }

    static verify(token, secret = JWT_SECRET) {
        if (!secret || typeof secret !== 'string') {
            throw new Error('JWT secret is missing or invalid');
        }

        return jwt.verify(token, secret);
    }
}

export default JwtService;