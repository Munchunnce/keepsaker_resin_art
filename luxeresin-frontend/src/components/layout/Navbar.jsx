import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../features/auth/authSlice";
import toast from "react-hot-toast";

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const totalCartItems = useSelector((state) => state.cart.totalQuantity) || 0;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // 🚀 SEARCH STATE
  const [searchTerm, setSearchTerm] = useState("");

  const userData = user?.user || user?.data || user;
  const firstName = userData?.full_name?.split(" ")[0] || "User";

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Vault locked successfully! 👋");
      navigate("/");
    } catch (error) {
      toast.error(`Logout failed: ${error?.message || "Please try again"}`);
    }
  };

  // 🚀 SEARCH LOGIC
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
        navigate(`/products?search=${searchTerm}`);
        setSearchTerm(""); // Search submit hone ke baad box clear
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* LEFT: BRAND LOGO */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              to="/"
              className="text-2xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] hover:scale-105 transition-transform"
            >
              LUXERESIN
            </Link>
          </div>

          {/* MIDDLE: NAVIGATION & SEARCH (Desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 hover:text-[#D4AF37] transition-colors">
              Shop
            </Link>
            <Link to="/categories" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 hover:text-[#D4AF37] transition-colors">
              Categories
            </Link>
            <Link to="/about" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 hover:text-[#D4AF37] transition-colors">
              About Us
            </Link>
            
            {/* 🔍 SEARCH BAR */}
            <form onSubmit={handleSearch} className="flex items-center bg-[#121212] border border-white/10 rounded-sm px-4 py-2 focus-within:border-[#D4AF37] focus-within:ring-1 focus-within:ring-[#D4AF37] transition-all ml-4">
                <input 
                    type="text" 
                    placeholder="SEARCH VAULT..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent text-[10px] font-black text-white placeholder-gray-600 outline-none w-40 uppercase tracking-[0.1em]"
                />
                <button type="submit" className="text-gray-500 hover:text-[#D4AF37] ml-2 text-sm transition-colors cursor-pointer">
                    🔍
                </button>
            </form>
          </div>

          {/* RIGHT: DYNAMIC AUTH SECTION */}
          <div className="flex items-center space-x-5">
            {isAuthenticated ? (
              <>
                <span className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                  {firstName}
                </span>
                
                <Link to="/my-orders" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors">
                  Orders
                </Link>
                
                {/* CART BUTTON */}
                <Link to="/cart" className="relative p-2 text-gray-400 hover:text-[#D4AF37] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {totalCartItems > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[9px] font-black text-black transform translate-x-1/4 -translate-y-1/4 bg-[#D4AF37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                      {totalCartItems}
                    </span>
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  className="hidden sm:block ml-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] rounded-sm transition-all cursor-pointer"
                >
                  Lock
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 hover:text-[#D4AF37] transition-colors">
                  Log In
                </Link>
                <Link to="/register" className="px-5 py-2.5 text-[10px] font-black text-black bg-[#D4AF37] uppercase tracking-[0.2em] hover:bg-[#FCF6BA] rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all">
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