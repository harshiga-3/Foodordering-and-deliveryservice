# Food Delivery Tracking System

A comprehensive real-time location sharing system between delivery drivers and customers with Google Maps integration.

## 🚀 Features Overview

### **Driver Features**
- **Mobile-friendly interface** optimized for delivery drivers
- **GPS location capture** with high accuracy
- **Manual location sharing** with one-tap button
- **Auto-update every 2 minutes** for continuous tracking
- **Battery-efficient implementation** with smart location watching
- **Online/Offline status** management
- **Order status updates** (confirmed, preparing, out for delivery, delivered)
- **Real-time location broadcasting** to customers

### **Customer Features**
- **Simple tracking webpage** accessible via order ID
- **Real-time driver location** display on Google Maps
- **Order status timeline** with visual progress indicators
- **Estimated delivery time** calculations
- **Driver contact information** when available
- **Live location updates** every 5 seconds
- **Mobile-responsive design** for all devices

## 🏗️ System Architecture

### **Backend API (Node.js/Express)**
- **Enhanced tracking routes** (`/api/tracking/`)
- **Real-time location storage** in memory (production: Redis)
- **Driver authentication** and authorization
- **Order validation** and status management
- **Auto-update intervals** management
- **Server-Sent Events (SSE)** for real-time updates

### **Frontend (React)**
- **Driver Tracking Interface** (`/driver/tracking/:orderId`)
- **Customer Tracking Page** (`/tracking/:orderId`)
- **Google Maps Integration** with custom markers
- **Real-time updates** via polling (production: WebSocket)
- **Mobile-responsive design** with Bootstrap

## 📱 Driver Interface

### **Location Sharing Controls**
```javascript
// Get current location with high accuracy
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // Share location with backend
  },
  (error) => {
    // Handle location errors
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }
);
```

### **Auto-Update System**
- **2-minute intervals** for automatic location sharing
- **Battery optimization** with smart location watching
- **Background location tracking** when app is active
- **Manual override** for immediate location sharing

### **Order Status Management**
- **Visual status buttons** for easy updates
- **Real-time status broadcasting** to customers
- **Order validation** before status changes
- **Driver assignment verification**

## 🗺️ Customer Tracking Interface

### **Google Maps Integration**
```javascript
// Initialize map with driver location
const map = new google.maps.Map(mapRef.current, {
  zoom: 15,
  center: { lat: location.lat, lng: location.lng },
  mapTypeId: 'roadmap'
});

// Custom driver marker
const marker = new google.maps.Marker({
  position: { lat: location.lat, lng: location.lng },
  map: map,
  title: 'Delivery Driver',
  icon: customDriverIcon
});
```

### **Real-Time Updates**
- **5-second polling** for location updates
- **Automatic map updates** when driver moves
- **Status timeline** with visual progress
- **Estimated delivery time** calculations

### **Order Information Display**
- **Order details** (ID, total, restaurant)
- **Driver information** (name, phone)
- **Delivery address** and status
- **Real-time location coordinates**

## 🔧 API Endpoints

### **Driver Endpoints**
```javascript
// Update location for specific order
POST /api/tracking/update/:orderId
{
  "lat": 40.7128,
  "lng": -74.0060,
  "status": "out_for_delivery"
}

// Start auto-update for order
POST /api/tracking/start-auto-update/:orderId

// Stop auto-update for order
POST /api/tracking/stop-auto-update/:orderId

// Update driver online/offline status
POST /api/tracking/driver-status
{
  "isOnline": true,
  "lat": 40.7128,
  "lng": -74.0060
}
```

### **Customer Endpoints**
```javascript
// Get order tracking information
GET /api/tracking/order/:orderId

// Real-time location updates (SSE)
GET /api/tracking/stream/:orderId
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js and npm installed
- Google Maps API key
- MongoDB database
- Modern web browser with geolocation support

### **Installation**

1. **Backend Setup**
```bash
cd server
npm install
npm start
```

2. **Frontend Setup**
```bash
cd front
npm install
npm run dev
```

3. **Google Maps Configuration**
- Get API key from [Google Cloud Console](https://console.cloud.google.com/)
- Replace `YOUR_GOOGLE_MAPS_API_KEY` in `index.html`
- Enable Maps JavaScript API and Places API

### **Usage**

#### **For Drivers**
1. Navigate to `/driver/tracking/:orderId`
2. Allow location permissions when prompted
3. Click "Get Current Location" to capture GPS coordinates
4. Click "Share Location" to send location to customers
5. Enable "Auto-Update" for continuous tracking
6. Update order status as delivery progresses

#### **For Customers**
1. Navigate to `/tracking/:orderId`
2. View real-time driver location on map
3. Track order status through timeline
4. See estimated delivery time
5. Contact driver if needed

## 📱 Mobile Optimization

### **Driver Interface**
- **Touch-friendly buttons** with large targets
- **Responsive design** for all screen sizes
- **Battery-efficient** location tracking
- **Offline capability** with location caching
- **One-handed operation** for easy use while driving

### **Customer Interface**
- **Mobile-first design** with responsive layout
- **Fast loading** with optimized assets
- **Touch gestures** for map interaction
- **Real-time updates** without page refresh
- **Cross-platform compatibility**

## 🔒 Security Features

### **Authentication**
- **JWT token validation** for all driver endpoints
- **Order ownership verification** before location updates
- **Driver assignment validation** for order access
- **Secure location data transmission**

### **Data Protection**
- **HTTPS encryption** for all communications
- **Location data sanitization** before storage
- **Rate limiting** on location update endpoints
- **Input validation** for all coordinates

## 🚀 Performance Optimizations

### **Backend**
- **In-memory storage** for fast location access
- **Efficient polling intervals** to reduce server load
- **Connection pooling** for database operations
- **Caching strategies** for order data

### **Frontend**
- **Lazy loading** for map components
- **Debounced location updates** to prevent spam
- **Efficient re-rendering** with React optimizations
- **Asset optimization** for faster loading

## 🔧 Configuration

### **Environment Variables**
```bash
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/food_delivery
JWT_SECRET=your_jwt_secret
PORT=4000

# Frontend
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### **Location Settings**
```javascript
// High accuracy GPS settings
const locationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000
};

// Auto-update interval (2 minutes)
const AUTO_UPDATE_INTERVAL = 120000;

// Customer polling interval (5 seconds)
const CUSTOMER_POLLING_INTERVAL = 5000;
```

## 🐛 Troubleshooting

### **Common Issues**

1. **Location not updating**
   - Check browser location permissions
   - Verify GPS is enabled on device
   - Ensure stable internet connection

2. **Map not loading**
   - Verify Google Maps API key
   - Check API key permissions
   - Ensure HTTPS for production

3. **Real-time updates not working**
   - Check network connectivity
   - Verify order ID is correct
   - Check browser console for errors

### **Debug Mode**
```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Check location accuracy
navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log('Accuracy:', position.coords.accuracy);
    console.log('Coordinates:', position.coords);
  }
);
```

## 📈 Future Enhancements

### **Planned Features**
- **WebSocket integration** for real-time updates
- **Push notifications** for status changes
- **Route optimization** for drivers
- **Delivery time predictions** using ML
- **Multi-language support**
- **Dark mode** for better visibility

### **Scalability Improvements**
- **Redis integration** for location storage
- **Load balancing** for high traffic
- **CDN integration** for static assets
- **Database optimization** for large datasets

## 📞 Support

For technical support or feature requests:
- **Documentation**: Check this file for detailed information
- **Issues**: Report bugs via GitHub issues
- **Features**: Request new features via GitHub discussions

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This system is designed for demonstration purposes. For production use, implement additional security measures, error handling, and scalability optimizations.
