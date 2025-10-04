const express = require('express');
const jwt = require('jsonwebtoken');
const { authRequired } = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');

const router = express.Router();

// In-memory store for demo purposes
const orderLocations = new Map(); // orderId -> { lat, lng, updatedAt, driverId, status }
const subscribers = new Map(); // orderId -> Set(res)
const driverLocations = new Map(); // driverId -> { lat, lng, updatedAt, isOnline }
const autoUpdateIntervals = new Map(); // orderId -> intervalId

// Helper to push updates to subscribers via SSE
const broadcast = (orderId, payload) => {
  const set = subscribers.get(orderId);
  if (!set) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try { res.write(data); } catch {}
  }
};

// SSE stream: clients subscribe to live updates for an orderId
// Supports token via query string when headers are not available (EventSource)
router.get('/stream/:orderId', (req, res) => {
  const { orderId } = req.params;
  // Try to authenticate from header or query token
  const header = req.headers.authorization || '';
  const tokenFromHeader = header.startsWith('Bearer ') ? header.slice(7) : null;
  const tokenFromQuery = req.query.token;
  const token = tokenFromHeader || tokenFromQuery;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      req.user = payload;
    } catch {}
  }

  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Register subscriber
  if (!subscribers.has(orderId)) subscribers.set(orderId, new Set());
  subscribers.get(orderId).add(res);

  // Send current location immediately if present
  const current = orderLocations.get(orderId);
  if (current) {
    res.write(`data: ${JSON.stringify({ type: 'location', payload: current })}\n\n`);
  }

  req.on('close', () => {
    const set = subscribers.get(orderId);
    if (set) {
      set.delete(res);
      if (set.size === 0) subscribers.delete(orderId);
    }
  });
});

// --- Delivery Simulation Helpers ---
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;

// POST: start a 2-minute simulation that moves from restaurant -> delivery, emits SSE every 1s, then marks delivered
router.post('/simulate/:orderId', authRequired, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Load order by public orderId or Mongo _id
    let order = await Order.findOne({ orderId });
    if (!order && /^[a-f\d]{24}$/i.test(orderId)) {
      try { order = await Order.findById(orderId); } catch {}
    }
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Get start/end coordinates
    const start = order.restaurantLatLng || null;
    const end = order.deliveryLatLng || null;
    if (!start || !Number.isFinite(start.lat) || !Number.isFinite(start.lng) ||
        !end || !Number.isFinite(end.lat) || !Number.isFinite(end.lng)) {
      return res.status(400).json({ message: 'Order missing coordinates to simulate' });
    }

    // Clear any existing interval
    const key = order.orderId || orderId;
    if (autoUpdateIntervals.has(key)) {
      clearInterval(autoUpdateIntervals.get(key));
      autoUpdateIntervals.delete(key);
    }

    const TOTAL_SECONDS = 120; // 2 minutes
    let t = 0;

    // Set status to out_for_delivery if still pending/confirmed
    if (['pending','confirmed','preparing'].includes(order.orderStatus)) {
      order.orderStatus = 'out_for_delivery';
      await order.save();
    }

    const intervalId = setInterval(async () => {
      try {
        t += 1;
        const u = clamp01(t / TOTAL_SECONDS);
        const lat = lerp(start.lat, end.lat, u);
        const lng = lerp(start.lng, end.lng, u);
        const payload = {
          lat,
          lng,
          updatedAt: new Date().toISOString(),
          driverId: 'simulated',
          status: order.orderStatus,
        };
        orderLocations.set(key, payload);
        broadcast(key, { type: 'location', payload });

        if (u >= 1) {
          clearInterval(intervalId);
          autoUpdateIntervals.delete(key);
          // Mark delivered
          try {
            const o = await Order.findOne({ _id: order._id });
            if (o) {
              o.orderStatus = 'delivered';
              await o.save();
            }
          } catch {}
        }
      } catch (e) {
        clearInterval(intervalId);
        autoUpdateIntervals.delete(key);
        console.error('Simulation error:', e);
      }
    }, 1000);

    autoUpdateIntervals.set(key, intervalId);
    res.json({ success: true, message: 'Simulation started', durationSeconds: TOTAL_SECONDS });
  } catch (error) {
    console.error('Error starting simulation:', error);
    res.status(500).json({ message: 'Failed to start simulation' });
  }
});

// Delivery driver updates their GPS location for an orderId
router.post('/update/:orderId', authRequired, express.json(), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { lat, lng, status } = req.body || {};
    const driverId = req.user.id;
    
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'lat and lng are required numbers' });
    }

    // Verify driver is assigned to this order (support both orderId and _id)
    let order = await Order.findOne({ orderId });
    if (!order && /^[a-f\d]{24}$/i.test(orderId)) {
      try { order = await Order.findById(orderId); } catch {}
    }
    if (!order || String(order.assignedTo) !== String(driverId)) {
      return res.status(403).json({ message: 'Not authorized to update this order location' });
    }

    const payload = { 
      lat, 
      lng, 
      updatedAt: new Date().toISOString(),
      driverId,
      status: status || order.orderStatus
    };
    
    // Key by public orderId code for clients
    const publicKey = order.orderId || orderId;
    orderLocations.set(publicKey, payload);
    driverLocations.set(driverId, { lat, lng, updatedAt: payload.updatedAt, isOnline: true });
    
    // Update order status if provided
    if (status && status !== order.orderStatus) {
      order.orderStatus = status;
      await order.save();
    }
    
    broadcast(publicKey, { type: 'location', payload });
    res.json({ success: true, message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
});

// Driver starts auto-updating location for an order
router.post('/start-auto-update/:orderId', authRequired, express.json(), async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.id;
    
    // Verify driver is assigned to this order (support both ids)
    let order = await Order.findOne({ orderId });
    if (!order && /^[a-f\d]{24}$/i.test(orderId)) {
      try { order = await Order.findById(orderId); } catch {}
    }
    if (!order || String(order.assignedTo) !== String(driverId)) {
      return res.status(403).json({ message: 'Not authorized to start auto-update for this order' });
    }

    // Clear existing interval if any
    if (autoUpdateIntervals.has(orderId)) {
      clearInterval(autoUpdateIntervals.get(orderId));
    }

    // Start auto-update every 2 minutes
    const intervalId = setInterval(async () => {
      try {
        // Get current driver location
        const driverLocation = driverLocations.get(driverId);
        if (driverLocation && driverLocation.isOnline) {
          const payload = {
            lat: driverLocation.lat,
            lng: driverLocation.lng,
            updatedAt: new Date().toISOString(),
            driverId,
            status: order.status
          };
          const publicKey = order.orderId || orderId;
          orderLocations.set(publicKey, payload);
          broadcast(publicKey, { type: 'location', payload });
        }
      } catch (error) {
        console.error('Auto-update error:', error);
      }
    }, 120000); // 2 minutes

    autoUpdateIntervals.set(orderId, intervalId);
    res.json({ success: true, message: 'Auto-update started' });
  } catch (error) {
    console.error('Error starting auto-update:', error);
    res.status(500).json({ message: 'Failed to start auto-update' });
  }
});

// Driver stops auto-updating location for an order
router.post('/stop-auto-update/:orderId', authRequired, (req, res) => {
  const { orderId } = req.params;
  
  if (autoUpdateIntervals.has(orderId)) {
    clearInterval(autoUpdateIntervals.get(orderId));
    autoUpdateIntervals.delete(orderId);
    res.json({ success: true, message: 'Auto-update stopped' });
  } else {
    res.json({ success: true, message: 'Auto-update was not running' });
  }
});

// Get order tracking information for customers
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Try to find order by orderId (6-digit) first, then by MongoDB _id
    let order = await Order.findOne({ orderId: orderId })
      .populate('assignedTo', 'name phone')
      .populate('restaurantId', 'name address phone email');
    
    if (!order && /^[a-f\d]{24}$/i.test(orderId)) {
      // Fallback: try MongoDB _id
      order = await Order.findById(orderId)
        .populate('assignedTo', 'name phone')
        .populate('restaurantId', 'name address');
    }
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const location = orderLocations.get(order.orderId || orderId);
    const driver = order.assignedTo;
    
    res.json({
      order: {
        id: order._id,
        orderId: order.orderId,
        status: order.orderStatus,
        totalAmount: order.totalAmount,
        finalAmount: order.finalAmount,
        createdAt: order.createdAt,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        customerName: order.userDetails?.name,
        customerPhone: order.userDetails?.contactNumber,
        deliveryAddress: order.userDetails?.address || order.deliveryAddress
      },
      restaurant: order.restaurantId ? {
        name: order.restaurantId.name,
        address: order.restaurantId.address
      } : null,
      driver: driver ? {
        name: driver.name,
        phone: driver.phone
      } : null,
      location: location ? {
        lat: location.lat,
        lng: location.lng,
        updatedAt: location.updatedAt
      } : null
    });
  } catch (error) {
    console.error('Error getting order tracking info:', error);
    res.status(500).json({ message: 'Failed to get order tracking information' });
  }
});

// Driver goes online/offline
router.post('/driver-status', authRequired, express.json(), (req, res) => {
  const { isOnline, lat, lng } = req.body;
  const driverId = req.user.id;
  
  if (isOnline && Number.isFinite(lat) && Number.isFinite(lng)) {
    driverLocations.set(driverId, { 
      lat, 
      lng, 
      updatedAt: new Date().toISOString(), 
      isOnline: true 
    });
  } else {
    const current = driverLocations.get(driverId);
    if (current) {
      driverLocations.set(driverId, { ...current, isOnline: false });
    }
  }
  
  res.json({ success: true, message: `Driver ${isOnline ? 'online' : 'offline'}` });
});

module.exports = router;


