import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '../services/axiosInstance'; // Humara Hack-Proof Network

const Register = () => {
    const navigate = useNavigate();
    
    // FAANG Form Engine: useForm
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

    // Jab user "Create Account" par click karega
    const onSubmit = async (data) => {
        try {
            // API Hit: Backend ko data bhejo
            const response = await axiosInstance.post('/register', {
                name: data.name,
                email: data.email,
                password: data.password
            });

            // Success! Premium notification dikhao
            toast.success(response.data.message || 'Account created successfully! 🎉');
            
            // 2 second baad login page par bhej do
            setTimeout(() => navigate('/login'), 2000);

        } catch (error) {
            // Agar email already exists ya koi aur error aayi
            const errorMsg = error.response?.data?.message || 'Something went wrong';
            toast.error(errorMsg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            {/* Notification Container */}
            <Toaster position="top-center" reverseOrder={false} />

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        LuxeResin
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">Join to buy premium resin art.</p>
                </div>

                {/* handleSubmit humare onSubmit ko tabhi chalayega jab form mein koi error na ho */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    
                    {/* FULL NAME FIELD */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            className={`mt-1 block w-full px-4 py-3 bg-gray-50 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-colors`}
                            placeholder="Munchun Kumar"
                            {...register('name', { required: 'Name is required', minLength: { value: 3, message: 'Name must be at least 3 characters' } })}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    {/* EMAIL FIELD */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            className={`mt-1 block w-full px-4 py-3 bg-gray-50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-colors`}
                            placeholder="munchun@example.com"
                            {...register('email', { 
                                required: 'Email is required',
                                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
                            })}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    {/* PASSWORD FIELD */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            className={`mt-1 block w-full px-4 py-3 bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-colors`}
                            placeholder="••••••••"
                            {...register('password', { 
                                required: 'Password is required', 
                                minLength: { value: 6, message: 'Password must be at least 6 characters' }
                            })}
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={isSubmitting} // Agar API call chalu hai toh button block kar do
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-all"
                    >
                        {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                {/* LOGIN LINK */}
                <p className="mt-8 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-black hover:underline">
                        Sign in here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;