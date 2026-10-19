import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { addToCart } from "../features/cart/cartSlice";

const Home = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.products);
  const navigate = useNavigate();

  // Page load hote hi backend se data mango
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // 💀 SKELETON LOADER COMPONENT (Apple Style Shimmer)
  const SkeletonLoader = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
      <div className="bg-gray-200 h-64 rounded-xl w-full mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-10 bg-gray-200 rounded-lg w-full mt-auto"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HERO SECTION */}
      <div className="bg-black text-white py-20 px-4 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          Masterpieces in Resin
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Handcrafted luxury resin art. Elevate your living space with our
          exclusive, one-of-a-kind collections.
        </p>
      </div>

      {/* PRODUCT GRID SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Latest Arrivals
        </h2>

        {/* ERROR STATE */}
        {error && (
          <div className="text-center text-red-500 font-bold py-10">
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
                  // 1. Poore card par click karne se Single Product par jayega
                  onClick={() => navigate(`/product/${product.slug}`)}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col"
                >
                  {/* Image Box */}
                  <div className="h-64 bg-gray-100 overflow-hidden relative">
                    <img
                      /* FIX 1: URL seedha array se uthao kyunki aapka DB strings bhej raha hai */
                      src={
                        product.images[0] ||
                        "https://res.cloudinary.com/duqcmfuei/image/upload/v1792086158/lord_radhe_dbvobi.jpg"
                      }
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* FIX 2: inStock boolean use kiya out-of-stock badge ke liye */}
                    {!product.inStock && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        Sold Out
                      </div>
                    )}
                  </div>

                  {/* Content Box */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xl font-extrabold text-black">
                        {/* FIX 3: MongoDB mein basePrice hai, price nahi */}₹
                        {product.basePrice}
                      </span>
                      <button
                        disabled={!product.inStock}
                        // 2. e.stopPropagation() se card ka click event ruk jayega aur user redirect nahi hoga!
                        // onClick={(e) => {
                        //   e.stopPropagation();
                        //   // Yahan future mein "dispatch(addToCart())" aayega
                        //   console.log("Added to cart directly!");
                        // }}
                        onClick={async (e) => {
                          e.stopPropagation(); // Stop card navigate page trigger

                          try {
                            await dispatch(
                              addToCart({
                                productId: product._id, // Back-end validation key
                                quantity: 1,
                                selectedSize: "Standard",
                                selectedColor: product.colors?.[0] || "Default",
                                selectedAddons: [],
                              }),
                            ).unwrap();

                            toast.success(`${product.name} added to cart! 🛍️`);
                          } catch (err) {
                            toast.error(err || "Error adding to bag");
                          }
                        }}
                        className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        Add to Cart
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
