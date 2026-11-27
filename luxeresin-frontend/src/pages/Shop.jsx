import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { addToCart } from "../features/cart/cartSlice";

// Component ke bahar rakha taaki har render par recreate na ho
const SkeletonLoader = () => (
  <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-4 animate-pulse">
    <div className="bg-[#1a1a1a] h-56 rounded-xl w-full mb-4"></div>
    <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-[#1a1a1a] rounded w-1/2 mb-4"></div>
    <div className="h-10 bg-[#1a1a1a] rounded-lg w-full mt-auto"></div>
  </div>
);

const getErrorMessage = (err, fallback) =>
  typeof err === "string"
    ? err
    : err?.response?.data?.message || err?.message || fallback;

const Shop = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryQuery = searchParams.get("category") || "";

  // Filter States
  const [sort, setSort] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [activeFilters, setActiveFilters] = useState({ minPrice: "", maxPrice: "" });
  const [addingId, setAddingId] = useState(null);

  const { items = [], loading, error } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const safeItems = Array.isArray(items) ? items : [];

  useEffect(() => {
    const queryObj = {
      ...(searchQuery && { search: searchQuery }),
      ...(categoryQuery && { category: categoryQuery }),
      ...(activeFilters.minPrice !== "" && { minPrice: activeFilters.minPrice }),
      ...(activeFilters.maxPrice !== "" && { maxPrice: activeFilters.maxPrice }),
      ...(sort && { sort }),
    };
    dispatch(fetchProducts(queryObj));
  }, [dispatch, searchQuery, categoryQuery, activeFilters, sort]);

  // Apply Price Filter (with Validation + Enter key support)
  const handleApplyPrice = (e) => {
    e.preventDefault();
    const min = minPrice.trim();
    const max = maxPrice.trim();

    if ((min !== "" && Number(min) < 0) || (max !== "" && Number(max) < 0)) {
      toast.error("Price cannot be negative.");
      return;
    }

    if (min !== "" && max !== "" && Number(min) > Number(max)) {
      toast.error("Minimum price cannot be greater than maximum price.");
      return;
    }

    setActiveFilters({ minPrice: min, maxPrice: max });
  };

  // Clear All Filters & Search
  const clearAllFilters = () => {
    setSearchParams({});
    setSort("");
    setMinPrice("");
    setMaxPrice("");
    setActiveFilters({ minPrice: "", maxPrice: "" });
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    if (!product.inStock || addingId === product._id) return;

    if (!isAuthenticated) {
      toast.error("Please login to add artifacts to your bag.");
      navigate("/login");
      return;
    }

    const defaultSize = product.sizes?.[0]?.sizeLabel || "Standard";
    const defaultColor = product.colors?.[0] || "Default";

    try {
      setAddingId(product._id);
      await dispatch(
        addToCart({
          productId: product._id,
          quantity: 1,
          selectedSize: defaultSize,
          selectedColor: defaultColor,
          selectedAddons: [],
        })
      ).unwrap();
      toast.success(`${product.name} added to vault bag! 💎`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add artifact to bag."));
    } finally {
      setAddingId(null);
    }
  };

  const isFilterActive = Boolean(
    searchQuery ||
      categoryQuery ||
      activeFilters.minPrice !== "" ||
      activeFilters.maxPrice !== "" ||
      sort
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 py-12 px-4 sm:px-6 lg:px-8 relative overflow-x-clip">
      {/* Subtle Ambient Gold Glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] bg-[#D4AF37]/8 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* SHOP HEADER */}
        <div className="mb-10 border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.35em] mb-2">
              {searchQuery ? "Search Results" : "The Complete Collection"}
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] tracking-tight">
              {searchQuery ? `Results for "${searchQuery}"` : "Resin Artifact Vault"}
            </h1>
            {!loading && (
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-2">
                {safeItems.length} {safeItems.length === 1 ? "Artifact" : "Artifacts"} Available
              </p>
            )}
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors border border-white/15 bg-[#0c0c0c] px-4 py-2.5 rounded-sm cursor-pointer"
            >
              Clear All Filters ✕
            </button>
          )}
        </div>

        {error && (
          <div className="text-center text-red-400 font-bold py-4 bg-red-500/10 rounded-2xl border border-red-500/25 mb-8">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT SIDEBAR: 3D FILTERS PANEL */}
          <div className="w-full lg:w-1/4 flex flex-col gap-8">
            <div className="bg-gradient-to-b from-[#0e0e0e] to-[#080808] p-6 rounded-2xl border border-white/10 border-t-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)] lg:sticky lg:top-28">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.25em] mb-6 border-b border-white/10 pb-4">
                Refine Vault
              </h3>

              {/* SORTING */}
              <div className="mb-8">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 text-white text-xs font-bold p-3 rounded-lg outline-none focus:border-[#D4AF37] transition-all cursor-pointer"
                >
                  <option value="">Latest Artifacts</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* PRICE RANGE FORM */}
              <form onSubmit={handleApplyPrice} className="mb-6">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                  Price Range (₹)
                </label>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-1/2 bg-[#050505] border border-white/10 text-white text-xs font-bold p-3 rounded-lg outline-none focus:border-[#D4AF37] transition-all"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-1/2 bg-[#050505] border border-white/10 text-white text-xs font-bold p-3 rounded-lg outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-transparent border border-[#D4AF37] text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-[#D4AF37] hover:text-black transition-all cursor-pointer"
                >
                  Apply Price
                </button>
              </form>

              {/* CATEGORIES SHORTCUT */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">
                  Browse By Style
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/categories")}
                  className="w-full py-2.5 px-3 bg-white/5 hover:bg-[#D4AF37]/15 border border-white/10 hover:border-[#D4AF37]/40 text-gray-200 hover:text-[#FCF6BA] text-[10px] font-black uppercase tracking-[0.2em] rounded-sm transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>All Categories</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: PRODUCT GRID */}
          <div className="w-full lg:w-3/4">
            {!loading && safeItems.length === 0 ? (
              <div className="text-center py-20 bg-gradient-to-b from-[#0e0e0e] to-[#080808] border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center justify-center px-6">
                <span className="text-5xl mb-4 opacity-80 block drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                  🔦
                </span>
                <h3 className="text-xl font-black text-white mb-2 tracking-wide">
                  Artifact Not Found
                </h3>
                <p className="text-gray-400 font-medium text-xs mb-6 max-w-md">
                  No masterpiece matches your selected filters in the vault.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-sm hover:scale-105 transition-transform duration-300 cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading
                  ? [...Array(6)].map((_, index) => <SkeletonLoader key={index} />)
                  : safeItems.map((product) => {
                      const basePrice = Number(product.basePrice) || 0;
                      const discountPrice = Number(product.discountPrice) || 0;
                      const hasDiscount =
                        discountPrice > 0 && discountPrice < basePrice;
                      const displayPrice = hasDiscount ? discountPrice : basePrice;
                      const discountPercent = hasDiscount
                        ? Math.round(((basePrice - discountPrice) / basePrice) * 100)
                        : 0;
                      const isAdding = addingId === product._id;

                      return (
                        <div
                          key={product._id}
                          onClick={() => navigate(`/product/${product.slug}`)}
                          className="group bg-gradient-to-b from-[#0d0d0d] to-[#070707] rounded-2xl border border-white/10 hover:border-[#D4AF37]/45 shadow-xl transition-all duration-500 overflow-hidden flex flex-col hover:-translate-y-1.5 cursor-pointer"
                        >
                          {/* Image Box */}
                          <div className="h-60 bg-[#121212] overflow-hidden relative">
                            <img
                              src={
                                product.images?.[0] ||
                                "https://res.cloudinary.com/duqcmfuei/image/upload/v1792086158/lord_radhe_dbvobi.jpg"
                              }
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-65"></div>

                            {hasDiscount && product.inStock && (
                              <div className="absolute top-3 left-3 bg-[#050505]/85 border border-[#D4AF37]/40 text-[#FCF6BA] text-[9px] font-black px-2.5 py-1 rounded-sm uppercase tracking-widest backdrop-blur-md">
                                {discountPercent}% OFF
                              </div>
                            )}

                            {!product.inStock && (
                              <div className="absolute top-3 right-3 bg-red-500/90 text-white text-[9px] font-black px-3 py-1 rounded-sm uppercase tracking-widest backdrop-blur-md">
                                Sold Out
                              </div>
                            )}
                          </div>

                          {/* Content Box */}
                          <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-base font-bold text-white mb-2 tracking-wide truncate group-hover:text-[#D4AF37] transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-[11px] text-gray-400 mb-4 line-clamp-2 leading-relaxed font-medium">
                              {product.description}
                            </p>

                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10 gap-2">
                              <div>
                                <span className="text-lg font-black text-[#D4AF37] tracking-tight">
                                  ₹{displayPrice.toLocaleString("en-IN")}
                                </span>
                                {hasDiscount && (
                                  <span className="block text-[10px] text-gray-500 line-through">
                                    ₹{basePrice.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                disabled={!product.inStock || isAdding}
                                onClick={(e) => handleAddToCart(e, product)}
                                className="px-3.5 py-2 bg-[#D4AF37] text-black text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-[#FCF6BA] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                              >
                                {!product.inStock
                                  ? "Sold Out"
                                  : isAdding
                                  ? "Adding..."
                                  : "Add to Bag"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;