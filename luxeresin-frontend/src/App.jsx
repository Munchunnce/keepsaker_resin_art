import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyAuthStatus } from './features/auth/authSlice';
import { fetchCart } from './features/cart/cartSlice';
import { Toaster } from 'react-hot-toast';

// 1. ASLI PAGES KO IMPORT KAREIN (Dummy nahi)
import Navbar from './components/layout/Navbar.jsx';
import ProtectedRoute from './routes/ProtectedRoutes.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import SingleProduct from './pages/SingleProduct.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import MyOrders from './pages/MyOrders.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminProductForm from './pages/admin/AdminProductForm.jsx';

// Baaki bache hue Dummy Pages (Inko baad mein asali page se replace karenge)
// const Home = () => <h1>Home Page (Public)</h1>;
// const Cart = () => <h1>My Cart (Customers)</h1>;
// const AdminDashboard = () => <h1>Admin Dashboard (Top Secret)</h1>;
const NotFound = () => <h1>404 - Page Not Found</h1>;

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(verifyAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
        dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <Router>
      <Toaster 
         position="top-center" 
         toastOptions={{ style: { background: '#333', color: '#fff', fontWeight: 'bold' } }} 
      />
      <Navbar />
      <Routes>
        {/* 🔓 PUBLIC ROUTES (Koi bhi aa sakta hai) */}
        <Route path="/" element={<Home />} />
        <Route path="/product/:slug" element={<SingleProduct />} />
        {/* 🚀 ASLI LOGIN AUR REGISTER YAHAN RENDER HONGE */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🔒 PROTECTED ROUTES (Sirf logged-in users) */}
        <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/my-orders" element={<MyOrders />} />
        </Route>

        {/* 👑 ADMIN ONLY ROUTES (Sirf Boss logo ke liye) */}
        <Route element={<ProtectedRoute allowedRoles={['Admin', 'admin']} />}>
            <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/products/new" element={<AdminProductForm />} />
                <Route path="/admin/coupons" element={<h1>Coupons Forge</h1>} />
            </Route>
        </Route>

        {/* 🚫 404 CATCH-ALL (Koi galat URL dale toh) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;