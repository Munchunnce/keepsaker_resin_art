import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-[#030303] text-gray-400 border-t border-white/5 relative overflow-hidden pt-20 pb-12">
            {/* Ambient Gold Glow Background */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-to-t from-[#D4AF37]/10 to-transparent blur-[120px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-white/5">
                    
                    {/* Brand Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] tracking-tight">
                            RESIN VAULT
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-sm font-medium">
                            Forging timeless masterpieces in obsidian and gold. Each artifact is uniquely handcrafted to elevate elite living spaces with uncompromising luxury.
                        </p>
                        <div className="flex items-center gap-4 text-xs font-black tracking-widest text-gray-500 uppercase">
                            <span>✦ Handcrafted</span>
                            <span>•</span>
                            <span>✦ Obsidian & Gold</span>
                            <span>•</span>
                            <span>✦ Certified</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Navigation</h4>
                        <ul className="space-y-3 text-xs font-bold">
                            <li><Link to="/" className="hover:text-[#D4AF37] transition-colors">Home Vault</Link></li>
                            <li><Link to="/cart" className="hover:text-[#D4AF37] transition-colors">Shopping Bag</Link></li>
                            <li><Link to="/my-orders" className="hover:text-[#D4AF37] transition-colors">My Acquisitions</Link></li>
                        </ul>
                    </div>

                    {/* Collections */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Collections</h4>
                        <ul className="space-y-3 text-xs font-bold text-gray-400">
                            <li className="hover:text-[#D4AF37] transition-colors cursor-pointer">Spiritual Geodes</li>
                            <li className="hover:text-[#D4AF37] transition-colors cursor-pointer">Ocean Wave Clocks</li>
                            <li className="hover:text-[#D4AF37] transition-colors cursor-pointer">Custom Furniture</li>
                            <li className="hover:text-[#D4AF37] transition-colors cursor-pointer">Royal Frames</li>
                        </ul>
                    </div>

                    {/* Newsletter / Concierge */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">VIP Concierge</h4>
                        <p className="text-xs text-gray-400 font-medium">Subscribe for private releases and bespoke resin art invitations.</p>
                        <div className="flex flex-col gap-2">
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                className="bg-[#0a0a0a] border border-white/10 px-4 py-2.5 rounded-sm text-white text-xs focus:outline-none focus:border-[#D4AF37]/50 placeholder-gray-700 font-bold"
                            />
                            <button className="py-2.5 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-sm hover:scale-[1.02] transition-transform cursor-pointer">
                                Join Private List
                            </button>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 font-bold tracking-wider">
                    <p>© {new Date().getFullYear()} Resin Vault. All Rights Reserved.</p>
                    <p className="mt-4 sm:mt-0 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/80">Forged with Obsidian & Gold Aesthetic</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;