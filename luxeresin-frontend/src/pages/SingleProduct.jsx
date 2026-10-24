import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductBySlug, clearSingleProduct } from "../features/products/productSlice";
import { addToCart } from "../features/cart/cartSlice";
import toast from "react-hot-toast";

const SingleProduct = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentProduct, singleLoading, singleError } = useSelector(
    (state) => state.products,
  );

  // States
  const [mainImage, setMainImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#D4AF37] font-black tracking-widest uppercase">
        Decoding The Vault...
      </div>
    );
  }

  if (singleError) {
    return <div className="text-center py-20 bg-[#050505] text-red-500 font-bold">{singleError}</div>;
  }

  if (!currentProduct) {
    return <div className="text-center py-20 bg-[#050505] text-white">Artifact not found.</div>;
  }

  // 🚀 FIX 1: Derived State (useEffect ki zaroorat nahi)
  // Agar user ne kuch select nahi kiya, toh default backend ki pehli value dikhao
  const displayedMainImage = mainImage || currentProduct?.images?.[0] || "https://via.placeholder.com/800";
  const activeColor = selectedColor || currentProduct?.colors?.[0] || "";
  const activeSize = selectedSize || currentProduct?.sizes?.[0] || null;

  // 🚀 DYNAMIC PRICE CALCULATOR
  const calculateFinalPrice = () => {
    let total = currentProduct.basePrice || 0;
    
    // Naya logic: ab activeSize use karenge taaki load hote hi price sahi dikhe
    if (activeSize && activeSize.priceModifier) {
      total += activeSize.priceModifier;
    }
    
    // Addons ka extra price jodo
    selectedAddons.forEach(addonName => {
      const addon = currentProduct.addons?.find(a => a.addonName === addonName);
      if (addon) total += addon.extraPrice;
    });

    return total;
  };

  const finalPrice = calculateFinalPrice();

  // 🚀 FIX 2: Addon Toggle Handler (Ab yeh niche click par use hoga)
  const toggleAddon = (addonName) => {
    setSelectedAddons(prev => 
      prev.includes(addonName) 
        ? prev.filter(item => item !== addonName) // Pehle se hai toh hatao
        : [...prev, addonName] // Nahi hai toh add karo
    );
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ backgroundPosition: `${x}% ${y}%` });
  };

  return (
    <div className="bg-[#050505] min-h-screen pb-24 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
        
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center text-xs font-black uppercase tracking-widest text-[#D4AF37] hover:text-[#FCF6BA] transition-colors cursor-pointer"
        >
          <span className="mr-2">←</span> Back to Vault
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* LEFT: IMAGE SECTION */}
          <div className="relative">
            <div className="md:sticky md:top-24 space-y-6">
              <div 
                className="aspect-square bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative cursor-crosshair group"
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
              >
                <img
                  src={displayedMainImage}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-40"></div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {currentProduct.images?.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      displayedMainImage === img
                        ? "border-[#D4AF37] scale-105 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                        : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`thumbnail-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: DETAILS SECTION */}
          <div className="relative flex flex-col pt-2 md:pt-6">
            
            {/* ZOOM OVERLAY MAGIC */}
            {isZooming && (
              <div 
                className="hidden md:block absolute top-0 bottom-0 -left-6 -right-16 lg:-right-24 xl:-right-32 z-50 bg-[#0a0a0a] pointer-events-none rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#D4AF37]/30"
                style={{
                  backgroundImage: `url(${displayedMainImage})`,
                  backgroundSize: '250%', 
                  backgroundRepeat: 'no-repeat',
                  ...zoomStyle, 
                }}
              ></div>
            )}

            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-2">Exclusive Artifact</p>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {currentProduct.name}
            </h1>
            
            {/* 🚀 DYNAMIC MAIN PRICE */}
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] mt-4 transition-all duration-300">
              ₹{finalPrice}
            </p>

            <div className="mt-8">
              <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-3 border-b border-white/5 pb-2">
                The Masterpiece
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed font-medium">
                {currentProduct.description}
              </p>
            </div>

            {/* 🎨 COLORS SELECTION */}
            {currentProduct.colors?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-4">Edition Color</h3>
                <div className="flex flex-wrap gap-3">
                  {currentProduct.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(color)}
                      className={`px-5 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest border transition-all cursor-pointer ${
                        activeColor === color
                          ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                          : "border-white/10 bg-[#121212] text-gray-400 hover:border-white/30"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 📐 SIZES SELECTION */}
            {currentProduct.sizes?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-4">Dimensions</h3>
                <div className="flex flex-wrap gap-3">
                  {currentProduct.sizes.map((size, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest border transition-all flex flex-col items-start cursor-pointer ${
                        activeSize?.sizeLabel === size.sizeLabel
                          ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                          : "border-white/10 bg-[#121212] text-gray-400 hover:border-white/30"
                      }`}
                    >
                      <span>{size.sizeLabel}</span>
                      {size.priceModifier > 0 && (
                        <span className="text-[9px] mt-1 opacity-70">+₹{size.priceModifier}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ✨ ADDONS SELECTION */}
            {currentProduct.addons?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-4">Enhance Your Artifact</h3>
                <div className="space-y-3">
                  {currentProduct.addons.map((addon, idx) => {
                    const isSelected = selectedAddons.includes(addon.addonName);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleAddon(addon.addonName)}
                        className={`flex items-center justify-between p-4 rounded-sm border cursor-pointer transition-all ${
                          isSelected ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-white/5 bg-[#121212] hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${isSelected ? "border-[#D4AF37] bg-[#D4AF37]" : "border-gray-600 bg-transparent"}`}>
                             {isSelected && <span className="text-black text-[10px]">✔</span>}
                          </div>
                          <span className={`text-sm font-bold ${isSelected ? "text-[#D4AF37]" : "text-gray-300"}`}>{addon.addonName}</span>
                        </div>
                        <span className="text-xs font-black text-gray-400">+₹{addon.extraPrice}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <hr className="my-10 border-white/5" />

            <div className="flex flex-wrap items-center gap-6 text-xs font-black tracking-widest uppercase text-gray-500 mb-10">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${currentProduct.inStock ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500"}`}></span>
                {currentProduct.inStock ? <span className="text-green-500">In Stock</span> : <span className="text-red-500">Sold Out</span>}
              </div>
              <div>|</div>
              <div>Lead Time: {currentProduct.leadTimeDays} Days</div>
            </div>

            <button
              disabled={!currentProduct.inStock}
              onClick={async () => {
                try {
                  await dispatch(
                    addToCart({
                      productId: currentProduct._id, 
                      quantity: 1,
                      selectedSize: activeSize?.sizeLabel || "Standard", 
                      selectedColor: activeColor || "Default",
                      selectedAddons: selectedAddons 
                    })
                  ).unwrap();
                  toast.success(`${currentProduct.name} forged into your vault! 💎`);
                } catch (err) {
                  toast.error(err || 'Failed to add item to Cart');
                }
              }}
              className="w-full py-5 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black text-sm font-black uppercase tracking-[0.2em] rounded-sm hover:scale-[1.02] transform transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] cursor-pointer"
            >
              {currentProduct.inStock ? `Add to Vault — ₹${finalPrice}` : "Currently Unavailable"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleProduct;