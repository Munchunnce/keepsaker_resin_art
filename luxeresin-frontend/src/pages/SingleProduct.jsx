import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductBySlug,
  clearSingleProduct,
} from "../features/products/productSlice";
import { addToCart } from "../features/cart/cartSlice";
import toast from "react-hot-toast";

const SingleProduct = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentProduct, singleLoading, singleError } = useSelector(
    (state) => state.products,
  );

  const [mainImage, setMainImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  
  const [isZooming, setIsZooming] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({});

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));
    return () => {
      dispatch(clearSingleProduct());
    };
  }, [dispatch, slug]);

  if (singleLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-16 animate-pulse">
        <div className="aspect-square bg-gray-200 rounded-3xl"></div>
        <div className="space-y-6 pt-10">
          <div className="h-10 bg-gray-200 rounded-lg w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  if (singleError) {
    return <div className="text-center py-20 text-red-500 font-bold">{singleError}</div>;
  }

  if (!currentProduct) {
    return <div className="text-center py-20">Product not found.</div>;
  }

  const displayedMainImage = mainImage || currentProduct?.images?.[0] || "https://via.placeholder.com/800";
  const activeColor = selectedColor || currentProduct?.colors?.[0] || "";

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ backgroundPosition: `${x}% ${y}%` });
  };

  return (
    <div className="bg-white min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
        
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center text-sm font-semibold text-gray-500 hover:text-black transition-colors"
        >
          <span className="mr-2">←</span> Back to Collection
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          <div className="relative">
            <div className="md:sticky md:top-24 space-y-6">
              
              <div 
                className="aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 shadow-2xl relative cursor-crosshair"
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
              >
                <img
                  src={displayedMainImage}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {currentProduct.images?.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      displayedMainImage === img
                        ? "border-black scale-105 shadow-md"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative flex flex-col pt-2 md:pt-10">
            
            {/* 🚀 THE ZOOM OVERLAY MAGIC (Height wahi hai, Width ko left-right stretch kar diya) */}
            {isZooming && (
              <div 
                className="hidden md:block absolute top-0 bottom-0 -left-6 -right-16 lg:-right-24 xl:-right-32 z-50 bg-white pointer-events-none rounded-3xl shadow-2xl border border-gray-100"
                style={{
                  backgroundImage: `url(${displayedMainImage})`,
                  backgroundSize: '250%', 
                  backgroundRepeat: 'no-repeat',
                  ...zoomStyle, 
                }}
              ></div>
            )}

            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {currentProduct.name}
            </h1>
            <p className="text-3xl font-light text-black mt-4">
              ₹{currentProduct.basePrice}
            </p>

            <div className="mt-8">
              <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">
                The Artpiece
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                {currentProduct.description}
              </p>
            </div>

            {currentProduct.colors?.length > 0 && (
              <div className="mt-10">
                <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">
                  Edition Color
                </h3>
                <div className="flex gap-3">
                  {currentProduct.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(color)}
                      className={`px-5 py-3 rounded-full text-sm font-semibold border-2 transition-all ${
                        activeColor === color
                          ? "border-black bg-black text-white shadow-lg"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <hr className="my-10 border-gray-100" />

            <div className="flex items-center gap-6 text-sm text-gray-500 font-medium mb-10">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    currentProduct.inStock
                      ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                      : "bg-red-500"
                  }`}
                ></span>
                {currentProduct.inStock
                  ? "In Stock & Ready to Ship"
                  : "Currently Unavailable"}
              </div>
              <div>•</div>
              <div>Lead Time: {currentProduct.leadTimeDays} Days</div>
            </div>

            <button
              disabled={!currentProduct.inStock}
              // onClick={() => {
              //   dispatch(
              //     addToCart({
              //       _id: currentProduct._id,
              //       name: currentProduct.name,
              //       basePrice: currentProduct.basePrice,
              //       image: displayedMainImage,
              //       selectedColor: activeColor || null,
              //     }),
              //   );
              //   toast.success(`${currentProduct.name} added to cart! 🛍️`);
              // }}
              onClick={async () => {
                try {
                  // 🚨 FIX: payload map to productId standard as backend validates
                  await dispatch(
                    addToCart({
                      productId: currentProduct._id, 
                      quantity: 1,
                      selectedSize: activeColor ? "Standard" : "24x24 Inches", // Example mapping
                      selectedColor: activeColor || "Default",
                      selectedAddons: [] // If addons not dynamic, empty array array validations require sort check
                    })
                  ).unwrap();
                  toast.success(`${currentProduct.name} added to cart! 🛍️`);
                } catch (err) {
                  toast.error(err || 'Failed to add item to Cart');
                }
              }}
              className="w-full py-5 bg-black text-white text-lg font-bold rounded-2xl hover:bg-gray-900 hover:shadow-2xl hover:-translate-y-1 transform transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {currentProduct.inStock
                ? `Add to Cart — ₹${currentProduct.basePrice}`
                : "Sold Out"}
            </button>

            <div className="mt-8 grid grid-cols-2 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="text-black text-lg">✦</span> Handcrafted Quality
              </div>
              <div className="flex items-center gap-2">
                <span className="text-black text-lg">✦</span> Secure Checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleProduct;