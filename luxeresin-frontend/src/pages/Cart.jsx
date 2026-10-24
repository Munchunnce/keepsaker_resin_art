import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchCart,
  updateCartItemQty,
  removeCartItem,
  applyCouponCode,
} from "../features/cart/cartSlice";
import toast from "react-hot-toast";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const { cart, loading, appliedCoupon, discountAmount } = useSelector(
    (state) => state.cart,
  );

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const items = cart?.items || [];

  // Calculate total on the fly based on basePrice * quantity
  const subtotal = items.reduce(
    (acc, item) => acc + (item.product?.basePrice || 0) * item.quantity,
    0,
  );
  const finalSubtotal = subtotal - discountAmount;
  const shipping = finalSubtotal > 5000 ? 0 : 250; // Premium logic: Free shipping over ₹5000
  const total = finalSubtotal + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      await dispatch(applyCouponCode(couponCode)).unwrap();
      toast.success("Golden key (Coupon) applied successfully! 🎉");
    } catch (err) {
      toast.error(err);
    }
  };

  const handleQtyChange = async (itemId, action) => {
    await dispatch(updateCartItemQty({ itemId, action })).unwrap();
  };

  const handleRemove = async (itemId) => {
    await dispatch(removeCartItem(itemId)).unwrap();
    toast.success("Artifact removed from the vault.");
  };

  if (loading && !cart) {
    return (
      <div className="min-h-screen bg-[#050505] flex justify-center items-center text-[#D4AF37] font-black uppercase tracking-widest text-sm">
        Unlocking Your Vault...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] px-4">
        <div className="w-24 h-24 bg-[#0a0a0a] border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
          <span className="text-4xl">💎</span>
        </div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] mb-2 tracking-tight">
          Your Vault is Empty
        </h2>
        <p className="text-gray-400 mb-8 font-medium">
          Discover our masterpiece collection and secure your art.
        </p>
        <button
          onClick={() => navigate("/products")}
          className="px-8 py-3.5 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black text-xs font-black uppercase tracking-widest rounded-sm hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] min-h-screen py-12 md:py-20 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="mb-10 border-b border-white/10 pb-6">
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-2">Secure Checkout</p>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Your Selected Artifacts
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* LEFT: CART ITEMS */}
          <div className="lg:w-2/3 space-y-6">
            {items.map((item) => (
              <div
                key={item._id}
                className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-6 hover:border-[#D4AF37]/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] transition-all duration-300 group"
              >
                {/* Image */}
                <div
                  className="w-full sm:w-32 h-32 bg-[#121212] rounded-xl overflow-hidden flex-shrink-0 cursor-pointer relative"
                  onClick={() => navigate(`/product/${item.product.slug}`)}
                >
                  <img
                    src={item.product?.images?.[0]}
                    alt={item.product?.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60"></div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3
                        className="text-lg font-bold text-white cursor-pointer hover:text-[#D4AF37] transition-colors"
                        onClick={() => navigate(`/product/${item.product.slug}`)}
                      >
                        {item.product?.name}
                      </h3>
                      <div className="text-xs text-gray-400 mt-2 space-y-1.5 font-medium">
                        <p><span className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mr-1">Size:</span> {item.selectedSize}</p>
                        <p><span className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mr-1">Color:</span> {item.selectedColor}</p>
                        {item.selectedAddons?.length > 0 && (
                          <p><span className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mr-1">Add-ons:</span> {item.selectedAddons.join(", ")}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xl font-black text-[#D4AF37]">
                      ₹{item.product?.basePrice}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                    {/* Dark Quantity Control */}
                    <div className="flex items-center border border-white/10 rounded-sm bg-[#121212]">
                      <button
                        onClick={() => handleQtyChange(item._id, "decrease")}
                        className="px-3 py-1.5 text-gray-500 hover:text-[#D4AF37] font-bold focus:outline-none transition-colors"
                      >
                        −
                      </button>
                      <span className="px-4 text-xs font-black w-12 text-center text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQtyChange(item._id, "increase")}
                        className="px-3 py-1.5 text-gray-500 hover:text-[#D4AF37] font-bold focus:outline-none transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item._id)}
                      className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="lg:w-1/3">
            <div className="bg-[#0a0a0a] p-8 rounded-2xl border border-white/10 shadow-2xl lg:sticky lg:top-24">
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest border-b border-white/10 pb-4">
                Vault Summary
              </h2>

              {/* 🚀 COUPON INPUT FIELD (LUXURY FIX) */}
              <div className="mb-8 flex items-stretch bg-[#121212] border border-white/10 rounded-sm overflow-hidden focus-within:border-[#D4AF37] focus-within:ring-1 focus-within:ring-[#D4AF37] transition-all">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="ENTER ACCESS CODE..."
                  className="flex-1 px-4 py-3 bg-transparent outline-none uppercase font-bold text-xs tracking-widest text-white w-full min-w-0 placeholder-gray-600"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={loading || !couponCode}
                  className="px-6 py-3 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#FCF6BA] disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  Apply
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-400 border-b border-white/10 pb-6 mb-6 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">₹{subtotal}</span>
                </div>

                {/* 🚀 DISCOUNT ROW */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#FCF6BA] font-bold">
                    <span>Discount ({appliedCoupon})</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Secure Shipping</span>
                  <span className="font-bold text-white">
                    {shipping === 0 ? <span className="text-[#D4AF37]">Complimentary</span> : `₹${shipping}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total</span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728]">
                  ₹{total}
                </span>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full py-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black text-xs font-black uppercase tracking-[0.2em] rounded-sm hover:scale-[1.02] transform transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.6)]"
              >
                Secure Checkout
              </button>
              
              {/* Trust Badges */}
              <div className="mt-6 flex justify-center items-center gap-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                <span>🔒 Encrypted</span>
                <span>✦ Authentic</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;