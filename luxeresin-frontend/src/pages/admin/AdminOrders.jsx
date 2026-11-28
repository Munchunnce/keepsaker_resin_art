import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOrders, updateOrderLive, updateOrderStatus } from '../../features/order/orderSlice';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    try {
        return new URL(apiBaseUrl).origin;
    } catch {
        return apiBaseUrl.replace(/\/api\/v1(\/auth)?\/?$/, '');
    }
};

const getErrorMessage = (err, fallback) =>
    typeof err === 'string'
        ? err
        : err?.response?.data?.message || err?.message || fallback;

const getPaymentBadge = (status) => {
    switch (status) {
        case 'COMPLETED':
            return {
                label: '✅ PAID',
                className: 'bg-green-500/10 text-green-400 border-green-500/30',
            };
        case 'FAILED':
            return {
                label: '✕ FAILED',
                className: 'bg-red-500/10 text-red-400 border-red-500/30',
            };
        case 'REFUNDED':
            return {
                label: '↩ REFUNDED',
                className: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
            };
        default:
            return {
                label: '⏳ PENDING',
                className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
            };
    }
};

const getStatusSelectStyle = (status) => {
    switch (status) {
        case 'PROCESSING':
            return 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30';
        case 'SHIPPED':
            return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
        case 'DELIVERED':
            return 'bg-green-500/10 text-green-400 border border-green-500/30';
        case 'CANCELLED':
            return 'bg-red-500/10 text-red-400 border border-red-500/30';
        default:
            return 'bg-[#1a1a1a] text-white border border-white/20';
    }
};

const AdminOrders = () => {
    const dispatch = useDispatch();
    const { allOrders, loading } = useSelector((state) => state.order);
    const { user } = useSelector((state) => state.auth);
    const [updatingId, setUpdatingId] = useState(null);

    const userData = user?.user || user?.data || user;
    const isAdmin = userData?.role?.toLowerCase() === 'admin';

    useEffect(() => {
        if (!isAdmin) return;
        dispatch(fetchAllOrders());

        // LIVE SOCKET.IO MAGIC FOR ADMIN DASHBOARD
        const socket = io(getSocketUrl());

        socket.on('connect', () => {
            console.log('✅ Admin Socket Connected! ID:', socket.id);
        });

        // 1. Naya order aate hi live notification + refresh
        socket.on('new-order-placed', (newOrder) => {
            const shortId = newOrder?._id ? newOrder._id.slice(-6).toUpperCase() : 'NEW';
            toast.success(`🚨 New Order Alert! #${shortId} placed just now.`, {
                style: { background: '#0a0a0a', color: '#D4AF37', border: '1px solid #D4AF37' },
            });
            dispatch(fetchAllOrders());
        });

        // 2. Status update sync with Redux
        socket.on('order-status-updated', (updatedOrder) => {
            if (updatedOrder?._id) {
                dispatch(updateOrderLive(updatedOrder));
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [dispatch, isAdmin]);

    const safeOrders = Array.isArray(allOrders) ? allOrders : [];

    // Status Change Handler (with per-row busy lock)
    const handleStatusChange = async (orderId, newStatus) => {
        if (updatingId === orderId) return;
        try {
            setUpdatingId(orderId);
            await dispatch(updateOrderStatus({ id: orderId, orderStatus: newStatus })).unwrap();
            toast.success(`Order status changed to ${newStatus} ⚡`);
            dispatch(fetchAllOrders());
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to update status'));
        } finally {
            setUpdatingId(null);
        }
    };

    // 1-Click Parcel Label Copy
    const handleCopyAddress = async (order) => {
        const addr = order?.shippingAddress;
        if (!addr) {
            toast.error('Shipping address not available.');
            return;
        }

        const formatted = [
            `Order: #${order._id?.slice(-6).toUpperCase()}`,
            `Name: ${addr.fullName || 'N/A'}`,
            `Phone: ${addr.phone || 'N/A'}`,
            `Address: ${addr.streetAddress || 'N/A'}`,
            `${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`,
        ].join('\n');

        try {
            await navigator.clipboard.writeText(formatted);
            toast.success('Full shipping address copied for parcel! 📦');
        } catch {
            toast.error('Failed to copy address.');
        }
    };

    if (loading && safeOrders.length === 0) {
        return (
            <div className="text-[#D4AF37] font-bold tracking-widest uppercase text-sm mt-10 animate-pulse">
                Accessing Live Order Stream...
            </div>
        );
    }

    return (
        <div>
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Live Orders</h2>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">
                        Manage & Dispatch
                    </p>
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-500">
                    Total Orders: <span className="text-[#D4AF37]">{safeOrders.length}</span>
                </span>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="text-[10px] text-gray-500 uppercase tracking-[0.2em] bg-[#050505] border-b border-white/5">
                            <tr>
                                <th className="px-6 py-5 font-black">Order ID & Date</th>
                                <th className="px-6 py-5 font-black">Customer & Shipping Address</th>
                                <th className="px-6 py-5 font-black">Items to Pack</th>
                                <th className="px-6 py-5 font-black">Total & Payment</th>
                                <th className="px-6 py-5 font-black">Live Status Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/5">
                            {safeOrders.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="px-6 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-500"
                                    >
                                        No orders received yet.
                                    </td>
                                </tr>
                            ) : (
                                safeOrders.map((order) => {
                                    const addr = order.shippingAddress || {};
                                    const paymentBadge = getPaymentBadge(order.paymentStatus);
                                    const txnRef = order.transactionId || order.utrNumber;
                                    const isUpdating = updatingId === order._id;

                                    return (
                                        <tr
                                            key={order._id}
                                            className="hover:bg-white/[0.02] transition-colors align-top"
                                        >
                                            {/* ORDER ID & DATE */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <p className="font-bold text-white tracking-wide font-mono">
                                                    #{order._id?.slice(-6).toUpperCase()}
                                                </p>
                                                <p className="text-[10px] text-gray-500 uppercase mt-1">
                                                    {order.createdAt
                                                        ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                              day: '2-digit',
                                                              month: 'short',
                                                              year: 'numeric',
                                                          })
                                                        : '—'}
                                                </p>
                                            </td>

                                            {/* FULL SHIPPING ADDRESS FOR PARCEL DISPATCH */}
                                            <td className="px-6 py-5 min-w-[260px] max-w-[340px]">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-bold text-white">
                                                        {addr.fullName || 'N/A'}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyAddress(order)}
                                                        className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/5 hover:bg-[#D4AF37]/20 text-gray-300 hover:text-[#D4AF37] border border-white/10 hover:border-[#D4AF37]/40 transition-colors cursor-pointer flex-shrink-0"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>

                                                {addr.phone && (
                                                    <p className="text-[11px] font-bold text-[#D4AF37] mt-1 font-mono">
                                                        📞 {addr.phone}
                                                    </p>
                                                )}

                                                {addr.streetAddress && (
                                                    <p className="text-xs text-gray-300 mt-1.5 leading-relaxed break-words">
                                                        {addr.streetAddress}
                                                    </p>
                                                )}

                                                <p className="text-[11px] text-gray-400 font-semibold mt-1">
                                                    {[addr.city, addr.state].filter(Boolean).join(', ')}
                                                    {addr.pincode ? (
                                                        <span className="text-white font-mono"> — {addr.pincode}</span>
                                                    ) : (
                                                        ''
                                                    )}
                                                </p>
                                            </td>

                                            {/* ITEMS TO PACK */}
                                            <td className="px-6 py-5 min-w-[210px] max-w-[280px]">
                                                <span className="inline-block px-2.5 py-0.5 bg-white/5 rounded-sm font-bold text-white text-[11px] border border-white/10 mb-2">
                                                    {order.orderItems?.length || 0}{' '}
                                                    {order.orderItems?.length === 1 ? 'Item' : 'Items'}
                                                </span>

                                                <div className="space-y-1.5">
                                                    {order.orderItems?.map((item, idx) => (
                                                        <div
                                                            key={item._id || idx}
                                                            className="text-[11px] leading-snug border-l-2 border-[#D4AF37]/40 pl-2"
                                                        >
                                                            <p className="text-gray-200 font-semibold line-clamp-1">
                                                                {item.quantity}x {item.name}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500">
                                                                {item.selectedSize || 'Standard'} •{' '}
                                                                {item.selectedColor || 'Default'}
                                                                {Array.isArray(item.selectedAddons) &&
                                                                item.selectedAddons.length > 0
                                                                    ? ` • +${item.selectedAddons.join(', ')}`
                                                                    : ''}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* TOTAL PAID & PAYMENT STATUS BADGE */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <p className="font-bold text-[#D4AF37] text-lg tracking-tight">
                                                    ₹{Number(order.finalTotal || 0).toLocaleString('en-IN')}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-white/5 text-gray-400 rounded border border-white/10">
                                                        {order.paymentMethod || 'COD'}
                                                    </span>
                                                    <span
                                                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${paymentBadge.className}`}
                                                    >
                                                        {paymentBadge.label}
                                                    </span>
                                                </div>
                                                {txnRef && (
                                                    <p className="text-[10px] text-gray-500 font-mono mt-1.5">
                                                        TXN: {txnRef}
                                                    </p>
                                                )}
                                            </td>

                                            {/* LIVE STATUS ACTION */}
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <select
                                                    disabled={isUpdating}
                                                    value={order.orderStatus || 'PLACED'}
                                                    onChange={(e) =>
                                                        handleStatusChange(order._id, e.target.value)
                                                    }
                                                    className={`outline-none px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 ${getStatusSelectStyle(
                                                        order.orderStatus
                                                    )}`}
                                                >
                                                    <option value="PLACED" className="bg-[#050505] text-white">
                                                        PLACED
                                                    </option>
                                                    <option
                                                        value="PROCESSING"
                                                        className="bg-[#050505] text-[#D4AF37]"
                                                    >
                                                        PROCESSING
                                                    </option>
                                                    <option
                                                        value="SHIPPED"
                                                        className="bg-[#050505] text-blue-400"
                                                    >
                                                        SHIPPED
                                                    </option>
                                                    <option
                                                        value="DELIVERED"
                                                        className="bg-[#050505] text-green-400"
                                                    >
                                                        DELIVERED
                                                    </option>
                                                    <option
                                                        value="CANCELLED"
                                                        className="bg-[#050505] text-red-400"
                                                    >
                                                        CANCELLED
                                                    </option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;