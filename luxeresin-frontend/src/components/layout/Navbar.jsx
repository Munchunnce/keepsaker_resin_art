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

  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userData = user?.user || user?.data || user;
  const firstName = userData?.full_name?.split(" ")[0] || "User";
  const isAdmin = userData?.role?.toLowerCase() === "admin";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      closeMobileMenu();
      toast.success("Vault locked successfully! 👋");
      navigate("/");
    } catch (error) {
      toast.error(`Logout failed: ${error?.message || "Please try again"}`);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
      closeMobileMenu();
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* LEFT: BRAND LOGO */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="text-xl xl:text-2xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] hover:scale-105 transition-transform"
            >
              LUXERESIN
            </Link>
          </div>

          {/* MIDDLE: NAVIGATION & SEARCH (Desktop 1024px+) */}
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            <Link
              to="/products"
              className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-300 hover:text-[#D4AF37] transition-colors whitespace-nowrap"
            >
              Shop
            </Link>
            <Link
              to="/categories"
              className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37] hover:text-[#FCF6BA] transition-all drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] whitespace-nowrap"
            >
              Categories
            </Link>
            <Link
              to="/custom-art"
              className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37] hover:text-[#FCF6BA] transition-all drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] whitespace-nowrap"
            >
              Bespoke Art
            </Link>
            <Link
              to="/about"
              className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-300 hover:text-[#D4AF37] transition-colors whitespace-nowrap"
            >
              About Us
            </Link>

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-sm bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FCF6BA] hover:bg-[#D4AF37]/25 transition-all whitespace-nowrap"
              >
                Admin Vault
              </Link>
            )}

            {/* SEARCH BAR */}
            <form
              onSubmit={handleSearch}
              className="flex items-center bg-[#121212] border border-white/10 rounded-sm px-3 py-2 focus-within:border-[#D4AF37] focus-within:ring-1 focus-within:ring-[#D4AF37] transition-all"
            >
              <input
                type="text"
                placeholder="SEARCH VAULT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-[10px] font-black text-white placeholder-gray-600 outline-none w-28 xl:w-40 uppercase tracking-[0.1em]"
              />
              <button
                type="submit"
                className="text-gray-500 hover:text-[#D4AF37] ml-1.5 text-sm transition-colors cursor-pointer"
              >
                🔍
              </button>
            </form>
          </div>

          {/* RIGHT: DESKTOP AUTH SECTION (1024px+) */}
          <div className="hidden lg:flex items-center space-x-3 xl:space-x-5">
            {isAuthenticated ? (
              <>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37] whitespace-nowrap">
                  {firstName}
                </span>

                <Link
                  to="/my-orders"
                  className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                >
                  Orders
                </Link>

                {/* CART BUTTON */}
                <Link
                  to="/cart"
                  className="relative p-2 text-gray-400 hover:text-[#D4AF37] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  {totalCartItems > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[9px] font-black text-black transform translate-x-1/4 -translate-y-1/4 bg-[#D4AF37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                      {totalCartItems}
                    </span>
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3.5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] rounded-sm transition-all cursor-pointer"
                >
                  Lock
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-300 hover:text-[#D4AF37] transition-colors whitespace-nowrap"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2.5 text-[10px] font-black text-black bg-[#D4AF37] uppercase tracking-[0.18em] hover:bg-[#FCF6BA] rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* RIGHT: MOBILE & TABLET CART + HAMBURGER BUTTON (< 1024px) */}
          <div className="flex lg:hidden items-center space-x-3">
            {isAuthenticated && (
              <Link
                to="/cart"
                onClick={closeMobileMenu}
                className="relative p-2 text-gray-300 hover:text-[#D4AF37] transition-colors"
                aria-label="Cart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {totalCartItems > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[9px] font-black text-black transform translate-x-1/4 -translate-y-1/4 bg-[#D4AF37] rounded-full">
                    {totalCartItems}
                  </span>
                )}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="p-2 rounded-sm border border-white/10 text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE & TABLET SLIDE-DOWN MENU DRAWER (< 1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#080808]/98 backdrop-blur-2xl border-t border-white/10 px-4 sm:px-6 pt-5 pb-7 space-y-6 shadow-2xl">
          <form
            onSubmit={handleSearch}
            className="flex items-center bg-[#121212] border border-white/10 rounded-sm px-4 py-3 focus-within:border-[#D4AF37]"
          >
            <input
              type="text"
              placeholder="SEARCH VAULT ARTIFACTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs font-bold text-white placeholder-gray-500 outline-none w-full uppercase tracking-wider"
            />
            <button
              type="submit"
              className="text-gray-400 hover:text-[#D4AF37] ml-2 text-base cursor-pointer"
            >
              🔍
            </button>
          </form>

          <div className="flex flex-col space-y-3">
            <Link
              to="/products"
              onClick={closeMobileMenu}
              className="py-2 text-xs font-black uppercase tracking-[0.2em] text-gray-200 hover:text-[#D4AF37] border-b border-white/5"
            >
              Shop All Artifacts
            </Link>
            <Link
              to="/categories"
              onClick={closeMobileMenu}
              className="py-2 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] hover:text-[#FCF6BA] border-b border-white/5"
            >
              Categories
            </Link>
            <Link
              to="/custom-art"
              onClick={closeMobileMenu}
              className="py-2 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] hover:text-[#FCF6BA] border-b border-white/5"
            >
              Bespoke Art
            </Link>
            <Link
              to="/about"
              onClick={closeMobileMenu}
              className="py-2 text-xs font-black uppercase tracking-[0.2em] text-gray-200 hover:text-[#D4AF37] border-b border-white/5"
            >
              About Us
            </Link>

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                onClick={closeMobileMenu}
                className="py-2.5 px-3 text-xs font-black uppercase tracking-[0.2em] rounded-sm bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FCF6BA]"
              >
                👑 Admin Vault Dashboard
              </Link>
            )}
          </div>

          <div className="pt-2">
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                    Welcome, {firstName}
                  </span>
                  <Link
                    to="/my-orders"
                    onClick={closeMobileMenu}
                    className="text-xs font-black uppercase tracking-[0.2em] text-gray-300 hover:text-white underline underline-offset-4"
                  >
                    My Orders
                  </Link>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-3 text-xs font-black uppercase tracking-[0.2em] text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 rounded-sm transition-all cursor-pointer"
                >
                  Lock Vault (Logout)
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="py-3 text-center text-xs font-black uppercase tracking-[0.2em] text-gray-200 border border-white/15 hover:border-[#D4AF37] rounded-sm"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="py-3 text-center text-xs font-black uppercase tracking-[0.2em] text-black bg-[#D4AF37] hover:bg-[#FCF6BA] rounded-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;