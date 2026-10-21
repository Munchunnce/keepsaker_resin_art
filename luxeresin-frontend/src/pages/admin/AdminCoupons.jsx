import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCoupon } from '../../features/coupon/couponSlice';
import toast from 'react-hot-toast';

const AdminCoupons = () => {
    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.coupon || { loading: false });

    // 🚀 EXACT MATCH WITH BACKEND JOI SCHEMA & MONGOOSE MODEL
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'PERCENTAGE', // Must be 'PERCENTAGE' or 'FLAT'
        discountValue: '',          // Backend expects 'discountValue', not 'discountPercent'
        minCartValue: '',           // Minimum order value check ke liye
        expiryDate: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 🚀 CLEAN PAYLOAD: Strings ko Numbers mein convert kiya Joi ke liye
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
            // Reset Form
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

    return (
        <div className="max-w-5xl mx-auto">
            {/* HEADER */}
            <div className="mb-10">
                <h2 className="text-3xl font-black text-white tracking-tight">Coupons Forge</h2>
                <p className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest mt-2">Create & Manage Discount Codes</p>
            </div>

            {/* FORGE FORM */}
            <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 sm:p-12 shadow-2xl space-y-8 mb-12">
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
        </div>
    );
};

export default AdminCoupons;