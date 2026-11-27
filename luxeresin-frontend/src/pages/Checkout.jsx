import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { placeOrder } from "../features/order/orderSlice";
import { clearCartOnLogout, fetchCart } from "../features/cart/cartSlice";
import axiosInstance from "../services/axiosInstance";
import toast from "react-hot-toast";

// Razorpay script safely load karega (duplicate script injection prevent karta hai)
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const getAddonName = (addon) =>
  typeof addon === "string" ? addon : addon?.addonName || "";

// SingleProduct & Cart ke exact formula se synced pricing calculator
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
  typeof err === "string"
    ? err
    : err?.response?.data?.message || err?.message || fallback;

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [processingPayment, setProcessingPayment] = useState(false);

  const {
    cart,
    loading: cartLoading,
    discountAmount = 0,
    appliedCoupon,
  } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.order);

  // Page direct refresh par cart hydrate karo
  useEffect(() => {
    if (!cart && !cartLoading && !isOrderSuccess) {
      dispatch(fetchCart());
    }
  }, [cart, cartLoading, dispatch, isOrderSuccess]);

  const items = cart?.items || [];

  // Cart load hone ke baad hi empty check par redirect karo
  useEffect(() => {
    if (!cartLoading && cart && items.length === 0 && !isOrderSuccess) {
      navigate("/cart");
    }
  }, [cart, cartLoading, items.length, navigate, isOrderSuccess]);

  // LIVE ACCURATE MATH (Discount + Size Modifier + Addons × Qty)
  const subtotal = items.reduce(
    (acc, item) => acc + getItemPricing(item).lineTotal,
    0
  );
  const safeDiscount = Math.min(Number(discountAmount) || 0, subtotal);
  const finalSubtotal = Math.max(0, subtotal - safeDiscount);
  const shipping = finalSubtotal >= 5000 || finalSubtotal === 0 ? 0 : 250;
  const total = finalSubtotal + shipping;

  const userData = user?.user || user?.data || user;
  const existingAddress = userData?.address || {};

  const [formData, setFormData] = useState({
    fullName: existingAddress.fullName || userData?.full_name || "",
    phone: existingAddress.phone || "",
    pincode: existingAddress.pincode || "",
    streetAddress: existingAddress.streetAddress || "",
    city: existingAddress.city || "",
    state: existingAddress.state || "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Phone & Pincode mein sirf digits allow karo
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: value.replace(/\D/g, "").slice(0, 10) }));
      return;
    }
    if (name === "pincode") {
      setFormData((prev) => ({ ...prev, pincode: value.replace(/\D/g, "").slice(0, 6) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getSanitizedAddress = () => ({
    fullName: formData.fullName.trim(),
    phone: formData.phone.trim(),
    pincode: formData.pincode.trim(),
    streetAddress: formData.streetAddress.trim(),
    city: formData.city.trim(),
    state: formData.state.trim(),
  });

  // 1. Validation Check before triggering Order
  const handlePreCheckout = (e) => {
    e.preventDefault();
    if (loading || processingPayment) return;

    const cleanAddress = getSanitizedAddress();

    if (!cleanAddress.fullName) {
      toast.error("Full name is required.");
      return;
    }
    if (!/^[0-9]{10}$/.test(cleanAddress.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    if (!/^[0-9]{6}$/.test(cleanAddress.pincode)) {
      toast.error("Pincode must be exactly 6 digits.");
      return;
    }
    if (!cleanAddress.streetAddress || !cleanAddress.city || !cleanAddress.state) {
      toast.error("Please fill all address fields.");
      return;
    }

    if (paymentMethod === "ONLINE") {
      handleRazorpayPayment(cleanAddress);
      return;
    }

    executeOrderPlacement(cleanAddress);
  };

  // RAZORPAY INTEGRATION LOGIC (Exact existing endpoints + ondismiss fix)
  const handleRazorpayPayment = async (cleanAddress) => {
    try {
      setProcessingPayment(true);

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.error("Razorpay key is missing in frontend configuration.");
        setProcessingPayment(false);
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Razorpay failed to load. Check your internet connection.");
        setProcessingPayment(false);
        return;
      }

      const orderPayload = {
        shippingAddress: cleanAddress,
        paymentMethod: "ONLINE",
        couponCode: appliedCoupon || null,
        utrNumber: null,
      };

      const { data: orderData } = await axiosInstance.post(
        "/order/checkout",
        orderPayload
      );
      const createdOrder = orderData?.data;
      if (!createdOrder?._id) {
        throw new Error("Order creation failed before payment.");
      }

      const { data: razorpayData } = await axiosInstance.post(
        "/payment/create",
        { orderId: createdOrder._id }
      );
      const rzpOrder = razorpayData?.data;
      if (!rzpOrder?.id) {
        throw new Error("Unable to initialize Razorpay order.");
      }

      const options = {
        key: razorpayKey,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || "INR",
        name: "LuxeResin Art",
        description: "Payment for Luxury Masterpiece",
        order_id: rzpOrder.id,
        handler: async function (response) {
          try {
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: createdOrder._id,
            };

            await axiosInstance.post("/payment/verify", verifyData);

            setIsOrderSuccess(true);
            dispatch(clearCartOnLogout());
            toast.success("Payment Successful! Order Confirmed. 🎉");
            navigate("/my-orders");
          } catch (verifyError) {
            console.error("Razorpay Verification Error:", verifyError);
            toast.error(
              getErrorMessage(verifyError, "Payment Verification Failed!")
            );
            setProcessingPayment(false);
          }
        },
        modal: {
          // CRITICAL FIX: User popup X se close kare toh button unlock ho
          ondismiss: function () {
            toast.error("Payment window closed.");
            setProcessingPayment(false);
          },
        },
        prefill: {
          name: cleanAddress.fullName,
          email: userData?.email || "",
          contact: cleanAddress.phone,
        },
        theme: {
          color: "#D4AF37",
        },
      };

      const rzpWindow = new window.Razorpay(options);
      rzpWindow.on("payment.failed", function (response) {
        console.error("Payment Failed Reason:", response?.error?.description);
        toast.error(
          response?.error?.description || "Payment Failed or Cancelled!"
        );
        setProcessingPayment(false);
      });
      rzpWindow.open();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to initiate payment."));
      setProcessingPayment(false);
    }
  };

  // 2. Final Order Execution (COD)
  const executeOrderPlacement = async (cleanAddress) => {
    try {
      const orderPayload = {
        shippingAddress: cleanAddress,
        paymentMethod: "COD",
        couponCode: appliedCoupon || null,
        utrNumber: null,
      };

      await dispatch(placeOrder(orderPayload)).unwrap();
      setIsOrderSuccess(true);
      dispatch(clearCartOnLogout());

      toast.success("Order Placed Successfully! 🎉");
      navigate("/my-orders");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to process order."));
    }
  };

  if (cartLoading && !cart) {
    return (
      <div className="min-h-screen bg-[#050505] flex justify-center items-center text-[#D4AF37] font-black uppercase tracking-widest text-sm animate-pulse">
        Preparing Secure Vault Checkout...
      </div>
    );
  }

  return (
    <div className="bg-[#050505] min-h-screen py-12 md:py-20 text-gray-300 relative overflow-x-clip">
      {/* Subtle 3D Ambient Gold Lighting */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#D4AF37]/8 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="mb-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#D4AF37] transition-colors cursor-pointer"
        >
          <span>←</span> Back to Vault Bag
        </button>

        {/* HEADER + 3D PROGRESS STEPPER */}
        <div className="mb-12 border-b border-white/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-2">
              Encrypted Acquisition
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] tracking-tight drop-shadow-[0_6px_20px_rgba(212,175,55,0.25)]">
              Secure Checkout
            </h1>
          </div>

          {/* Luxury Stepper */}
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
            <span className="text-gray-500">01. Bag</span>
            <span className="w-6 h-px bg-[#D4AF37]/40" />
            <span className="px-3 py-1.5 rounded-sm bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#FCF6BA] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              02. Checkout
            </span>
            <span className="w-6 h-px bg-white/10" />
            <span className="text-gray-600">03. Vaulted</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 xl:gap-12 items-start">
          {/* LEFT: 3D ELEVATED SHIPPING & PAYMENT CARD */}
          <div className="w-full lg:w-2/3">
            <div className="bg-gradient-to-b from-[#0e0e0e] to-[#080808] p-6 sm:p-8 md:p-10 rounded-2xl border border-white/10 border-t-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(212,175,55,0.06)]">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
                    Step 01
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                    Shipping Information
                  </h2>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 hidden sm:inline">
                  Pan-India Insured Delivery
                </span>
              </div>

              <form
                id="checkout-form"
                onSubmit={handlePreCheckout}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter recipient full name"
                      required
                      className="w-full px-4 py-3.5 bg-[#050505] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:border-[#D4AF37] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.2)] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Phone Number (10 Digits)
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      maxLength={10}
                      placeholder="9876543210"
                      required
                      className="w-full px-4 py-3.5 bg-[#050505] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:border-[#D4AF37] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.2)] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Street Address / Landmark
                  </label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    placeholder="House No., Street, Area, Landmark"
                    required
                    className="w-full px-4 py-3.5 bg-[#050505] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:border-[#D4AF37] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.2)] outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g., Patna"
                      required
                      className="w-full px-4 py-3.5 bg-[#050505] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:border-[#D4AF37] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.2)] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="e.g., Bihar"
                      required
                      className="w-full px-4 py-3.5 bg-[#050505] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:border-[#D4AF37] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.2)] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      maxLength={6}
                      placeholder="800001"
                      required
                      className="w-full px-4 py-3.5 bg-[#050505] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:border-[#D4AF37] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.2)] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* PAYMENT METHOD SELECTION (3D INTERACTIVE TILES) */}
                <div className="pt-8 mt-8 border-t border-white/10">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
                    Step 02
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 mb-6">
                    Payment Method
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* COD TILE */}
                    <label
                      className={`relative flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                        paymentMethod === "COD"
                          ? "bg-gradient-to-b from-[#17140b] to-[#0b0a06] border-[#D4AF37] shadow-[0_12px_30px_-10px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(252,246,186,0.25)] -translate-y-0.5"
                          : "bg-[#070707] border-white/10 hover:border-white/25"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        className="mt-1 w-4 h-4 accent-[#D4AF37] cursor-pointer"
                      />
                      <div>
                        <span className="text-sm font-black text-white block tracking-wide">
                          Pay on Delivery
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]/80 block mt-0.5">
                          Cash / UPI at Doorstep
                        </span>
                        <span className="text-xs text-gray-400 block mt-2 leading-relaxed">
                          Pay securely when your handcrafted resin artifact arrives.
                        </span>
                      </div>
                    </label>

                    {/* RAZORPAY ONLINE TILE */}
                    <label
                      className={`relative flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                        paymentMethod === "ONLINE"
                          ? "bg-gradient-to-b from-[#17140b] to-[#0b0a06] border-[#D4AF37] shadow-[0_12px_30px_-10px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(252,246,186,0.25)] -translate-y-0.5"
                          : "bg-[#070707] border-white/10 hover:border-white/25"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "ONLINE"}
                        onChange={() => setPaymentMethod("ONLINE")}
                        className="mt-1 w-4 h-4 accent-[#D4AF37] cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-sm font-black text-white tracking-wide">
                            Pay Online
                          </span>
                          <span className="text-[9px] bg-[#D4AF37] text-black px-2 py-0.5 rounded-sm font-black uppercase tracking-widest">
                            Instant
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]/80 block mt-0.5">
                          Razorpay Secured
                        </span>
                        <span className="text-xs text-gray-400 block mt-2 leading-relaxed">
                          UPI, Credit / Debit Cards & NetBanking with instant confirmation.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT: 3D STICKY ORDER SUMMARY VAULT */}
          <div className="w-full lg:w-1/3">
            <div className="bg-gradient-to-b from-[#101010] to-[#070707] text-white p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/25 border-t-[#FCF6BA]/30 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.1)] lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white">
                  Vault Summary
                </h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                  {items.length} {items.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* ITEM LIST */}
              <div className="space-y-5 mb-6 max-h-[38vh] overflow-y-auto pr-1 scrollbar-hide">
                {items.map((item) => {
                  const { lineTotal, originalUnitPrice, hasDiscount } =
                    getItemPricing(item);
                  const addonLabels = (item.selectedAddons || [])
                    .map(getAddonName)
                    .filter(Boolean);

                  return (
                    <div
                      key={item._id}
                      className="flex gap-4 items-start bg-[#050505]/80 p-3 rounded-xl border border-white/5"
                    >
                      <div className="w-16 h-16 bg-[#121212] rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                        <img
                          src={item.product?.images?.[0]}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">
                          {item.product?.name || "Artifact"}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {item.selectedSize || "Standard"} •{" "}
                          {item.selectedColor || "Default"}
                        </p>
                        {addonLabels.length > 0 && (
                          <p className="text-[10px] text-[#D4AF37]/80 truncate mt-0.5">
                            + {addonLabels.join(", ")}
                          </p>
                        )}
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-sm text-[#D4AF37]">
                          ₹{lineTotal.toLocaleString("en-IN")}
                        </p>
                        {hasDiscount && (
                          <p className="text-[10px] text-gray-500 line-through">
                            ₹{(originalUnitPrice * item.quantity).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* BREAKDOWN */}
              <div className="space-y-3.5 text-sm text-gray-400 border-t border-white/10 pt-5 mb-6 font-medium">
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
                  <span>Insured Shipping</span>
                  <span className="font-bold text-white">
                    {shipping === 0 ? (
                      <span className="text-[#D4AF37]">Complimentary</span>
                    ) : (
                      `₹${shipping.toLocaleString("en-IN")}`
                    )}
                  </span>
                </div>
              </div>

              {/* TOTAL */}
              <div className="flex justify-between items-end border-t border-white/10 pt-5 mb-8">
                <div>
                  <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] block">
                    Total Payable
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Inclusive of all taxes
                  </span>
                </div>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728]">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              {/* 3D METALLIC GOLD CTA BUTTON */}
              <button
                type="submit"
                form="checkout-form"
                disabled={loading || processingPayment}
                className="w-full py-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black text-xs font-black uppercase tracking-[0.2em] rounded-sm shadow-[0_12px_30px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.65)] hover:shadow-[0_18px_40px_rgba(212,175,55,0.55)] hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
              >
                {loading || processingPayment
                  ? "Processing Secure Payment..."
                  : paymentMethod === "ONLINE"
                  ? `Pay ₹${total.toLocaleString("en-IN")} Now`
                  : `Confirm COD Order — ₹${total.toLocaleString("en-IN")}`}
              </button>

              {/* TRUST FOOTER */}
              <div className="mt-6 flex justify-center items-center gap-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                <span>🔒 256-Bit SSL</span>
                <span>✦ Authentic Resin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;