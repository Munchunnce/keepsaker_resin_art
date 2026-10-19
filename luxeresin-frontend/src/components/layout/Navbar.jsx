import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';

const Navbar = () => {
    // 🧠 REDUX CONNECTION: Navbar lagataar Redux ke dimaag ko padh raha hai
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    // Future mein hum Cart ka count bhi yahan padhenge:
    // const cartItemCount = useSelector((state) => state.cart.totalItems);
    
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // LOGOUT LOGIC
    const handleLogout = () => {
        dispatch(logout()); // Redux state aur JS variable clear
        toast.success('Logged out successfully! 👋');
        navigate('/'); // Home page par phek do
    };

    return (
        // 💎 GLASSMORPHISM UI: sticky top-0, bg-white/80, backdrop-blur-md
        <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    
                    {/* LEFT: BRAND LOGO */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-2xl font-extrabold tracking-widest text-black hover:text-gray-700 transition">
                            LUXERESIN
                        </Link>
                    </div>

                    {/* MIDDLE: NAVIGATION LINKS (Desktop) */}
                    <div className="hidden md:flex space-x-8">
                        <Link to="/products" className="text-gray-800 hover:text-black font-medium transition">Shop</Link>
                        <Link to="/categories" className="text-gray-800 hover:text-black font-medium transition">Categories</Link>
                        <Link to="/about" className="text-gray-800 hover:text-black font-medium transition">About Us</Link>
                    </div>

                    {/* RIGHT: DYNAMIC AUTH SECTION */}
                    <div className="flex items-center space-x-4">
                        
                        {/* THE REDUX MAGIC: Condition based rendering */}
                        {isAuthenticated ? (
                            // Agar User Logged In hai 👇
                            <>
                                {/* USER GREETING */}
                                <span className="hidden sm:block text-sm font-medium text-gray-600">
                                    Hi, {user?.name?.split(' ')[0]} {/* Sirf first name dikhayega */}
                                </span>

                                {/* CART BUTTON (With Badge) */}
                                <Link to="/cart" className="relative p-2 text-gray-600 hover:text-black transition">
                                    {/* Cart Icon (SVG) */}
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    {/* Cart Notification Badge (Dummy count 2 for now) */}
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-black rounded-full">
                                        2
                                    </span>
                                </Link>

                                {/* LOGOUT BUTTON */}
                                <button 
                                    onClick={handleLogout}
                                    className="ml-4 px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            // Agar User GUEST (Logged Out) hai 👇
                            <>
                                <Link to="/login" className="text-gray-800 hover:text-black font-medium transition">
                                    Log In
                                </Link>
                                <Link to="/register" className="px-4 py-2 text-sm font-bold text-white bg-black hover:bg-gray-800 rounded-lg shadow-sm transition">
                                    Sign Up
                                </Link>
                            </>
                        )}
                        
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;