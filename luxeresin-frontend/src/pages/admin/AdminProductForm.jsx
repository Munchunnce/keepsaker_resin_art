import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { createProduct } from '../../features/products/productSlice';
import axiosInstance from '../../services/axiosInstance';
import toast from 'react-hot-toast';

const AdminProductForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation(); // Rasta check karne ke liye

    // 🚀 EDIT MODE DETECTOR
    const editProduct = location.state?.editProduct;
    const isEditMode = Boolean(editProduct);

    const { loading } = useSelector((state) => state.products || { loading: false });

    const [categories, setCategories] = useState([]);
    
    const [formData, setFormData] = useState({
        name: editProduct?.name || '',
        description: editProduct?.description || '',
        basePrice: editProduct?.basePrice || '', 
        discountPrice: editProduct?.discountPrice || '',
        discountPercentage: editProduct?.discountPercentage || '',
        category: editProduct?.category?._id || editProduct?.category || '',  
        stock: editProduct ? (editProduct.inStock ? 5 : 0) : '',
        colors: editProduct?.colors ? editProduct.colors.join(', ') : '', 
        leadTimeDays: editProduct?.leadTimeDays || 7,
    });
    
    const [image, setImage] = useState(null);
    // const [sizes, setSizes] = useState([{ sizeLabel: 'Standard', priceModifier: 0 }]);
    const [sizes, setSizes] = useState(
        editProduct?.sizes?.length > 0 ? editProduct.sizes : [{ sizeLabel: 'Standard', priceModifier: 0 }]
    );
    const [addons, setAddons] = useState([]);

    // 🚀 1. CATEGORIES FETCH KAREN
    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await axiosInstance.get('/categories');
                if (res.data.success) {
                    setCategories(res.data.data);
                    if (res.data.data.length > 0 && !isEditMode) {
                        setFormData(prev => ({ ...prev, category: res.data.data[0]._id }));
                    }
                }
            } catch (error) {
                console.error("Category fetch error:", error);
                toast.error("Failed to load categories");
            }
        };
        fetchCats();
    }, [isEditMode]);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSizeChange = (index, field, value) => {
        const newSizes = [...sizes];
        newSizes[index][field] = value;
        setSizes(newSizes);
    };
    const addSize = () => setSizes([...sizes, { sizeLabel: '', priceModifier: 0 }]);
    const removeSize = (index) => setSizes(sizes.filter((_, i) => i !== index));

    const handleAddonChange = (index, field, value) => {
        const newAddons = [...addons];
        newAddons[index][field] = value;
        setAddons(newAddons);
    };
    const addAddon = () => setAddons([...addons, { addonName: '', extraPrice: 0 }]);
    const removeAddon = (index) => setAddons(addons.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 🚀 UPDATE PRODUCT LOGIC (PUT)
        if (isEditMode) {
            try {
                const updatedData = {
                    name: formData.name,
                    description: formData.description,
                    basePrice: Number(formData.basePrice),
                    discountPrice: Number(formData.discountPrice) || 0,
                    discountPercentage: Number(formData.discountPercentage) || 0,
                    category: formData.category,
                    colors: formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : [],
                    sizes,
                    addons,
                    leadTimeDays: Number(formData.leadTimeDays),
                    inStock: Number(formData.stock) > 0
                };

                await axiosInstance.put(`/products/${editProduct._id}`, updatedData);
                toast.success('Artifact Updated Successfully! ✏️');
                navigate('/admin/products');
            } catch (error) {
                console.error(error);
                toast.error('Failed to update artifact');
            }
        } 
        // 🚀 CREATE PRODUCT LOGIC (POST)
        else {
            if (!image) return toast.error('Please upload a high-res image!');
            if (!formData.category) return toast.error('Category is required!');

            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('category', formData.category);
            data.append('stock', formData.stock);
            data.append('basePrice', formData.basePrice);
            
            if (formData.discountPrice) data.append('discountPrice', formData.discountPrice);
            if (formData.discountPercentage) data.append('discountPercentage', formData.discountPercentage);
            data.append('leadTimeDays', formData.leadTimeDays);

            const colorsArray = formData.colors.split(',').map(c => c.trim()).filter(Boolean);
            data.append('colors', JSON.stringify(colorsArray));
            data.append('sizes', JSON.stringify(sizes));
            data.append('addons', JSON.stringify(addons));
            
            data.append('image', image);

            try {
                await dispatch(createProduct(data)).unwrap();
                toast.success('Masterpiece added to Vault! 💎');
                navigate('/admin/products');
            } catch (error) {
                toast.error(error || 'Failed to forge artifact');
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <div className="mb-10 flex items-center justify-between">
                <div>
                    {/* 🚀 Dynamic Heading */}
                    <h2 className="text-3xl font-black text-white tracking-tight">
                        {isEditMode ? 'Update Masterpiece' : 'The Forge'}
                    </h2>
                    <p className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest mt-2">
                        {isEditMode ? 'Modify Artifact Details' : 'Create New Artifact'}
                    </p>
                </div>
                <button onClick={() => navigate('/admin/products')} className="text-gray-500 hover:text-white uppercase text-[10px] font-black tracking-widest transition-colors">
                    ← Back to Vault
                </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 sm:p-12 shadow-2xl space-y-10">
                
                {/* SECTION 1: BASIC INFO */}
                <div>
                    <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest mb-6 border-b border-white/10 pb-2">Basic Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Artifact Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white focus:border-[#D4AF37]/50 font-bold outline-none" placeholder="Ocean Wave Clock" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Vault Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} required className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white focus:border-[#D4AF37]/50 font-bold cursor-pointer outline-none">
                                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: PRICING & INVENTORY */}
                <div>
                    <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest mb-6 border-b border-white/10 pb-2">Pricing & Inventory</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Base Price (₹)</label>
                            <input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} required className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-[#D4AF37] font-black text-lg outline-none" placeholder="3500" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Discount Price (₹)</label>
                            <input type="number" name="discountPrice" value={formData.discountPrice} onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white font-bold outline-none" placeholder="2999" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Initial Stock</label>
                            <input type="number" name="stock" value={formData.stock} onChange={handleChange} required className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white font-bold outline-none" placeholder="5" />
                        </div>
                    </div>
                </div>

                {/* SECTION 3: ATTRIBUTES & TIMELINES */}
                <div>
                    <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest mb-6 border-b border-white/10 pb-2">Attributes & Time</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Available Colors (Comma Separated)</label>
                            <input type="text" name="colors" value={formData.colors} onChange={handleChange} className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white font-bold outline-none focus:border-[#D4AF37]/50" placeholder="Ocean Blue, Emerald Green, Obsidian" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Lead Time (Days to craft)</label>
                            <input type="number" name="leadTimeDays" value={formData.leadTimeDays} onChange={handleChange} required className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white font-bold outline-none focus:border-[#D4AF37]/50" placeholder="7" />
                        </div>
                    </div>
                </div>

                {/* SECTION 4: DYNAMIC SIZES */}
                <div>
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
                        <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest">Variant Sizes</h3>
                        <button type="button" onClick={addSize} className="text-[10px] text-black bg-[#D4AF37] px-3 py-1 font-black uppercase rounded-sm hover:bg-[#FCF6BA]">+ Add Size</button>
                    </div>
                    {sizes.map((size, index) => (
                        <div key={index} className="flex gap-4 mb-4">
                            <input type="text" value={size.sizeLabel} onChange={(e) => handleSizeChange(index, 'sizeLabel', e.target.value)} className="w-1/2 bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white font-bold outline-none" placeholder="e.g. 14 Inches" required />
                            <input type="number" value={size.priceModifier} onChange={(e) => handleSizeChange(index, 'priceModifier', e.target.value)} className="w-1/3 bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-[#D4AF37] font-bold outline-none" placeholder="Extra Price (+0)" required />
                            {index > 0 && <button type="button" onClick={() => removeSize(index)} className="w-1/6 bg-red-900/40 text-red-500 rounded-sm text-xl font-bold hover:bg-red-500 hover:text-white transition-colors">✕</button>}
                        </div>
                    ))}
                </div>

                {/* SECTION 5: DYNAMIC ADDONS */}
                <div>
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
                        <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest">Premium Addons</h3>
                        <button type="button" onClick={addAddon} className="text-[10px] text-black bg-[#D4AF37] px-3 py-1 font-black uppercase rounded-sm hover:bg-[#FCF6BA]">+ Add Addon</button>
                    </div>
                    {addons.length === 0 && <p className="text-xs text-gray-600 font-bold">No addons applied.</p>}
                    {addons.map((addon, index) => (
                        <div key={index} className="flex gap-4 mb-4">
                            <input type="text" value={addon.addonName} onChange={(e) => handleAddonChange(index, 'addonName', e.target.value)} className="w-1/2 bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white font-bold outline-none" placeholder="e.g. Gold Hands" required />
                            <input type="number" value={addon.extraPrice} onChange={(e) => handleAddonChange(index, 'extraPrice', e.target.value)} className="w-1/3 bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-[#D4AF37] font-bold outline-none" placeholder="Extra Price (+300)" required />
                            <button type="button" onClick={() => removeAddon(index)} className="w-1/6 bg-red-900/40 text-red-500 rounded-sm text-xl font-bold hover:bg-red-500 hover:text-white transition-colors">✕</button>
                        </div>
                    ))}
                </div>

                {/* SECTION 6: DESCRIPTION & MEDIA */}
                <div className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Artifact Story</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" className="w-full bg-[#050505] border border-white/10 rounded-sm px-4 py-3 text-white font-medium resize-none outline-none focus:border-[#D4AF37]/50" placeholder="Premium handcrafted ocean resin..."></textarea>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                            {isEditMode ? 'Current Image (Leave empty to keep current)' : 'High-Res Artifact Image'}
                        </label>
                        <div className="relative w-full bg-[#050505] border border-dashed border-white/20 rounded-sm px-4 py-8 text-center hover:border-[#D4AF37]/50 transition-colors cursor-pointer group">
                            {/* 🚀 Image required sirf tab hoga jab naya product ban raha ho */}
                            <input type="file" onChange={handleImageChange} accept="image/*" required={!isEditMode} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <div className="text-gray-500 group-hover:text-[#D4AF37] transition-colors">
                                <span className="text-2xl block mb-2">📸</span>
                                <span className="text-xs font-bold uppercase tracking-widest">{image ? image.name : 'Drop image here to forge'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🚀 Dynamic Button Text */}
                <button type="submit" disabled={loading} className="w-full py-5 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black uppercase tracking-[0.2em] text-sm rounded-sm hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 mt-10">
                    {loading ? (isEditMode ? 'Updating Vault...' : 'Forging Artifact...') : (isEditMode ? 'Update Details' : 'Launch Masterpiece')}
                </button>
            </form>
        </div>
    );
};

export default AdminProductForm;