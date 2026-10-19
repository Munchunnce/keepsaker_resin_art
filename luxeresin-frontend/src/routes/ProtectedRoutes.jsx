import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ allowedRoles }) => {
    // Redux store (Brain) se current state padh rahe hain
    const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
    
    // User kahan jana chahta tha? (Uski location track kar rahe hain)
    const location = useLocation();

    // 1. THE ANTI-FLICKER SHIELD
    if (loading) {
        // Yahan par hum ek khoobsurat 'Skeleton Loader' ya 'LuxeResin Logo Pulse' dikhayenge
        // Jab tak API se token verify nahi ho jata, user ko yahin rok kar rakhenge
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="text-xl font-bold tracking-widest animate-pulse text-gray-400">
                    LUXERESIN...
                </div>
            </div>
        );
    }

    // 2. THE LOGIN KICKOUT
    if (!isAuthenticated) {
        // Agar user login nahi hai, toh seedha Login page par bhejo.
        // Par 'state={{ from: location }}' mein uski purani location save kar lo.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. THE ROLE-BASED BOUNCER (Admin vs Customer)
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // Agar user login hai, par uski aukaat (role) nahi hai us page ki (e.g. Admin Page)
        return <Navigate to="/" replace />;
    }

    // 4. WELCOME INSIDE (Outlet)
    // Agar sab theek hai, toh usko andar aane do! (Nested components render honge)
    return <Outlet />;
};

export default ProtectedRoute;