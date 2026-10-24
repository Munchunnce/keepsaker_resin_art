import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance'; // Aapka setup kiya hua axios
import toast from 'react-hot-toast';

const CustomArtRequest = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [formData, setFormData] = useState({
        theme: 'Wedding Varmala Preservation',
        dimensions: '',
        description: ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) {
            return toast.error('Please upload a reference image!');
        }

        // 🚀 Multer backend ke liye FormData banana zaroori hai
        const data = new FormData();
        data.append('theme', formData.theme);
        data.append('dimensions', formData.dimensions);
        data.append('description', formData.description);
        data.append('image', image);

        try {
            setLoading(true);
            const res = await axiosInstance.post('/custom-art', data);
            
            if (res.data.success) {
                toast.success('Your vision has been sent to our artists! 💎');
                // Submit hone ke baad wapas home ya orders page bhej dein
                navigate('/'); 
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#fafafa] min-h-screen py-16 md:py-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                
                {/* 🚀 PREMIUM HEADER */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-black tracking-tighter mb-4">Commission a Masterpiece</h1>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                        Turn your memories into eternal luxury resin art
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-12 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 space-y-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* THEME SELECTOR */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Art Theme</label>
                            <select 
                                name="theme" 
                                value={formData.theme} 
                                onChange={handleChange} 
                                className="w-full bg-[#fafafa] border border-gray-200 rounded-sm px-4 py-3 text-black font-bold outline-none focus:border-[#D4AF37] transition-colors"
                            >
                                <option value="Wedding Varmala Preservation">Wedding Varmala Preservation</option>
                                <option value="Geode Wall Clock">Custom Geode Wall Clock</option>
                                <option value="Luxury Nameplate">Luxury Nameplate</option>
                                <option value="Ocean Diorama">Ocean Diorama Setup</option>
                                <option value="Other Custom Idea">Other Custom Idea</option>
                            </select>
                        </div>

                        {/* DIMENSIONS */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Desired Size</label>
                            <input 
                                type="text" 
                                name="dimensions" 
                                value={formData.dimensions} 
                                onChange={handleChange} 
                                required 
                                className="w-full bg-[#fafafa] border border-gray-200 rounded-sm px-4 py-3 text-black font-bold outline-none focus:border-[#D4AF37] transition-colors" 
                                placeholder="e.g. 18x18 Inches or Large" 
                            />
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Special Requirements & Details</label>
                        <textarea 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            required 
                            rows="4" 
                            className="w-full bg-[#fafafa] border border-gray-200 rounded-sm px-4 py-3 text-black font-medium resize-none outline-none focus:border-[#D4AF37] transition-colors" 
                            placeholder="Tell us exactly how you want your art to look. Include colors, styles, or specific memory details..."
                        ></textarea>
                    </div>

                    {/* IMAGE UPLOAD */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Reference Image</label>
                        <div className="relative w-full bg-[#fafafa] border-2 border-dashed border-gray-200 rounded-sm px-4 py-10 text-center hover:border-[#D4AF37] transition-colors cursor-pointer group">
                            <input 
                                type="file" 
                                onChange={handleImageChange} 
                                accept="image/*" 
                                required 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            />
                            <div className="text-gray-400 group-hover:text-[#D4AF37] transition-colors">
                                <span className="text-3xl block mb-3">🖼️</span>
                                <span className="text-xs font-bold uppercase tracking-widest text-black">
                                    {image ? image.name : 'Click or drop your reference photo here'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full py-5 bg-[#050505] text-white font-black uppercase tracking-[0.2em] text-sm rounded-sm hover:bg-[#D4AF37] hover:text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Transmitting Vision...' : 'Submit Design Request'}
                    </button>
                    
                    <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mt-4">
                        Our master artisans will review your request and provide a final quote.
                    </p>

                </form>
            </div>
        </div>
    );
};

export default CustomArtRequest;