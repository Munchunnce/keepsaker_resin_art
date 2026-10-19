import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { placeOrder } from '../features/order/orderSlice';
import toast from 'react-hot-toast';

const Checkout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { cart } = useSelector((state) => state.cart);
    const { user } = useSelector((state) => state.auth);
    const { loading } = useSelector((state) => state.order);

    const items = cart?.items || [];
    const subtotal = items.reduce((acc, item) => acc + (item.product?.basePrice * item.quantity), 0);
    const shipping = subtotal > 5000 ? 0 : 250;
    const total = subtotal + shipping;

    // 🧠 SMART PRE-FILL: Backend se aane wala userData aur address auto-fill ho jayega
    const userData = user?.user || user?.data || user;
    const existingAddress = userData?.address || {};

    const [formData, setFormData] = useState({
        fullName: existingAddress.fullName || userData?.full_name || '',
        phone: existingAddress.phone || '',
        pincode: existingAddress.pincode || '',
        streetAddress: existingAddress.streetAddress || '',
        city: existingAddress.city || '',
        state: existingAddress.state || '',
    });

    // Agar cart khali hai toh direct wapas bhej do
    useEffect(() => {
        if (items.length === 0) {
            navigate('/cart');
        }
    }, [items, navigate]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.phone || !formData.streetAddress || !formData.pincode) {
            toast.error('Please fill all mandatory address fields.');
            return;
        }

        try {
            // Aapke backend ke hisaab se payload
            const orderPayload = {
                shippingAddress: formData,
                paymentMethod: 'COD', // Abhi ke liye Pay on Delivery
                items: items,
                totalAmount: total
            };

            await dispatch(placeOrder(orderPayload)).unwrap();
            toast.success('Order Placed Successfully! 🎉');
            navigate('/'); // Success ke baad home ya success page par bhej dein
        } catch (error) {
            toast.error(error || 'Failed to process order.');
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Back Button */}
                <button onClick={() => navigate('/cart')} className="mb-8 flex items-center text-sm font-semibold text-gray-500 hover:text-black transition-colors">
                    <span className="mr-2">←</span> Back to Cart
                </button>

                <h1 className="text-4xl font-extrabold text-gray-900 mb-10 tracking-tight">Secure Checkout</h1>

                <div className="flex flex-col lg:flex-row gap-12">
                    
                    {/* LEFT: SHIPPING FORM */}
                    <div className="lg:w-2/3">
                        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8">Shipping Information</h2>
                            
                            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Full Name</label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Phone Number</label>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} required
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Street Address</label>
                                    <input type="text" name="streetAddress" value={formData.streetAddress} onChange={handleInputChange} required
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">City</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} required
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">State</label>
                                        <input type="text" name="state" value={formData.state} onChange={handleInputChange} required
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">PIN Code</label>
                                        <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} required
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                                    </div>
                                </div>

                                <div className="pt-8 mt-8 border-t border-gray-100">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
                                    <div className="flex items-center p-5 border-2 border-black rounded-xl bg-gray-50">
                                        <div className="w-5 h-5 rounded-full border-4 border-black bg-white mr-4"></div>
                                        <span className="font-bold text-gray-900">Pay on Delivery (Cash/UPI)</span>
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
                                            <img src={item.product?.images?.[0]} alt={item.product?.name} className="w-full h-full object-cover opacity-80" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-sm line-clamp-1">{item.product?.name}</h4>
                                            <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="font-bold text-sm">₹{item.product?.basePrice * item.quantity}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 text-sm text-gray-400 border-t border-gray-800 pt-6 mb-6">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="text-white">₹{subtotal}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="text-white">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
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
                                className="w-full py-5 bg-white text-black text-lg font-bold rounded-2xl hover:bg-gray-200 hover:-translate-y-1 transform transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {loading ? 'Processing...' : 'Confirm Order'}
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