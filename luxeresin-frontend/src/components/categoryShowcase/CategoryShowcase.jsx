import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';

const CategoryShowcase = () => {
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axiosInstance.get('/categories');

                if (res.data.success) {
                    setCategories(res.data.data);
                }
            } catch (err) {
                console.error('Failed to load categories', err);
            }
        };

        fetchCategories();
    }, []);

    return (
        <section className="w-full bg-[#050505] py-20">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section Heading */}
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">
                        Curated Vaults
                    </p>

                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                        Explore by Category
                    </h2>

                    <p className="text-xs text-gray-400 font-medium leading-relaxed">
                        Handcrafted resin masterpieces categorized for your
                        exclusive interior aesthetics.
                    </p>
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categories.map((cat) => (
                        <div
                            key={cat._id}
                            onClick={() => navigate(`/category/${cat.slug}`)}
                            className="group relative h-96 rounded-2xl overflow-hidden border border-white/5 cursor-pointer shadow-2xl transition-all duration-700 hover:-translate-y-2 hover:border-[#D4AF37]/50"
                        >
                            {/* Background Category Image */}
                            <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100"
                            />

                            {/* Luxury Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />

                            {/* Category Content */}
                            <div className="absolute bottom-0 left-0 w-full p-8 space-y-2 text-center group-hover:-translate-y-2 transition-transform duration-500">
                                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">
                                    Vault Collection
                                </span>

                                <h3 className="text-xl font-black text-white tracking-wide group-hover:text-[#FCF6BA] transition-colors">
                                    {cat.name}
                                </h3>

                                <p className="text-xs text-gray-400 line-clamp-2 font-medium">
                                    {cat.description}
                                </p>

                                <div className="pt-2">
                                    <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-white border-b border-[#D4AF37] pb-0.5">
                                        Discover Collection →
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default CategoryShowcase;