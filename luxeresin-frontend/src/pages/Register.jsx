import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '../services/axiosInstance'; 

const Register = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

    const onSubmit = async (data) => {
        try {
            const response = await axiosInstance.post('/register', {
                name: data.name,
                email: data.email,
                password: data.password
            });

            toast.success(response.data.message || 'Identity forged successfully! 💎');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Something went wrong in the vault.';
            toast.error(errorMsg);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden group perspective-1000">
            
            <Toaster 
                position="top-center" 
                toastOptions={{ 
                    style: { background: '#121212', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(212,175,55,0.2)' } 
                }} 
            />

            {/* 🚀 FULL SCREEN HD ANIMATED BACKGROUND WITH 3D HOVER */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                <img 
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=100&w=2560&auto=format&fit=crop" 
                    alt="Luxury HD Resin Art" 
                    className="w-full h-full object-cover scale-110 opacity-85 contrast-125 saturate-[1.2] transition-all duration-[15000ms] ease-out group-hover:scale-125 group-hover:rotate-2 animate-[pulse_8s_ease-in-out_infinite]"
                />
                
                {/* 🚀 LIGHTER OVERLAYS: Image ko bright rakhne ke liye opacity kam ki hai */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/20 to-[#050505]/80 transition-opacity duration-1000 group-hover:opacity-80"></div>
                <div className="absolute inset-0 bg-[#D4AF37]/10 mix-blend-overlay pointer-events-none animate-pulse"></div>
            </div>

            {/* 🚀 3D FLOATING CENTERED FORM */}
            <div className="relative z-10 w-full max-w-md bg-[#0a0a0a]/60 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 hover:border-[#D4AF37]/50 hover:shadow-[0_20px_80px_rgba(212,175,55,0.3)] transition-all duration-500 transform-gpu hover:-translate-y-3 hover:scale-[1.02] p-8 sm:p-10">
                
                {/* BACK GLOW EFFECT */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] rounded-2xl blur-xl opacity-0 hover:opacity-20 transition-opacity duration-700 pointer-events-none -z-10"></div>

                {/* HEADER */}
                <div className="text-center mb-10 space-y-3 relative z-20">
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] group-hover:tracking-[0.6em] transition-all duration-700 drop-shadow-md">Exclusive Access</p>
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] tracking-tight pb-1 drop-shadow-[0_5px_15px_rgba(212,175,55,0.4)]">
                        The Resin Vault
                    </h2>
                    <p className="text-xs text-gray-200 font-medium tracking-wide drop-shadow-sm">
                        Forge your identity to acquire masterpieces.
                    </p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-20">
                    
                    <div className="group/input relative">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-2 group-focus-within/input:text-[#D4AF37] transition-colors drop-shadow-md">
                            Full Name
                        </label>
                        <input
                            type="text"
                            className={`w-full px-4 py-3 bg-[#050505]/80 border ${errors.name ? 'border-red-500/80' : 'border-white/10'} rounded-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] hover:border-white/30 transition-all shadow-inner text-sm font-bold`}
                            placeholder="Munchun Kumar"
                            {...register('name', { required: 'Name is required', minLength: { value: 3, message: 'Minimum 3 characters required' } })}
                        />
                        {errors.name && <p className="text-red-400 text-[10px] mt-1.5 font-bold uppercase tracking-wide drop-shadow-md">{errors.name.message}</p>}
                    </div>

                    <div className="group/input relative">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-2 group-focus-within/input:text-[#D4AF37] transition-colors drop-shadow-md">
                            Email Address
                        </label>
                        <input
                            type="email"
                            className={`w-full px-4 py-3 bg-[#050505]/80 border ${errors.email ? 'border-red-500/80' : 'border-white/10'} rounded-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] hover:border-white/30 transition-all shadow-inner text-sm font-bold`}
                            placeholder="munchun@example.com"
                            {...register('email', { 
                                required: 'Email is required',
                                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
                            })}
                        />
                        {errors.email && <p className="text-red-400 text-[10px] mt-1.5 font-bold uppercase tracking-wide drop-shadow-md">{errors.email.message}</p>}
                    </div>

                    <div className="group/input relative">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-2 group-focus-within/input:text-[#D4AF37] transition-colors drop-shadow-md">
                            Password
                        </label>
                        <input
                            type="password"
                            className={`w-full px-4 py-3 bg-[#050505]/80 border ${errors.password ? 'border-red-500/80' : 'border-white/10'} rounded-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] hover:border-white/30 transition-all shadow-inner text-sm font-bold`}
                            placeholder="••••••••"
                            {...register('password', { 
                                required: 'Password is required', 
                                minLength: { value: 6, message: 'Minimum 6 characters required' }
                            })}
                        />
                        {errors.password && <p className="text-red-400 text-[10px] mt-1.5 font-bold uppercase tracking-wide drop-shadow-md">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full relative overflow-hidden group/btn flex justify-center py-4 px-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black text-xs font-black uppercase tracking-widest rounded-sm focus:outline-none disabled:opacity-50 transition-all duration-500 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_rgba(212,175,55,0.8)] mt-8 cursor-pointer transform-gpu hover:scale-105"
                    >
                        {/* Shimmer Effect on Button */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                        <span className="relative z-10">{isSubmitting ? 'Forging Profile...' : 'Create Account'}</span>
                    </button>
                </form>

                {/* LOGIN LINK */}
                <div className="mt-8 text-center border-t border-white/10 pt-6 relative z-20">
                    <p className="text-xs text-gray-300 font-medium drop-shadow-sm">
                        Already hold a account?{' '}
                        <Link to="/login" className="text-[#D4AF37] font-black hover:text-[#FCF6BA] hover:underline transition-colors tracking-widest drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;