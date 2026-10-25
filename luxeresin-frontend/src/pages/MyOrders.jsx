import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders } from '../features/order/orderSlice';
import { fetchMyCustomRequests } from '../features/customArt/customArtSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyOrders = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // NAYA: Tab state manage karne ke liye
    const [activeTab, setActiveTab] = useState('STANDARD');

    // Normal Orders State
    const { myOrders, loading: ordersLoading, error: ordersError } = useSelector((state) => state.order);
    
    // Custom Requests State
    const { myRequests, loading: requestsLoading, error: requestsError } = useSelector((state) => state.customArt);

    useEffect(() => {
        dispatch(fetchMyOrders());
        dispatch(fetchMyCustomRequests()); // 🚀 NAYA: Component load hote hi custom requests bhi layega
    }, [dispatch]);

    const handleAcceptQuote = (requestId) => {
        // Yahan Checkout API ya Razorpay link add hoga next step mein
        console.log("Initiating payment for Custom Request ID:", requestId);
        toast('Checkout feature coming soon! 💳', { icon: '🚧' });
    };

    if (ordersLoading || requestsLoading) {
        return <div className="min-h-screen flex justify-center items-center font-bold text-gray-400 uppercase tracking-widest text-sm">Fetching your collection...</div>;
    }

    //  ordersError aur requestsError ko yahan error dikhane ke liye use kar liya
    if (ordersError || requestsError) {
        return <div className="text-center py-20 text-red-500 font-bold uppercase tracking-widest text-sm">{ordersError || requestsError}</div>;
    }

    return (
        <div className="bg-[#fafafa] min-h-screen py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* 🚀 PAGE HEADER & TABS */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-black tracking-tighter">Your Vault</h1>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Manage orders & bespoke quotes</p>
                    </div>

                    {/* TABS BUTTONS */}
                    <div className="flex bg-white p-1 rounded-sm shadow-sm border border-gray-100">
                        <button 
                            onClick={() => setActiveTab('STANDARD')}
                            className={`px-6 py-3 text-xs font-black tracking-widest uppercase transition-all rounded-sm ${activeTab === 'STANDARD' ? 'bg-[#050505] text-[#D4AF37] shadow-lg' : 'text-gray-400 hover:text-black'}`}
                        >
                            Standard Collection
                        </button>
                        <button 
                            onClick={() => setActiveTab('BESPOKE')}
                            className={`px-6 py-3 text-xs font-black tracking-widest uppercase transition-all rounded-sm ${activeTab === 'BESPOKE' ? 'bg-[#050505] text-[#D4AF37] shadow-lg' : 'text-gray-400 hover:text-black'}`}
                        >
                            Bespoke Requests
                        </button>
                    </div>
                </div>

                {/* ==================================================== */}
                {/* 🚀 TAB 1: STANDARD ORDERS (Aapka purana code yahan hai) */}
                {/* ==================================================== */}
                {activeTab === 'STANDARD' && (
                    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
                        {(!myOrders || myOrders.length === 0) ? (
                            <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <span className="text-4xl block mb-4">📦</span>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No standard orders yet.</p>
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

                {/* ==================================================== */}
                {/* 🚀 TAB 2: BESPOKE REQUESTS (Naya UI) */}
                {/* ==================================================== */}
                {activeTab === 'BESPOKE' && (
                    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
                        {(!myRequests || myRequests.length === 0) ? (
                            <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <span className="text-4xl block mb-4">🎨</span>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">No bespoke requests yet.</p>
                                <button onClick={() => navigate('/custom-art')} className="px-6 py-2 bg-black text-[#D4AF37] text-[10px] font-black tracking-[0.2em] uppercase rounded-sm">Request Custom Art</button>
                            </div>
                        ) : (
                            myRequests.map((req) => (
                                <div key={req._id} className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col md:flex-row gap-8 transition-all hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]">
                                    
                                    {/* PHOTO & THEME */}
                                    <div className="w-full md:w-1/3 flex-shrink-0">
                                        <div className="w-full aspect-square rounded-xl overflow-hidden border border-gray-100 mb-4 bg-gray-50">
                                            <img src={req.referenceImage} alt={req.theme} className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">{req.theme}</p>
                                        <p className="text-xs text-gray-500 font-bold mt-1">Requested: {new Date(req.createdAt).toLocaleDateString()}</p>
                                    </div>

                                    {/* DETAILS & QUOTE */}
                                    <div className="w-full md:w-2/3 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <h3 className="text-2xl font-black text-black tracking-tight">{req.shape} Design</h3>
                                                <span className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm border ${
                                                    req.status === 'PENDING' || req.status === 'REVIEWING' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                    req.status === 'ACCEPTED' ? 'bg-[#050505] text-[#D4AF37] border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' :
                                                    'bg-green-50 text-green-600 border-green-200'
                                                }`}>
                                                    {req.status}
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

                                        {/* QUOTATION ACTION AREA */}
                                        <div className="mt-auto border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Artist Quotation</p>
                                                {req.estimatedPrice > 0 ? (
                                                    <p className="text-3xl font-black text-black tracking-tighter">₹{req.estimatedPrice.toLocaleString('en-IN')}</p>
                                                ) : (
                                                    <p className="text-sm font-bold text-gray-400">Evaluating...</p>
                                                )}
                                            </div>
                                            
                                            {/* VIP CHECKOUT BUTTON */}
                                            {req.status === 'ACCEPTED' && req.estimatedPrice > 0 && (
                                                <button onClick={() => handleAcceptQuote(req._id)} className="w-full sm:w-auto px-8 py-4 bg-black text-[#D4AF37] font-black uppercase tracking-[0.2em] text-xs rounded-sm hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                                                    Accept Quote & Pay
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;