import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { submitCustomRequest } from '../features/customArt/customArtSlice';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE_MB = 5;

const THEMES = [
    { value: 'Wedding Varmala Preservation', label: 'Wedding Varmala', tag: 'Most Popular', baseRange: [2999, 4499] },
    { value: 'Geode Wall Clock', label: 'Geode Wall Clock', tag: 'Luxury Decor', baseRange: [2499, 3999] },
    { value: 'Luxury Nameplate', label: 'Luxury Nameplate', tag: 'Home Entrance', baseRange: [1999, 3299] }
];

const SHAPES = [
    { value: 'Round', label: 'Round', icon: '◯' },
    { value: 'Square', label: 'Square', icon: '▢' },
    { value: 'Rectangle', label: 'Rectangle', icon: '▭' },
    { value: 'Hexagon', label: 'Hexagon', icon: '⬡' }
];

const DIMENSIONS = [
    { value: '12x12 Inches (Standard)', label: '12x12" (Standard)', multiplier: 1 },
    { value: '14x14 Inches (Medium)', label: '14x14" (Medium)', multiplier: 1.25 },
    { value: '18x18 Inches (Large)', label: '18x18" (Large)', multiplier: 1.65 },
    { value: '24x24 Inches (Grand)', label: '24x24" (Grand Masterpiece)', multiplier: 2.3 },
    { value: 'Custom Size', label: 'Custom Size (Specify below)', multiplier: null }
];

const getErrorMessage = (err, fallback) =>
    typeof err === 'string'
        ? err
        : err?.response?.data?.message || err?.message || fallback;

const CustomArtRequest = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { loading } = useSelector((state) => state.customArt);
    const { isAuthenticated } = useSelector((state) => state.auth);

    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showFullPreview, setShowFullPreview] = useState(false);
    const [textTone, setTextTone] = useState('GOLD'); // Visual preview only

    const [formData, setFormData] = useState({
        theme: 'Wedding Varmala Preservation',
        shape: 'Round',
        dimensions: '12x12 Inches (Standard)',
        customText: '',
        description: ''
    });

    // MEMORY LEAK FIX: Purana Blob URL cleanup
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'customText' && value.length > 40) return;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const processSelectedFile = (file) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload a valid image file (JPG, PNG, WEBP).');
            return;
        }

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            toast.error(`Image size must be under ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }

        setImage(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        processSelectedFile(file);
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        processSelectedFile(file);
    };

    const handleRemoveImage = () => {
        setImage(null);
        setPreviewUrl(null);
        setShowFullPreview(false);
    };

    // Dynamic Ballpark Estimate (Conversion Booster)
    const getEstimatedRange = () => {
        const themeObj = THEMES.find((t) => t.value === formData.theme) || THEMES[0];
        const sizeObj = DIMENSIONS.find((d) => d.value === formData.dimensions);

        if (!sizeObj || sizeObj.multiplier === null) {
            return 'Custom Quote';
        }

        const min = Math.round((themeObj.baseRange[0] * sizeObj.multiplier) / 100) * 100 - 1;
        const max = Math.round((themeObj.baseRange[1] * sizeObj.multiplier) / 100) * 100 - 1;
        return `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')}`;
    };

    // Sharp Gold Rim Wrapper (Fixes Hexagon clipped border bug)
    const getShapeClass = () => {
        switch (formData.shape) {
            case 'Round':
                return 'rounded-full aspect-square';
            case 'Square':
                return 'rounded-xl aspect-square';
            case 'Rectangle':
                return 'rounded-xl aspect-[4/3]';
            case 'Hexagon':
                return 'aspect-square [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]';
            default:
                return 'rounded-full aspect-square';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (!isAuthenticated) {
            toast.error('Please login to submit your bespoke art commission.');
            navigate('/login');
            return;
        }

        if (!image) {
            toast.error('Please upload a reference image!');
            return;
        }

        const cleanDescription = formData.description.trim();
        if (cleanDescription.length < 10) {
            toast.error('Please add a bit more detail (at least 10 characters) for our artists.');
            return;
        }

        const data = new FormData();
        data.append('theme', formData.theme);
        data.append('shape', formData.shape);
        data.append('customText', formData.customText.trim());
        data.append('dimensions', formData.dimensions);
        data.append('description', cleanDescription);
        data.append('image', image);

        try {
            await dispatch(submitCustomRequest(data)).unwrap();
            toast.success('Your vision has been transmitted to our studio! 💎');
            navigate('/my-orders');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to submit request.'));
        }
    };

    return (
        <div className="bg-[#050505] min-h-screen py-12 md:py-20 text-gray-300 relative overflow-x-clip">
            {/* Ambient 3D Gold Lighting */}
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[780px] h-[320px] bg-[#D4AF37]/8 blur-[130px] rounded-full" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* HEADER */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-3">
                        LuxeResin Bespoke Atelier
                    </p>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] tracking-tight drop-shadow-[0_6px_20px_rgba(212,175,55,0.22)] mb-4">
                        Design Your Masterpiece
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-[0.18em]">
                        Preserve wedding varmalas, memories & luxury decor in crystal-clear museum-grade resin
                    </p>
                </div>

                {/* CEO CONVERSION STRIP: HOW BESPOKE WORKS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    {[
                        { step: '01', title: 'Configure & Upload', desc: 'Pick mold shape, size & upload your reference photo.' },
                        { step: '02', title: 'Artist Quote in 24h', desc: 'Our resin specialists review & send an exact price quote.' },
                        { step: '03', title: '50% Advance & Track Live', desc: 'Approve quote, pay 50% advance & watch live crafting stages.' }
                    ].map((item) => (
                        <div
                            key={item.step}
                            className="bg-gradient-to-b from-[#0e0e0e] to-[#080808] p-5 rounded-xl border border-white/10 flex items-start gap-4"
                        >
                            <span className="text-xs font-black text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2.5 py-1.5 rounded-sm font-mono">
                                {item.step}
                            </span>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {!isAuthenticated && (
                    <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs font-bold text-[#FCF6BA]">
                            🔒 Login required to save your commission & receive your studio quote.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-[#FCF6BA] transition-colors cursor-pointer"
                        >
                            Log In Now
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* LEFT COLUMN: 3D STICKY LIVE RESIN VISUALIZER */}
                    <div className="lg:col-span-5 lg:sticky lg:top-24">
                        <div className="bg-gradient-to-b from-[#101010] to-[#070707] p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/25 border-t-[#FCF6BA]/30 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.08)] flex flex-col items-center">
                            <div className="w-full flex items-center justify-between border-b border-white/10 pb-4 mb-7">
                                <div>
                                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.25em]">
                                        Live Studio Preview
                                    </p>
                                    <p className="text-xs font-bold text-gray-400 mt-0.5">
                                        {formData.shape} • {formData.dimensions.split(' ')[0]}
                                    </p>
                                </div>

                                {previewUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setShowFullPreview(true)}
                                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-[#D4AF37]/20 text-[#FCF6BA] border border-white/10 hover:border-[#D4AF37]/40 rounded-sm transition-all cursor-pointer"
                                    >
                                        Inspect Photo ↗
                                    </button>
                                )}
                            </div>

                            {/* 3D MOLD STAGE */}
                            <div className="relative w-full max-w-[290px] py-4 flex items-center justify-center">
                                {/* Soft Gold Halo Under Mold */}
                                <div className="pointer-events-none absolute inset-6 bg-[#D4AF37]/15 blur-2xl rounded-full" />

                                {/* Outer 24K Gold Rim (Works cleanly for Hexagon too) */}
                                <div
                                    className={`relative w-full p-[3px] bg-gradient-to-br from-[#FCF6BA] via-[#D4AF37] to-[#6E4F12] shadow-[0_25px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.22)] transition-all duration-500 ${getShapeClass()}`}
                                >
                                    <div
                                        className={`relative w-full h-full overflow-hidden bg-[#0a0a0a] flex items-center justify-center ${getShapeClass()}`}
                                    >
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Bespoke Preview"
                                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center px-6 w-full h-full bg-gradient-to-br from-[#141414] via-[#0b0b0b] to-[#17130a]">
                                                <span className="text-4xl mb-3 opacity-80">💎</span>
                                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                                                    {formData.shape} Resin Mold
                                                </span>
                                                <span className="text-[11px] text-gray-500 mt-1.5">
                                                    Upload your reference photo to preview live
                                                </span>
                                            </div>
                                        )}

                                        {/* 3D Glass Resin Sheen Overlay */}
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-white/15" />

                                        {/* LIVE CUSTOM ENGRAVING TEXT */}
                                        {formData.customText && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                                                <span
                                                    className={`text-xl sm:text-2xl font-black text-center leading-tight tracking-wide break-words ${
                                                        textTone === 'GOLD'
                                                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]'
                                                            : 'text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]'
                                                    }`}
                                                >
                                                    {formData.customText}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Text Tone Preview Switch */}
                            {formData.customText && (
                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                                        Text Preview:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setTextTone('GOLD')}
                                        className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm border cursor-pointer ${
                                            textTone === 'GOLD'
                                                ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#FCF6BA]'
                                                : 'border-white/10 text-gray-400'
                                        }`}
                                    >
                                        Gold Foil
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTextTone('WHITE')}
                                        className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm border cursor-pointer ${
                                            textTone === 'WHITE'
                                                ? 'border-white/50 bg-white/10 text-white'
                                                : 'border-white/10 text-gray-400'
                                        }`}
                                    >
                                        Pearl White
                                    </button>
                                </div>
                            )}

                            {/* LIVE BALLPARK ESTIMATE CARD */}
                            <div className="w-full mt-7 pt-5 border-t border-white/10 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                                        Estimated Investment
                                    </p>
                                    <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] mt-0.5">
                                        {getEstimatedRange()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-sm">
                                        Zero Upfront Fee
                                    </span>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Pay only after quote approval
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: 3D CONFIGURATION FORM */}
                    <div className="lg:col-span-7">
                        <form
                            onSubmit={handleSubmit}
                            className="bg-gradient-to-b from-[#0e0e0e] to-[#080808] p-6 sm:p-8 md:p-10 rounded-2xl border border-white/10 border-t-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] space-y-8"
                        >
                            {/* 1. ART THEME CARDS */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.25em] block">
                                    01. Select Art Theme
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {THEMES.map((theme) => {
                                        const active = formData.theme === theme.value;
                                        return (
                                            <button
                                                key={theme.value}
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({ ...prev, theme: theme.value }))
                                                }
                                                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                                    active
                                                        ? 'bg-gradient-to-b from-[#17140b] to-[#0b0a06] border-[#D4AF37] shadow-[0_10px_25px_-10px_rgba(212,175,55,0.4)] -translate-y-0.5'
                                                        : 'bg-[#050505] border-white/10 hover:border-white/25'
                                                }`}
                                            >
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]/80 block mb-1">
                                                    {theme.tag}
                                                </span>
                                                <span className="text-xs font-black text-white block">
                                                    {theme.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. INTERACTIVE SHAPE SELECTOR */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.25em] block">
                                    02. Choose Mold Shape
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {SHAPES.map((shape) => {
                                        const active = formData.shape === shape.value;
                                        return (
                                            <button
                                                key={shape.value}
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({ ...prev, shape: shape.value }))
                                                }
                                                className={`py-3.5 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                                    active
                                                        ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#FCF6BA] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                                                        : 'bg-[#050505] border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                                                }`}
                                            >
                                                <span className="text-xl leading-none">{shape.icon}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {shape.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. CUSTOM TEXT & DIMENSIONS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                            03. Custom Engraving (Optional)
                                        </label>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {formData.customText.length}/40
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        name="customText"
                                        value={formData.customText}
                                        onChange={handleChange}
                                        maxLength={40}
                                        placeholder="e.g. Rahul & Priya • 12.11.2026"
                                        className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-3.5 text-sm text-white placeholder-gray-600 shadow-[inset_0_2px_6px_rgba(0,0,0,0.85)] focus:border-[#D4AF37] outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">
                                        04. Required Dimensions
                                    </label>
                                    <select
                                        name="dimensions"
                                        value={formData.dimensions}
                                        onChange={handleChange}
                                        className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-3.5 text-sm text-white font-bold shadow-[inset_0_2px_6px_rgba(0,0,0,0.85)] focus:border-[#D4AF37] outline-none transition-all cursor-pointer"
                                    >
                                        {DIMENSIONS.map((dim) => (
                                            <option key={dim.value} value={dim.value}>
                                                {dim.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 4. SPECIAL REQUIREMENTS */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">
                                    05. Artist Instructions & Special Details *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows="3"
                                    placeholder="Share flower placement, preferred color palette (gold leaf, emerald, pearl white), LED backlight request, or target event date..."
                                    className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-3.5 text-sm text-white placeholder-gray-600 resize-none shadow-[inset_0_2px_6px_rgba(0,0,0,0.85)] focus:border-[#D4AF37] outline-none transition-all"
                                />
                            </div>

                            {/* 5. DRAG & DROP REFERENCE IMAGE UPLOADER */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">
                                    06. Reference Photo * (Max {MAX_FILE_SIZE_MB}MB)
                                </label>

                                {!image ? (
                                    <label
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsDragging(true);
                                        }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                                            isDragging
                                                ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                                                : 'border-white/15 bg-[#050505] hover:border-[#D4AF37]/50'
                                        }`}
                                    >
                                        <span className="text-3xl mb-2">📸</span>
                                        <span className="text-xs font-black uppercase tracking-widest text-white">
                                            Drop photo here or click to browse
                                        </span>
                                        <span className="text-[11px] text-gray-500 mt-1">
                                            JPG, PNG or WEBP • High resolution recommended
                                        </span>
                                        <input
                                            type="file"
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </label>
                                ) : (
                                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#050505] border border-[#D4AF37]/40">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={previewUrl}
                                                alt="Selected"
                                                className="w-12 h-12 rounded-lg object-cover border border-white/10 flex-shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-white truncate">
                                                    {image.name}
                                                </p>
                                                <p className="text-[10px] text-[#D4AF37] font-mono mt-0.5">
                                                    {(image.size / (1024 * 1024)).toFixed(2)} MB • Ready
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <label className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 rounded-sm cursor-pointer">
                                                Change
                                                <input
                                                    type="file"
                                                    onChange={handleImageChange}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-sm cursor-pointer"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SUBMIT CTA */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black uppercase tracking-[0.22em] text-xs sm:text-sm rounded-sm shadow-[0_12px_35px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.65)] hover:shadow-[0_18px_45px_rgba(212,175,55,0.55)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
                            >
                                {loading ? 'Transmitting Vision to Studio...' : 'Request Free Studio Quote'}
                            </button>

                            <div className="flex flex-wrap justify-center items-center gap-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest pt-1">
                                <span>✦ 100% Handmade in India</span>
                                <span>✦ UV-Resistant Epoxy</span>
                                <span>✦ Insured Delivery</span>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* FULL-SIZE IMAGE INSPECTOR MODAL (Mobile + Desktop Friendly) */}
            {showFullPreview && previewUrl && (
                <div
                    onClick={() => setShowFullPreview(false)}
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0a0a0a] border border-[#D4AF37]/40 rounded-2xl max-w-3xl w-full p-5 relative shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.25em]">
                                Original Uncropped Reference Photo
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowFullPreview(false)}
                                className="text-gray-400 hover:text-white font-bold text-lg cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <img
                            src={previewUrl}
                            alt="Original Reference"
                            className="w-full max-h-[75vh] object-contain rounded-xl bg-[#050505]"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomArtRequest;