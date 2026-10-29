import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { placeOrder } from "../features/order/orderSlice";
import { clearCartOnLogout } from "../features/cart/cartSlice";
import toast from "react-hot-toast";

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // UPI Modal states
  const [showQrModal, setShowQrModal] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [timeLeft,setTimeLeft] = useState(600);

  const {
    cart,
    discountAmount = 0,
    appliedCoupon,
  } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.order);

  // LIVE MATH LOGIC WITH DISCOUNT
  const items = cart?.items || [];
  const subtotal = items.reduce(
    (acc, item) => acc + (item.product?.basePrice || 0) * item.quantity,
    0,
  );
  const finalSubtotal = Math.max(0, subtotal - discountAmount);
  const shipping = finalSubtotal > 5000 ? 0 : 250;
  const total = finalSubtotal + shipping;

  // SMART PRE-FILL
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

  useEffect(() => {
    if (items.length === 0 && !isOrderSuccess) {
      navigate("/cart");
    }
  }, [items.length, navigate, isOrderSuccess]);

  useEffect(() => {
    // Agar modal band hai, toh kuch mat karo
    if (!showQrModal) return;

    // Timer start karo
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer); // Timer roko
          setShowQrModal(false); // Modal band karo
          setTimeout(() => toast.error("Payment session expired! Please try again."), 0);
          return 600; // Timer wapas 10 min par reset karo
        }
        return prevTime - 1; // 1 second kam karo
      });
    }, 1000);

    // Cleanup function: modal close hone par timer clear ho jayega
    return () => clearInterval(timer);
  }, [showQrModal]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. Validation Check before triggering Modal or COD Order
  const handlePreCheckout = (e) => {
    e.preventDefault();

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      toast.error("Pincode must be exactly 6 digits.");
      return;
    }
    if (!formData.streetAddress || !formData.city || !formData.state) {
      toast.error("Please fill all address fields.");
      return;
    }

    // Agar ONLINE hai toh QR modal kholo
    if (paymentMethod === "ONLINE") {
      setShowQrModal(true);
      return;
    }

    // Agar COD hai toh direct order place karo
    executeOrderPlacement();
  };

  // 2. Final Order Execution (For both COD and Verified ONLINE)
  const executeOrderPlacement = async (verifiedUtr = null) => {
    try {
      const orderPayload = {
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          pincode: formData.pincode,
          streetAddress: formData.streetAddress,
          city: formData.city,
          state: formData.state,
        },
        paymentMethod: paymentMethod,
        couponCode: appliedCoupon || null,
        utrNumber: verifiedUtr, // Online payment ke liye UTR
      };

      await dispatch(placeOrder(orderPayload)).unwrap();
      setIsOrderSuccess(true);
      dispatch(clearCartOnLogout());

      toast.success("Order Placed Successfully! 🎉");
      navigate("/my-orders");
    } catch (error) {
      toast.error(error || "Failed to process order.");
    }
  };

  // 3. Handle QR Modal Submit (UTR Verification)
  const handleVerifyAndPay = (e) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.trim().length < 8) {
      toast.error(
        "Please enter a valid 12-digit UTR / Transaction Reference Number.",
      );
      return;
    }

    setShowQrModal(false);
    executeOrderPlacement(utrNumber.trim());
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 md:py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/cart")}
          className="mb-8 flex items-center text-sm font-semibold text-gray-500 hover:text-black transition-colors"
        >
          <span className="mr-2">←</span> Back to Cart
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] tracking-tight drop-shadow-[0_2px_10px_rgba(212,175,55,0.2)]">
            Secure Checkout
          </h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
            Finalize Your Luxury Acquisition
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* LEFT: SHIPPING FORM */}
          <div className="lg:w-2/3">
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Shipping Information
              </h2>

              <form
                id="checkout-form"
                onSubmit={handlePreCheckout}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    required
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                {/* PAYMENT METHOD SELECTION OPTIONS */}
                <div className="pt-8 mt-8 border-t border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Payment Method
                  </h2>
                  <div className="space-y-4">
                    <label
                      onClick={() => setPaymentMethod("COD")}
                      className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === "COD"
                          ? "border-black bg-gray-50 shadow-sm"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        className="w-4 h-4 text-black accent-black mr-4 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-gray-900 block">
                          Pay on Delivery (Cash / UPI)
                        </span>
                        <span className="text-xs text-gray-500">
                          Pay securely when your resin artifact arrives at your
                          doorstep.
                        </span>
                      </div>
                    </label>

                    <label
                      onClick={() => setPaymentMethod("ONLINE")}
                      className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === "ONLINE"
                          ? "border-black bg-gray-50 shadow-sm"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "ONLINE"}
                        onChange={() => setPaymentMethod("ONLINE")}
                        className="w-4 h-4 text-black accent-black mr-4 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            Online UPI Payment (Scan QR & Pay)
                          </span>
                          <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                            Instant
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Scan QR via GPay, PhonePe, Paytm & enter UTR number.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="lg:w-1/3">
            <div className="bg-black text-white p-8 md:p-10 rounded-3xl shadow-2xl lg:sticky lg:top-24">
              <h2 className="text-2xl font-bold mb-8">Order Summary</h2>

              <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
                {items.map((item) => (
                  <div key={item._id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product?.images?.[0]}
                        alt={item.product?.name}
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm line-clamp-1">
                        {item.product?.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="font-bold text-sm">
                      ₹{item.product?.basePrice * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm text-gray-400 border-t border-gray-800 pt-6 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">₹{subtotal}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-400 font-bold">
                    <span>Discount ({appliedCoupon})</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-white">
                    {shipping === 0 ? "Free" : `₹${shipping}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-2xl font-extrabold text-white mb-10">
                <span>Total</span>
                <span>₹{total}</span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="w-full py-5 bg-white text-black text-lg font-bold rounded-2xl hover:bg-gray-200 hover:-translate-y-1 transform transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
              >
                {loading
                  ? "Processing..."
                  : paymentMethod === "ONLINE"
                    ? `Pay ₹${total} via QR`
                    : `Confirm Order - ₹${total}`}
              </button>

              <p className="text-center text-xs text-gray-400 mt-6 font-medium flex justify-center items-center gap-2">
                🔒 256-bit Secure Encryption
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DYNAMIC LUXURY UPI QR CODE & UTR MODAL */}
      {/* ========================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0a0a0a] border border-[#D4AF37]/40 w-full max-w-md rounded-3xl p-8 shadow-2xl relative text-center">
            {/* Close Modal */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white text-xl font-bold"
            >
              ✕
            </button>

            <h3 className="text-2xl font-black text-white tracking-tight mb-1">
              Scan & Pay Online
            </h3>
            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-6">
              Amount to Pay: ₹{total}
            </p>
            {/* 10-MINUTE COUNTDOWN TIMER BADGE */}
            <div className="inline-block bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full mb-4">
              <span className="text-xs font-black text-yellow-400 tracking-wider">
                ⏳ Time Remaining: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} min
              </span>
            </div>

            {/* QR CODE IMAGE CONTAINER */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mb-6 border-4 border-[#D4AF37]/30">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=yourstoreupi@paytm&pn=LuxeResin&am=${total}&cu=INR`}
                alt="UPI QR Code"
                className="w-48 h-48 mx-auto"
              />
              <p className="text-[10px] font-black text-black uppercase tracking-widest mt-2">
                GPay / PhonePe / Paytm / UPI
              </p>
            </div>

            <form onSubmit={handleVerifyAndPay} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">
                  Enter UPI Transaction ID / UTR Number
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 423561829012"
                  required
                  className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-bold tracking-wider focus:outline-none focus:border-[#D4AF37]"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Payment karne ke baad 12-digit ka UTR number yahan enter
                  karein.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer mt-4"
              >
                {loading ? "Verifying..." : "Verify & Confirm Order 🚀"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
