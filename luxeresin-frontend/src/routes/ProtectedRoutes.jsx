import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
    const location = useLocation();

    // Nested auth payload safe extraction
    const userData = user?.user || user?.data || user;
    const userRole = userData?.role ? String(userData.role).toLowerCase() : null;

    // 1. THE ANTI-FLICKER SHIELD
    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#050505]">
                <div className="text-xl font-black tracking-[0.35em] animate-pulse text-[#D4AF37]">
                    LUXERESIN...
                </div>
            </div>
        );
    }

    // 2. THE LOGIN KICKOUT
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. THE ROLE-BASED BOUNCER (Admin vs Customer)
    if (allowedRoles && allowedRoles.length > 0) {
        const normalizedAllowedRoles = allowedRoles.map((role) =>
            String(role).toLowerCase()
        );
        if (!userRole || !normalizedAllowedRoles.includes(userRole)) {
            return <Navigate to="/" replace />;
        }
    }

    // 4. WELCOME INSIDE (Outlet)
    return <Outlet />;
};

export default ProtectedRoute;