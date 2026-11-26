import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyAuthStatus } from './features/auth/authSlice';
import { fetchCart } from './features/cart/cartSlice';
import { Toaster } from 'react-hot-toast';

// 1. PAGES & COMPONENTS
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
import AdminCategories from './pages/admin/AdminCategories.jsx';

// Har route change par page ko automatically top par scroll karega
const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

// Brand-matched 404 Page
const NotFound = () => (
    <div className="min-h-[75vh] bg-[#050505] flex flex-col items-center justify-center text-center px-4">
        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-3">
            Error 404
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Artifact Not Found
        </h1>
        <p className="text-sm text-gray-400 max-w-md mb-8">
            The vault page you are looking for does not exist or has been moved.
        </p>
        <Link
            to="/"
            className="px-6 py-3 bg-[#D4AF37] text-black text-xs font-black uppercase tracking-widest rounded-sm hover:bg-[#e5c158] transition-all"
        >
            Return to Home
        </Link>
    </div>
);

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
            <ScrollToTop />
            <Toaster
                position="top-center"
                toastOptions={{ style: { background: '#333', color: '#fff', fontWeight: 'bold' } }}
            />
            <Navbar />
            <Routes>
                {/* 🔓 PUBLIC ROUTES (Koi bhi visitor browse kar sakta hai) */}
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Shop />} />
                <Route path="/product/:slug" element={<SingleProduct />} />
                <Route path="/categories" element={<CategoryShowcase />} />
                <Route path="/category/:slug" element={<CategoryProducts />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* 🔒 PROTECTED ROUTES (Sirf logged-in users ke liye) */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/my-orders" element={<MyOrders />} />
                    <Route path="/custom-art" element={<CustomArtRequest />} />
                </Route>

                {/* 👑 ADMIN ONLY ROUTES */}
                <Route element={<ProtectedRoute allowedRoles={['Admin', 'admin']} />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/orders" element={<AdminOrders />} />
                        <Route path="/admin/products" element={<AdminProducts />} />
                        <Route path="/admin/products/new" element={<AdminProductForm />} />
                        <Route path="/admin/categories" element={<AdminCategories />} />
                        <Route path="/admin/coupons" element={<AdminCoupons />} />
                        <Route path="/admin/custom-requests" element={<AdminCustomRequests />} />
                    </Route>
                </Route>

                {/* 🚫 404 CATCH-ALL */}
                <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
        </Router>
    );
}

export default App;