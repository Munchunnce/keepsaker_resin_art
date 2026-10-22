import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { addToCart } from "../features/cart/cartSlice";
import CategoryShowcase from "../components/categoryShowcase/CategoryShowcase";

const Home = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.products);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // 💀 LUXURY SKELETON LOADER
  const SkeletonLoader = () => (
    <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-4 animate-pulse">
      <div className="bg-[#1a1a1a] h-64 rounded-xl w-full mb-4"></div>
      <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-[#1a1a1a] rounded w-1/2 mb-4"></div>
      <div className="h-10 bg-[#1a1a1a] rounded-lg w-full mt-auto"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 pb-20">
      {/* 🚀 ULTRA-LUXURY CINEMATIC HERO SECTION */}
      <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-black text-center px-4">
        {/* Background Resin Art Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop"
            alt="Luxury Resin Art Background"
            className="w-full h-full object-cover opacity-35 scale-105 animate-pulse duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 pt-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a0a0a]/80 border border-[#D4AF37]/40 backdrop-blur-md shadow-[0_0_20px_rgba(212,175,55,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#E5C158] animate-ping"></span>
            <span className="text-[10px] text-[#D4AF37] uppercase font-black tracking-[0.3em]">
              Exquisite Handcrafted Vault
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2A3] via-[#D4AF37] to-[#795B1B] drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_0_#997320,_0_2px_0_#805f18,_0_3px_0_#664b12,_0_4px_0_#4d380e,_0_6px_10px_rgba(0,0,0,0.8),_0_0_40px_rgba(212,175,55,0.5)]">
            Masterpieces in Resin
          </h1>

          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto font-medium tracking-wide">
            Handcrafted luxury resin art. Elevate your living space with our
            exclusive, one-of-a-kind collections forged to perfection.
          </p>

          <div className="pt-4">
            <a
              href="#products-section"
              className="inline-block px-8 py-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black uppercase tracking-[0.2em] text-xs rounded-sm shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-105 transition-transform"
            >
              Explore Collection ↓
            </a>
          </div>
        </div>
      </div>
      
      {/* Category show  */}
      <CategoryShowcase />
      {/* PRODUCT GRID SECTION */}
      <div
        id="products-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20"
      >
        <div className="flex justify-between items-end mb-10 border-b border-white/5 pb-6">
          <div>
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-1">
              Curated Artifacts
            </p>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Latest Arrivals
            </h2>
          </div>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest hidden sm:inline">
            Obsidian & Gold Edition
          </span>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="text-center text-red-500 font-bold py-10 bg-[#0a0a0a] rounded-2xl border border-red-500/20">
            {error} (Backend server chalu hai na boss?)
          </div>
        )}

        {/* THE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* CONDITION 1: LOADING SKELETONS */}
          {loading
            ? [...Array(8)].map((_, index) => <SkeletonLoader key={index} />)
            : /* CONDITION 2: ACTUAL PRODUCTS */
              Array.isArray(items) &&
              items.map((product) => (
                <div
                  key={product._id}
                  onClick={() => navigate(`/product/${product.slug}`)}
                  className="group bg-[#0a0a0a] rounded-2xl border border-white/5 hover:border-[#D4AF37]/40 shadow-2xl transition-all duration-500 overflow-hidden flex flex-col hover:-translate-y-1.5 cursor-pointer"
                >
                  {/* Image Box */}
                  <div className="h-72 bg-[#121212] overflow-hidden relative">
                    <img
                      src={
                        product.images?.[0] ||
                        "https://res.cloudinary.com/duqcmfuei/image/upload/v1792086158/lord_radhe_dbvobi.jpg"
                      }
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60"></div>

                    {!product.inStock && (
                      <div className="absolute top-3 right-3 bg-red-500/90 text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest backdrop-blur-md">
                        Sold Out
                      </div>
                    )}
                  </div>

                  {/* Content Box */}
                  <div className="p-6 flex flex-col flex-grow bg-gradient-to-b from-[#0a0a0a] to-[#070707]">
                    <h3 className="text-lg font-bold text-white mb-2 tracking-wide truncate group-hover:text-[#D4AF37] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-400 mb-6 line-clamp-2 leading-relaxed font-medium">
                      {product.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xl font-black text-[#D4AF37] tracking-tight">
                        ₹{product.basePrice}
                      </span>
                      <button
                        disabled={!product.inStock}
                        onClick={async (e) => {
                          e.stopPropagation();

                          try {
                            await dispatch(
                              addToCart({
                                productId: product._id,
                                quantity: 1,
                                selectedSize: "Standard",
                                selectedColor: product.colors?.[0] || "Default",
                                selectedAddons: [],
                              }),
                            ).unwrap();

                            toast.success(
                              `${product.name} added to vault bag! 💎`,
                            );
                          } catch (err) {
                            toast.error(err || "Error adding to bag");
                          }
                        }}
                        className="px-4 py-2.5 bg-[#D4AF37] text-black text-xs font-black uppercase tracking-widest rounded-sm hover:bg-[#e5c158] disabled:opacity-50 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.2)] cursor-pointer"
                      >
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
