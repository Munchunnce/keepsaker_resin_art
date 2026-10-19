import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Protected Route Guard
import ProtectedRoute from './routes/ProtectedRoutes.jsx';

// Dummy Pages (Inko baad mein banayenge)
const Home = () => <h1>Home Page (Public)</h1>;
const Login = () => <h1>Login Page (Public)</h1>;
const Cart = () => <h1>My Cart (Customers)</h1>;
const AdminDashboard = () => <h1>Admin Dashboard (Top Secret)</h1>;
const NotFound = () => <h1>404 - Page Not Found</h1>;

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔓 PUBLIC ROUTES (Koi bhi aa sakta hai) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

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