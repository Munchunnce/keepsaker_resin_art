import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCart, updateCartItemQty, removeCartItem } from '../features/cart/cartSlice';
import toast from 'react-hot-toast';

const Cart = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { cart, loading } = useSelector((state) => state.cart);

    useEffect(() => {
        dispatch(fetchCart());
    }, [dispatch]);

    const items = cart?.items || [];
    
    // Calculate total on the fly based on basePrice * quantity
    const subtotal = items.reduce((acc, item) => acc + (item.product?.basePrice * item.quantity), 0);
    const shipping = subtotal > 5000 ? 0 : 250; // Premium logic: Free shipping over ₹5000
    const total = subtotal + shipping;

    const handleQtyChange = async (itemId, action) => {
        await dispatch(updateCartItemQty({ itemId, action })).unwrap();
    };

    const handleRemove = async (itemId) => {
        await dispatch(removeCartItem(itemId)).unwrap();
        toast.success('Item removed from cart');
    };

    if (loading && !cart) {
        return <div className="min-h-screen flex justify-center items-center font-bold text-gray-500">Loading your luxury cart...</div>;
    }

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl text-gray-400">🛍️</span>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-8">Discover our masterpiece collection and find something you love.</p>
                <button onClick={() => navigate('/')} className="px-8 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-all">
                    Explore Collection
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-10 tracking-tight">Shopping Bag</h1>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* LEFT: CART ITEMS */}
                    <div className="lg:w-2/3 space-y-6">
                        {items.map((item) => (
                            <div key={item._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow">
                                {/* Image */}
                                <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => navigate(`/product/${item.product.slug}`)}>
                                    <img src={item.product?.images?.[0]} alt={item.product?.name} className="w-full h-full object-cover" />
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 cursor-pointer hover:underline" onClick={() => navigate(`/product/${item.product.slug}`)}>
                                                {item.product?.name}
                                            </h3>
                                            <div className="text-sm text-gray-500 mt-1 space-y-1">
                                                <p><span className="font-medium text-gray-700">Size:</span> {item.selectedSize}</p>
                                                <p><span className="font-medium text-gray-700">Color:</span> {item.selectedColor}</p>
                                                {item.selectedAddons?.length > 0 && (
                                                    <p><span className="font-medium text-gray-700">Add-ons:</span> {item.selectedAddons.join(', ')}</p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xl font-extrabold text-black">₹{item.product?.basePrice}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between mt-6">
                                        <div className="flex items-center border border-gray-200 rounded-full bg-gray-50">
                                            <button onClick={() => handleQtyChange(item._id, 'decrease')} className="px-4 py-1 text-gray-600 hover:text-black font-bold focus:outline-none">−</button>
                                            <span className="px-4 text-sm font-bold w-12 text-center">{item.quantity}</span>
                                            <button onClick={() => handleQtyChange(item._id, 'increase')} className="px-4 py-1 text-gray-600 hover:text-black font-bold focus:outline-none">+</button>
                                        </div>
                                        <button onClick={() => handleRemove(item._id)} className="text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* RIGHT: ORDER SUMMARY */}
                    <div className="lg:w-1/3">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 lg:sticky lg:top-24">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
                            
                            <div className="space-y-4 text-sm text-gray-600 border-b border-gray-100 pb-6 mb-6">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-gray-900">₹{subtotal}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Estimated Shipping</span>
                                    <span className="font-bold text-gray-900">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-xl font-extrabold text-gray-900 mb-8">
                                <span>Total</span>
                                <span>₹{total}</span>
                            </div>

                            <button onClick={() => navigate('/checkout')} className="w-full py-4 bg-black text-white font-bold rounded-2xl hover:bg-gray-900 hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300">
                                Proceed to Checkout
                            </button>
                            
                            <p className="text-center text-xs text-gray-400 mt-4 font-medium flex justify-center items-center gap-1">
                                🔒 Secure encrypted checkout
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;