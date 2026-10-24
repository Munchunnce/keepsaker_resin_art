import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOrders } from '../../features/order/orderSlice';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 🚀 FIX 1: TOOLTIP KO COMPONENT KE BAHAR NIKAL DIYA
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#050505]/95 backdrop-blur-md border border-[#D4AF37]/40 p-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className="text-2xl font-black text-[#D4AF37] tracking-tight">₹{payload[0].value.toLocaleString('en-IN')}</p>
            </div>
        );
    }
    return null;
};

// 🚀 FIX 2: GRAPH DATA LOGIC KO BHI BAHAR NIKAL DIYA (React Compiler Khush)
const generateChartData = (orders) => {
    if (!orders || orders.length === 0) return [];
    
    const dataMap = {};
    const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    sortedOrders.forEach(order => {
        const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        if (!dataMap[dateStr]) dataMap[dateStr] = 0;
        dataMap[dateStr] += (order.finalTotal || 0);
    });
    
    return Object.keys(dataMap).map(date => ({
        date,
        revenue: dataMap[date]
    }));
};

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const { allOrders, loading } = useSelector((state) => state.order);

    useEffect(() => {
        dispatch(fetchAllOrders());
    }, [dispatch]);

    const safeOrders = Array.isArray(allOrders) ? allOrders : [];
    
    // 🚀 CLEAN STATS MATH
    const totalRevenue = safeOrders.reduce((sum, order) => sum + (order.finalTotal || 0), 0);
    const newOrdersCount = safeOrders.filter(o => o.orderStatus === 'PLACED').length;
    const processingCount = safeOrders.filter(o => o.orderStatus === 'PROCESSING').length;
    const deliveredCount = safeOrders.filter(o => o.orderStatus === 'DELIVERED').length;

    // 🚀 USE THE HELPER FUNCTION (No manual useMemo needed, React Compiler handles it)
    const chartData = generateChartData(safeOrders);

    const stats = [
        { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, isGlow: false },
        { title: 'New Orders (Placed)', value: newOrdersCount, isGlow: newOrdersCount > 0 },
        { title: 'Processing', value: processingCount, isGlow: false },
        { title: 'Successfully Delivered', value: deliveredCount, isGlow: false, isSuccess: true },
    ];

    if (loading && safeOrders.length === 0) {
        return <div className="text-[#D4AF37] font-bold tracking-widest uppercase text-sm mt-10 animate-pulse">Syncing Command Center...</div>;
    }

    return (
        <div>
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Command Center</h2>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">Live Store Overview</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5C158] animate-pulse shadow-[0_0_8px_#E5C158]"></span>
                    <span className="text-[10px] text-[#D4AF37] uppercase font-black tracking-widest">Live Sync</span>
                </div>
            </div>

            {/* GLOWING METRIC CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, idx) => (
                    <div key={idx} className={`relative p-6 rounded-2xl bg-[#0a0a0a] border transition-all duration-300 hover:-translate-y-1 ${
                        stat.isGlow ? 'border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 
                        stat.isSuccess ? 'border-green-500/30' : 'border-white/5'
                    }`}>
                        <div className="absolute top-6 right-6">
                            {stat.isGlow && <span className="flex w-2.5 h-2.5 rounded-full bg-[#E5C158] animate-pulse shadow-[0_0_8px_#E5C158]"></span>}
                        </div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">{stat.title}</p>
                        <h3 className={`text-4xl font-black tracking-tighter ${stat.isGlow ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] to-[#FCF6BA]' : 'text-white'}`}>
                            {stat.value}
                        </h3>
                    </div>
                ))}
            </div>

            {/* REVENUE GRAPH */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-2xl mb-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#D4AF37]/5 to-transparent opacity-50 pointer-events-none"></div>
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white tracking-wide relative z-10">Revenue Trajectory</h3>
                </div>
                
                <div className="h-[320px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6} />
                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.03} vertical={false} />
                            <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} dy={10} fontWeight="bold" />
                            <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} fontWeight="bold" />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#D4AF37', strokeWidth: 1, strokeDasharray: '5 5' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={4} fillOpacity={1} fill="url(#goldGradient)" activeDot={{ r: 7, fill: "#050505", stroke: "#D4AF37", strokeWidth: 3, shadow: "0 0 15px #D4AF37" }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* RECENT TRANSACTIONS TABLE */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-[#0d0d0d] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white tracking-wide">Live Order Stream</h3>
                    <span className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-black">Recent 6 Transactions</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="text-[10px] text-gray-500 uppercase tracking-[0.2em] bg-[#050505]">
                            <tr>
                                <th className="px-6 py-4 font-black">Order ID</th>
                                <th className="px-6 py-4 font-black">Customer</th>
                                <th className="px-6 py-4 font-black">Amount</th>
                                <th className="px-6 py-4 font-black">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[...safeOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6).map((order) => (
                                <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">#{order._id.slice(-6).toUpperCase()}</td>
                                    <td className="px-6 py-4">{order.shippingAddress?.fullName || 'Guest'}</td>
                                    <td className="px-6 py-4 font-bold text-[#D4AF37]">₹{order.finalTotal}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider ${
                                            order.orderStatus === 'PLACED' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20' : 
                                            order.orderStatus === 'PROCESSING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                                            'bg-green-500/10 text-green-400 border border-green-500/20'
                                        }`}>
                                            {order.orderStatus}
                                        </span>
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

export default AdminDashboard;