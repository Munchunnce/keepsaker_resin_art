import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../services/axiosInstance.js';

const ProductReviews = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    
    // Form States
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Reviews ko useEffect ke andar rakha gaya hai
    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true); // Pehle loading true karein
            try {
                const response = await axiosInstance.get(`/reviews/${productId}`);
                setReviews(response.data.data);
            } catch (error) {
                console.error('Failed to fetch reviews', error);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchReviews();
        }
    }, [productId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            return toast.error('Please select a star rating! 🌟');
        }

        setIsSubmitting(true);
        try {
            const response = await axiosInstance.post('/reviews', {
                productId,
                rating,
                comment
            });
            
            toast.success(response.data.message || 'Review forged into the vault! 💎');
            setRating(0);
            setComment('');
            setShowForm(false);
            
            // YAHAN CHANGE HAI 👇 (API dobara bulane ki jagah, naya data array mein aage daal diya)
            if (response.data.data) {
                setReviews(prevReviews => [response.data.data, ...prevReviews]); 
            }
            
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to submit review.';
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // SVG Star Icon Component for reusability
    const StarIcon = ({ filled, onMouseEnter, onMouseLeave, onClick }) => (
        <svg
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            className={`w-8 h-8 cursor-pointer transition-all duration-300 transform hover:scale-110 ${
                filled 
                ? 'text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]' 
                : 'text-gray-600 hover:text-[#BF953F]/50'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
        >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );

    return (
        <div className="mt-16 w-full max-w-5xl mx-auto relative group perspective-1000">
            {/* Header Area */}
            <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-8">
                <div>
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] tracking-tight drop-shadow-md">
                        Vault Testimonials
                    </h3>
                    <p className="text-xs text-gray-400 font-medium tracking-[0.2em] uppercase mt-2">
                        {reviews.length} {reviews.length === 1 ? 'Collector' : 'Collectors'} Shared Their Experience
                    </p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="px-6 py-2 bg-[#0a0a0a] border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-black uppercase tracking-widest rounded-sm hover:bg-[#D4AF37] hover:text-black transition-all duration-500 shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transform-gpu hover:-translate-y-1"
                >
                    {showForm ? 'Cancel Review' : 'Pen a Review'}
                </button>
            </div>

            {/* Write Review Form (Expandable) */}
            <div className={`overflow-hidden transition-all duration-700 ease-in-out ${showForm ? 'max-h-[600px] opacity-100 mb-12' : 'max-h-0 opacity-0'}`}>
                <div className="relative z-10 w-full bg-[#050505]/80 backdrop-blur-xl rounded-xl border border-white/10 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none rounded-xl"></div>
                    
                    <form onSubmit={handleSubmit} className="relative z-20 space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-3">
                                Artifact Rating
                            </label>
                            <div className="flex space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <StarIcon 
                                        key={star}
                                        filled={star <= (hoverRating || rating)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="group/input relative">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-2 group-focus-within/input:text-[#D4AF37] transition-colors">
                                Your Masterpiece Experience
                            </label>
                            <textarea
                                rows="4"
                                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] hover:border-white/30 transition-all text-sm font-medium resize-none shadow-inner"
                                placeholder="Describe the craftsmanship, texture, and aura of this artifact..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                maxLength={500}
                                required
                            />
                            <p className="text-[10px] text-gray-500 text-right mt-1 font-mono">
                                {comment.length}/500
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="relative overflow-hidden group/btn px-8 py-3 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black text-xs font-black uppercase tracking-widest rounded-sm disabled:opacity-50 transition-all duration-500 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.7)]"
                            >
                                <span className="relative z-10">{isSubmitting ? 'Engraving...' : 'Publish Review'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Reviews List */}
            {loading ? (
                <div className="flex justify-center items-center py-10">
                    <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-16 bg-[#050505]/40 rounded-xl border border-dashed border-white/10">
                    <p className="text-gray-400 font-medium tracking-wide">No collectors have reviewed this artifact yet.</p>
                    <p className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.2em] mt-2">Be the first to forge a legacy</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviews.map((rev) => (
                        <div key={rev._id} className="bg-[#0a0a0a]/60 backdrop-blur-md p-6 rounded-lg border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)] group/card">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-white text-sm font-bold tracking-wide capitalize group-hover/card:text-[#D4AF37] transition-colors">
                                        {rev.user?.full_name || 'Anonymous Collector'}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                                        {new Date(rev.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-[#D4AF37]' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                            </div>
                            <p className="text-gray-300 text-xs leading-relaxed font-medium">
                                "{rev.comment}"
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductReviews;