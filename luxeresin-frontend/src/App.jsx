import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { verifyAuthStatus } from './features/auth/authSlice';

// 1. ASLI PAGES KO IMPORT KAREIN (Dummy nahi)
import Navbar from './components/layout/Navbar.jsx';
import ProtectedRoute from './routes/ProtectedRoutes.jsx';
import Login from './pages/Login.jsx';       // Aapka banaya hua asli Login Page
import Register from './pages/Register.jsx'; // Aapka banaya hua asli Register Page

// Baaki bache hue Dummy Pages (Inko baad mein asali page se replace karenge)
const Home = () => <h1>Home Page (Public)</h1>;
const Cart = () => <h1>My Cart (Customers)</h1>;
const AdminDashboard = () => <h1>Admin Dashboard (Top Secret)</h1>;
const NotFound = () => <h1>404 - Page Not Found</h1>;

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(verifyAuthStatus());
  }, [dispatch]);

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* 🔓 PUBLIC ROUTES (Koi bhi aa sakta hai) */}
        <Route path="/" element={<Home />} />
        
        {/* 🚀 ASLI LOGIN AUR REGISTER YAHAN RENDER HONGE */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🔒 PROTECTED ROUTES (Sirf logged-in users) */}
        <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<h1>Checkout Page</h1>} />
        </Route>

        {/* 👑 ADMIN ONLY ROUTES (Sirf Boss logo ke liye) */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<h1>Manage Products</h1>} />
        </Route>

        {/* 🚫 404 CATCH-ALL (Koi galat URL dale toh) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;