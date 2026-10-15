import express from "express";
import { loginController, registerController, userController, refreshController, categoryController, productController } from "../controllers/index.js";
import auth from "../middlewares/auth.js";
import admin from "../middlewares/admin.js";

const router = express.Router();

// --- Auth Routes ---
router.post('/register', registerController.register);
router.post('/login', loginController.login);
router.get('/me', auth, userController.me);
router.post('/refresh', refreshController.refresh);
router.post('/logout', auth, loginController.logout);

// --- Category Routes ---
// PRO FIX: Pehle 'auth' check karega login hai ya nahi, phir 'admin' check karega wo Admin hai ya nahi
router.post('/categories', auth, admin, categoryController.store);

// --- Product Routes ---
// Pro-Level Security: Only Logged In (auth) AND Admin (admin) can create products
router.post('/products', auth, admin, productController.store);

export default router;