import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { placeOrder } from "../features/order/orderSlice";
import { clearCartOnLogout } from "../features/cart/cartSlice";
import axiosInstance from "../services/axiosInstance"; // Razorpay API call ke liye
import toast from "react-hot-toast";

// 🚀 Razorpay script load karne ka function
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [processingPayment, setProcessingPayment] = useState(false); // Naya state

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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. Validation Check before triggering Order
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

    // 🚀 RAZORPAY TRIGGER LOGIC
    if (paymentMethod === "ONLINE") {
      handleRazorpayPayment(); // QR ki jagah seedha Razorpay modal khulega
      return;
    }

    // Agar COD hai toh direct order place karo
    executeOrderPlacement();
  };

  // 🚀 RAZORPAY INTEGRATION LOGIC
  const handleRazorpayPayment = async () => {
    try {
      setProcessingPayment(true);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Razorpay failed to load. Check your internet connection.");
        setProcessingPayment(false);
        return;
      }

      // 1. Pehle Backend mein dummy order create karke calculation match karenge
      // (Iske liye temporary Order Model mein entry jayegi validation ke liye)
      const orderPayload = {
        shippingAddress: formData,
        paymentMethod: paymentMethod,
        couponCode: appliedCoupon || null,
        utrNumber: null
      };

      // Order create karein taaki exact Razorpay order id generate ho
      // 🚀 NOTE: Is flow ko aur optimize karne ke liye hum pehle ek razorpay order banate hain
      const { data: orderData } = await axiosInstance.post("/order/checkout", orderPayload);
      const createdOrder = orderData.data;

      // Ab is order ki total amount par Razorpay Order create karenge backend mein
      const { data: razorpayData } = await axiosInstance.post("/payment/create", { orderId: createdOrder._id });
      const rzpOrder = razorpayData.data;

      // 2. Razorpay Window open karenge
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // .env mein VITE_RAZORPAY_KEY_ID dalna hoga
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "LuxeResin Art",
        description: "Payment for Luxury Masterpiece",
        image: "https://your-logo-url.png", // Apna logo daal sakte hain
        order_id: rzpOrder.id,
        handler: async function (response) {
            // 3. Payment Verify karenge
            try {
                const verifyData = {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    orderId: createdOrder._id
                };
                
                await axiosInstance.post("/payment/verify", verifyData);
                
                setIsOrderSuccess(true);
                dispatch(clearCartOnLogout());
                toast.success("Payment Successful! Order Confirmed. 🎉");
                navigate("/my-orders");
            } catch (verifyError) {
                console.error("Razorpay Verification Error:", verifyError);
                toast.error("Payment Verification Failed!");
                setProcessingPayment(false);
            }
        },
        prefill: {
          name: formData.fullName,
          email: userData?.email || "",
          contact: formData.phone,
        },
        theme: {
          color: "#D4AF37", // Apni website ka theme color
        },
      };

      const rzpWindow = new window.Razorpay(options);
      rzpWindow.on("payment.failed", function (response) {
        console.error("Payment Failed Reason:", response.error.description);
        toast.error("Payment Failed or Cancelled!");
        setProcessingPayment(false);
      });
      rzpWindow.open();

    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to initiate payment");
        setProcessingPayment(false);
    }
  };

  // 2. Final Order Execution (Only for COD now)
  const executeOrderPlacement = async () => {
    try {
      const orderPayload = {
        shippingAddress: formData,
        paymentMethod: paymentMethod,
        couponCode: appliedCoupon || null,
        utrNumber: null, 
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
                            Pay Online (Razorpay)
                          </span>
                          <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                            Instant & Secure
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Pay securely via UPI, Credit/Debit Card, or NetBanking.
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
                disabled={loading || processingPayment}
                className="w-full py-5 bg-white text-black text-lg font-bold rounded-2xl hover:bg-gray-200 hover:-translate-y-1 transform transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
              >
                {loading || processingPayment
                  ? "Processing Secure Payment..."
                  : paymentMethod === "ONLINE"
                    ? `Pay ₹${total} Now`
                    : `Confirm COD Order - ₹${total}`}
              </button>

              <p className="text-center text-xs text-gray-400 mt-6 font-medium flex justify-center items-center gap-2">
                🔒 256-bit Secure Encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;