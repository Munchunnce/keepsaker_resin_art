import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { addToCart } from "../features/cart/cartSlice";

const Shop = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.products);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const SkeletonLoader = () => (
    <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-4 animate-pulse">
      <div className="bg-[#1a1a1a] h-64 rounded-xl w-full mb-4"></div>
      <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-[#1a1a1a] rounded w-1/2 mb-4"></div>
      <div className="h-10 bg-[#1a1a1a] rounded-lg w-full mt-auto"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* SHOP HEADER */}
        <div className="mb-12 border-b border-white/5 pb-6">
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-2">The Complete Collection</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Resin Artifact Vault
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-xl font-medium">
            Explore our entire gallery of handcrafted luxury resin frames, clocks, and bespoke art pieces.
          </p>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="text-center text-red-500 font-bold py-10 bg-[#0a0a0a] rounded-2xl border border-red-500/20">
            {error}
          </div>
        )}

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading
            ? [...Array(8)].map((_, index) => <SkeletonLoader key={index} />)
            : Array.isArray(items) &&
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
                            toast.success(`${product.name} added to vault bag! 💎`);
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

export default Shop;