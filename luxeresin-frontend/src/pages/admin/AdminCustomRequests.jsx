import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminCustomRequests, updateAdminCustomRequest } from '../../features/customArt/customArtSlice';
import toast from 'react-hot-toast';

// Individual Card Component (Bina extra useEffect ke)
const BespokeRequestCard = ({ req, onUpdate }) => {
    const [status, setStatus] = useState(req.status || 'PENDING');
    const [estimatedPrice, setEstimatedPrice] = useState(req.estimatedPrice || '');
    const [adminNotes, setAdminNotes] = useState(req.adminNotes || '');
    const [updating, setUpdating] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setUpdating(true);
        await onUpdate(req._id, {
            status,
            estimatedPrice: Number(estimatedPrice) || 0,
            adminNotes
        });
        setUpdating(false);
    };

    const balanceAmount = (req.estimatedPrice || 0) - (req.advancePaid || 0);

    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl hover:border-[#D4AF37]/30 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. LEFT: REFERENCE IMAGE & CUSTOMER INFO (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col justify-between">
                    <div>
                        <div className="w-full aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#111] mb-4 relative group">
                            <img 
                                src={req.referenceImage} 
                                alt={req.theme} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                            <a 
                                href={req.referenceImage} 
                                target="_blank" 
                                rel="noreferrer"
                                className="absolute bottom-3 right-3 bg-black/80 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black transition-colors"
                            >
                                View Full Image ↗
                            </a>
                        </div>

                        <div className="bg-[#111111] p-4 rounded-xl border border-white/5">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Requested By</p>
                            <p className="text-sm font-bold text-white">{req.user?.full_name || 'Valued Client'}</p>
                            <p className="text-xs text-gray-400">{req.user?.email || 'No email'}</p>
                            <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-wider">
                                Date: {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. MIDDLE: ART SPECS + UPI UTR & SHIPPING ADDRESS (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                            <div>
                                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] block">{req.theme}</span>
                                <h3 className="text-xl font-black text-white tracking-tight">{req.shape} Frame</h3>
                            </div>
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded border ${
                                req.status === 'ADVANCE_PAID' 
                                    ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                                    : req.status === 'ACCEPTED'
                                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30'
                                    : 'bg-white/5 text-gray-300 border-white/10'
                            }`}>
                                {req.status?.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-[#111] p-3 rounded-lg border border-white/5">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Dimensions</p>
                                <p className="text-xs font-bold text-gray-200 mt-0.5">{req.dimensions}</p>
                            </div>
                            <div className="bg-[#111] p-3 rounded-lg border border-white/5">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Custom Text</p>
                                <p className="text-xs font-bold text-[#D4AF37] mt-0.5">{req.customText || 'None'}</p>
                            </div>
                        </div>

                        <div className="bg-[#111] p-3.5 rounded-lg border border-white/5 mb-4">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Customer Vision / Description</p>
                            <p className="text-xs text-gray-300 leading-relaxed">{req.description}</p>
                        </div>

                        {/* UPI PAYMENT & UTR PROOF BOX */}
                        {req.utrNumber ? (
                            <div className="bg-green-950/20 border border-green-500/30 rounded-xl p-4 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">
                                        ✅ 50% Advance Paid (UPI)
                                    </span>
                                    <span className="text-sm font-black text-white">
                                        ₹{req.advancePaid?.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="bg-black/60 p-2.5 rounded border border-green-500/20 flex items-center justify-between">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">UTR / Ref No:</span>
                                    <span className="text-xs font-mono font-black text-[#D4AF37] tracking-widest select-all">
                                        {req.utrNumber}
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold mt-2 flex justify-between">
                                    <span>Remaining Balance:</span>
                                    <span className="text-white">₹{balanceAmount.toLocaleString('en-IN')}</span>
                                </p>
                            </div>
                        ) : (
                            <div className="bg-[#111] border border-white/5 rounded-xl p-3.5 mb-4 text-center">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    ⏳ No Advance Payment / UTR Submitted Yet
                                </p>
                            </div>
                        )}

                        {/* SHIPPING ADDRESS BOX */}
                        {req.shippingAddress && req.shippingAddress.address && (
                            <div className="bg-[#111111] border border-[#D4AF37]/30 rounded-xl p-4">
                                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2">
                                    📍 Delivery Address
                                </p>
                                <p className="text-xs font-bold text-white">{req.shippingAddress.fullName}</p>
                                <p className="text-xs font-bold text-[#D4AF37] mt-0.5">📞 {req.shippingAddress.phone}</p>
                                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                                    {req.shippingAddress.address}, {req.shippingAddress.city} - <span className="font-bold text-white">{req.shippingAddress.pincode}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. RIGHT: ADMIN QUOTATION & STATUS FORM (4 Cols) */}
                <div className="lg:col-span-4 bg-[#111111] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                    <form onSubmit={handleSave} className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] border-b border-white/10 pb-3">
                            Admin Action & Quote
                        </h4>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
                                Order Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full bg-[#050505] border border-white/15 focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-xs font-bold text-white outline-none"
                            >
                                <option value="PENDING">Pending (Need to Review)</option>
                                <option value="REVIEWING">Reviewing</option>
                                <option value="ACCEPTED">Accepted (Waiting for Payment)</option>
                                <option value="ADVANCE_PAID">Advance Paid (Verify UTR)</option>
                                <option value="IN_MAKING">In Making (Work Started)</option>
                                <option value="SHIPPED">Shipped</option>
                                <option value="DELIVERED">Delivered</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
                                Estimated Price (₹)
                            </label>
                            <input
                                type="number"
                                placeholder="e.g. 5000"
                                value={estimatedPrice}
                                onChange={(e) => setEstimatedPrice(e.target.value)}
                                className="w-full bg-[#050505] border border-white/15 focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm font-black text-[#D4AF37] outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
                                Internal Notes / Tracking ID
                            </label>
                            <textarea
                                rows="3"
                                placeholder="Write note for customer or courier tracking ID..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="w-full bg-[#050505] border border-white/15 focus:border-[#D4AF37] rounded-lg p-3 text-xs text-white outline-none"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={updating}
                            className="w-full py-3.5 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black uppercase tracking-[0.2em] text-xs rounded-lg hover:opacity-90 transition-all shadow-lg cursor-pointer disabled:opacity-50"
                        >
                            {updating ? 'Updating Vault...' : 'Update Request'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

const AdminCustomRequests = () => {
    const dispatch = useDispatch();
    const { requests, loading, error } = useSelector((state) => state.customArt);

    useEffect(() => {
        dispatch(fetchAdminCustomRequests());
    }, [dispatch]);

    const handleUpdateRequest = async (id, updateData) => {
        try {
            await dispatch(updateAdminCustomRequest({ id, updateData })).unwrap();
            toast.success('Bespoke request updated successfully! ✨');
        } catch (err) {
            toast.error(err || 'Failed to update request');
        }
    };

    if (loading) {
        return <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Bespoke Vault...</div>;
    }

    if (error) {
        return <div className="py-20 text-center text-red-500 font-bold uppercase tracking-widest text-xs">{error}</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.25em]">VIP Customizations</p>
                    <h1 className="text-3xl font-black text-white tracking-tight mt-1">Bespoke Art Requests</h1>
                </div>
                <div className="bg-[#111] border border-white/10 px-4 py-2 rounded-lg">
                    <span className="text-xs font-black text-[#D4AF37]">{requests?.length || 0}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-2">Total Requests</span>
                </div>
            </div>

            {(!requests || requests.length === 0) ? (
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-16 text-center">
                    <span className="text-4xl block mb-3">🎨</span>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No custom requests found.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {requests.map((req) => (
                        <BespokeRequestCard 
                            key={`${req._id}-${req.status}-${req.estimatedPrice}`} 
                            req={req} 
                            onUpdate={handleUpdateRequest} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminCustomRequests;