import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { addToCart } from "../features/cart/cartSlice";

const Shop = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  // 🚀 NAYA: Filter States
  const [sort, setSort] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [activeFilters, setActiveFilters] = useState({ minPrice: "", maxPrice: "" });

  const { items, loading, error } = useSelector((state) => state.products);

  useEffect(() => {
    // 🚀 REDUX API CALL (Search + Filters + Sort)
    const queryObj = {
      ...(searchQuery && { search: searchQuery }),
      ...(activeFilters.minPrice && { minPrice: activeFilters.minPrice }),
      ...(activeFilters.maxPrice && { maxPrice: activeFilters.maxPrice }),
      ...(sort && { sort })
    };
    dispatch(fetchProducts(queryObj));
  }, [dispatch, searchQuery, activeFilters, sort]);

  // Apply Price Filter
  const handleApplyPrice = () => {
    setActiveFilters({ minPrice, maxPrice });
  };

  // Clear All Filters & Search
  const clearAllFilters = () => {
    setSearchParams({}); // Clear URL Search
    setSort("");
    setMinPrice("");
    setMaxPrice("");
    setActiveFilters({ minPrice: "", maxPrice: "" });
  };

  const SkeletonLoader = () => (
    <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-4 animate-pulse">
      <div className="bg-[#1a1a1a] h-56 rounded-xl w-full mb-4"></div>
      <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-[#1a1a1a] rounded w-1/2 mb-4"></div>
      <div className="h-10 bg-[#1a1a1a] rounded-lg w-full mt-auto"></div>
    </div>
  );

  // Check if any filter is active
  const isFilterActive = searchQuery || activeFilters.minPrice || activeFilters.maxPrice || sort;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* 👑 SHOP HEADER */}
        <div className="mb-10 border-b border-white/5 pb-6 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-2">
              {searchQuery ? "Search Results" : "The Complete Collection"}
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              {searchQuery ? `Showing results for "${searchQuery}"` : "Resin Artifact Vault"}
            </h1>
          </div>

          {isFilterActive && (
            <button 
              onClick={clearAllFilters} 
              className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#D4AF37] transition-colors border border-white/10 px-4 py-2 rounded-sm cursor-pointer"
            >
              Clear All Filters ✕
            </button>
          )}
        </div>

        {error && (
          <div className="text-center text-red-500 font-bold py-4 bg-[#0a0a0a] rounded-2xl border border-red-500/20 mb-8">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 🎛️ LEFT SIDEBAR: FILTERS */}
          <div className="w-full lg:w-1/4 flex flex-col gap-8">
            <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 shadow-2xl lg:sticky lg:top-28">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 border-b border-white/10 pb-4">
                Refine Vault
              </h3>

              {/* SORTING */}
              <div className="mb-8">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Sort By</label>
                <select 
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 text-white text-xs font-bold p-3 rounded-sm outline-none focus:border-[#D4AF37] transition-all cursor-pointer"
                >
                  <option value="">Latest Artifacts</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* PRICE RANGE */}
              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Price Range (₹)</label>
                <div className="flex items-center gap-2 mb-4">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-1/2 bg-[#121212] border border-white/10 text-white text-xs font-bold p-3 rounded-sm outline-none focus:border-[#D4AF37] transition-all"
                  />
                  <span className="text-gray-500">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-1/2 bg-[#121212] border border-white/10 text-white text-xs font-bold p-3 rounded-sm outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
                <button 
                  onClick={handleApplyPrice}
                  className="w-full py-2.5 bg-transparent border border-[#D4AF37] text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-[#D4AF37] hover:text-black transition-all cursor-pointer"
                >
                  Apply Price
                </button>
              </div>
              
              {/* Category placeholder (To be integrated later when you have category APIs) */}
              <div className="mt-8 pt-6 border-t border-white/10">
                 <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Categories coming soon...</p>
              </div>
            </div>
          </div>

          {/* 💎 RIGHT SIDE: PRODUCT GRID */}
          <div className="w-full lg:w-3/4">
            {!loading && items.length === 0 ? (
              <div className="text-center py-20 bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-2xl flex flex-col items-center justify-center">
                <span className="text-5xl mb-4 opacity-80 block drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">🔦</span>
                <h3 className="text-xl font-black text-white mb-2 tracking-wide">Artifact Not Found</h3>
                <p className="text-gray-400 font-medium text-xs mb-6 max-w-md">
                    No masterpiece matches your selected filters in the vault.
                </p>
                <button 
                    onClick={clearAllFilters} 
                    className="px-6 py-3 bg-[#D4AF37] text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-sm hover:bg-[#FCF6BA] transition-transform duration-300 cursor-pointer"
                >
                    Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading
                  ? [...Array(6)].map((_, index) => <SkeletonLoader key={index} />)
                  : Array.isArray(items) &&
                    items.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => navigate(`/product/${product.slug}`)}
                        className="group bg-[#0a0a0a] rounded-2xl border border-white/5 hover:border-[#D4AF37]/40 shadow-xl transition-all duration-500 overflow-hidden flex flex-col hover:-translate-y-1 cursor-pointer"
                      >
                        {/* Image Box */}
                        <div className="h-60 bg-[#121212] overflow-hidden relative">
                          <img
                            src={product.images?.[0] || "https://res.cloudinary.com/duqcmfuei/image/upload/v1792086158/lord_radhe_dbvobi.jpg"}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60"></div>
                          {!product.inStock && (
                            <div className="absolute top-3 right-3 bg-red-500/90 text-white text-[9px] font-black px-3 py-1 rounded-sm uppercase tracking-widest backdrop-blur-md">Sold Out</div>
                          )}
                        </div>

                        {/* Content Box */}
                        <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-[#0a0a0a] to-[#070707]">
                          <h3 className="text-base font-bold text-white mb-2 tracking-wide truncate group-hover:text-[#D4AF37] transition-colors">{product.name}</h3>
                          <p className="text-[11px] text-gray-400 mb-4 line-clamp-2 leading-relaxed font-medium">{product.description}</p>
                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                            <span className="text-lg font-black text-[#D4AF37] tracking-tight">₹{product.basePrice}</span>
                            <button
                              disabled={!product.inStock}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await dispatch(addToCart({ productId: product._id, quantity: 1, selectedSize: "Standard", selectedColor: product.colors?.[0] || "Default", selectedAddons: [] })).unwrap();
                                  toast.success(`${product.name} added! 💎`);
                                } catch (err) {
                                  toast.error(err || "Error");
                                }
                              }}
                              className="px-3 py-2 bg-[#D4AF37] text-black text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-[#e5c158] disabled:opacity-50 transition-all cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;