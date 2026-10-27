import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOrders, updateOrderStatus } from '../../features/order/orderSlice';
import toast from 'react-hot-toast';

const AdminOrders = () => {
    const dispatch = useDispatch();
    const { allOrders, loading } = useSelector((state) => state.order);

    useEffect(() => {
        dispatch(fetchAllOrders());
    }, [dispatch]);

    const safeOrders = Array.isArray(allOrders) ? allOrders : [];

    // THE MAGIC: Status Change & Reverse Logic
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await dispatch(updateOrderStatus({ id: orderId, orderStatus: newStatus })).unwrap();
            toast.success(`Order status changed to ${newStatus} ⚡`);
            dispatch(fetchAllOrders()); // Table ko live refresh karne ke liye
        } catch (error) {
            toast.error(error || 'Failed to update status');
        }
    };

    if (loading && safeOrders.length === 0) {
        return <div className="text-[#D4AF37] font-bold tracking-widest uppercase text-sm mt-10">Accessing Live Order Stream...</div>;
    }

    return (
        <div>
            <div className="mb-10">
                <h2 className="text-3xl font-black text-white tracking-tight">Live Orders</h2>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">Manage & Dispatch</p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="text-[10px] text-gray-500 uppercase tracking-[0.2em] bg-[#050505] border-b border-white/5">
                            <tr>
                                <th className="px-6 py-5 font-black">Order ID & Date</th>
                                <th className="px-6 py-5 font-black">Customer Details</th>
                                <th className="px-6 py-5 font-black">Items</th>
                                <th className="px-6 py-5 font-black">Total Paid</th>
                                <th className="px-6 py-5 font-black">Live Status Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {safeOrders.map((order) => (
                                <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                                    
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-white tracking-wide">#{order._id.slice(-6).toUpperCase()}</p>
                                        <p className="text-[10px] text-gray-500 uppercase mt-1">
                                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </p>
                                    </td>

                                    <td className="px-6 py-5">
                                        <p className="font-bold text-white">{order.shippingAddress?.fullName}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                                    </td>

                                    <td className="px-6 py-5">
                                        <span className="px-3 py-1 bg-white/5 rounded-sm font-bold text-white text-xs border border-white/10">
                                            {order.orderItems?.length || 0} Items
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 font-bold text-[#D4AF37] text-lg tracking-tight">
                                        ₹{order.finalTotal}
                                    </td>

                                    <td className="px-6 py-5">
                                        {/* 🚀 VIP DROPDOWN: Yahan se status change aur reverse hoga */}
                                        <select 
                                            value={order.orderStatus || 'PLACED'} 
                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                            className={`outline-none px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-wider cursor-pointer appearance-none ${
                                                order.orderStatus === 'PLACED' ? 'bg-[#1a1a1a] text-white border border-white/20' :
                                                order.orderStatus === 'PROCESSING' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' :
                                                order.orderStatus === 'SHIPPED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                                                'bg-green-500/10 text-green-400 border border-green-500/30'
                                            }`}
                                        >
                                            <option value="PLACED" className="bg-[#050505] text-white">PLACED</option>
                                            <option value="PROCESSING" className="bg-[#050505] text-[#D4AF37]">PROCESSING</option>
                                            <option value="SHIPPED" className="bg-[#050505] text-blue-400">SHIPPED</option>
                                            <option value="DELIVERED" className="bg-[#050505] text-green-400">DELIVERED</option>
                                        </select>
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;