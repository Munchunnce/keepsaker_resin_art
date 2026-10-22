import express from "express";
import { loginController, registerController, userController, refreshController, categoryController, productController, cartController, orderController, couponController } from "../controllers/index.js";
import auth from "../middlewares/auth.js";
import admin from "../middlewares/admin.js";
import reviewController from "../controllers/product/reviewController.js";
import dashboardController from "../controllers/admin/dashboardController.js";

const router = express.Router();

// --- Auth Routes ---
router.post('/register', registerController.register);
router.post('/login', loginController.login);
router.get('/me', auth, userController.me);
router.put('/user/address', auth, userController.updateAddress);
router.post('/refresh', refreshController.refresh);
router.post('/logout', auth, loginController.logout);


// --- Admin Dashboard Route ---
router.get('/admin/dashboard', [auth, admin], dashboardController.getDashboardStats);

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

// --- Review Routes ---
router.post('/product/review', auth, reviewController.addReview);
router.get('/product/:productId/reviews', reviewController.getProductReviews); // Public: Koi bhi reviews padh sakta hai

// --- Coupon Routes ---
// Admin Route: Naya coupon banane ke liye (admin middleware zaroori hai)
router.post('/admin/coupon', [auth, admin], couponController.createCoupon);

// Customer Route: Cart mein code apply karne ke liye
router.post('/cart/apply-coupon', auth, couponController.applyCoupon);

// --- Category Routes ---
// POST: Admin category banayega
router.post('/categories', auth, admin, categoryController.store);

// 🚀 NAYA: GET ALL - Koi bhi visitor saari categories dekh sakta hai (Public)
router.get('/categories', categoryController.index);

// 🚀 NAYA: GET SINGLE - Ek category aur uske saare products (Public)
router.get('/categories/:slug', categoryController.show);

// 🚀 NAYA: PUT - Admin category update karega
router.put('/categories/:id', [auth, admin], categoryController.update);

// 🚀 NAYA: DELETE - Admin category hide/delete karega
router.delete('/categories/:id', [auth, admin], categoryController.destroy);

export default router;