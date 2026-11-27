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

const getAddonName = (addon) =>
  typeof addon === "string" ? addon : addon?.addonName || "";

// Single Product ke exact formula se synced unit + line price calculator
const getItemPricing = (item) => {
  const product = item?.product;
  if (!product) {
    return {
      unitPrice: 0,
      originalUnitPrice: 0,
      lineTotal: 0,
      hasDiscount: false,
    };
  }

  const basePrice = Number(product.basePrice) || 0;
  const discountPrice = Number(product.discountPrice) || 0;
  const hasDiscount = discountPrice > 0 && discountPrice < basePrice;
  const effectiveBase = hasDiscount ? discountPrice : basePrice;

  const matchedSize = product.sizes?.find(
    (s) => s.sizeLabel === item.selectedSize
  );
  const sizeExtra = Number(matchedSize?.priceModifier) || 0;

  const addonsExtra = (item.selectedAddons || []).reduce((sum, addonEntry) => {
    if (typeof addonEntry === "object" && addonEntry?.extraPrice != null) {
      return sum + (Number(addonEntry.extraPrice) || 0);
    }
    const name = getAddonName(addonEntry);
    const matchedAddon = product.addons?.find((a) => a.addonName === name);
    return sum + (Number(matchedAddon?.extraPrice) || 0);
  }, 0);

  const unitPrice = effectiveBase + sizeExtra + addonsExtra;
  const originalUnitPrice = basePrice + sizeExtra + addonsExtra;
  const quantity = Math.max(1, Number(item.quantity) || 1);

  return {
    unitPrice,
    originalUnitPrice,
    lineTotal: unitPrice * quantity,
    hasDiscount,
  };
};

const getErrorMessage = (err, fallback) =>
  typeof err === "string" ? err : err?.message || fallback;

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState("");
  const [busyItemId, setBusyItemId] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const { cart, loading, appliedCoupon, discountAmount } = useSelector(
    (state) => state.cart
  );

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const items = cart?.items || [];

  // Orphaned (deleted) ya out-of-stock artifacts check
  const hasUnavailableItems = items.some(
    (item) => !item.product || item.product.inStock === false
  );

  // Accurate subtotal (Discount + Size Modifier + Addons × Qty)
  const subtotal = items.reduce(
    (acc, item) => acc + getItemPricing(item).lineTotal,
    0
  );

  // Safe discount clamp (kabhi negative subtotal nahi hoga)
  const safeDiscount = Math.min(Number(discountAmount) || 0, subtotal);
  const finalSubtotal = Math.max(0, subtotal - safeDiscount);
  const shipping = finalSubtotal >= 5000 || finalSubtotal === 0 ? 0 : 250;
  const total = finalSubtotal + shipping;
  const freeShippingRemaining = Math.max(0, 5000 - finalSubtotal);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const cleanedCode = couponCode.trim().toUpperCase();
    if (!cleanedCode) return;

    try {
      setApplyingCoupon(true);
      await dispatch(applyCouponCode(cleanedCode)).unwrap();
      toast.success("Golden key (Coupon) applied successfully! 🎉");
      setCouponCode("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Invalid or expired access code."));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleQtyChange = async (itemId, action) => {
    if (busyItemId === itemId) return;
    try {
      setBusyItemId(itemId);
      await dispatch(updateCartItemQty({ itemId, action })).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update quantity."));
    } finally {
      setBusyItemId(null);
    }
  };

  const handleRemove = async (itemId) => {
    if (busyItemId === itemId) return;
    try {
      setBusyItemId(itemId);
      await dispatch(removeCartItem(itemId)).unwrap();
      toast.success("Artifact removed from the vault.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove artifact."));
    } finally {
      setBusyItemId(null);
    }
  };

  if (loading && !cart) {
    return (
      <div className="min-h-screen bg-[#050505] flex justify-center items-center text-[#D4AF37] font-black uppercase tracking-widest text-sm animate-pulse">
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
        <p className="text-gray-400 mb-8 font-medium text-center">
          Discover our masterpiece collection and secure your art.
        </p>
        <button
          onClick={() => navigate("/products")}
          className="px-8 py-3.5 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black text-xs font-black uppercase tracking-widest rounded-sm hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)] cursor-pointer"
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
        <div className="mb-10 border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-2">
              Secure Checkout
            </p>
            <h1 className="text-4xl font-black text-white tracking-tight">
              Your Selected Artifacts
            </h1>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-gray-500">
            {items.length} {items.length === 1 ? "Artifact" : "Artifacts"} in Vault
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* LEFT: CART ITEMS */}
          <div className="lg:w-2/3 space-y-6">
            {items.map((item) => {
              const product = item.product;
              const isUnavailable = !product || product.inStock === false;
              const isBusy = busyItemId === item._id;
              const { unitPrice, originalUnitPrice, lineTotal, hasDiscount } =
                getItemPricing(item);
              const addonLabels = (item.selectedAddons || [])
                .map(getAddonName)
                .filter(Boolean);

              const handleNavigateProduct = () => {
                if (product?.slug) {
                  navigate(`/product/${product.slug}`);
                }
              };

              return (
                <div
                  key={item._id}
                  className={`bg-[#0a0a0a] p-6 rounded-2xl border flex flex-col sm:flex-row gap-6 transition-all duration-300 group ${
                    isUnavailable
                      ? "border-red-500/30 opacity-80"
                      : "border-white/5 hover:border-[#D4AF37]/40 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                  }`}
                >
                  {/* Image */}
                  <div
                    className={`w-full sm:w-32 h-32 bg-[#121212] rounded-xl overflow-hidden flex-shrink-0 relative ${
                      product?.slug ? "cursor-pointer" : "cursor-default"
                    }`}
                    onClick={handleNavigateProduct}
                  >
                    {product?.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 font-bold uppercase">
                        Removed
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60"></div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3
                          className={`text-lg font-bold text-white transition-colors ${
                            product?.slug
                              ? "cursor-pointer hover:text-[#D4AF37]"
                              : ""
                          }`}
                          onClick={handleNavigateProduct}
                        >
                          {product?.name || "Artifact No Longer Available"}
                        </h3>

                        {isUnavailable && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-red-500/15 text-red-400 border border-red-500/30 rounded-sm">
                            {!product ? "Removed from Catalog" : "Sold Out"}
                          </span>
                        )}

                        <div className="text-xs text-gray-400 mt-2 space-y-1.5 font-medium">
                          <p>
                            <span className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mr-1">
                              Size:
                            </span>{" "}
                            {item.selectedSize || "Standard"}
                          </p>
                          <p>
                            <span className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mr-1">
                              Color:
                            </span>{" "}
                            {item.selectedColor || "Default"}
                          </p>
                          {addonLabels.length > 0 && (
                            <p>
                              <span className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mr-1">
                                Add-ons:
                              </span>{" "}
                              {addonLabels.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price Display (Line Total + Unit Breakdown) */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-black text-[#D4AF37]">
                          ₹{lineTotal.toLocaleString("en-IN")}
                        </p>
                        {hasDiscount && (
                          <p className="text-xs text-gray-500 line-through">
                            ₹{(originalUnitPrice * item.quantity).toLocaleString("en-IN")}
                          </p>
                        )}
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-gray-500 font-bold mt-1">
                            ₹{unitPrice.toLocaleString("en-IN")} each
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                      <div className="flex items-center border border-white/10 rounded-sm bg-[#121212]">
                        <button
                          type="button"
                          disabled={isBusy || isUnavailable}
                          onClick={() => handleQtyChange(item._id, "decrease")}
                          className="px-3 py-1.5 text-gray-400 hover:text-[#D4AF37] font-bold focus:outline-none disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          −
                        </button>
                        <span className="px-4 text-xs font-black w-12 text-center text-white">
                          {isBusy ? "..." : item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isBusy || isUnavailable}
                          onClick={() => handleQtyChange(item._id, "increase")}
                          className="px-3 py-1.5 text-gray-400 hover:text-[#D4AF37] font-bold focus:outline-none disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRemove(item._id)}
                        className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="lg:w-1/3">
            <div className="bg-[#0a0a0a] p-8 rounded-2xl border border-white/10 shadow-2xl lg:sticky lg:top-24">
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest border-b border-white/10 pb-4">
                Vault Summary
              </h2>

              {/* COUPON INPUT FORM */}
              <form
                onSubmit={handleApplyCoupon}
                className="mb-8 flex items-stretch bg-[#121212] border border-white/10 rounded-sm overflow-hidden focus-within:border-[#D4AF37] focus-within:ring-1 focus-within:ring-[#D4AF37] transition-all"
              >
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="ENTER ACCESS CODE..."
                  className="flex-1 px-4 py-3 bg-transparent outline-none uppercase font-bold text-xs tracking-widest text-white w-full min-w-0 placeholder-gray-600"
                />
                <button
                  type="submit"
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="px-6 py-3 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#FCF6BA] disabled:opacity-50 transition-colors flex-shrink-0 cursor-pointer"
                >
                  {applyingCoupon ? "..." : "Apply"}
                </button>
              </form>

              <div className="space-y-4 text-sm text-gray-400 border-b border-white/10 pb-6 mb-6 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {safeDiscount > 0 && (
                  <div className="flex justify-between text-[#FCF6BA] font-bold">
                    <span>Discount ({appliedCoupon})</span>
                    <span>-₹{safeDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Secure Shipping</span>
                  <span className="font-bold text-white">
                    {shipping === 0 ? (
                      <span className="text-[#D4AF37]">Complimentary</span>
                    ) : (
                      `₹${shipping.toLocaleString("en-IN")}`
                    )}
                  </span>
                </div>

                {freeShippingRemaining > 0 && (
                  <p className="text-[11px] text-gray-500 pt-1">
                    Add{" "}
                    <span className="text-[#D4AF37] font-bold">
                      ₹{freeShippingRemaining.toLocaleString("en-IN")}
                    </span>{" "}
                    more for complimentary shipping.
                  </p>
                )}
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  Total
                </span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728]">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              {hasUnavailableItems && (
                <p className="text-xs text-red-400 font-bold mb-4 text-center">
                  Checkout se pehle unavailable ya sold-out artifacts remove karein.
                </p>
              )}

              <button
                disabled={hasUnavailableItems || busyItemId !== null}
                onClick={() => navigate("/checkout")}
                className="w-full py-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black text-xs font-black uppercase tracking-[0.2em] rounded-sm hover:scale-[1.02] transform transition-all duration-300 disabled:opacity-40 disabled:hover:scale-100 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] cursor-pointer"
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