import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
    fetchAdminCategories,
    createCategory,
    updateCategory,
    toggleCategoryStatus,
} from '../../features/category/categorySlice';

const AdminCategories = () => {
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const { items: categories, loading, submitting } = useSelector((state) => state.category || {});

    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        dispatch(fetchAdminCategories());
    }, [dispatch]);

    // Blob URL memory leak prevention
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const slugPreview = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setDescription('');
        setImageFile(null);
        setPreviewUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            return toast.error('Sirf valid image file (JPG, PNG, WEBP) select karein.');
        }
        if (file.size > 5 * 1024 * 1024) {
            return toast.error('Image size 5MB se kam honi chahiye.');
        }

        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleEditClick = (cat) => {
        setEditingId(cat._id);
        setName(cat.name);
        setDescription(cat.description || '');
        setImageFile(null);
        setPreviewUrl(cat.image);
        if (fileInputRef.current) fileInputRef.current.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            return toast.error('Category name zaroori hai.');
        }
        if (!editingId && !imageFile) {
            return toast.error('Nayi category ke liye cover image upload karein.');
        }

        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('description', description.trim());
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            if (editingId) {
                await dispatch(updateCategory({ id: editingId, formData })).unwrap();
                toast.success('Category updated successfully!');
            } else {
                await dispatch(createCategory(formData)).unwrap();
                toast.success('Category forged successfully!');
            }
            resetForm();
        } catch (err) {
            toast.error(err || 'Operation failed.');
        }
    };

    const handleToggleStatus = async (cat) => {
        try {
            await dispatch(toggleCategoryStatus(cat._id)).unwrap();
            toast.success(`${cat.name} is now ${!cat.isActive ? 'Active' : 'Hidden'}.`);
        } catch (err) {
            toast.error(err || 'Status update failed.');
        }
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">
                        Vault Categories
                    </h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mt-2">
                        Manage Storefront Collections & Taxonomy
                    </p>
                </div>
                <div className="px-4 py-2 bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-sm text-xs font-black uppercase tracking-widest text-[#D4AF37]">
                    {categories.length} {categories.length === 1 ? 'Collection' : 'Collections'}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT: CREATE / EDIT FORM */}
                <div className="lg:col-span-5 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                            {editingId ? 'Edit Vault Category' : 'Forge New Category'}
                        </h3>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white cursor-pointer"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                Category Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Devotional Art"
                                className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-sm text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                                required
                            />
                            {slugPreview && (
                                <p className="text-[11px] font-mono text-gray-500 mt-1.5">
                                    Slug: <span className="text-[#D4AF37]">/{slugPreview}</span>
                                </p>
                            )}
                        </div>

                        {/* Image File Picker */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                Cover Image {editingId && '(Optional on edit)'}
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full text-xs text-gray-400 bg-[#050505] border border-white/10 rounded-sm file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-[#D4AF37]/15 file:text-[#D4AF37] hover:file:bg-[#D4AF37]/25 cursor-pointer"
                            />

                            {previewUrl && (
                                <div className="mt-3 rounded-lg overflow-hidden border border-white/10 bg-[#050505] h-44">
                                    <img
                                        src={previewUrl}
                                        alt="Category preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                Collection Description
                            </label>
                            <textarea
                                rows="4"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={350}
                                placeholder="Handcrafted sacred resin artifacts infused with 24K gold flakes..."
                                className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-sm text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] resize-none"
                            />
                            <p className="text-[10px] font-mono text-gray-500 text-right mt-1">
                                {description.length}/350
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black text-xs font-black uppercase tracking-[0.2em] rounded-sm disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] cursor-pointer"
                        >
                            {submitting
                                ? editingId
                                    ? 'Updating Vault...'
                                    : 'Uploading & Forging...'
                                : editingId
                                ? 'Save Changes'
                                : 'Forge Category'}
                        </button>
                    </form>
                </div>

                {/* RIGHT: CATEGORIES LIST */}
                <div className="lg:col-span-7 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/5 bg-[#0d0d0d]">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                            Vault Collections
                        </h3>
                    </div>

                    {loading && categories.length === 0 ? (
                        <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-[#D4AF37] animate-pulse">
                            Syncing Vault Categories...
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 text-sm">
                            Abhi koi category nahi hai. Left panel se pehli category forge karein.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {categories.map((cat) => (
                                <div
                                    key={cat._id}
                                    className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center hover:bg-white/[0.02] transition-colors"
                                >
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="w-20 h-20 rounded-xl object-cover border border-white/10 flex-shrink-0 bg-[#050505]"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <h4 className="text-base font-bold text-white truncate">
                                                {cat.name}
                                            </h4>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
                                                /{cat.slug}
                                            </span>
                                            <span
                                                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-sm border ${
                                                    cat.isActive
                                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}
                                            >
                                                {cat.isActive ? 'Active' : 'Hidden'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                                            {cat.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleEditClick(cat)}
                                            className="px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(cat)}
                                            className="px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm border border-white/10 text-gray-300 hover:border-white/30 hover:text-white transition-all cursor-pointer"
                                        >
                                            {cat.isActive ? 'Hide' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCategories;