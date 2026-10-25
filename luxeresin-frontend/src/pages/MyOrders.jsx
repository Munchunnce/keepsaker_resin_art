import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders } from '../features/order/orderSlice';
import { fetchMyCustomRequests, acceptCustomArtQuote } from '../features/customArt/customArtSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// 🚀 YAHAN APNA ASALI PHONEPE / UPI ID DAALEIN
const MERCHANT_UPI_ID = '9708723622@ybl'; 
const MERCHANT_NAME = 'LuxeResin Art';

const MyOrders = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('STANDARD');

    // 🚀 PAYMENT MODAL STATES
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 Minutes (300 seconds)
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [utrNumber, setUtrNumber] = useState('');
    const [shippingAddress, setShippingAddress] = useState({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        pincode: ''
    });

    const { myOrders, loading: ordersLoading, error: ordersError } = useSelector((state) => state.order);
    const { myRequests, loading: requestsLoading, error: requestsError } = useSelector((state) => state.customArt);

    useEffect(() => {
        dispatch(fetchMyOrders());
        dispatch(fetchMyCustomRequests());
    }, [dispatch]);

    // 🚀 5-MINUTE LIVE COUNTDOWN TIMER LOGIC
    useEffect(() => {
        if (!selectedRequest) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setSelectedRequest(null);
                    toast.error('Payment session expired! Please try again. ⏳');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [selectedRequest]);

    // Modal Open Karne Ka Function
    const handleOpenPaymentModal = (req) => {
        setSelectedRequest(req);
        setTimeLeft(300); // Reset timer to 5:00
        setUtrNumber('');
    };

    // Timer ko MM:SS format mein dikhane ke liye
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // 🚀 FINAL SUBMIT: Address + UTR Backend Ko Bhejein
    const handleConfirmPayment = async (e) => {
        e.preventDefault();

        if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.city || !shippingAddress.pincode) {
            return toast.error('Please fill complete delivery address!');
        }

        if (!utrNumber || utrNumber.trim().length < 12) {
            return toast.error('Please enter valid 12-digit UPI UTR / Ref number!');
        }

        const advancePaid = Math.round(selectedRequest.estimatedPrice / 2);

        try {
            setSubmittingPayment(true);
            await dispatch(
                acceptCustomArtQuote({
                    id: selectedRequest._id,
                    paymentData: {
                        shippingAddress,
                        utrNumber: utrNumber.trim(),
                        advancePaid
                    }
                })
            ).unwrap();

            toast.success('Payment Submitted! 🎉 Your bespoke order is confirmed.');
            setSelectedRequest(null);
        } catch (error) {
            toast.error(error || 'Failed to confirm payment');
        } finally {
            setSubmittingPayment(false);
        }
    };

    if (ordersLoading || requestsLoading) {
        return <div className="min-h-screen flex justify-center items-center font-bold text-gray-400 uppercase tracking-widest text-sm">Fetching your collection...</div>;
    }

    if (ordersError || requestsError) {
        return <div className="text-center py-20 text-red-500 font-bold uppercase tracking-widest text-sm">{ordersError || requestsError}</div>;
    }

    // Selected request ke 50% advance aur UPI QR link ka calculation
    const advanceAmount = selectedRequest ? Math.round(selectedRequest.estimatedPrice / 2) : 0;
    const upiUri = selectedRequest
        ? `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${advanceAmount}&cu=INR&tn=${encodeURIComponent(`BespokeOrder_${selectedRequest._id.slice(-6)}`)}`
        : '';
    const qrCodeUrl = selectedRequest
        ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}`
        : '';

    return (
        <div className="bg-[#fafafa] min-h-screen py-16 md:py-24 relative">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* HEADER & TABS */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-black tracking-tighter">Your Vault</h1>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Manage orders & bespoke quotes</p>
                    </div>

                    <div className="flex bg-white p-1 rounded-sm shadow-sm border border-gray-100">
                        <button 
                            onClick={() => setActiveTab('STANDARD')}
                            className={`px-6 py-3 text-xs font-black tracking-widest uppercase transition-all rounded-sm cursor-pointer ${activeTab === 'STANDARD' ? 'bg-[#050505] text-[#D4AF37] shadow-lg' : 'text-gray-400 hover:text-black'}`}
                        >
                            Standard Collection
                        </button>
                        <button 
                            onClick={() => setActiveTab('BESPOKE')}
                            className={`px-6 py-3 text-xs font-black tracking-widest uppercase transition-all rounded-sm cursor-pointer ${activeTab === 'BESPOKE' ? 'bg-[#050505] text-[#D4AF37] shadow-lg' : 'text-gray-400 hover:text-black'}`}
                        >
                            Bespoke Requests
                        </button>
                    </div>
                </div>

                {/* ==================== TAB 1: STANDARD ==================== */}
                {activeTab === 'STANDARD' && (
                    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
                        {(!myOrders || myOrders.length === 0) ? (
                            <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <span className="text-4xl block mb-4">📦</span>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">No standard orders yet.</p>
                                <button onClick={() => navigate('/products')} className="px-6 py-2 bg-black text-white text-[10px] font-black tracking-[0.2em] uppercase rounded-sm hover:bg-[#D4AF37] hover:text-black transition-colors">Shop Collection</button>
                            </div>
                        ) : (
                            myOrders.map((order) => (
                                <div key={order._id} className="bg-white p-8 sm:p-10 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 transition-all hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-8 mb-8">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Order Reference</p>
                                            <p className="text-lg font-bold text-black tracking-tight">#{order._id.slice(-8).toUpperCase()}</p>
                                        </div>
                                        <div className="mt-4 sm:mt-0 text-left sm:text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Current Status</p>
                                            <span className={`relative inline-flex items-center px-5 py-2.5 text-[11px] font-black rounded-sm border transition-all ${
                                                order.orderStatus === 'DELIVERED' ? 'bg-green-100 text-green-800 border-green-300' : 
                                                order.orderStatus === 'SHIPPED' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                                'bg-[#050505] border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.12)] uppercase tracking-[0.2em]' 
                                            }`}>
                                                {(order.orderStatus === 'PLACED' || order.orderStatus === 'PROCESSING' || !order.orderStatus) && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5C158] mr-3 animate-pulse shadow-[0_0_8px_#E5C158]"></span>
                                                )}
                                                <span className={(order.orderStatus === 'PLACED' || order.orderStatus === 'PROCESSING' || !order.orderStatus) ? "bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-transparent bg-clip-text" : ""}>
                                                    {order.orderStatus || 'PLACED'}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        {order.orderItems?.map((item, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 group">
                                                <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 group-hover:border-gray-200 transition-colors">
                                                    <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 w-full">
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h4>
                                                            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-500 mt-3 uppercase tracking-wider">
                                                                <span className="bg-gray-100 px-2 py-1 rounded-sm">Qty: {item.quantity}</span>
                                                            </div>
                                                        </div>
                                                        <div className="font-black text-black text-lg mt-2 sm:mt-0">₹{item.itemFinalPrice}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Date of Purchase</p>
                                            <p className="text-sm font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-left sm:text-right w-full sm:w-auto p-5 bg-gray-50 rounded-lg border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Total Paid</p>
                                            <p className="text-3xl font-black text-black tracking-tighter">₹{order.finalTotal}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ==================== TAB 2: BESPOKE ==================== */}
                {activeTab === 'BESPOKE' && (
                    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
                        {(!myRequests || myRequests.length === 0) ? (
                            <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <span className="text-4xl block mb-4">🎨</span>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">No bespoke requests yet.</p>
                                <button onClick={() => navigate('/custom-art')} className="px-6 py-2 bg-black text-[#D4AF37] text-[10px] font-black tracking-[0.2em] uppercase rounded-sm hover:bg-[#D4AF37] hover:text-black transition-colors">Request Custom Art</button>
                            </div>
                        ) : (
                            myRequests.map((req) => (
                                <div key={req._id} className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col md:flex-row gap-8 transition-all hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]">
                                    
                                    <div className="w-full md:w-1/3 flex-shrink-0">
                                        <div className="w-full aspect-square rounded-xl overflow-hidden border border-gray-100 mb-4 bg-gray-50">
                                            <img src={req.referenceImage} alt={req.theme} className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">{req.theme}</p>
                                        <p className="text-xs text-gray-500 font-bold mt-1">Requested: {new Date(req.createdAt).toLocaleDateString()}</p>
                                    </div>

                                    <div className="w-full md:w-2/3 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <h3 className="text-2xl font-black text-black tracking-tight">{req.shape} Design</h3>
                                                
                                                <span className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm border ${
                                                    req.status === 'PENDING' || req.status === 'REVIEWING' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                    req.status === 'ACCEPTED' ? 'bg-[#050505] text-[#D4AF37] border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' :
                                                    req.status === 'ADVANCE_PAID' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-green-50 text-green-600 border-green-200'
                                                }`}>
                                                    {req.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-[#fafafa] p-3 rounded-lg border border-gray-100">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dimensions</p>
                                                    <p className="text-sm font-bold text-gray-800">{req.dimensions}</p>
                                                </div>
                                                <div className="bg-[#fafafa] p-3 rounded-lg border border-gray-100">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Custom Text</p>
                                                    <p className="text-sm font-bold text-gray-800">{req.customText || 'None'}</p>
                                                </div>
                                            </div>
                                            
                                            {req.adminNotes && (
                                                <p className="text-xs font-medium text-gray-500 italic bg-gray-50 p-3 rounded-lg border-l-2 border-gray-200 mb-6">
                                                    " {req.adminNotes} "
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-auto border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Artist Quotation</p>
                                                {req.estimatedPrice > 0 ? (
                                                    <p className="text-3xl font-black text-black tracking-tighter">₹{req.estimatedPrice.toLocaleString('en-IN')}</p>
                                                ) : (
                                                    <p className="text-sm font-bold text-gray-400">Evaluating...</p>
                                                )}
                                            </div>
                                            
                                            {/* 🚀 BUTTON: Opens PhonePe QR + Address Modal */}
                                            {req.status === 'ACCEPTED' && req.estimatedPrice > 0 && (
                                                <button 
                                                    onClick={() => handleOpenPaymentModal(req)} 
                                                    className="w-full sm:w-auto px-8 py-4 bg-black text-[#D4AF37] font-black uppercase tracking-[0.2em] text-xs rounded-sm hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] cursor-pointer"
                                                >
                                                    Confirm Order (UPI)
                                                </button>
                                            )}

                                            {/* 🚀 ADVANCE PAID CONFIRMATION */}
                                            {req.status === 'ADVANCE_PAID' && (
                                                <div className="w-full sm:w-auto text-right">
                                                    <p className="text-xs font-bold text-green-700 bg-green-50 px-4 py-2.5 rounded-sm border border-green-200 inline-block">
                                                        ✅ ₹{req.advancePaid?.toLocaleString('en-IN')} Advance Paid (UTR: {req.utrNumber})
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* ================================================================= */}
            {/* 🚀 LUXURY UPI CHECKOUT MODAL (Address + PhonePe QR + 5-Min Timer) */}
            {/* ================================================================= */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="bg-[#0a0a0a] border border-[#D4AF37]/40 rounded-2xl max-w-3xl w-full p-6 sm:p-8 text-white shadow-[0_0_50px_rgba(212,175,55,0.15)] relative my-8">
                        
                        {/* Close Button */}
                        <button 
                            onClick={() => setSelectedRequest(null)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-white text-xl font-bold cursor-pointer"
                        >
                            ✕
                        </button>

                        {/* Modal Header & Timer */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-5 mb-6 gap-4 pr-8">
                            <div>
                                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.25em]">Bespoke Vault Checkout</p>
                                <h3 className="text-2xl font-black tracking-tight mt-1">{selectedRequest.shape} — {selectedRequest.theme}</h3>
                            </div>
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-lg self-start sm:self-auto">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                <span className="text-xs font-black uppercase tracking-widest text-red-400">
                                    Expires in {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleConfirmPayment} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* LEFT COLUMN: DELIVERY ADDRESS */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-2">1. Delivery Details</h4>
                                
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Full Name</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="Enter receiver's name"
                                        value={shippingAddress.fullName}
                                        onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                                        className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">WhatsApp / Phone Number</label>
                                    <input 
                                        type="tel"
                                        required
                                        maxLength={10}
                                        placeholder="10-digit mobile number"
                                        value={shippingAddress.phone}
                                        onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value.replace(/\D/g, '')})}
                                        className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Complete Street Address</label>
                                    <textarea 
                                        rows="2"
                                        required
                                        placeholder="House No, Building, Area, Landmark"
                                        value={shippingAddress.address}
                                        onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                                        className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">City</label>
                                        <input 
                                            type="text"
                                            required
                                            placeholder="City"
                                            value={shippingAddress.city}
                                            onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                                            className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Pincode</label>
                                        <input 
                                            type="text"
                                            required
                                            maxLength={6}
                                            placeholder="6-digit Pincode"
                                            value={shippingAddress.pincode}
                                            onChange={(e) => setShippingAddress({...shippingAddress, pincode: e.target.value.replace(/\D/g, '')})}
                                            className="w-full bg-[#121212] border border-white/10 focus:border-[#D4AF37] rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: PHONEPE QR & UTR INPUT */}
                            <div className="flex flex-col justify-between bg-[#111111] p-5 rounded-xl border border-white/5">
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">2. Scan via PhonePe / UPI</h4>
                                        <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded font-bold">50% Advance</span>
                                    </div>

                                    {/* QR CODE BOX */}
                                    <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center mb-4 shadow-inner">
                                        <img 
                                            src={qrCodeUrl} 
                                            alt="UPI QR Code" 
                                            className="w-44 h-44 object-contain"
                                        />
                                        <p className="text-xs font-black text-black mt-2 tracking-tight">
                                            Pay Advance: <span className="text-purple-700 text-base">₹{advanceAmount.toLocaleString('en-IN')}</span>
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-bold">Total Quote: ₹{selectedRequest.estimatedPrice.toLocaleString('en-IN')}</p>
                                    </div>

                                    {/* UTR / REF NUMBER INPUT */}
                                    <div className="mb-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 block mb-1">
                                            Enter 12-Digit UPI Ref / UTR No. *
                                        </label>
                                        <input 
                                            type="text"
                                            required
                                            maxLength={12}
                                            placeholder="e.g. 412389012345"
                                            value={utrNumber}
                                            onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-[#050505] border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-lg px-4 py-2.5 text-sm text-[#D4AF37] font-mono font-bold tracking-widest outline-none"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Pay karne ke baad PhonePe history se 12-digit UTR number yahan daalein.</p>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={submittingPayment}
                                    className="w-full py-3.5 bg-[#D4AF37] text-black font-black uppercase tracking-[0.2em] text-xs rounded-lg hover:bg-[#e5c158] transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] cursor-pointer disabled:opacity-50"
                                >
                                    {submittingPayment ? 'Verifying Payment...' : `Verify & Pay ₹${advanceAmount.toLocaleString('en-IN')}`}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrders;