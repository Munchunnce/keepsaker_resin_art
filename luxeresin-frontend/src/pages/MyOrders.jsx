import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders, updateOrderLive } from '../features/order/orderSlice';
import { fetchMyCustomRequests, acceptCustomArtQuote } from '../features/customArt/customArtSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

// YAHAN APNA ASALI PHONEPE / UPI ID DAALEIN
const MERCHANT_UPI_ID = '9708723622@ybl';
const MERCHANT_NAME = 'LuxeResin Art';

// BESPOKE PROGRESS STEPS
const BESPOKE_STEPS = [
    { key: 'ADVANCE_PAID', label: 'Advance Paid', icon: '💳' },
    { key: 'IN_MAKING', label: 'In Making', icon: '🎨' },
    { key: 'SHIPPED', label: 'Shipped', icon: '🚚' },
    { key: 'DELIVERED', label: 'Delivered', icon: '✨' }
];

const getErrorMessage = (err, fallback) =>
    typeof err === 'string'
        ? err
        : err?.response?.data?.message || err?.message || fallback;

const getSocketUrl = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    try {
        return new URL(apiBaseUrl).origin;
    } catch {
        return apiBaseUrl.replace(/\/api\/v1(\/auth)?\/?$/, '');
    }
};

const getOrderStatusBadge = (status) => {
    switch (status) {
        case 'DELIVERED':
            return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
        case 'SHIPPED':
            return 'bg-sky-500/15 text-sky-400 border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.15)]';
        case 'CANCELLED':
            return 'bg-red-500/15 text-red-400 border-red-500/40';
        default:
            return 'bg-[#0a0a0a] text-[#FCF6BA] border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.18)]';
    }
};

const getBespokeStatusBadge = (status) => {
    switch (status) {
        case 'PENDING':
        case 'REVIEWING':
            return 'bg-amber-500/15 text-amber-300 border-amber-500/35';
        case 'DELIVERED':
            return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
        case 'REJECTED':
        case 'CANCELLED':
            return 'bg-red-500/15 text-red-400 border-red-500/40';
        default:
            return 'bg-[#D4AF37]/15 text-[#FCF6BA] border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]';
    }
};

const MyOrders = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('STANDARD');

    // PAYMENT MODAL STATES
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 Minutes (300 seconds)
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [utrNumber, setUtrNumber] = useState('');

    const { user } = useSelector((state) => state.auth);
    const { myOrders = [], loading: ordersLoading, error: ordersError } = useSelector((state) => state.order);
    const { myRequests = [], loading: requestsLoading, error: requestsError } = useSelector((state) => state.customArt);

    const userData = user?.user || user?.data || user;
    const currentUserId = userData?._id || userData?.id || null;
    const savedAddress = userData?.address || {};

    const [shippingAddress, setShippingAddress] = useState({
        fullName: savedAddress.fullName || userData?.full_name || '',
        phone: savedAddress.phone || '',
        address: savedAddress.streetAddress || '',
        city: savedAddress.city || '',
        pincode: savedAddress.pincode || ''
    });

    // 1. INITIAL DATA FETCH
    useEffect(() => {
        dispatch(fetchMyOrders());
        dispatch(fetchMyCustomRequests());
    }, [dispatch]);

    // 2. LIVE SOCKET.IO MAGIC (User-Scoped — Doosre user ka update leak nahi hoga)
    useEffect(() => {
        const socket = io(getSocketUrl());

        socket.on('order-status-updated', (updatedOrder) => {
            if (!updatedOrder?._id) return;

            const orderUserId =
                typeof updatedOrder.user === 'object'
                    ? updatedOrder.user?._id
                    : updatedOrder.user;

            // SECURITY FIX: Sirf logged-in user ke apne order par update aur toast dikhao
            if (currentUserId && orderUserId && String(orderUserId) !== String(currentUserId)) {
                return;
            }

            dispatch(updateOrderLive(updatedOrder));

            toast.success(
                `Order #${updatedOrder._id.slice(-8).toUpperCase()} updated to ${updatedOrder.orderStatus} ⚡`,
                {
                    icon: '🚀',
                    style: {
                        borderRadius: '10px',
                        background: '#111',
                        color: '#D4AF37',
                        border: '1px solid rgba(212,175,55,0.4)',
                        fontWeight: 'bold'
                    }
                }
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [dispatch, currentUserId]);

    // 3. DRIFT-FREE 5-MINUTE LIVE COUNTDOWN TIMER (React 19 Safe)
    useEffect(() => {
        if (!selectedRequest) return;

        const expiresAt = Date.now() + 300 * 1000;

        const timer = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
                setSelectedRequest(null);
                toast.error('Payment session expired! Please try again. ⏳');
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [selectedRequest]);

    const handleOpenPaymentModal = (req) => {
        setSelectedRequest(req);
        setTimeLeft(300);
        setUtrNumber('');
    };

    const handleCopyUpi = async () => {
        try {
            await navigator.clipboard.writeText(MERCHANT_UPI_ID);
            toast.success('UPI ID copied to clipboard!');
        } catch {
            toast.error('Could not copy UPI ID.');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleConfirmPayment = async (e) => {
        e.preventDefault();
        if (submittingPayment || !selectedRequest) return;

        const cleanAddress = {
            fullName: shippingAddress.fullName.trim(),
            phone: shippingAddress.phone.trim(),
            address: shippingAddress.address.trim(),
            city: shippingAddress.city.trim(),
            pincode: shippingAddress.pincode.trim()
        };

        if (!cleanAddress.fullName || !cleanAddress.address || !cleanAddress.city) {
            return toast.error('Please fill complete delivery address!');
        }
        if (!/^[0-9]{10}$/.test(cleanAddress.phone)) {
            return toast.error('Phone number must be exactly 10 digits!');
        }
        if (!/^[0-9]{6}$/.test(cleanAddress.pincode)) {
            return toast.error('Pincode must be exactly 6 digits!');
        }
        if (!/^[0-9]{12}$/.test(utrNumber.trim())) {
            return toast.error('Please enter valid 12-digit UPI UTR / Ref number!');
        }

        const advancePaid = Math.round((Number(selectedRequest.estimatedPrice) || 0) / 2);

        try {
            setSubmittingPayment(true);
            await dispatch(
                acceptCustomArtQuote({
                    id: selectedRequest._id,
                    paymentData: {
                        shippingAddress: cleanAddress,
                        utrNumber: utrNumber.trim(),
                        advancePaid
                    }
                })
            ).unwrap();

            toast.success('Payment Submitted! 🎉 Your bespoke order is confirmed.');
            setSelectedRequest(null);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to confirm payment'));
        } finally {
            setSubmittingPayment(false);
        }
    };

    const getStepIndex = (status) => {
        return BESPOKE_STEPS.findIndex((s) => s.key === status);
    };

    const safeOrders = Array.isArray(myOrders) ? myOrders : [];
    const safeRequests = Array.isArray(myRequests) ? myRequests : [];

    const isInitialLoading =
        (ordersLoading && safeOrders.length === 0) &&
        (requestsLoading && safeRequests.length === 0);

    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex justify-center items-center font-black text-[#D4AF37] uppercase tracking-[0.25em] text-sm animate-pulse">
                Unlocking Your Vault Collection...
            </div>
        );
    }

    const advanceAmount = selectedRequest
        ? Math.round((Number(selectedRequest.estimatedPrice) || 0) / 2)
        : 0;
    const upiUri = selectedRequest
        ? `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${advanceAmount}&cu=INR&tn=${encodeURIComponent(`BespokeOrder_${selectedRequest._id.slice(-6)}`)}`
        : '';
    const qrCodeUrl = selectedRequest
        ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}`
        : '';

    return (
        <div className="bg-[#050505] min-h-screen py-12 md:py-20 text-gray-300 relative overflow-x-clip">
            {/* Subtle 3D Ambient Gold Lighting */}
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[300px] bg-[#D4AF37]/8 blur-[120px] rounded-full" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* HEADER & 3D TABS */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 border-b border-white/10 pb-8 gap-6">
                    <div>
                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-2">
                            Private Ledger & Live Tracking
                        </p>
                        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] tracking-tight drop-shadow-[0_6px_20px_rgba(212,175,55,0.22)]">
                            Your Vault
                        </h1>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mt-2">
                            Manage Standard Orders & Bespoke Commissions
                        </p>
                    </div>

                    {/* 3D Tab Switcher */}
                    <div className="flex w-full md:w-auto bg-[#0c0c0c] p-1.5 rounded-xl border border-white/10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.85)]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('STANDARD')}
                            className={`flex-1 md:flex-none px-5 py-3 text-[11px] font-black tracking-[0.18em] uppercase transition-all rounded-lg cursor-pointer ${
                                activeTab === 'STANDARD'
                                    ? 'bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black shadow-[0_6px_20px_rgba(212,175,55,0.3)]'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Standard ({safeOrders.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('BESPOKE')}
                            className={`flex-1 md:flex-none px-5 py-3 text-[11px] font-black tracking-[0.18em] uppercase transition-all rounded-lg cursor-pointer ${
                                activeTab === 'BESPOKE'
                                    ? 'bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black shadow-[0_6px_20px_rgba(212,175,55,0.3)]'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Bespoke ({safeRequests.length})
                        </button>
                    </div>
                </div>

                {/* ==================== TAB 1: STANDARD ORDERS ==================== */}
                {activeTab === 'STANDARD' && (
                    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
                        {ordersError && (
                            <div className="p-6 text-center bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-black uppercase tracking-widest">
                                {ordersError}
                            </div>
                        )}

                        {ordersLoading && safeOrders.length === 0 ? (
                            <div className="py-20 text-center text-[#D4AF37] font-black uppercase tracking-widest text-xs animate-pulse">
                                Loading Standard Orders...
                            </div>
                        ) : safeOrders.length === 0 ? (
                            <div className="py-20 px-6 text-center bg-gradient-to-b from-[#0e0e0e] to-[#080808] rounded-2xl border border-white/10 shadow-2xl">
                                <div className="w-20 h-20 mx-auto bg-[#050505] border border-[#D4AF37]/20 rounded-full flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(212,175,55,0.12)]">
                                    <span className="text-3xl">📦</span>
                                </div>
                                <h3 className="text-xl font-black text-white mb-2">No Standard Orders Yet</h3>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px] mb-8">
                                    Acquire your first handcrafted resin artifact.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate('/products')}
                                    className="px-7 py-3.5 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black text-xs font-black tracking-[0.2em] uppercase rounded-sm hover:scale-105 transition-transform shadow-[0_0_25px_rgba(212,175,55,0.3)] cursor-pointer"
                                >
                                    Shop Collection
                                </button>
                            </div>
                        ) : (
                            safeOrders.map((order) => {
                                const status = order.orderStatus || 'PLACED';
                                const isActiveGoldStatus = status === 'PLACED' || status === 'PROCESSING';
                                const isPaid = order.paymentStatus === 'COMPLETED';

                                return (
                                    <div
                                        key={order._id}
                                        className="bg-gradient-to-b from-[#0e0e0e] to-[#080808] p-6 sm:p-8 md:p-10 rounded-2xl border border-white/10 border-t-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_30px_rgba(212,175,55,0.05)] hover:border-[#D4AF37]/35 transition-all duration-300"
                                    >
                                        {/* CARD TOP BAR */}
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 mb-7 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] mb-1.5">
                                                    Order Reference
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <p className="text-lg font-black text-white tracking-wider font-mono">
                                                        #{order._id?.slice(-8).toUpperCase()}
                                                    </p>
                                                    <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm bg-white/5 border border-white/10 text-gray-300">
                                                        {order.paymentMethod || 'COD'} • {order.paymentStatus || 'PENDING'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-left sm:text-right">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] mb-1.5">
                                                    Live Status
                                                </p>
                                                <span
                                                    className={`inline-flex items-center px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] rounded-sm border transition-all ${getOrderStatusBadge(
                                                        status
                                                    )}`}
                                                >
                                                    {isActiveGoldStatus && (
                                                        <span className="w-2 h-2 rounded-full bg-[#E5C158] mr-2.5 animate-pulse shadow-[0_0_10px_#E5C158]" />
                                                    )}
                                                    {status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* ORDER ITEMS */}
                                        <div className="space-y-4">
                                            {order.orderItems?.map((item, idx) => (
                                                <div
                                                    key={item._id || idx}
                                                    className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-[#050505]/85 border border-white/5 group hover:border-[#D4AF37]/25 transition-colors"
                                                >
                                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#121212] rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                                                        <img
                                                            src={item.image || 'https://via.placeholder.com/150'}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>

                                                    <div className="flex-1 w-full min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                                            <div className="min-w-0">
                                                                <h4 className="font-bold text-white text-base sm:text-lg leading-snug">
                                                                    {item.name}
                                                                </h4>

                                                                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-gray-400 mt-2.5 uppercase tracking-wider">
                                                                    <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-sm text-gray-200">
                                                                        Qty: {item.quantity}
                                                                    </span>
                                                                    {item.selectedSize && (
                                                                        <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-sm">
                                                                            Size: {item.selectedSize}
                                                                        </span>
                                                                    )}
                                                                    {item.selectedColor && (
                                                                        <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-sm">
                                                                            Color: {item.selectedColor}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0 && (
                                                                    <p className="text-[11px] text-[#D4AF37]/85 font-semibold mt-2">
                                                                        + Add-ons: {item.selectedAddons.join(', ')}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="font-black text-[#D4AF37] text-lg flex-shrink-0">
                                                                ₹{Number(item.itemFinalPrice || 0).toLocaleString('en-IN')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* CARD FOOTER: DATE, SHIPPING & TOTAL */}
                                        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                                        Date of Purchase
                                                    </p>
                                                    <p className="text-sm font-bold text-gray-200">
                                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>

                                                {order.shippingAddress?.city && (
                                                    <p className="text-xs text-gray-400">
                                                        📍 <span className="text-gray-200 font-semibold">{order.shippingAddress.fullName}</span>, {order.shippingAddress.city}, {order.shippingAddress.state} ({order.shippingAddress.pincode})
                                                    </p>
                                                )}

                                                {order.utrNumber && isPaid && (
                                                    <p className="text-[10px] font-mono text-gray-500">
                                                        TXN: {order.utrNumber}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-left sm:text-right w-full sm:w-auto px-6 py-4 bg-[#050505] rounded-xl border border-[#D4AF37]/25 shadow-[inset_0_1px_0_rgba(252,246,186,0.12)]">
                                                <div className="flex sm:justify-end gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                    {Number(order.discountAmount) > 0 && (
                                                        <span className="text-emerald-400">
                                                            Saved ₹{Number(order.discountAmount).toLocaleString('en-IN')}
                                                        </span>
                                                    )}
                                                    <span>
                                                        {Number(order.shippingCharge) === 0
                                                            ? 'Free Shipping'
                                                            : `Shipping ₹${Number(order.shippingCharge || 0).toLocaleString('en-IN')}`}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                                                    {isPaid ? 'Total Paid' : 'Total Payable'}
                                                </p>
                                                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] tracking-tight">
                                                    ₹{Number(order.finalTotal || 0).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ==================== TAB 2: BESPOKE REQUESTS ==================== */}
                {activeTab === 'BESPOKE' && (
                    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
                        {requestsError && (
                            <div className="p-6 text-center bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-black uppercase tracking-widest">
                                {requestsError}
                            </div>
                        )}

                        {requestsLoading && safeRequests.length === 0 ? (
                            <div className="py-20 text-center text-[#D4AF37] font-black uppercase tracking-widest text-xs animate-pulse">
                                Loading Bespoke Commissions...
                            </div>
                        ) : safeRequests.length === 0 ? (
                            <div className="py-20 px-6 text-center bg-gradient-to-b from-[#0e0e0e] to-[#080808] rounded-2xl border border-white/10 shadow-2xl">
                                <div className="w-20 h-20 mx-auto bg-[#050505] border border-[#D4AF37]/20 rounded-full flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(212,175,55,0.12)]">
                                    <span className="text-3xl">🎨</span>
                                </div>
                                <h3 className="text-xl font-black text-white mb-2">No Bespoke Requests Yet</h3>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px] mb-8">
                                    Commission a one-of-a-kind resin masterpiece crafted to your vision.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate('/custom-art')}
                                    className="px-7 py-3.5 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black text-xs font-black tracking-[0.2em] uppercase rounded-sm hover:scale-105 transition-transform shadow-[0_0_25px_rgba(212,175,55,0.3)] cursor-pointer"
                                >
                                    Request Custom Art
                                </button>
                            </div>
                        ) : (
                            safeRequests.map((req) => {
                                const currentStepIdx = getStepIndex(req.status);
                                const estimatedPrice = Number(req.estimatedPrice) || 0;
                                const advancePaid = Number(req.advancePaid) || 0;
                                const remainingBalance = Math.max(0, estimatedPrice - advancePaid);
                                const statusLabel = (req.status || 'PENDING').replace(/_/g, ' ');

                                return (
                                    <div
                                        key={req._id}
                                        className="bg-gradient-to-b from-[#0e0e0e] to-[#080808] p-6 sm:p-8 rounded-2xl border border-white/10 border-t-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_30px_rgba(212,175,55,0.05)] hover:border-[#D4AF37]/35 flex flex-col gap-8 transition-all duration-300"
                                    >
                                        <div className="flex flex-col md:flex-row gap-8">
                                            {/* IMAGE COLUMN */}
                                            <div className="w-full md:w-1/3 flex-shrink-0">
                                                <div className="w-full aspect-square rounded-xl overflow-hidden border border-white/10 mb-4 bg-[#050505]">
                                                    <img
                                                        src={req.referenceImage}
                                                        alt={req.theme}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.25em]">
                                                    {req.theme}
                                                </p>
                                                <p className="text-xs text-gray-500 font-bold mt-1">
                                                    Requested: {new Date(req.createdAt).toLocaleDateString('en-IN')}
                                                </p>
                                            </div>

                                            {/* DETAILS COLUMN */}
                                            <div className="w-full md:w-2/3 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] mb-1 font-mono">
                                                                Ref #{req._id?.slice(-6).toUpperCase()}
                                                            </p>
                                                            <h3 className="text-2xl font-black text-white tracking-tight">
                                                                {req.shape} Design
                                                            </h3>
                                                        </div>

                                                        <span
                                                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm border ${getBespokeStatusBadge(
                                                                req.status
                                                            )}`}
                                                        >
                                                            {statusLabel}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                                        <div className="bg-[#050505] p-3.5 rounded-xl border border-white/10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
                                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                                Dimensions
                                                            </p>
                                                            <p className="text-sm font-bold text-gray-200 mt-1">
                                                                {req.dimensions}
                                                            </p>
                                                        </div>
                                                        <div className="bg-[#050505] p-3.5 rounded-xl border border-white/10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
                                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                                Custom Text
                                                            </p>
                                                            <p className="text-sm font-bold text-gray-200 mt-1">
                                                                {req.customText || 'None'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* ARTIST NOTE / TRACKING UPDATE */}
                                                    {req.adminNotes && (
                                                        <div className="bg-[#110f09] text-white p-4 rounded-xl border border-[#D4AF37]/30 mb-6 shadow-[0_0_20px_rgba(212,175,55,0.08)]">
                                                            <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.25em] mb-1">
                                                                ✨ Studio Update / Tracking Info
                                                            </p>
                                                            <p className="text-xs font-medium text-gray-200 leading-relaxed">
                                                                "{req.adminNotes}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* QUOTATION & PAYMENT BREAKDOWN */}
                                                <div className="mt-auto border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                                            Artist Quotation
                                                        </p>
                                                        {estimatedPrice > 0 ? (
                                                            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] tracking-tight">
                                                                ₹{estimatedPrice.toLocaleString('en-IN')}
                                                            </p>
                                                        ) : (
                                                            <p className="text-sm font-bold text-gray-400">
                                                                Evaluating your masterpiece...
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* BUTTON: Opens UPI QR + Address Modal */}
                                                    {req.status === 'ACCEPTED' && estimatedPrice > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenPaymentModal(req)}
                                                            className="w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black uppercase tracking-[0.2em] text-xs rounded-sm shadow-[0_10px_25px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.65)] hover:-translate-y-0.5 transition-all cursor-pointer"
                                                        >
                                                            Confirm Order (UPI)
                                                        </button>
                                                    )}

                                                    {/* PAYMENT SUMMARY BADGE (Once Advance is Paid) */}
                                                    {currentStepIdx !== -1 && (
                                                        <div className="w-full sm:w-auto bg-[#050505] p-4 rounded-xl border border-emerald-500/25 text-left sm:text-right">
                                                            <p className="text-xs font-black text-emerald-400">
                                                                ✅ Advance Paid: ₹{advancePaid.toLocaleString('en-IN')}
                                                            </p>
                                                            {req.utrNumber && (
                                                                <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                                                                    UTR: {req.utrNumber}
                                                                </p>
                                                            )}
                                                            <p className="text-[11px] font-bold text-gray-300 mt-1.5">
                                                                {req.status === 'DELIVERED'
                                                                    ? '🎉 Full Payment Completed'
                                                                    : `Balance Due on Delivery: ₹${remainingBalance.toLocaleString('en-IN')}`}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3D HD ANIMATED LIVE PROGRESS TRACKER */}
                                        {currentStepIdx !== -1 && (
                                            <div className="bg-[#050505] p-5 sm:p-8 rounded-2xl border border-[#D4AF37]/25 text-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.9),0_10px_30px_rgba(0,0,0,0.6)]">
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-2">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37]">
                                                            Live Crafting Progress
                                                        </p>
                                                        <h4 className="text-lg font-black tracking-tight mt-0.5 text-white">
                                                            Masterpiece Status
                                                        </h4>
                                                    </div>
                                                    {req.shippingAddress?.city && (
                                                        <p className="text-[11px] font-bold text-gray-400">
                                                            📍 Delivering to:{' '}
                                                            <span className="text-white">
                                                                {req.shippingAddress.fullName}, {req.shippingAddress.city}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Progress Line Container */}
                                                <div className="relative px-1 sm:px-6">
                                                    {/* Background Track Line */}
                                                    <div className="absolute top-5 left-7 right-7 sm:left-12 sm:right-12 h-1 bg-white/10 rounded-full z-0">
                                                        {/* Animated Glowing Gold Progress Line */}
                                                        <div
                                                            className="h-full bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(212,175,55,0.75)]"
                                                            style={{
                                                                width: `${(currentStepIdx / (BESPOKE_STEPS.length - 1)) * 100}%`
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Steps Flex Grid */}
                                                    <div className="relative z-10 flex justify-between items-start">
                                                        {BESPOKE_STEPS.map((step, idx) => {
                                                            const isCompleted = idx <= currentStepIdx;
                                                            const isCurrent = idx === currentStepIdx;

                                                            return (
                                                                <div
                                                                    key={step.key}
                                                                    className="flex flex-col items-center text-center w-16 sm:w-24"
                                                                >
                                                                    <div
                                                                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm sm:text-base font-black transition-all duration-500 ${
                                                                            isCompleted
                                                                                ? 'bg-gradient-to-br from-[#FCF6BA] via-[#D4AF37] to-[#8C6A1A] text-black shadow-[0_0_20px_rgba(212,175,55,0.55)] scale-105'
                                                                                : 'bg-[#141414] text-gray-500 border border-white/10'
                                                                        } ${isCurrent ? 'ring-4 ring-[#D4AF37]/30 scale-110' : ''}`}
                                                                    >
                                                                        {step.icon}
                                                                    </div>
                                                                    <p
                                                                        className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider mt-3 transition-colors duration-300 leading-tight ${
                                                                            isCompleted ? 'text-[#D4AF37]' : 'text-gray-500'
                                                                        }`}
                                                                    >
                                                                        {step.label}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* ================================================================= */}
            {/* 3D LUXURY UPI CHECKOUT MODAL (Address + PhonePe QR + 5-Min Timer) */}
            {/* ================================================================= */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="bg-gradient-to-b from-[#111111] to-[#070707] border border-[#D4AF37]/40 border-t-[#FCF6BA]/35 rounded-2xl max-w-3xl w-full p-6 sm:p-8 text-white shadow-[0_30px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(212,175,55,0.18)] relative my-8">
                        <button
                            type="button"
                            disabled={submittingPayment}
                            onClick={() => setSelectedRequest(null)}
                            aria-label="Close payment modal"
                            className="absolute top-5 right-5 text-gray-400 hover:text-white text-xl font-bold cursor-pointer disabled:opacity-40"
                        >
                            ✕
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-5 mb-6 gap-4 pr-8">
                            <div>
                                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.25em]">
                                    Bespoke Vault Checkout
                                </p>
                                <h3 className="text-2xl font-black tracking-tight mt-1">
                                    {selectedRequest.shape} — {selectedRequest.theme}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-lg self-start sm:self-auto">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                <span className="text-xs font-black uppercase tracking-widest text-red-400 font-mono">
                                    Expires in {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleConfirmPayment} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* LEFT COLUMN: DELIVERY ADDRESS */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                    1. Delivery Details
                                </h4>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter receiver's name"
                                        value={shippingAddress.fullName}
                                        onChange={(e) =>
                                            setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                                        }
                                        className="w-full bg-[#050505] border border-white/10 focus:border-[#D4AF37] rounded-lg px-4 py-2.5 text-sm text-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                                        WhatsApp / Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        required
                                        maxLength={10}
                                        placeholder="10-digit mobile number"
                                        value={shippingAddress.phone}
                                        onChange={(e) =>
                                            setShippingAddress({
                                                ...shippingAddress,
                                                phone: e.target.value.replace(/\D/g, '').slice(0, 10)
                                            })
                                        }
                                        className="w-full bg-[#050505] border border-white/10 focus:border-[#D4AF37] rounded-lg px-4 py-2.5 text-sm text-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                                        Complete Street Address
                                    </label>
                                    <textarea
                                        rows="2"
                                        required
                                        placeholder="House No, Building, Area, Landmark"
                                        value={shippingAddress.address}
                                        onChange={(e) =>
                                            setShippingAddress({ ...shippingAddress, address: e.target.value })
                                        }
                                        className="w-full bg-[#050505] border border-white/10 focus:border-[#D4AF37] rounded-lg px-4 py-2.5 text-sm text-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="City"
                                            value={shippingAddress.city}
                                            onChange={(e) =>
                                                setShippingAddress({ ...shippingAddress, city: e.target.value })
                                            }
                                            className="w-full bg-[#050505] border border-white/10 focus:border-[#D4AF37] rounded-lg px-4 py-2.5 text-sm text-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                                            Pincode
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            required
                                            maxLength={6}
                                            placeholder="6-digit Pincode"
                                            value={shippingAddress.pincode}
                                            onChange={(e) =>
                                                setShippingAddress({
                                                    ...shippingAddress,
                                                    pincode: e.target.value.replace(/\D/g, '').slice(0, 6)
                                                })
                                            }
                                            className="w-full bg-[#050505] border border-white/10 focus:border-[#D4AF37] rounded-lg px-4 py-2.5 text-sm text-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: PHONEPE QR, DIRECT MOBILE UPI & UTR INPUT */}
                            <div className="flex flex-col justify-between bg-[#0a0a0a] p-5 rounded-xl border border-white/10">
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                                            2. Pay via PhonePe / UPI
                                        </h4>
                                        <span className="text-[10px] bg-[#D4AF37]/15 text-[#FCF6BA] border border-[#D4AF37]/30 px-2 py-0.5 rounded font-bold">
                                            50% Advance
                                        </span>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center mb-3 shadow-inner">
                                        <img
                                            src={qrCodeUrl}
                                            alt="UPI QR Code"
                                            className="w-40 h-40 object-contain"
                                        />
                                        <p className="text-xs font-black text-black mt-2 tracking-tight">
                                            Pay Advance:{' '}
                                            <span className="text-purple-700 text-base">
                                                ₹{advanceAmount.toLocaleString('en-IN')}
                                            </span>
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-bold">
                                            Total Quote: ₹{Number(selectedRequest.estimatedPrice || 0).toLocaleString('en-IN')}
                                        </p>
                                    </div>

                                    {/* Mobile UPI Deep Link + Copy UPI ID */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <a
                                            href={upiUri}
                                            className="flex-1 py-2 text-center text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/15 text-[#FCF6BA] rounded-lg transition-colors"
                                        >
                                            Open UPI App
                                        </a>
                                        <button
                                            type="button"
                                            onClick={handleCopyUpi}
                                            className="px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 rounded-lg transition-colors cursor-pointer"
                                        >
                                            Copy UPI
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 block mb-1">
                                            Enter 12-Digit UPI Ref / UTR No. *
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            required
                                            maxLength={12}
                                            placeholder="e.g. 412389012345"
                                            value={utrNumber}
                                            onChange={(e) =>
                                                setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))
                                            }
                                            className="w-full bg-[#050505] border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-lg px-4 py-2.5 text-sm text-[#D4AF37] font-mono font-bold tracking-widest outline-none"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Pay karne ke baad PhonePe / GPay history se 12-digit UTR number yahan daalein.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submittingPayment}
                                    className="w-full py-3.5 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black uppercase tracking-[0.2em] text-xs rounded-sm shadow-[0_10px_25px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.65)] hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {submittingPayment
                                        ? 'Verifying Payment...'
                                        : `Verify & Pay ₹${advanceAmount.toLocaleString('en-IN')}`}
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