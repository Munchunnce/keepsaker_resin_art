import express from "express";
import multer from "multer";
import { loginController, registerController, userController, refreshController, categoryController, productController, cartController, orderController, couponController } from "../controllers/index.js";
import auth from "../middlewares/auth.js";
import admin from "../middlewares/admin.js";
import reviewController from "../controllers/product/reviewController.js";
import dashboardController from "../controllers/admin/dashboardController.js";

const router = express.Router();

// Multer Configuration (Image ko 1 second ke liye yahan rakhega)
const upload = multer({ dest: 'uploads/' });

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
router.post('/categories', auth, admin, categoryController.store);

// --- Product Routes ---
// Yahan 'upload.single("image")' lagaya hai
router.post('/products', auth, admin, upload.single('image'), productController.store);

// GET: Koi bhi visitor products dekh sakta hai (No auth guard)
router.get('/products', productController.index);

// GET SINGLE: URL mein jo ":slug" hai wo parameter ban jayega
router.get('/products/:slug', productController.show);

// PUT: Update Product (Admin only)
router.put('/products/:id', auth, admin, productController.update);

// DELETE: Delete Product (Admin only)
router.delete('/products/:id', auth, admin, productController.destroy);

// --- Cart Routes ---
router.post('/cart', auth, cartController.addItem);
router.get('/cart', auth, cartController.getCart);                  
router.put('/cart/items/:itemId', auth, cartController.updateQuantity); 
router.delete('/cart/items/:itemId', auth, cartController.removeItem); 

// --- Order Routes ---
router.post('/order/checkout', auth, orderController.placeOrder);
router.get('/order/my-orders', auth, orderController.myOrders);           
router.get('/order/all', auth, admin, orderController.allOrders);         
router.put('/order/:id/status', auth, admin, orderController.updateStatus); 

// --- Review Routes ---
router.post('/product/review', auth, reviewController.addReview);
router.get('/product/:productId/reviews', reviewController.getProductReviews); 

// --- Coupon Routes ---
router.post('/admin/coupon', [auth, admin], couponController.createCoupon);
router.post('/cart/apply-coupon', auth, couponController.applyCoupon);

// --- Category Routes (Public & Admin) ---
router.get('/categories', categoryController.index);
router.get('/categories/:slug', categoryController.show);
router.put('/categories/:id', [auth, admin], categoryController.update);
router.delete('/categories/:id', [auth, admin], categoryController.destroy);

export default router;