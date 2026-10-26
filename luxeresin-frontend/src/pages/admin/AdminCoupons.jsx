import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCoupons, createCoupon, deleteCoupon } from '../../features/coupon/couponSlice';
import toast from 'react-hot-toast';

const AdminCoupons = () => {
    const dispatch = useDispatch();
    const { coupons = [], loading } = useSelector((state) => state.coupon || {});

    const [formData, setFormData] = useState({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minCartValue: '',
        expiryDate: '',
    });

    // 🚀 Page load hote hi saare coupons fetch karein
    useEffect(() => {
        dispatch(fetchCoupons());
    }, [dispatch]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            code: formData.code.trim().toUpperCase(),
            discountType: formData.discountType,
            discountValue: Number(formData.discountValue),
            minCartValue: formData.minCartValue ? Number(formData.minCartValue) : 0,
            expiryDate: formData.expiryDate,
        };

        try {
            await dispatch(createCoupon(payload)).unwrap();
            toast.success('Coupon successfully forged! 🎟️✨');
            setFormData({
                code: '',
                discountType: 'PERCENTAGE',
                discountValue: '',
                minCartValue: '',
                expiryDate: '',
            });
        } catch (error) {
            toast.error(error || 'Failed to forge coupon');
        }
    };

    const handleDelete = async (id, code) => {
        if (!window.confirm(`Remove coupon "${code}" from the vault?`)) return;
        try {
            await dispatch(deleteCoupon(id)).unwrap();
            toast.success(`Coupon ${code} removed! 🗑️`);
        } catch (error) {
            toast.error(error || 'Failed to delete coupon');
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success(`Copied "${code}" to clipboard! 📋`);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Coupons Forge</h2>
                    <p className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest mt-2">Create & Manage Discount Codes</p>
                </div>
                <div className="bg-[#111] border border-white/10 px-4 py-2 rounded-lg self-start sm:self-auto">
                    <span className="text-xs font-black text-[#D4AF37]">{coupons.length}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-2">Active Keys</span>
                </div>
            </div>

            {/* FORGE FORM */}
            <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 sm:p-10 shadow-2xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    
                    {/* 1. Coupon Code */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Coupon Code</label>
                        <input 
                            type="text" 
                            name="code" 
                            value={formData.code} 
                            onChange={handleChange} 
                            required
                            placeholder="e.g. RESIN50"
                            className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white uppercase font-black focus:outline-none focus:border-[#D4AF37]/50 transition-colors placeholder-gray-700"
                        />
                    </div>

                    {/* 2. Discount Type */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Discount Type</label>
                        <select 
                            name="discountType" 
                            value={formData.discountType} 
                            onChange={handleChange}
                            className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white font-bold focus:outline-none focus:border-[#D4AF37]/50 transition-colors cursor-pointer"
                        >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FLAT">Flat Off (₹)</option>
                        </select>
                    </div>

                    {/* 3. Discount Value */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                            {formData.discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Flat Amount (₹)'}
                        </label>
                        <input 
                            type="number" 
                            name="discountValue" 
                            value={formData.discountValue} 
                            onChange={handleChange} 
                            required
                            min="1"
                            max={formData.discountType === 'PERCENTAGE' ? "100" : undefined}
                            placeholder={formData.discountType === 'PERCENTAGE' ? "e.g. 20" : "e.g. 500"}
                            className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-[#D4AF37] font-black focus:outline-none focus:border-[#D4AF37]/50 transition-colors placeholder-gray-700"
                        />
                    </div>

                    {/* 4. Minimum Cart Value */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Min Cart Value (₹)</label>
                        <input 
                            type="number" 
                            name="minCartValue" 
                            value={formData.minCartValue} 
                            onChange={handleChange} 
                            min="0"
                            placeholder="e.g. 2000 (Optional)"
                            className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white font-bold focus:outline-none focus:border-[#D4AF37]/50 transition-colors placeholder-gray-700"
                        />
                    </div>

                    {/* 5. Expiry Date */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Expiry Date</label>
                        <input 
                            type="date" 
                            name="expiryDate" 
                            value={formData.expiryDate} 
                            onChange={handleChange} 
                            required
                            className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white font-bold focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                        />
                    </div>

                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black uppercase tracking-[0.2em] text-sm rounded-sm hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 cursor-pointer"
                >
                    {loading ? 'Forging Coupon...' : 'Forge New Coupon'}
                </button>
            </form>

            {/* ========================================================= */}
            {/* 🚀 FORGED COUPONS VAULT (LIVE LIST & DELETE) */}
            {/* ========================================================= */}
            <div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">
                    Forged Access Keys
                </h3>

                {coupons.length === 0 ? (
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-12 text-center">
                        <span className="text-3xl block mb-3">🎟️</span>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No coupons forged yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {coupons.map((coupon) => {
                            const isExpired = new Date(coupon.expiryDate) < new Date();

                            return (
                                <div 
                                    key={coupon._id} 
                                    className="bg-[#0a0a0a] border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl p-6 flex flex-col justify-between transition-all shadow-lg relative overflow-hidden group"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <button
                                                type="button"
                                                onClick={() => handleCopyCode(coupon.code)}
                                                title="Click to copy code"
                                                className="bg-[#141414] border border-dashed border-[#D4AF37]/50 px-3.5 py-1.5 rounded text-sm font-mono font-black text-[#D4AF37] tracking-widest hover:bg-[#D4AF37] hover:text-black transition-colors cursor-pointer"
                                            >
                                                {coupon.code} 📋
                                            </button>

                                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded border ${
                                                isExpired 
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                                                    : 'bg-green-500/10 text-green-400 border-green-500/30'
                                            }`}>
                                                {isExpired ? 'Expired' : 'Active'}
                                            </span>
                                        </div>

                                        <div className="my-4">
                                            <p className="text-2xl font-black text-white tracking-tight">
                                                {coupon.discountType === 'PERCENTAGE' 
                                                    ? `${coupon.discountValue}% OFF` 
                                                    : `₹${coupon.discountValue} FLAT OFF`}
                                            </p>
                                            <p className="text-xs text-gray-400 font-bold mt-1">
                                                Min. Order: ₹{coupon.minCartValue?.toLocaleString('en-IN') || 0}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Valid Till</p>
                                            <p className="text-xs font-bold text-gray-300">
                                                {new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(coupon._id, coupon.code)}
                                            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors cursor-pointer px-2 py-1"
                                        >
                                            Delete ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCoupons;