import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminCustomRequests, updateAdminCustomRequest } from '../../features/customArt/customArtSlice';
import toast from 'react-hot-toast';

// 🚀 Chhota Component: Ek single Order Card ke liye (Taaki har card ka apna local state ho)
const RequestCard = ({ req }) => {
    const dispatch = useDispatch();
    const [status, setStatus] = useState(req.status);
    const [price, setPrice] = useState(req.estimatedPrice || '');
    const [notes, setNotes] = useState(req.adminNotes || '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        try {
            setLoading(true);
            await dispatch(updateAdminCustomRequest({
                id: req._id,
                updateData: { status, estimatedPrice: Number(price), adminNotes: notes }
            })).unwrap();
            toast.success('Quote & Status updated successfully! 💸');
        } catch (error) {
            toast.error(error || 'Failed to update');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-6 mb-6">
            {/* LEFT: PHOTO AUR CUSTOMER DETAILS */}
            <div className="lg:w-1/3 space-y-4">
                <div className="relative group rounded-lg overflow-hidden border-2 border-gray-100 aspect-square">
                    <img src={req.referenceImage} alt="Reference" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                </div>
                <div>
                    <p className="text-xs font-black text-[#D4AF37] uppercase tracking-widest">{req.theme}</p>
                    <p className="text-sm font-bold mt-1">Customer: <span className="font-medium text-gray-600">{req.user?.full_name}</span></p>
                    <p className="text-sm font-bold">Email: <span className="font-medium text-gray-600">{req.user?.email}</span></p>
                    <p className="text-xs text-gray-400 mt-2">Date: {new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            {/* MIDDLE: ORDER REQUIREMENTS */}
            <div className="lg:w-1/3 space-y-4 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-4 lg:pt-0">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Design Requirements</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Shape</p>
                        <p className="font-medium text-sm">{req.shape}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Dimensions</p>
                        <p className="font-medium text-sm">{req.dimensions}</p>
                    </div>
                </div>

                <div className="bg-[#fafafa] p-3 rounded-md border border-gray-100">
                    <p className="text-[10px] text-[#D4AF37] uppercase font-black mb-1">Custom Text to Print</p>
                    <p className="font-black text-lg">{req.customText || 'N/A'}</p>
                </div>

                <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Special Notes / Description</p>
                    <p className="font-medium text-sm text-gray-600 italic mt-1">"{req.description}"</p>
                </div>
            </div>

            {/* RIGHT: ADMIN CONTROLS (QUOTE & STATUS) */}
            <div className="lg:w-1/3 space-y-4 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-4 lg:pt-0">
                <h3 className="text-xs font-black text-black uppercase tracking-widest mb-4">Admin Action Console</h3>
                
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Order Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full mt-1 p-2 bg-[#fafafa] border border-gray-200 rounded-sm text-sm font-bold outline-none focus:border-[#D4AF37]">
                            <option value="PENDING">Pending (Need to Review)</option>
                            <option value="REVIEWING">Reviewing</option>
                            <option value="ACCEPTED">Accepted (Waiting for Payment)</option>
                            <option value="IN_MAKING">In Making (Work Started)</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Estimated Price (₹)</label>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 5000" className="w-full mt-1 p-2 bg-[#fafafa] border border-gray-200 rounded-sm text-sm font-bold outline-none focus:border-[#D4AF37]" />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Internal Notes / Tracking ID</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" placeholder="Private notes for team..." className="w-full mt-1 p-2 bg-[#fafafa] border border-gray-200 rounded-sm text-sm resize-none outline-none focus:border-[#D4AF37]"></textarea>
                    </div>

                    <button onClick={handleUpdate} disabled={loading} className="w-full py-3 mt-2 bg-black text-white font-black uppercase text-[10px] tracking-widest rounded-sm hover:bg-[#D4AF37] transition-colors disabled:opacity-50">
                        {loading ? 'Saving...' : 'Update Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// 🚀 MAIN PAGE COMPONENT
const AdminCustomRequests = () => {
    const dispatch = useDispatch();
    const { requests, loading } = useSelector((state) => state.customArt);

    useEffect(() => {
        dispatch(fetchAdminCustomRequests());
    }, [dispatch]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bespoke Commissions</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage custom art requests & quotes</p>
                </div>
            </div>

            {loading && requests.length === 0 ? (
                <div className="text-center py-10"><p className="text-gray-400 font-bold tracking-widest uppercase">Fetching Vault...</p></div>
            ) : requests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-4xl mb-4">📭</p>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No custom requests yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {requests.map((req) => (
                        <RequestCard key={req._id} req={req} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminCustomRequests;