import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const AdminLayout = () => {
    const navigate = useNavigate();

    const menuItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
        { name: 'Live Orders', path: '/admin/orders', icon: '⚡' },
        { name: 'Product Vault', path: '/admin/products', icon: '💎' },
        { name: 'Bespoke Requests', path: '/admin/custom-requests', icon: '🎨' },
        { name: 'Coupons Forge', path: '/admin/coupons', icon: '🎟️' },
    ];

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
            
            {/* LEFT SIDEBAR - Obsidian Glassmorphism */}
            <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col justify-between">
                <div>
                    {/* Brand Logo Area */}
                    <div className="h-20 flex items-center justify-center border-b border-white/5">
                        <h1 className="text-xl font-black tracking-[0.2em] uppercase bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-transparent bg-clip-text">
                            Resin Admin
                        </h1>
                    </div>

                    {/* Navigation Links */}
                    <nav className="p-4 space-y-2 mt-4">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-bold tracking-wider uppercase transition-all duration-300 ${
                                        isActive 
                                        ? 'bg-[#1a1a1a] text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }`
                                }
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Bottom Action */}
                <div className="p-4 border-t border-white/5">
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold tracking-widest text-gray-400 uppercase hover:text-white transition-colors"
                    >
                        <span>←</span> Exit to Store
                    </button>
                </div>
            </aside>

            {/* RIGHT MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto bg-[#050505] relative">
                {/* Subtle Background Glow */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37] opacity-[0.02] blur-[120px] pointer-events-none"></div>
                
                <div className="p-8 md:p-12 relative z-10">
                    <Outlet /> {/* Yahan aapke Dashboard, Orders aur Products render honge */}
                </div>
            </main>
            
        </div>
    );
};

export default AdminLayout;