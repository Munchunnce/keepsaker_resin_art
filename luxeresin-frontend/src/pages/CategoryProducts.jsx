import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { addToCart } from "../features/cart/cartSlice";

const CategoryProducts = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [categoryData, setCategoryData] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategoryDetails = async () => {
            if (!slug || slug === "undefined") {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await axiosInstance.get(`/categories/${slug}`);

                if (res.data.success) {
                    setCategoryData(res.data.data.category);
                    setProducts(res.data.data.products || []);
                }
            } catch (err) {
                toast.error(err?.response?.data?.message || "Failed to load category collection");
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryDetails();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#D4AF37] font-black tracking-widest uppercase animate-pulse">
                Forging Collection...
            </div>
        );
    }

    if (!categoryData) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-3xl font-black text-white mb-4">Category Not Found</h2>
                <p className="text-gray-400 mb-8">
                    The vault you are looking for does not exist or has been hidden.
                </p>
                <button
                    onClick={() => navigate("/products")}
                    className="px-6 py-3 bg-[#D4AF37] text-black font-black uppercase tracking-widest text-xs rounded-sm hover:scale-105 transition-transform cursor-pointer"
                >
                    Back to Catalog
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* CATEGORY BANNER HEADER */}
                <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-16 border border-white/10 flex items-center justify-center text-center p-6 shadow-2xl">
                    <img
                        src={categoryData.image}
                        alt={categoryData.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />

                    <div className="relative z-10 space-y-3 max-w-2xl">
                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">
                            Exclusive Category
                        </p>
                        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] tracking-tight">
                            {categoryData.name}
                        </h1>
                        {categoryData.description && (
                            <p className="text-xs md:text-sm text-gray-300 font-medium leading-relaxed">
                                {categoryData.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* PRODUCTS GRID */}
                {products.length === 0 ? (
                    <div className="text-center py-20 bg-[#0a0a0a] rounded-2xl border border-white/5 shadow-inner">
                        <span className="text-4xl mb-4 block">🛠️</span>
                        <h3 className="text-xl font-black text-white mb-2">Vault is Empty</h3>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                            No artifacts currently forged in this category.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((product) => {
                            const hasDiscount =
                                product.discountPrice > 0 && product.discountPrice < product.basePrice;
                            const displayPrice = hasDiscount ? product.discountPrice : product.basePrice;
                            const defaultSize = product.sizes?.[0]?.sizeLabel || "Standard";
                            const defaultColor = product.colors?.[0] || "Default";

                            return (
                                <div
                                    key={product._id}
                                    onClick={() => navigate(`/product/${product.slug}`)}
                                    className="group bg-[#0a0a0a] rounded-2xl border border-white/5 hover:border-[#D4AF37]/40 shadow-2xl transition-all duration-500 overflow-hidden flex flex-col hover:-translate-y-1.5 cursor-pointer"
                                >
                                    <div className="h-72 bg-[#121212] overflow-hidden relative">
                                        <img
                                            src={product.images?.[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60" />
                                    </div>

                                    <div className="p-6 flex flex-col flex-grow bg-gradient-to-b from-[#0a0a0a] to-[#070707]">
                                        <h3 className="text-lg font-bold text-white mb-2 tracking-wide truncate group-hover:text-[#D4AF37] transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 mb-6 line-clamp-2 leading-relaxed font-medium">
                                            {product.description}
                                        </p>

                                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5 gap-2">
                                            <div>
                                                <span className="text-xl font-black text-[#D4AF37] tracking-tight">
                                                    ₹{displayPrice.toLocaleString("en-IN")}
                                                </span>
                                                {hasDiscount && (
                                                    <span className="block text-[11px] text-gray-500 line-through">
                                                        ₹{product.basePrice.toLocaleString("en-IN")}
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                disabled={!product.inStock}
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await dispatch(
                                                            addToCart({
                                                                productId: product._id,
                                                                quantity: 1,
                                                                selectedSize: defaultSize,
                                                                selectedColor: defaultColor,
                                                                selectedAddons: [],
                                                            })
                                                        ).unwrap();
                                                        toast.success(`${product.name} added to bag! 💎`);
                                                    } catch (err) {
                                                        toast.error(err || "Error adding to bag");
                                                    }
                                                }}
                                                className="px-4 py-2.5 bg-[#D4AF37] text-black text-xs font-black uppercase tracking-widest rounded-sm hover:bg-[#e5c158] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] cursor-pointer"
                                            >
                                                {product.inStock ? "Add to Bag" : "Sold Out"}
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
    );
};

export default CategoryProducts;