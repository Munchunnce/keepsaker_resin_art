import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../../features/products/productSlice';
import axiosInstance from '../../services/axiosInstance';
import toast from 'react-hot-toast';

const AdminProducts = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // 🚀 REDUX SE ASLI PRODUCTS UTRAYE
    const { items, loading } = useSelector((state) => state.products);

    useEffect(() => {
        dispatch(fetchProducts());
    }, [dispatch]);

    const safeProducts = Array.isArray(items) ? items : [];

    // 🚀 DELETE ARTIFACT LOGIC
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this masterpiece from the Vault?")) {
            try {
                await axiosInstance.delete(`/products/${id}`);
                toast.success('Artifact successfully removed ⚡');
                dispatch(fetchProducts()); // Table refresh karne ke liye
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete artifact');
            }
        }
    };

    if (loading && safeProducts.length === 0) {
        return <div className="text-[#D4AF37] font-bold tracking-widest uppercase text-sm mt-10 animate-pulse">Accessing Product Vault...</div>;
    }

    return (
        <div>
            {/* 🚀 VAULT HEADER */}
            <div className="mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Product Vault</h2>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">Manage Your Resin Collection</p>
                </div>
                
                {/* 🚀 ADD ARTIFACT BUTTON */}
                <button 
                    onClick={() => navigate('/admin/products/new')}
                    className="relative px-6 py-3 bg-[#D4AF37] text-black font-black uppercase tracking-widest text-xs rounded-sm overflow-hidden group hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)] cursor-pointer"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                    + Add New Artifact
                </button>
            </div>

            {/* 🚀 THE LIVE VAULT TABLE */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="text-[10px] text-gray-500 uppercase tracking-[0.2em] bg-[#050505] border-b border-white/5">
                            <tr>
                                <th className="px-6 py-5 font-black">Artwork</th>
                                <th className="px-6 py-5 font-black">Category</th>
                                <th className="px-6 py-5 font-black">Base Price</th>
                                <th className="px-6 py-5 font-black">Stock Status</th>
                                <th className="px-6 py-5 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {safeProducts.map((product) => (
                                <tr key={product._id} className="hover:bg-white/[0.02] transition-colors group">
                                    
                                    {/* IMAGE & NAME */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-md bg-[#1a1a1a] border border-white/10 overflow-hidden flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {/* Backend image URL ya placeholder */}
                                                <img 
                                                    src={product.images?.[0]?.url || product.image || 'https://via.placeholder.com/150'} 
                                                    alt={product.name} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white tracking-wide">{product.name}</p>
                                                <p className="text-[10px] text-gray-500 uppercase mt-1">ID: #{product._id.slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* CATEGORY */}
                                    <td className="px-6 py-5 font-bold text-gray-300">
                                        {typeof product.category === 'object' ? product.category?.name : (product.category || 'Resin Art')}
                                    </td>

                                    {/* PRICE */}
                                    <td className="px-6 py-5 font-black text-[#D4AF37] text-lg tracking-tight">
                                        ₹{product.price}
                                    </td>

                                    {/* STOCK STATUS */}
                                    <td className="px-6 py-5">
                                        {(product.stock ?? 1) > 0 ? (
                                            <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-sm text-[10px] font-black uppercase tracking-wider">
                                                In Stock ({product.stock || 'Available'})
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-sm text-[10px] font-black uppercase tracking-wider animate-pulse">
                                                Sold Out
                                            </span>
                                        )}
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => handleDelete(product._id)} 
                                                className="p-2 text-gray-500 hover:text-red-500 transition-colors cursor-pointer" 
                                                title="Delete Artifact"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {safeProducts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
                                        Vault is empty. Click "+ Add New Artifact" to forge your first masterpiece.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminProducts;