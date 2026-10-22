const About = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* HEADER SECTION */}
        <div className="text-center space-y-4">
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Our Legacy & Philosophy</p>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] tracking-tight">
            The Art of Resin Vault
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Where raw elements transform into timeless luxury. Forged in obsidian black and radiant gold, every artifact tells a story of unmatched craftsmanship.
          </p>
        </div>

        {/* HERO IMAGE BANNER */}
        <div className="relative h-96 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop" 
            alt="Resin Art Workshop" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
        </div>

        {/* CORE PILLARS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl shadow-xl space-y-3">
            <span className="text-2xl">✦</span>
            <h3 className="text-lg font-bold text-white tracking-wide">Uncompromising Craft</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              Every single piece is meticulously poured, cured, and polished by master artisans over weeks of precise work.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl shadow-xl space-y-3">
            <span className="text-2xl">✦</span>
            <h3 className="text-lg font-bold text-white tracking-wide">Obsidian & Gold Aesthetic</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              Inspired by the contrast of dark midnight obsidian and shimmering liquid gold, bringing elite sophistication to your space.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl shadow-xl space-y-3">
            <span className="text-2xl">✦</span>
            <h3 className="text-lg font-bold text-white tracking-wide">Bespoke Exclusivity</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              No two resin masterpieces are identical. Your acquisition is a 1-of-1 creation crafted exclusively for your collection.
            </p>
          </div>
        </div>

        {/* FOUNDER NOTE / VISION */}
        <div className="bg-[#0a0a0a] border border-white/5 p-10 md:p-14 rounded-2xl shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728]"></div>
          <h3 className="text-2xl font-black text-white tracking-tight">Crafted for the Elite</h3>
          <p className="text-sm text-gray-400 max-w-xl mx-auto leading-relaxed font-medium">
            "Resin Vault was born out of a passion to bridge the gap between contemporary interior design and classical fine art. We don't just make decor; we forge conversation pieces."
          </p>
          <div className="pt-2">
            <span className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.2em]">— Founder, Resin Vault</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;