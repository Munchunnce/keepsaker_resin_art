import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyAuthStatus } from './features/auth/authSlice';
import { fetchCart } from './features/cart/cartSlice';
import { Toaster } from 'react-hot-toast';

// 1. PAGES
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
import AdminCoupons from './pages/admin/AdminCoupons.jsx';
import Footer from './pages/Footer.jsx';
import Shop from './pages/Shop.jsx';
import About from './pages/About.jsx';
import CategoryProducts from './pages/CategoryProducts.jsx';
import CategoryShowcase from './components/categoryShowcase/CategoryShowcase.jsx';
import CustomArtRequest from './pages/CustomArtRequest.jsx';
import AdminCustomRequests from './pages/admin/AdminCustomRequests.jsx';

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
        <Route path="/categories" element={<CategoryShowcase />} />
        <Route path="/category/:slug" element={<CategoryProducts />} />
        <Route path="/about" element={<About />} />
        {/* 🚀 ASLI LOGIN AUR REGISTER YAHAN RENDER HONGE */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🔒 PROTECTED ROUTES (Sirf logged-in users) */}
        <Route element={<ProtectedRoute />}>
            <Route path="/products" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/custom-art" element={<CustomArtRequest />} />
        </Route>

        {/* 👑 ADMIN ONLY ROUTES (Sirf Boss logo ke liye) */}
        <Route element={<ProtectedRoute allowedRoles={['Admin', 'admin']} />}>
            <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/products/new" element={<AdminProductForm />} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
                <Route path="/admin/custom-requests" element={<AdminCustomRequests />} />
            </Route>
        </Route>

        {/* 🚫 404 CATCH-ALL (Koi galat URL dale toh) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;