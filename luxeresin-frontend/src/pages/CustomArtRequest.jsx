import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { submitCustomRequest } from '../features/customArt/customArtSlice';
import toast from 'react-hot-toast';

const CustomArtRequest = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.customArt);

    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isHovering, setIsHovering] = useState(false); 

    const [formData, setFormData] = useState({
        theme: 'Wedding Varmala Preservation',
        shape: 'Round',      
        dimensions: '12x12 Inches (Standard)',
        customText: '',      
        description: ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file)); 
        }
    };

    const getShapeStyle = () => {
        switch (formData.shape) {
            case 'Round': return 'rounded-full aspect-square';
            case 'Square': return 'rounded-sm aspect-square';
            case 'Rectangle': return 'rounded-sm aspect-[4/3]';
            case 'Hexagon': return 'aspect-square [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]';
            default: return 'rounded-full aspect-square'; 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) {
            return toast.error('Please upload a reference image!');
        }

        const data = new FormData();
        data.append('theme', formData.theme);
        data.append('shape', formData.shape);
        data.append('customText', formData.customText);
        data.append('dimensions', formData.dimensions);
        data.append('description', formData.description);
        data.append('image', image);

        try {
            await dispatch(submitCustomRequest(data)).unwrap();
            toast.success('Your vision has been sent to our artists! 💎');
            navigate('/'); 
        } catch (error) {
            toast.error(error || 'Failed to submit request');
        }
    };

    return (
        <div className="bg-[#fafafa] min-h-screen py-16 md:py-24 overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-black text-black tracking-tighter mb-4">Design Your Masterpiece</h1>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                        Customize your shape, text, and memories in real-time
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* LEFT COLUMN: LIVE VISUALIZER */}
                    <div className="lg:col-span-5 sticky top-28">
                        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 w-full text-left border-b border-gray-100 pb-2">Live Preview Visualizer</p>
                            
                            <div 
                                className="relative w-full max-w-[280px] flex items-center justify-center group mx-auto cursor-crosshair"
                                onMouseEnter={() => setIsHovering(true)}
                                onMouseLeave={() => setIsHovering(false)}
                            >
                                <div className={`relative overflow-hidden w-full bg-gray-100 shadow-2xl transition-all duration-500 border-4 border-[#D4AF37]/40 flex items-center justify-center ${getShapeStyle()}`}>
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-300 w-full h-full bg-[#f8f8f8]">
                                            <span className="text-4xl block mb-2 opacity-40">🖼️</span>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 text-center px-4">
                                                Empty {formData.shape} Mold <br/> Upload Photo
                                            </span>
                                        </div>
                                    )}

                                    {formData.customText && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <span className="text-white text-2xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-center px-4 leading-tight">
                                                {formData.customText}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-6">
                                {previewUrl ? 'Hover over image to view original' : 'Preview is for visualization purposes only.'}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FORM & HOVER PREVIEW */}
                    <div className="lg:col-span-7 relative">
                        
                        {/* FORM CONTAINER */}
                        <div className={`transition-all duration-500 ${isHovering && previewUrl ? 'opacity-10 blur-md pointer-events-none' : 'opacity-100'}`}>
                            <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-10 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 space-y-8">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Art Theme</label>
                                        <select name="theme" value={formData.theme} onChange={handleChange} className="w-full bg-[#fafafa] border border-gray-200 rounded-sm px-4 py-3 text-black font-bold outline-none focus:border-[#D4AF37]">
                                            <option value="Wedding Varmala Preservation">Wedding Varmala</option>
                                            <option value="Geode Wall Clock">Geode Wall Clock</option>
                                            <option value="Luxury Nameplate">Luxury Nameplate</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Resin Shape</label>
                                        <select name="shape" value={formData.shape} onChange={handleChange} className="w-full bg-[#fafafa] border border-gray-200 rounded-sm px-4 py-3 text-black font-bold outline-none focus:border-[#D4AF37]">
                                            <option value="Round">Round / Circular</option>
                                            <option value="Square">Square</option>
                                            <option value="Rectangle">Rectangle</option>
                                            <option value="Hexagon">Hexagon</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Custom Text (Names/Date)</label>
                                        <input type="text" name="customText" value={formData.customText} onChange={handleChange} className="w-full bg-[#fafafa] border border-gray-200 rounded-sm px-4 py-3 text-black font-bold outline-none focus:border-[#D4AF37]" placeholder="e.g. Rahul & Priya" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Required Size</label>
                                        <select name="dimensions" value={formData.dimensions} onChange={handleChange} className="w-full bg-[#fafafa] border border-gray-200 rounded-sm px-4 py-3 text-black font-bold outline-none focus:border-[#D4AF37]">
                                            <option value="12x12 Inches (Standard)">12x12 Inches (Standard)</option>
                                            <option value="14x14 Inches (Medium)">14x14 Inches (Medium)</option>
                                            <option value="18x18 Inches (Large)">18x18 Inches (Large)</option>
                                            <option value="24x24 Inches (Grand)">24x24 Inches (Grand Masterpiece)</option>
                                            <option value="Custom Size">Other (Please specify in requirements)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Special Requirements</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" className="w-full bg-[#fafafa] border border-gray-200 rounded-sm px-4 py-3 text-black font-medium resize-none outline-none focus:border-[#D4AF37]" placeholder="Any specific flower placement, color matching, etc..."></textarea>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Reference Image</label>
                                    <input type="file" onChange={handleImageChange} accept="image/*" required className="w-full bg-[#fafafa] border border-gray-200 rounded-sm px-4 py-3 text-black font-bold file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-black file:uppercase file:bg-[#050505] file:text-[#D4AF37] hover:file:bg-[#D4AF37] hover:file:text-black transition-all cursor-pointer" />
                                </div>

                                <button type="submit" disabled={loading} className="w-full py-5 bg-[#050505] text-white font-black uppercase tracking-[0.2em] text-sm rounded-sm hover:bg-[#D4AF37] hover:text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50 mt-4">
                                    {loading ? 'Transmitting Vision...' : 'Submit Design Request'}
                                </button>
                            </form>
                        </div>

                        {/* FIXED: IMAGE AUR BADI KAR DI (max-w-2xl aur max-h-[600px] kar diya) */}
                        <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-all duration-500 pointer-events-none ${isHovering && previewUrl ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                            <div className="bg-white p-4 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.2)] border border-[#D4AF37]/50 max-w-2xl w-full flex flex-col items-center">
                                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-4">Original Uncropped Image</p>
                                <img src={previewUrl} alt="Original View" className="w-full h-auto max-h-[600px] object-contain rounded-lg" />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomArtRequest;