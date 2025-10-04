const express = require('express');
const Order = require('../models/Order.js');
const Restaurant = require('../models/Restaurant.js');
const Food = require('../models/Food.js');
const Payment = require('../models/Payment.js');
const { authRequired } = require('../middleware/auth.js');

const router = express.Router();
const { addOwnerSubscriber, removeOwnerSubscriber } = require('../utils/realtime.js');

// Normalize various order status variants to our canonical set
// Canonical: pending, confirmed, preparing, out_for_delivery, delivered, cancelled
function normalizeStatus(status) {
  const s = String(status || '').toLowerCase().replace(/\s+/g, '_');
  if (!s) return 'pending';
  if (s === 'outfordelivery' || s === 'out_for_delivery' || s === 'out-for-delivery' || s === 'out_for_delivery') return 'out_for_delivery';
  if (s === 'pickedup' || s === 'picked_up') return 'preparing';
  // Map common display variants
  if (s === 'delivered') return 'delivered';
  if (s === 'pending') return 'pending';
  if (s === 'confirmed') return 'confirmed';
  if (s === 'preparing') return 'preparing';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  return s;
}

// All routes require authentication
router.use(authRequired);
// SSE stream for real-time owner analytics
router.get('/stream', (req, res) => {
  // Allow token via query for SSE where headers are limited
  // If auth middleware already set req.user, use it; otherwise attempt manual decode is skipped for simplicity
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Restaurant owners only.' });
  }

  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const ownerId = req.user.id;
  addOwnerSubscriber(ownerId, res);

  // send a comment to keep connection alive
  res.write(': ok\n\n');

  req.on('close', () => {
    removeOwnerSubscriber(ownerId, res);
  });
});

// Helper function to get owner's restaurant IDs
const getOwnerRestaurantIds = async (userId) => {
  const restaurants = await Restaurant.find({ ownerId: userId }).select('_id');
  return restaurants.map(r => r._id);
};

// Helper function to get owner's food IDs
const getOwnerFoodIds = async (restaurantIds) => {
  if (restaurantIds.length === 0) return [];
  const foods = await Food.find({ restaurantId: { $in: restaurantIds } }).select('_id');
  return foods.map(f => f._id);
};

// GET daily order analysis
router.get('/daily-orders', async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Restaurant owners only.' });
    }

    const { date, period = 'today' } = req.query;
    const ownerId = req.user.id;
    
    // Get owner's restaurant and food IDs
    const restaurantIds = await getOwnerRestaurantIds(ownerId);
    const foodIds = await getOwnerFoodIds(restaurantIds);
    const restaurantIdStrings = restaurantIds.map(id => String(id));
    const foodIdStrings = foodIds.map(id => String(id));
    
    if (restaurantIdStrings.length === 0 && foodIdStrings.length === 0) {
      return res.json({
        totalOrders: 0,
        statusBreakdown: {
          pending: 0,
          confirmed: 0,
          preparing: 0,
          out_for_delivery: 0,
          delivered: 0,
          cancelled: 0
        },
        orderVolume: [],
        realTimeOrders: []
      });
    }

    // Calculate date range based on period
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      default:
        if (date) {
          startDate = new Date(date);
          endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 1);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        }
    }

    // Get orders for the period
    const orders = await Order.find({
      $and: [
        { createdAt: { $gte: startDate, $lt: endDate } },
        { deletedByOwner: { $ne: true } },
        { $or: [
          ...(foodIdStrings.length ? [{ 'items.foodId': { $in: foodIdStrings } }] : []),
          ...(restaurantIdStrings.length ? [{ restaurantId: { $in: restaurantIdStrings } }] : [])
        ]}
      ]
    }).populate('user', 'name email').populate('assignedTo', 'name email');

    // Calculate status breakdown
    const statusBreakdown = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      const status = order.orderStatus || 'pending';
      if (statusBreakdown.hasOwnProperty(status)) {
        statusBreakdown[status]++;
      }
    });

    // Calculate hourly distribution for today
    const hourlyDistribution = {};
    if (period === 'today' || period === 'yesterday') {
      for (let i = 0; i < 24; i++) {
        hourlyDistribution[i] = 0;
      }
      
      orders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hourlyDistribution[hour]++;
      });
    }

    // Get real-time orders (last 2 hours)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const realTimeOrders = await Order.find({
      $and: [
        { createdAt: { $gte: twoHoursAgo } },
        { deletedByOwner: { $ne: true } },
        { $or: [
          ...(foodIdStrings.length ? [{ 'items.foodId': { $in: foodIdStrings } }] : []),
          ...(restaurantIdStrings.length ? [{ restaurantId: { $in: restaurantIdStrings } }] : [])
        ]}
      ]
    }).populate('user', 'name email').populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      totalOrders: orders.length,
      statusBreakdown,
      hourlyDistribution,
      realTimeOrders: realTimeOrders.slice(0, 10), // Last 10 orders
      period,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('Error fetching daily orders:', error);
    res.status(500).json({ message: 'Error fetching daily orders', error: error.message });
  }
});

// GET financial performance
router.get('/financial-performance', async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Restaurant owners only.' });
    }

    const { period = 'today' } = req.query;
    const ownerId = req.user.id;
    
    // Get owner's restaurant and food IDs
    const restaurantIds = await getOwnerRestaurantIds(ownerId);
    const foodIds = await getOwnerFoodIds(restaurantIds);
    const restaurantIdStrings = restaurantIds.map(id => String(id));
    const foodIdStrings = foodIds.map(id => String(id));
    
    if (restaurantIdStrings.length === 0 && foodIdStrings.length === 0) {
      return res.json({
        dailyRevenue: 0,
        revenueGainLoss: 0,
        orderValueStats: {
          average: 0,
          highest: 0,
          lowest: 0
        },
        paymentMethodBreakdown: {},
        profitMargins: 0
      });
    }

    // Calculate date range
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    // Get orders for the period (all statuses), filter delivered in JS using normalizeStatus
    const periodOrders = await Order.find({
      $and: [
        { createdAt: { $gte: startDate, $lt: endDate } },
        { deletedByOwner: { $ne: true } },
        { $or: [
          ...(foodIdStrings.length ? [{ 'items.foodId': { $in: foodIdStrings } }] : []),
          ...(restaurantIdStrings.length ? [{ restaurantId: { $in: restaurantIdStrings } }] : [])
        ]}
      ]
    });
    const completedOrders = periodOrders.filter(o => normalizeStatus(o.orderStatus) === 'delivered');

    // Calculate daily revenue
    const dailyRevenue = completedOrders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);

    // Calculate previous period revenue for comparison
    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const previousPeriodEnd = startDate;
    
    const previousPeriodOrders = await Order.find({
      $and: [
        { createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } },
        { deletedByOwner: { $ne: true } },
        { $or: [
          ...(foodIdStrings.length ? [{ 'items.foodId': { $in: foodIdStrings } }] : []),
          ...(restaurantIdStrings.length ? [{ restaurantId: { $in: restaurantIdStrings } }] : [])
        ]}
      ]
    });
    const previousOrders = previousPeriodOrders.filter(o => normalizeStatus(o.orderStatus) === 'delivered');

    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);
    const revenueGainLoss = dailyRevenue - previousRevenue;

    // Calculate order value statistics
    const orderValues = completedOrders.map(order => order.finalAmount || order.totalAmount || 0);
    const orderValueStats = {
      average: orderValues.length > 0 ? orderValues.reduce((sum, val) => sum + val, 0) / orderValues.length : 0,
      highest: orderValues.length > 0 ? Math.max(...orderValues) : 0,
      lowest: orderValues.length > 0 ? Math.min(...orderValues) : 0
    };

    // Payment method breakdown
    const paymentMethodBreakdown = {};
    completedOrders.forEach(order => {
      const method = order.paymentMethod || 'cod';
      paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + 1;
    });

    // Calculate profit margins (assuming 30% margin for demo)
    const profitMargins = dailyRevenue * 0.3;

    res.json({
      dailyRevenue,
      revenueGainLoss,
      orderValueStats,
      paymentMethodBreakdown,
      profitMargins,
      totalOrders: completedOrders.length,
      period,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('Error fetching financial performance:', error);
    res.status(500).json({ message: 'Error fetching financial performance', error: error.message });
  }
});

// GET time-based analytics
router.get('/time-analytics', async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Restaurant owners only.' });
    }

    const { type = 'hourly' } = req.query;
    const ownerId = req.user.id;
    
    // Get owner's restaurant and food IDs
    const restaurantIds = await getOwnerRestaurantIds(ownerId);
    const foodIds = await getOwnerFoodIds(restaurantIds);
    const restaurantIdStrings = restaurantIds.map(id => String(id));
    const foodIdStrings = foodIds.map(id => String(id));
    
    if (restaurantIds.length === 0 && foodIds.length === 0) {
      return res.json({
        hourlyDistribution: {},
        dailyComparison: [],
        weeklyTrends: [],
        monthlyTrends: [],
        seasonalInsights: {}
      });
    }

    const now = new Date();
    let analytics = {};

    if (type === 'hourly') {
      // Hourly distribution for today
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      
      const todayOrders = await Order.find({
        $and: [
          { createdAt: { $gte: todayStart, $lt: todayEnd } },
          { deletedByOwner: { $ne: true } },
          { $or: [
            ...(foodIdStrings.length ? [{ 'items.foodId': { $in: foodIdStrings } }] : []),
            ...(restaurantIdStrings.length ? [{ restaurantId: { $in: restaurantIdStrings } }] : [])
          ]}
        ]
      });

      const hourlyDistribution = {};
      for (let i = 0; i < 24; i++) {
        hourlyDistribution[i] = 0;
      }
      
      todayOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hourlyDistribution[hour]++;
      });

      analytics.hourlyDistribution = hourlyDistribution;
    }

    if (type === 'daily' || type === 'all') {
      // Day-to-day comparison for last 7 days
      const dailyComparison = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        
        const dayOrders = await Order.find({
          $and: [
            { createdAt: { $gte: dayStart, $lt: dayEnd } },
            { deletedByOwner: { $ne: true } },
            { $or: [
              ...(foodIdStrings.length ? [{ 'items.foodId': { $in: foodIdStrings } }] : []),
              ...(restaurantIdStrings.length ? [{ restaurantId: { $in: restaurantIdStrings } }] : [])
            ]}
          ]
        });

        const revenue = dayOrders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);
        
        dailyComparison.push({
          date: dayStart.toISOString().split('T')[0],
          orders: dayOrders.length,
          revenue: revenue
        });
      }

      analytics.dailyComparison = dailyComparison;
    }

    if (type === 'weekly' || type === 'all') {
      // Weekly trends for last 8 weeks
      const weeklyTrends = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const weekOrders = await Order.find({
          $and: [
            { createdAt: { $gte: weekStart, $lt: weekEnd } },
            { deletedByOwner: { $ne: true } },
            { $or: [
              ...(foodIdStrings.length ? [{ 'items.foodId': { $in: foodIdStrings } }] : []),
              ...(restaurantIdStrings.length ? [{ restaurantId: { $in: restaurantIdStrings } }] : [])
            ]}
          ]
        });

        const revenue = weekOrders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);
        
        weeklyTrends.push({
          week: `Week ${8 - i}`,
          startDate: weekStart.toISOString().split('T')[0],
          orders: weekOrders.length,
          revenue: revenue
        });
      }

      analytics.weeklyTrends = weeklyTrends;
    }

    if (type === 'monthly' || type === 'all') {
      // Monthly trends for last 6 months
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthOrders = await Order.find({
          $and: [
            { createdAt: { $gte: monthStart, $lt: monthEnd } },
            { deletedByOwner: { $ne: true } },
            { $or: [
              ...(foodIdStrings.length ? [{ 'items.foodId': { $in: foodIdStrings } }] : []),
              ...(restaurantIdStrings.length ? [{ restaurantId: { $in: restaurantIdStrings } }] : [])
            ]}
          ]
        });

        const revenue = monthOrders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);
        
        monthlyTrends.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          orders: monthOrders.length,
          revenue: revenue
        });
      }

      analytics.monthlyTrends = monthlyTrends;
    }

    // Seasonal insights (basic implementation)
    const seasonalInsights = {
      peakHours: [],
      peakDays: [],
      recommendations: []
    };

    // Find peak hours
    if (analytics.hourlyDistribution) {
      const sortedHours = Object.entries(analytics.hourlyDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      seasonalInsights.peakHours = sortedHours.map(([hour, count]) => ({
        hour: `${hour}:00`,
        orders: count
      }));
    }

    res.json(analytics);

  } catch (error) {
    console.error('Error fetching time analytics:', error);
    res.status(500).json({ message: 'Error fetching time analytics', error: error.message });
  }
});

// GET comprehensive dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Restaurant owners only.' });
    }

    const ownerId = req.user.id;
    
    // Get owner's restaurant and food IDs
    const restaurantIds = await getOwnerRestaurantIds(ownerId);
    const foodIds = await getOwnerFoodIds(restaurantIds);
    
    // Note: do not early-return when there are no foods.
    // We still want to show restaurant count even if there are 0 foods.

    // Get summary statistics
    const totalRestaurants = restaurantIds.length;
    const totalFoodItems = foodIds.length;
    
    const restaurantIdStrings2 = restaurantIds.map(id => String(id));
    const foodIdStrings2 = foodIds.map(id => String(id));
    const allOrders = await Order.find({
      $and: [
        { deletedByOwner: { $ne: true } },
        { $or: [
          ...(foodIdStrings2.length ? [{ 'items.foodId': { $in: foodIdStrings2 } }] : []),
          ...(restaurantIdStrings2.length ? [{ restaurantId: { $in: restaurantIdStrings2 } }] : [])
        ]}
      ]
    });

    const totalOrders = allOrders.length;
    const totalRevenue = allOrders
      .filter(order => order.orderStatus === 'delivered')
      .reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);

    // Get recent orders (last 10)
    const recentOrders = await Order.find({
      $and: [
        { deletedByOwner: { $ne: true } },
        { $or: [
          ...(foodIdStrings2.length ? [{ 'items.foodId': { $in: foodIdStrings2 } }] : []),
          ...(restaurantIdStrings2.length ? [{ restaurantId: { $in: restaurantIdStrings2 } }] : [])
        ]}
      ]
    })
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get top food items by order frequency
    const foodOrderCounts = {};
    allOrders.forEach(order => {
      order.items.forEach(item => {
        const foodId = String(item.foodId);
        if (foodIds.some(id => String(id) === foodId)) {
          foodOrderCounts[foodId] = (foodOrderCounts[foodId] || 0) + item.quantity;
        }
      });
    });

    const topFoodItems = Object.entries(foodOrderCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([foodId, count]) => {
        const food = allOrders
          .flatMap(order => order.items)
          .find(item => String(item.foodId) === foodId);
        return {
          foodId,
          name: food?.name || 'Unknown',
          orderCount: count
        };
      });

    // Order status breakdown
    const orderStatusBreakdown = {};
    allOrders.forEach(order => {
      const status = order.orderStatus || 'pending';
      orderStatusBreakdown[status] = (orderStatusBreakdown[status] || 0) + 1;
    });

    // Revenue trend for last 7 days
    const now = new Date();
    const revenueTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const dayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dayStart && orderDate < dayEnd && order.orderStatus === 'delivered';
      });

      const revenue = dayOrders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);
      
      revenueTrend.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: revenue
      });
    }

    res.json({
      summary: {
        totalRestaurants,
        totalFoodItems,
        totalOrders,
        totalRevenue
      },
      recentOrders,
      topFoodItems,
      orderStatusBreakdown,
      revenueTrend
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

module.exports = router;
