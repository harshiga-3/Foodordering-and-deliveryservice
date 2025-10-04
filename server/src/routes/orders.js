const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Order = require('../models/Order.js');
const Restaurant = require('../models/Restaurant.js');
const Food = require('../models/Food.js');
// const Payment = require('../models/Payment.js'); // Payment integration disabled
const { authRequired } = require('../middleware/auth.js');
// const Razorpay = require('razorpay'); // Payment integration disabled

const router = express.Router();
const { publishToOwner, publishToAdmins } = require('../utils/realtime.js');
const DeliveryPerson = require('../models/DeliveryPerson.js');
const { findBestDeliveryPartner } = require('../services/assignmentService');
const { buildAddress, geocodeAddress, defaultCityCoords } = require('../utils/geocode.js');

// Initialize Razorpay (disabled)
// let razorpay;
// try {
//   if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
//     razorpay = new Razorpay({
//       key_id: process.env.RAZORPAY_KEY_ID,
//       key_secret: process.env.RAZORPAY_KEY_SECRET,
//     });
//   }
// } catch (error) {
//   console.warn('Razorpay not initialized - missing environment variables');
// }

// All routes require authentication
router.use(authRequired);

// Internal handler so we can expose multiple route paths ("/" and "/create")
const handleCreateOrder = async (req, res) => {
  try {
    const { items, userDetails, deliveryAddress, specialInstructions } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }
    
    if (!userDetails || !userDetails.name || !userDetails.address || !userDetails.contactNumber) {
      return res.status(400).json({ message: 'User details (name, address, contact) are required' });
    }
    
    // Calculate totals (support number or formatted string)
    const parsePrice = (value) => {
      if (typeof value === 'number') return value;
      if (value == null) return 0;
      const str = String(value).trim();
      const cleaned = str.replace(/₹/g, '').replace(/,/g, '');
      const num = parseFloat(cleaned);
      return Number.isFinite(num) ? num : 0;
    };

    const totalAmount = items.reduce((sum, item) => {
      const price = parsePrice(item.price);
      const qty = Number.isFinite(item?.quantity) ? Number(item.quantity) : 1;
      return sum + (price * qty);
    }, 0);
    
    const deliveryCharge = totalAmount > 500 ? 0 : 50; // Free delivery above ₹500
    const gst = totalAmount * 0.05; // 5% GST
    const finalAmount = totalAmount + deliveryCharge + gst;
    
    // Generate unique order ID
    const orderId = await Order.generateOrderId();
    
    // Validate that all items belong to the same restaurant
    // We try to resolve foodIds to Food docs; skip if not resolvable
    let restaurantId = null;
    const resolvedFoods = await Food.find({ _id: { $in: items.map(i => i.foodId).filter(id => /^[a-f\d]{24}$/i.test(String(id))) } }).select('_id restaurantId');
    if (resolvedFoods.length > 0) {
      const restSet = new Set(resolvedFoods.map(f => String(f.restaurantId)));
      if (restSet.size > 1) {
        return res.status(400).json({ message: 'All items in an order must be from the same restaurant' });
      }
      restaurantId = resolvedFoods[0].restaurantId;
    }

    // Fallback: accept restaurantId directly from client when foods are not in DB
    if (!restaurantId && req.body.restaurantId && /^[a-f\d]{24}$/i.test(String(req.body.restaurantId))) {
      restaurantId = req.body.restaurantId;
    }

    // Resolve restaurant address (if known)
    let restaurantDoc = null;
    if (restaurantId) {
      try { restaurantDoc = await Restaurant.findById(restaurantId).select('name address'); } catch {}
    }

    // Build address strings
    const restaurantAddrString = buildAddress(restaurantDoc?.address) || restaurantDoc?.name || '';
    const deliveryAddrString = buildAddress(deliveryAddress) || buildAddress(userDetails?.address);

    // Prefer client-provided coords if present
    let restaurantLatLng = req.body.restaurantLatLng || null;
    let deliveryLatLng = req.body.deliveryLatLng || null;
    const coordSource = { restaurant: 'default', delivery: 'default' };

    if (!restaurantLatLng) {
      const g = await geocodeAddress(restaurantAddrString);
      if (g) { restaurantLatLng = g; coordSource.restaurant = 'geocoded'; }
      else { restaurantLatLng = defaultCityCoords(); coordSource.restaurant = 'default'; }
    } else {
      coordSource.restaurant = 'stored';
    }

    if (!deliveryLatLng) {
      const g = await geocodeAddress(deliveryAddrString);
      if (g) { deliveryLatLng = g; coordSource.delivery = 'geocoded'; }
      else { deliveryLatLng = defaultCityCoords(); coordSource.delivery = 'default'; }
    } else {
      coordSource.delivery = 'stored';
    }

    // Create order
    const order = new Order({
      orderId,
      user: req.user.id,
      restaurantId,
      items,
      userDetails,
      deliveryAddress,
      specialInstructions,
      totalAmount,
      deliveryCharge,
      gst,
      finalAmount,
      paymentMethod: 'stripe',
      restaurantLatLng,
      deliveryLatLng,
      coordSource
    });
    
    // Attempt auto-assignment
    let assignedUserId = null;
    try {
      if (restaurantId) {
        const dp = await findBestDeliveryPartner(restaurantId);
        if (dp) {
          assignedUserId = dp.userId;
        }
      }
    } catch (e) {
      console.warn('Auto-assignment failed:', e.message);
    }

    if (assignedUserId) {
      order.assignedTo = assignedUserId;
      // If pending, move to confirmed once assigned
      if (order.orderStatus === 'pending') {
        order.orderStatus = 'confirmed';
      }
    }

    const savedOrder = await order.save();

    // Realtime: notify the restaurant owner for this order
    try {
      let ownerId = null;
      if (savedOrder.restaurantId) {
        const rest = await Restaurant.findById(savedOrder.restaurantId).select('ownerId');
        ownerId = rest?.ownerId ? String(rest.ownerId) : null;
      } else if (Array.isArray(savedOrder.items) && savedOrder.items.length > 0) {
        // Fallback: infer via food -> restaurant -> owner
        const foodIds = savedOrder.items.map(i => i.foodId).filter(Boolean);
        const foods = await Food.find({ _id: { $in: foodIds } }).select('restaurantId');
        const restaurantId = foods[0]?.restaurantId;
        if (restaurantId) {
          const rest = await Restaurant.findById(restaurantId).select('ownerId');
          ownerId = rest?.ownerId ? String(rest.ownerId) : null;
        }
      }
      if (ownerId) {
        publishToOwner(ownerId, { type: 'order_created', payload: {
          orderId: savedOrder.orderId,
          orderStatus: savedOrder.orderStatus,
          finalAmount: savedOrder.finalAmount,
          createdAt: savedOrder.createdAt,
        }});
      }
      // Also notify admins
      publishToAdmins({ type: 'order_created', payload: {
        orderId: savedOrder.orderId,
        orderStatus: savedOrder.orderStatus,
        finalAmount: savedOrder.finalAmount,
        createdAt: savedOrder.createdAt,
      }});
    } catch (e) {
      console.warn('Realtime notify failed (create):', e.message);
    }

    // Increment activeOrders for assigned delivery partner
    if (assignedUserId) {
      try {
        await DeliveryPerson.findOneAndUpdate(
          { userId: assignedUserId },
          { $inc: { activeOrders: 1 } }
        );
      } catch (e) {
        console.warn('Failed to increment activeOrders for delivery person:', e.message);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: savedOrder,
      orderId: savedOrder.orderId
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: `Error creating order: ${error.message}`, error: error.message });
  }
};

// POST create new order (preferred path)
router.post('/', handleCreateOrder);

// POST create new order (legacy path kept for backward compatibility)
router.post('/create', handleCreateOrder);

// POST create payment order for Razorpay
// Payment creation endpoint disabled
// router.post('/create-payment', async (req, res) => {
//   return res.status(503).json({ success: false, message: 'Online payments are temporarily disabled.' });
// });

// POST verify payment and update order
// Payment verification endpoint disabled
// router.post('/verify-payment', async (req, res) => {
//   return res.status(503).json({ success: false, message: 'Online payments are temporarily disabled.' });
// });

// Razorpay redirect callback (for redirect mode)
// Razorpay redirect callback disabled
// router.post('/razorpay-callback', async (req, res) => {
//   return res.status(503).send('Online payments are temporarily disabled.');
// });

// GET user's orders
router.get('/my-orders', async (req, res) => {
  try {
    const orders = await Order.findByUser(req.user.id).populate('assignedTo', 'name email');
    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// GET specific order by ID
// Handles both orderId (custom ID) and _id (MongoDB ID)
// Only match 6-digit orderId or 24-hex ObjectId to avoid clashing with named routes like 'assigned'/'completed'
router.get('/:orderId([0-9]{6}|[a-fA-F0-9]{24})', async (req, res) => {
  try {
    const { orderId } = req.params;
    // Safety guard in case of unexpected matches
    if (orderId === 'assigned' || orderId === 'completed') {
      return res.status(404).json({ message: 'Not found' });
    }
    const userId = req.user?.id;
    
    console.log(`Fetching order with ID: ${orderId} for user: ${userId}`);
    
    if (!userId) {
      console.error('No user ID found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Try to find by orderId first
    let order = await Order.findOne({ orderId, user: userId })
      .populate('assignedTo', 'name email')
      .lean();
    
    // If not found by orderId, try by _id
    if (!order) {
      console.log(`Order not found with orderId, trying with _id: ${orderId}`);
      order = await Order.findOne({ _id: orderId, user: userId })
        .populate('assignedTo', 'name email')
        .lean();
    }
    
    if (!order) {
      console.log(`Order not found with ID: ${orderId} for user: ${userId}`);
      return res.status(404).json({ 
        success: false,
        message: 'Order not found',
        orderId,
        userId
      });
    }
    
    console.log(`Found order:`, { 
      _id: order._id, 
      orderId: order.orderId,
      status: order.status,
      user: order.user,
      userId: userId
    });
    
    res.json({
      success: true,
      order: order
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// PUT update order status
router.put('/:orderId([0-9]{6}|[a-fA-F0-9]{24})/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;
    
    const order = await Order.findOne({ orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.orderStatus = orderStatus;
    await order.save();
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: order
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

// PATCH update order status (for delivery staff)
router.patch('/:orderId([0-9]{6}|[a-fA-F0-9]{24})/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is assigned to this order (for delivery staff)
    if (req.user.role === 'delivery' && order.assignedTo && order.assignedTo.toString() !== String(req.user.id)) {
      return res.status(403).json({ message: 'You are not assigned to this order' });
    }
    
    const previousStatus = order.orderStatus;
    order.orderStatus = status;
    await order.save();

    // Realtime: notify owner on status change
    try {
      let ownerId = null;
      if (order.restaurantId) {
        const rest = await Restaurant.findById(order.restaurantId).select('ownerId');
        ownerId = rest?.ownerId ? String(rest.ownerId) : null;
      }
      if (ownerId) {
        publishToOwner(ownerId, { type: 'order_status', payload: {
          orderId: order.orderId,
          orderStatus: order.orderStatus,
          updatedAt: new Date(),
        }});
      }
      // also notify admins
      publishToAdmins({ type: 'order_status', payload: {
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        updatedAt: new Date(),
      }});
    } catch (e) {
      console.warn('Realtime notify failed (status):', e.message);
    }

    // If delivered or cancelled, decrement activeOrders for assigned delivery
    if (order.assignedTo && previousStatus !== status && (status === 'delivered' || status === 'cancelled')) {
      try {
        await DeliveryPerson.findOneAndUpdate(
          { userId: order.assignedTo },
          { $inc: { activeOrders: -1 } }
        );
      } catch (e) {
        console.warn('Failed to decrement activeOrders:', e.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: order
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

// GET assigned orders for delivery staff
router.get('/assigned', async (req, res) => {
  try {
    const role = (req.user.role || '').toLowerCase();
    if (role !== 'delivery' && role !== 'driver') {
      return res.status(403).json({ message: 'Access denied. Delivery staff only.' });
    }
    const uid = String(req.user.id || '').trim();
    if (!/^[a-f\d]{24}$/i.test(uid)) {
      console.warn('[orders.assigned] Invalid user id for assigned lookup:', uid);
      return res.json([]);
    }
    console.log('[orders.assigned] uid=', uid);

    const orders = await Order.find({
      assignedTo: uid,
      orderStatus: { $in: ['confirmed', 'preparing', 'out_for_delivery'] }
    })
      .populate('user', 'name email contactNumber')
      .populate('restaurantId', 'name address phone email');
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching assigned orders:', error?.message || error);
    res.status(500).json({ message: 'Error fetching assigned orders', error: error.message });
  }
});

// GET completed orders for delivery staff
router.get('/completed', async (req, res) => {
  try {
    const role = (req.user.role || '').toLowerCase();
    if (role !== 'delivery' && role !== 'driver') {
      return res.status(403).json({ message: 'Access denied. Delivery staff only.' });
    }
    const uid = String(req.user.id || '').trim();
    if (!/^[a-f\d]{24}$/i.test(uid)) {
      console.warn('[orders.completed] Invalid user id for completed lookup:', uid);
      return res.json([]);
    }
    console.log('[orders.completed] uid=', uid);

    const orders = await Order.find({
      assignedTo: uid,
      orderStatus: 'delivered'
    }).populate('user', 'name email contactNumber');
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching completed orders:', error?.message || error);
    res.status(500).json({ message: 'Error fetching completed orders', error: error.message });
  }
});

// PATCH assign delivery person to order (owner only)
router.patch('/:orderId/assign', async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Restaurant owners only.' });
    }
    
    const { orderId } = req.params;
    const { assignedTo } = req.body;
    if (!assignedTo) {
      return res.status(400).json({ message: 'assignedTo is required' });
    }
    
    let order = await Order.findOne({ orderId });
    if (!order && orderId && /^[a-f\d]{24}$/i.test(orderId)) {
      // Fallback: allow Mongo _id in path param
      try {
        order = await Order.findById(orderId);
      } catch {}
    }
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Verify the order belongs to owner's restaurant
    // This would need restaurant validation in a real app
    
    order.assignedTo = assignedTo;
    // Move order to a valid next state per enum
    if (order.orderStatus === 'pending') {
      order.orderStatus = 'confirmed';
    }
    await order.save();
    
    res.json({
      success: true,
      message: 'Order assigned successfully',
      order: order
    });
    
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ message: 'Error assigning order', error: error.message });
  }
});

// Owner soft-delete (hide) an order from their view
router.delete('/:orderId/owner', async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Restaurant owners only.' });
    }
    const { orderId } = req.params;
    let order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.deletedByOwner = true;
    await order.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting order for owner:', error);
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
});

// GET all orders (for owners to see their restaurant orders)
router.get('/', async (req, res) => {
  try {
    let orders;
    const userRole = req.user.role?.toLowerCase();
    
    if (userRole === 'owner') {
      // Owner should only see orders that contain foods from their restaurants
      const ownerRestaurants = await Restaurant.find({ ownerId: req.user.id }).select('_id');
      const restaurantIds = ownerRestaurants.map(r => String(r._id));

      if (restaurantIds.length === 0) {
        return res.json([]);
      }

      // Find all food items that belong to these restaurants
      const foods = await Food.find({ restaurantId: { $in: restaurantIds } }).select('_id');
      const foodIdStrings = foods.map(f => String(f._id));

      if (foodIdStrings.length === 0) {
        return res.json([]);
      }

      // Orders that have at least one item whose foodId matches one of the owner's foods
      orders = await Order.find({ 'items.foodId': { $in: foodIdStrings }, deletedByOwner: { $ne: true } })
        .populate('user', 'name email contactNumber')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });
    } else if (userRole === 'user') {
      // For regular users, get their own orders
      orders = await Order.find({ user: req.user.id, deletedByUser: { $ne: true } }).populate('assignedTo', 'name email');
    } else if (userRole === 'delivery') {
      // For delivery staff, get their assigned orders
      orders = await Order.find({ 
        assignedTo: req.user.id,
        orderStatus: { $in: ['confirmed', 'Pending', 'PickedUp', 'OutForDelivery', 'Delivered'] }
      }).populate('user', 'name email contactNumber');
    } else {
      return res.status(403).json({ 
        message: 'Access denied. Invalid user role or insufficient permissions.',
        userRole: req.user.role,
        userId: req.user.id
      });
    }
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// DELETE hide order from user's history
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId, user: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.deletedByUser = true;
    await order.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
});

module.exports = router;
