import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../../features/products/productSlice';
import toast from 'react-hot-toast';

const AdminProductForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading } = useSelector((state) => state.products || { loading: false });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Resin Art',
        stock: '',
    });
    const [image, setImage] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // FormData object banayenge kyunki image file bhejni hai
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('price', formData.price);
        data.append('category', formData.category);
        data.append('stock', formData.stock);
        if (image) data.append('image', image);

        try {
            await dispatch(createProduct(data)).unwrap();
            toast.success('Masterpiece added to Vault! 💎');
            navigate('/admin/products');
        } catch (error) {
            toast.error(error || 'Failed to forge artifact');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* 🚀 HEADER */}
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">The Forge</h2>
                    <p className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest mt-2">Create New Artifact</p>
                </div>
                <button 
                    onClick={() => navigate('/admin/products')}
                    className="text-gray-500 hover:text-white uppercase text-[10px] font-black tracking-widest transition-colors"
                >
                    ← Back to Vault
                </button>
            </div>

            {/* 🚀 PREMIUM FORM */}
            <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 sm:p-12 shadow-2xl space-y-8">
                
                {/* Name & Category Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Artifact Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required
                            className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors placeholder-gray-700 font-bold"
                            placeholder="e.g. Radhe Krishna Geode"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Category</label>
                        <select name="category" value={formData.category} onChange={handleChange}
                            className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors font-bold appearance-none cursor-pointer"
                        >
                            <option value="Resin Art">Resin Art</option>
                            <option value="Spiritual Art">Spiritual Art</option>
                            <option value="Wall Clocks">Wall Clocks</option>
                            <option value="Custom Furniture">Custom Furniture</option>
                        </select>
                    </div>
                </div>

                {/* Price & Stock Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Base Price (₹)</label>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} required
                            className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]/50 transition-colors placeholder-gray-700 font-black text-lg"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Initial Stock</label>
                        <input type="number" name="stock" value={formData.stock} onChange={handleChange} required
                            className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors placeholder-gray-700 font-bold"
                            placeholder="e.g. 5"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Artifact Story & Details</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} required rows="4"
                        className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors placeholder-gray-700 font-medium resize-none"
                        placeholder="Describe the materials, meaning, and craftsmanship..."
                    ></textarea>
                </div>

                {/* High-Res Image Upload */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Primary Image</label>
                    <div className="relative w-full bg-[#050505] border border-dashed border-white/20 rounded-sm px-4 py-8 text-center hover:border-[#D4AF37]/50 transition-colors cursor-pointer group">
                        <input type="file" onChange={handleImageChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="text-gray-500 group-hover:text-[#D4AF37] transition-colors">
                            <span className="text-2xl block mb-2">📸</span>
                            <span className="text-xs font-bold uppercase tracking-widest">{image ? image.name : 'Drop high-res image here or click to browse'}</span>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-white/5">
                    <button type="submit" disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black uppercase tracking-[0.2em] text-sm rounded-sm hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50"
                    >
                        {loading ? 'Forging Artifact...' : 'Add to Vault'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default AdminProductForm;