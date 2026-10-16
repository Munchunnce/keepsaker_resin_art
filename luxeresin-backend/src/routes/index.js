import express from "express";
import { loginController, registerController, userController, refreshController, categoryController, productController, cartController, orderController } from "../controllers/index.js";
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

// GET: Koi bhi visitor products dekh sakta hai (No auth guard)
router.get('/products', productController.index);

// GET SINGLE: URL mein jo ":slug" hai wo parameter ban jayega
router.get('/products/:slug', productController.show);

// PUT: Update Product (Admin only) - URL mein ID bhejna hoga
router.put('/products/:id', auth, admin, productController.update);

// DELETE: Delete Product (Admin only) - URL mein ID bhejna hoga
router.delete('/products/:id', auth, admin, productController.destroy);

// --- Cart Routes ---
// POST: Customer cart mein item add karega (auth guard zaroori hai)
router.post('/cart', auth, cartController.addItem);
router.get('/cart', auth, cartController.getCart);                  // View cart
router.put('/cart/items/:itemId', auth, cartController.updateQuantity); // Increase/Decrease Qty
router.delete('/cart/items/:itemId', auth, cartController.removeItem); // Remove item
// --- Order Routes ---
router.post('/order/checkout', auth, orderController.placeOrder);
router.get('/order/my-orders', auth, orderController.myOrders);           // Sirf Auth (Customer)
router.get('/order/all', auth, admin, orderController.allOrders);         // Auth + Admin
router.put('/order/:id/status', auth, admin, orderController.updateStatus); // Auth + Admin


export default router;