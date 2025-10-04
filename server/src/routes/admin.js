const express = require('express');
const Order = require('../models/Order.js');
const DeliveryPerson = require('../models/DeliveryPerson.js');
const User = require('../models/User.js');
const Restaurant = require('../models/Restaurant.js');
const Food = require('../models/Food.js');
const jwt = require('jsonwebtoken');
const { authRequired, requireRole } = require('../middleware/auth.js');
const { addAdminSubscriber, removeAdminSubscriber, publishToAdmins } = require('../utils/realtime.js');

const router = express.Router();

// --- Admin SSE stream (before auth middleware to allow token via query) ---
router.get('/stream', (req, res) => {
  try {
    // Support token via query for EventSource
    let token = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
    if (!token && req.query && req.query.token) token = String(req.query.token);

    if (!token) return res.status(401).json({ message: 'Missing token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    addAdminSubscriber(res);
    res.write(':ok\n\n');

    req.on('close', () => {
      removeAdminSubscriber(res);
    });
  } catch (e) {
    res.status(500).json({ message: 'Error establishing stream', error: e.message });
  }
});

// Admin auth
router.use(authRequired, requireRole('admin'));

// GET all orders with populated refs
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email contactNumber')
      .populate('restaurantId', 'name address')
      .populate('assignedTo', 'name email');
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ message: 'Error fetching orders', error: e.message });
  }
});

// PATCH order status (override)
router.patch('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'status is required' });

    let order = await Order.findOne({ orderId });
    if (!order && /^[a-f\d]{24}$/i.test(orderId)) order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStatus = status;
    await order.save();
    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ message: 'Error updating status', error: e.message });
  }
});

// PATCH assign driver
router.patch('/orders/:orderId/assign', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ message: 'assignedTo is required' });

    let order = await Order.findOne({ orderId });
    if (!order && /^[a-f\d]{24}$/i.test(orderId)) order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.assignedTo = assignedTo;
    if (order.orderStatus === 'pending') order.orderStatus = 'confirmed';
    await order.save();

    res.json({ success: true, order });
  } catch (e) {
    res.status(500).json({ message: 'Error assigning driver', error: e.message });
  }
});

// GET drivers list (basic)
router.get('/drivers', async (req, res) => {
  try {
    const drivers = await DeliveryPerson.find({})
      .populate('userId', 'name email role')
      .lean();
    res.json({ success: true, drivers });
  } catch (e) {
    res.status(500).json({ message: 'Error fetching drivers', error: e.message });
  }
});

module.exports = router;

// ----- Stats -----
router.get('/stats', async (req, res) => {
  try {
    const [users, restaurants, foods, orders, deliveryPersons, ordersByStatus] = await Promise.all([
      User.countDocuments({}),
      Restaurant.countDocuments({}),
      Food.countDocuments({}),
      Order.countDocuments({}),
      DeliveryPerson.countDocuments({}),
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      totals: {
        users,
        restaurants,
        foods,
        orders,
        deliveryPersons
      },
      ordersByStatus: ordersByStatus.reduce((acc, cur) => { acc[cur._id || 'unknown'] = cur.count; return acc; }, {})
    });
  } catch (e) {
    res.status(500).json({ message: 'Error fetching stats', error: e.message });
  }
});

// Restaurants with counts
router.get('/restaurants/with-counts', async (req, res) => {
  try {
    const [restaurants, foodCounts, orderCounts, revenueByRest] = await Promise.all([
      Restaurant.find({}).lean(),
      Food.aggregate([{ $group: { _id: '$restaurantId', count: { $sum: 1 } } }]),
      Order.aggregate([{ $group: { _id: '$restaurantId', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { orderStatus: 'delivered' } },
        { $group: { _id: '$restaurantId', revenue: { $sum: { $ifNull: ['$finalAmount', 0] } } } }
      ])
    ]);

    const foodMap = new Map(foodCounts.map(x => [String(x._id), x.count]));
    const orderMap = new Map(orderCounts.map(x => [String(x._id), x.count]));
    const revenueMap = new Map(revenueByRest.map(x => [String(x._id), x.revenue]));

    const items = restaurants.map(r => ({
      _id: String(r._id),
      name: r.name,
      address: r.address,
      cuisine: r.cuisine,
      isOpen: r.isOpen,
      isActive: r.isActive,
      foodCount: foodMap.get(String(r._id)) || 0,
      orderCount: orderMap.get(String(r._id)) || 0,
      revenue: revenueMap.get(String(r._id)) || 0
    }));

    res.json({ success: true, items });
  } catch (e) {
    res.status(500).json({ message: 'Error fetching restaurant counts', error: e.message });
  }
});

// Per-restaurant revenue list
router.get('/restaurants/revenue', async (req, res) => {
  try {
    const revenue = await Order.aggregate([
      { $match: { orderStatus: 'delivered' } },
      { $group: { _id: '$restaurantId', revenue: { $sum: { $ifNull: ['$finalAmount', 0] } }, orders: { $sum: 1 } } },
    ]);
    const ids = revenue.map(r => r._id).filter(Boolean);
    const restaurants = await Restaurant.find({ _id: { $in: ids } }).select('name').lean();
    const nameMap = new Map(restaurants.map(r => [String(r._id), r.name]));
    res.json({ success: true, items: revenue.map(r => ({
      restaurantId: String(r._id),
      name: nameMap.get(String(r._id)) || 'Unknown',
      revenue: r.revenue || 0,
      orders: r.orders || 0,
    })) });
  } catch (e) {
    res.status(500).json({ message: 'Error fetching revenue', error: e.message });
  }
});

// Single restaurant summary
router.get('/restaurants/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const rest = await Restaurant.findById(id).select('name address').lean();
    if (!rest) return res.status(404).json({ message: 'Restaurant not found' });

    const [ordersCount, deliveredAgg, byStatus] = await Promise.all([
      Order.countDocuments({ restaurantId: id }),
      Order.aggregate([
        { $match: { restaurantId: rest._id, orderStatus: 'delivered' } },
        { $group: { _id: null, revenue: { $sum: { $ifNull: ['$finalAmount', 0] } } } }
      ]),
      Order.aggregate([
        { $match: { restaurantId: rest._id } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ])
    ]);

    const ordersByStatus = byStatus.reduce((acc, cur) => { acc[cur._id || 'unknown'] = cur.count; return acc; }, {});
    const revenue = (deliveredAgg[0]?.revenue) || 0;

    res.json({ success: true, restaurant: { id: String(rest._id), name: rest.name, address: rest.address }, ordersCount, revenue, ordersByStatus });
  } catch (e) {
    res.status(500).json({ message: 'Error fetching restaurant summary', error: e.message });
  }
});

// Orders for a specific restaurant
router.get('/restaurants/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const orders = await Order.find({ restaurantId: id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ message: 'Error fetching restaurant orders', error: e.message });
  }
});

// ---- Customers (admin) ----
// List customers with order counts and revenue
router.get('/customers/with-counts', async (req, res) => {
  try {
    const [users, agg] = await Promise.all([
      User.find({ role: 'user' }).select('_id name email').lean(),
      Order.aggregate([
        { $group: { _id: '$user', orders: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$finalAmount', 0] } } } }
      ])
    ]);
    const statsMap = new Map(agg.map(x => [String(x._id), { orders: x.orders || 0, revenue: x.revenue || 0 }]));
    const items = users.map(u => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      orders: statsMap.get(String(u._id))?.orders || 0,
      revenue: statsMap.get(String(u._id))?.revenue || 0,
    }));
    res.json({ success: true, items });
  } catch (e) {
    res.status(500).json({ message: 'Error fetching customers', error: e.message });
  }
});

// Orders for a specific customer
router.get('/customers/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '100', 10) || 100, 500);
    const orders = await Order.find({ user: id })
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ message: 'Error fetching customer orders', error: e.message });
  }
});

// (stream route already defined above)
