import { Order, Product, User } from '../../models/index.js';
import CustomErrorHandler from '../../services/CustomErrorHandler.js';

const dashboardController = {
    // 1. MASTER DASHBOARD STATS
    async getDashboardStats(req, res, next) {
        try {
            // 1. Date Range Setup (Is mahine ka data nikalne ke liye)
            const today = new Date();
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            // 2. FAANG-Level Parallel Execution (Promise.all)
            // Saare complex queries ek sath fire karenge taaki API super fast ho!
            const [
                totalUsers,
                totalProducts,
                orderStats,
                monthlyRevenue,
                statusCounts,
                recentOrders
            ] = await Promise.all([
                // A: Kitne Customers hain?
                User.countDocuments({ role: 'Customer' }),
                
                // B: Kitne Products hain?
                Product.countDocuments(),

                // C: TOTAL REVENUE & ORDERS (The Aggregation Magic)
                Order.aggregate([
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: "$finalTotal" },
                            totalOrders: { $sum: 1 }
                        }
                    }
                ]),

                // D: THIS MONTH'S REVENUE (Sirf current mahine ki kamayi)
                Order.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: firstDayOfMonth }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            monthlyRevenue: { $sum: "$finalTotal" }
                        }
                    }
                ]),

                // E: ORDER STATUS SUMMARY (Kitne Placed, Kitne Delivered)
                Order.aggregate([
                    {
                        $group: {
                            _id: "$orderStatus",
                            count: { $sum: 1 }
                        }
                    }
                ]),

                // F: RECENT 5 ORDERS (Dashboard par quick view ke liye)
                Order.find()
                    .populate('user', 'name email')
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('orderStatus finalTotal createdAt')
            ]);

            // 📊 3. Data Formatting (Gande arrays ko sundar JSON banana)
            const stats = {
                totalCustomers: totalUsers,
                totalProducts: totalProducts,
                lifetimeRevenue: orderStats.length > 0 ? orderStats[0].totalRevenue : 0,
                totalOrdersPlaced: orderStats.length > 0 ? orderStats[0].totalOrders : 0,
                thisMonthRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].monthlyRevenue : 0,
                
                // Array ko object mein badalna (e.g., { PLACED: 5, DELIVERED: 10 })
                orderStatusBreakdown: statusCounts.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),

                recentOrders
            };

            return res.status(200).json({
                success: true,
                message: 'Master Dashboard Data fetched successfully!',
                data: stats
            });

        } catch (err) {
            return next(err);
        }
    }
};

export default dashboardController;