import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders } from '../features/order/orderSlice';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { myOrders, loading, error } = useSelector((state) => state.order);

    useEffect(() => {
        dispatch(fetchMyOrders());
    }, [dispatch]);

    if (loading) {
        return <div className="min-h-screen flex justify-center items-center font-bold text-gray-400 uppercase tracking-widest text-sm">Fetching your collection...</div>;
    }

    if (error) {
        return <div className="text-center py-20 text-red-500 font-bold">{error}</div>;
    }

    if (!myOrders || myOrders.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#fafafa] px-4">
                <div className="w-24 h-24 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl">📦</span>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">No Orders Yet</h2>
                <p className="text-gray-400 mb-8 font-medium">Your luxury collection awaits.</p>
                <button onClick={() => navigate('/')} className="px-10 py-4 bg-black text-white text-sm font-bold tracking-widest uppercase rounded-none hover:bg-gray-800 transition-all">
                    Discover Art
                </button>
            </div>
        );
    }

    return (
        <div className="bg-[#fafafa] min-h-screen py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-12">
                    <h1 className="text-4xl font-black text-black tracking-tighter">Order History</h1>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{myOrders.length} Orders</span>
                </div>

                <div className="space-y-8">
                    {myOrders.map((order) => (
                        <div key={order._id} className="bg-white p-8 sm:p-10 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 transition-all hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]">
                            
                            {/* 🚀 PREMIUM HEADER */}
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
                                        // 🚀 PLACED aur PROCESSING dono ke liye Deep Obsidian Black background
                                        'bg-[#050505] border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.12)] uppercase tracking-[0.2em]' 
                                    }`}>
                                        
                                        {/* 🚀 FIXED: PLACED aur PROCESSING dono mein Gold Dot chamkega */}
                                        {(order.orderStatus === 'PLACED' || order.orderStatus === 'PROCESSING' || !order.orderStatus) && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#E5C158] mr-3 animate-pulse shadow-[0_0_8px_#E5C158]"></span>
                                        )}
                                        
                                        {/* 🚀 FIXED: PLACED aur PROCESSING dono mein Gold Text aayega */}
                                        <span className={
                                            (order.orderStatus === 'PLACED' || order.orderStatus === 'PROCESSING' || !order.orderStatus) 
                                                ? "bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-transparent bg-clip-text"
                                                : ""
                                        }>
                                            {order.orderStatus || 'PLACED'}
                                        </span>
                                        
                                    </span>
                                </div>
                            </div>

                            {/* 🚀 LUXURY ITEMS LIST */}
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
                                                        {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                                                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                                                    </div>
                                                </div>
                                                <div className="font-black text-black text-lg mt-2 sm:mt-0">
                                                    ₹{item.itemFinalPrice}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 🚀 MINIMALIST FOOTER (FIXED finalTotal) */}
                            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Date of Purchase</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                    {order.discountAmount > 0 && (
                                        <p className="text-xs font-bold text-green-600 mt-2">Saved ₹{order.discountAmount} applied</p>
                                    )}
                                </div>
                                <div className="text-left sm:text-right w-full sm:w-auto p-5 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Total Paid</p>
                                    {/* 🚨 FIX: Yahan totalAmount ki jagah finalTotal kar diya gaya hai */}
                                    <p className="text-3xl font-black text-black tracking-tighter">₹{order.finalTotal}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyOrders;