import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance, { setAccessToken } from '../services/axiosInstance'; // The Vault
import { verifyAuthStatus } from '../features/auth/authSlice'; // The Redux Brain

const Login = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    // 🎯 THE TELEPORTATION TARGET
    // Pata karo ki user kahan se aaya tha? Agar direct /login type kiya toh Home ('/') bhejenge.
    const from = location.state?.from?.pathname || '/';

    const onSubmit = async (data) => {
        try {
            // 1. API HIT: Backend ko credentials bhejo
            const response = await axiosInstance.post('/login', {
                email: data.email,
                password: data.password
            });

            // 2. THE VAULT LOCK: Token nikal kar In-Memory RAM mein save karo (100% Hack-Proof)
            const token = response.data.access_token;
            setAccessToken(token);

            // 3. THE REDUX AWAKENING: Backend se fresh profile (/me) mangwa kar state update karo
            // .unwrap() error ko catch block me bhej dega agar verify fail hua
            await dispatch(verifyAuthStatus()).unwrap();

            // 4. PREMIUM WELCOME
            toast.success('Welcome back to LuxeResin! 💎');

            // 5. TELEPORTATION: User ko wahi bhejo jahan wo jana chahta tha
            navigate(from, { replace: true });

        } catch (error) {
            // Hacker/Wrong password defense
            const errorMsg = error.response?.data?.message || 'Invalid email or password';
            toast.error(errorMsg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Toaster position="top-center" />

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Welcome Back
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">Sign in to your LuxeResin account.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* EMAIL FIELD */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            className={`mt-1 block w-full px-4 py-3 bg-gray-50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-colors`}
                            placeholder="munchun@example.com"
                            {...register('email', { required: 'Email is required' })}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    {/* PASSWORD FIELD */}
                    <div>
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <a href="#" className="text-xs font-semibold text-gray-600 hover:text-black">
                                Forgot password?
                            </a>
                        </div>
                        <input
                            type="password"
                            className={`mt-1 block w-full px-4 py-3 bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-colors`}
                            placeholder="••••••••"
                            {...register('password', { required: 'Password is required' })}
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-all"
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* REGISTER LINK */}
                <p className="mt-8 text-center text-sm text-gray-600">
                    New to LuxeResin?{' '}
                    <Link to="/register" className="font-bold text-black hover:underline">
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;