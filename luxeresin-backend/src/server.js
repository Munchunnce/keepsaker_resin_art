import express from 'express';
import { APP_PORT } from './config/index.js';
import connectDatabase from './config/database.js';
import routes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';

// --- Enterprise Middlewares ---
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

// ==========================================
// 1. GLOBAL MIDDLEWARES (Order is important)
// ==========================================

app.use(helmet()); // Adds extra security headers to protect from common web vulnerabilities

// CORS configuration - Extremely crucial for React frontend and Cookies
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // React/Vite URLs
    credentials: true, // THIS IS MANDATORY for HttpOnly Cookies to work across frontend/backend
}));

app.use(express.json()); // Parses incoming JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data
app.use(cookieParser()); // Allows Express to read req.cookies

app.use(morgan('dev')); // Logs API requests in the terminal (e.g., POST /api/v1/auth/login 200)

// ==========================================
// 2. ROUTES
// ==========================================
app.use('/api/v1/auth', routes);

// ==========================================
// 3. ERROR HANDLER (Must be the last middleware)
// ==========================================
app.use(errorHandler);

// ==========================================
// 4. SERVER STARTUP LOGIC
// ==========================================
const startServer = async () => {
    try {
        // Ensure Database connects BEFORE opening the server to traffic
        await connectDatabase();

        app.listen(APP_PORT, () => {
            console.log(`🚀 Server running on port ${APP_PORT}`);
        });
    } catch (error) {
        console.error('❌ Server startup failed:', error.message);
        process.exitCode = 1; // Gracefully indicates failure without crashing abruptly
    }
};

startServer();