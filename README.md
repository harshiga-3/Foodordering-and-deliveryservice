# Food Delivery Application

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) food delivery application with role-based access control for Users, Restaurant Owners, and Delivery Personnel.

 ## Project Structure

 ```
food_app_demo_vs/
├── front/                       # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components (e.g., FoodPage.jsx, dashboards)
│   │   ├── context/             # React Context providers
│   │   ├── utils/               # API client and helpers (see src/utils/api.js)
│   │   └── assets/              # Images and static assets
│   ├── public/
│   ├── package.json
│   └── README.md
├── server/                      # Backend (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── models/              # Mongoose models
│   │   ├── routes/              # API route handlers
│   │   ├── middleware/          # Auth and other middleware
│   │   └── index.js             # Server entry point
│   ├── package.json
│   └── README.md
├── DELIVERY_TRACKING_SYSTEM.md  # Delivery tracking feature docs
├── OWNER_ANALYTICS_DASHBOARD.md # Owner analytics docs
├── TASTE_PROFILE_FEATURES.md    # Taste profile and Surprise Me docs
└── README.md                    # Consolidated project documentation
 ```

## Features

### 🍽️ Food Management
- Browse all available food items
- Search and filter foods by name, category, price, and restaurant
- View food details with images, descriptions, and ratings
- Add/remove foods to favorites
- Write and manage food reviews

### 🏪 Restaurant Management
- Restaurant owners can create and manage their restaurants
- Add, edit, and delete food items
- View restaurant analytics and orders
- Open/close restaurant status toggle
- Manage restaurant information and settings

### 🎁 Combo Offers System
- Create special combo offers combining multiple food items
- Upload custom combo images and set categories (family, couple, individual)
- Display combo offers on restaurant pages and track sales

### 🛒 Order System
- Users can place orders and track delivery status
- Owners can manage orders and assign delivery personnel
- Delivery personnel can update order status with real-time updates

### 👥 Role-Based Access Control
- Users, Restaurant Owners, and Delivery Personnel with appropriate permissions

### 🔍 Advanced Search & Filtering
- Search by food/restaurant name, filter by category, price range, dietary preferences; sort by rating/price/name

## Technology Stack

### Frontend
- React (Vite)
- React Router
- React Bootstrap / Bootstrap Icons / Font Awesome
- Chart.js + react-chartjs-2 (analytics)
- Leaflet + React-Leaflet (maps)

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT authentication and bcrypt password hashing
- Stripe and Razorpay integrations (optional)

## Getting Started

### Prerequisites
 - Node.js (v18 or higher)
 - MongoDB (local or cloud instance)
 - npm or yarn package manager

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   MONGO_URI=mongodb://127.0.0.1:27017/food_delivery
   JWT_SECRET=your_secret_key_here
   PORT=4000
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the front directory:
   ```bash
   cd front
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

The backend provides RESTful APIs for:

### 🔐 **Authentication** (`/api/auth`)
- `POST /login` - User login
- `POST /signup` - User registration
- `GET /profile` - Get user profile

### 👥 **Users** (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /` - List users (admin only)

### 🍽️ **Foods** (`/api/foods`)
- `GET /` - Get all foods (public)
- `GET /:id` - Get food by ID (public)
- `POST /` - Create food (owner only)
- `PUT /:id` - Update food (owner only)
- `DELETE /:id` - Delete food (owner only)

### 🏪 **Restaurants** (`/api/restaurants`)
- `GET /` - Get all restaurants (public)
- `GET /:id` - Get restaurant by ID (public)
- `GET /owner/:ownerId` - Get restaurants by owner (auth)
- `POST /` - Create restaurant (owner only)
- `PUT /:id` - Update restaurant (owner only)
- `DELETE /:id` - Delete restaurant (owner only)
- `PATCH /:id/toggle-status` - Toggle open/close status

### 🛒 **Orders** (`/api/orders`)
- `GET /` - Get user orders (role-aware)
- `GET /my-orders` - Get user's order history
- `GET /:orderId` - Get a specific order (by orderId or _id)
- `POST /` - Create new order
- `PATCH /:id/status` - Update order status (delivery staff)
- `PATCH /:id/assign` - Assign delivery person (owner)
- `DELETE /:id` - Delete order (user)

### ❤️ **Favorites** (`/api/favorites`)
- `GET /` - Get user favorites
- `POST /add` - Add item to favorites
- `POST /remove` - Remove item by foodId
- `POST /toggle` - Toggle food favorite
- `GET /check/:foodId` - Check if food is favorited
- `GET /count` - Get user's favorite count
- `DELETE /:id` - Remove favorite by favoriteId

### ⭐ **Reviews** (`/api/reviews`)
- `GET /food/:id` - Get food reviews
- `GET /restaurant/:id` - Get restaurant reviews
- `GET /user` - Get user's reviews
- `POST /` - Create review
- `PUT /:id` - Update review
- `DELETE /:id` - Delete review

### 🎁 **Combo Offers** (`/api/combos`)
- `GET /` - Get all combos (public)
- `GET /?restaurantId=:id` - Get restaurant combos
- `POST /` - Create combo (owner only)
- `PUT /:id` - Update combo (owner only)
- `DELETE /:id` - Delete combo (owner only)

### 💳 **Payments (Stripe)** (`/api/stripe`)
- `GET /config` - Get publishable key
- `POST /create-payment-intent` - Create PaymentIntent for an order (body: `{ orderId }`)
- Webhook: `POST /api/stripe/webhook`

## 📊 **Dashboard API Usage**

### **User Dashboard APIs**
The user dashboard (`DashboardUser.jsx`) utilizes the following APIs:

#### **Data Loading Process**
```javascript
// 1. Fetch User Favorites
GET /api/favorites
// Returns: Array of favorite items

// 2. Fetch User Orders
GET /api/orders/my-orders
// Returns: Object with orders array

// 3. Fetch User Reviews
GET /api/reviews/user
// Returns: Array of user reviews

// 4. Fetch User Profile
GET /api/users/profile
// Returns: User profile object

// 5. Local Storage
localStorage.getItem('cart')
// Returns: Cart items array
```

#### **Authentication Headers**
All API calls require JWT authentication:
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>'
}
```

#### **Error Handling Strategy**
- Graceful degradation for each API call
- Non-blocking error handling
- User feedback via Alert components
- Loading states with Spinner components

## Key Features

### 🔐 **Security**
- JWT-based authentication
- Role-based access control
- Secure password hashing
- Input validation and sanitization

### 📱 **User Experience**
- **Modern Login Interface**: Single-button login with Google sign-in option
- **Streamlined Navigation**: Clean signup links and intuitive user flow
- **Responsive Design**: Optimized for all devices (mobile, tablet, desktop)
- **Real-time Updates**: Live order tracking and status updates
- **Interactive Features**: Favorites, reviews, and combo offer systems
- **Clean Newsletter Design**: Simplified footer sections for better UX
- **Beautiful Combo Displays**: Enhanced visual presentation of special offers
- **Intuitive Dashboard**: Comprehensive user dashboard with metrics and quick actions

### 🚀 **Performance**
- Efficient database queries with aggregation
- Optimized search with text indexing
- Caching strategies for better performance

## Recent Updates

### 🆕 **Latest Features (v2.1)**
- **Enhanced Login UI**: Single-button login with Google sign-in option and signup links
- **Improved Newsletter Design**: Cleaned up footer sections for better user experience
- **Combo Offers System**: Restaurant owners can create and manage special combo offers
- **Enhanced Restaurant Management**: Added open/close toggle and improved restaurant controls
- **Improved Food Management**: Enhanced edit/delete functionality for food items
- **Delivery Assignment**: Restaurant owners can assign delivery personnel to orders
- **Image Upload**: Support for combo offer images with preview functionality
- **Database Optimization**: Improved query performance and data handling

### 🔧 **Technical Improvements**
- **UI/UX Enhancements**: Streamlined login process with modern design
- **API Documentation**: Comprehensive API endpoint documentation
- **Form Validation**: Enhanced form validation across all components
- **Error Handling**: Improved error handling and user feedback
- **Login UI Redesign**: Single-button login with Google sign-in option
- **Newsletter Cleanup**: Removed footer clutter for better user experience
- **Fixed combo offer display issues on restaurant pages
- **Enhanced API error handling and logging
- **Improved database schema for combo offers
- **Better image handling and storage
- **Optimized frontend state management

### 🎨 **UI/UX Improvements**
- **Modern Login Design**: Clean, single-button interface with Google integration
- **Streamlined Navigation**: Clear signup links and intuitive user flow
- **Clean Newsletter**: Simplified footer sections without distracting elements
- **Enhanced Dashboard**: Comprehensive user metrics and quick actions
- **Responsive Design**: Optimized for all screen sizes and devices
- **Icon Integration**: Font Awesome icons for better visual hierarchy
- **Form Validation**: Real-time validation with user-friendly error messages

## Development

### Code Structure
- **Modular Architecture**: Separate concerns between frontend and backend
- **RESTful APIs**: Standard HTTP methods and status codes
- **Error Handling**: Comprehensive error handling and validation
- **Documentation**: Detailed API documentation and code comments

### Database Design
- **Normalized Schema**: Efficient data relationships
- **Indexing**: Optimized queries with proper indexes
- **Validation**: Data integrity with Mongoose schemas
- **Combo Offers**: Special schema for combo offers with restaurant relationships

### Combo Offers System
The combo offers system allows restaurant owners to:
- Create special meal combinations at discounted prices
- Upload custom images for combo offers
- Set categories (family, couple, individual, etc.)
- Define combo items and pricing
- Display offers prominently on restaurant pages
- Track combo sales and performance

**Combo Schema Features:**
- Restaurant association
- Item combinations (food items or text descriptions)
- Original price vs combo price calculation
- Discount percentage calculation
- Image upload support
- Category and tag system
- Validity dates and order limits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

## Monorepo Quick Start

- **Server (API at `http://localhost:4000`)**
  ```bash
  cd server
  npm install
  npm run dev
  ```
- **Frontend (Vite at `http://localhost:5173`)**
  ```bash
  cd front
  npm install
  npm run dev
  ```

The frontend calls the API at `http://localhost:4000/api` by default (see `front/src/utils/api.js`).

## Environment Variables

Create a `.env` in both `server/` and `front/`.

- **Server (`server/.env`)**
  ```env
  # Core
  MONGO_URI=mongodb://127.0.0.1:27017/food_delivery
  JWT_SECRET=replace_with_strong_secret
  PORT=4000
  FRONTEND_BASE=http://localhost:5173

  # Stripe (optional)
  STRIPE_PUBLISHABLE_KEY=pk_test_xxx
  STRIPE_SECRET_KEY=sk_test_xxx
  STRIPE_WEBHOOK_SECRET=whsec_xxx

  # Razorpay (optional)
  RAZORPAY_KEY_ID=rzp_test_xxx
  RAZORPAY_KEY_SECRET=your_razorpay_secret

  # Google OAuth (optional)
  GOOGLE_CLIENT_ID=your_google_client_id
  GOOGLE_CLIENT_SECRET=your_google_client_secret
  ```

- **Frontend (`front/.env`)**
  ```env
  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
  # Optional if you refactor API base:
  # VITE_API_BASE=http://localhost:4000/api
  ```

## Payments

### Stripe
- Implemented in `server/src/routes/stripe.js`.
- Endpoints:
  - `GET /api/stripe/config` → returns `{ publishableKey }`
  - `POST /api/stripe/create-payment-intent` (requires auth; body: `{ orderId }`) → returns `{ clientSecret, paymentIntentId }`
  - Webhook: `POST /api/stripe/webhook` (mounted before body parsers in `server/src/index.js`).
- Set `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` in `server/.env`.

### Razorpay
- `server/src/routes/payments.js` exists but is not mounted by default.
- To enable, mount it in `server/src/index.js` under `/api/payments` and configure `RAZORPAY_*` env vars.
- See `front/RAZORPAY_SETUP.md` for step-by-step setup.

## Google Maps Integration
- `front/index.html` includes the Google Maps JS API via script tag. Replace the placeholder key with your own and restrict it to your domains.
- Consider moving the key to environment variables or a server proxy for production.

## Additional API Modules
- Taste Profile: `server/src/routes/tasteProfile.js` → `/api/taste-profile`
- Surprise Me: `server/src/routes/surpriseMe.js` → `/api/surprise-me`
- Analytics (Owner): `server/src/routes/analytics.js` → `/api/analytics`
- Tracking: `server/src/routes/tracking.js` → `/api/tracking`
- Admin: `server/src/routes/admin.js` → `/api/admin`
- Stripe: `server/src/routes/stripe.js` → `/api/stripe`

## Data Seeding & Sample Data
```bash
cd server
node seed.js
node seedFoods.js
node addFoods.js
node addMoreFoods.js
```
Additional scripts for testing exist (e.g., `test-taste-profile.js`, `testFoods.js`, `testDuplicateReview.js`). Ensure `MONGO_URI` is set before running.

## Development Scripts & Ports
- Server: `npm run dev` (nodemon) at `http://localhost:4000`
- Frontend: `npm run dev` (Vite) at `http://localhost:5173`
- Frontend build: `npm run build` and `npm run preview` in `front/`.

## CORS & Static Uploads
- CORS is enabled with `origin: '*'` in `server/src/index.js`.
- Static uploads are served from `/uploads` (ensure an `uploads/` directory exists if you store images).

## Deployment Notes
- Backend:
  - Set all required environment variables.
  - Use HTTPS and a strong `JWT_SECRET`.
  - Point MongoDB to a managed instance.
  - Run with a process manager (e.g., PM2) and enable logs.
- Frontend:
  - Build with Vite and serve `front/dist` behind a web server/CDN.
  - Update API base in `front/src/utils/api.js` for production or refactor to use `VITE_API_BASE`.

## Feature Deep Dives

### Delivery Tracking System

Consolidated from `DELIVERY_TRACKING_SYSTEM.md`.

- **Driver Features**: Mobile-friendly UI, GPS capture, manual share, auto-update every 2 minutes, online/offline toggle, status updates.
- **Customer Features**: Real-time driver location on Google Maps, status timeline, ETA, updates every 5 seconds.
- **Frontend**: Pages `/driver/tracking/:orderId` and `/tracking/:orderId`, Google Maps with custom markers.
- **Backend**: `/api/tracking/*` routes; in-memory location storage for demo (use Redis in production); auth + order validation.

Endpoints:
- Driver
  - `POST /api/tracking/update/:orderId` → `{ lat, lng, status? }`
  - `POST /api/tracking/start-auto-update/:orderId`
  - `POST /api/tracking/stop-auto-update/:orderId`
  - `POST /api/tracking/driver-status` → `{ isOnline, lat?, lng? }`
- Customer
  - `GET /api/tracking/order/:orderId` → tracking info
  - `GET /api/tracking/stream/:orderId` → SSE stream (optional)

Location capture example:
```javascript
navigator.geolocation.getCurrentPosition(
  ({ coords: { latitude, longitude } }) => {/* share */},
  (err) => {/* handle */},
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
);
```

Config:
```env
# Backend
MONGO_URI=mongodb://localhost:27017/food_delivery
JWT_SECRET=your_jwt_secret
PORT=4000

# Frontend
VITE_API_BASE=http://localhost:4000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

```javascript
const locationOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 };
const AUTO_UPDATE_INTERVAL = 120000;    // 2 minutes
const CUSTOMER_POLLING_INTERVAL = 5000; // 5 seconds
```

Security & Performance:
- JWT validation, driver assignment checks, HTTPS, input validation, rate limiting.
- Use Redis for real-time storage; consider WebSockets for production.

### Owner Analytics Dashboard

Consolidated from `OWNER_ANALYTICS_DASHBOARD.md`.

- **Endpoints** (`/api/analytics`):
  - `GET /daily-orders?period=today|yesterday|week|month&date=YYYY-MM-DD`
  - `GET /financial-performance?period=today|week|month`
  - `GET /time-analytics?type=hourly|daily|weekly|monthly|all`
  - `GET /dashboard`
- **Security**: Auth required; accessible to `role: 'owner'` only. Data filtered by restaurant ownership.
- **Frontend**: Charts via Chart.js + react-chartjs-2; responsive dashboard with tabs (Overview, Order Analysis, Financial Performance, Time Analytics).
- **Sample fetch**:
  ```javascript
  const res = await fetch('/api/analytics/daily-orders?period=today', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  ```
- **Insights**: order status breakdown, hourly distributions, revenue trends, payment methods, top food items.

### Taste Profile & Surprise Me

Consolidated from `TASTE_PROFILE_FEATURES.md`.

- **Model**: `TasteProfile` stores preferences (cuisines, spice level, dietary restrictions, categories, price range, meal types, textures, flavors), quiz responses, recommendations, and behavior stats.
- **Endpoints** (`/api/taste-profile`):
  - `GET /` – get user's profile
  - `POST /` – create/update profile
  - `GET /recommendations` – personalized foods
  - `POST /behavior` – update behavior (orders, likes, dislikes)
- **Surprise Me** (`/api/surprise-me`):
  - `GET /` – single surprise dish
  - `GET /multiple` – multiple options (supports params like `maxPrice`, `minRating`)
- **Frontend components**: `TasteBudsQuiz`, `SurpriseMeButton`, `PersonalizedRecommendations` with responsive, animated UI.
- **Usage examples**:
  ```javascript
  // Create/update profile
  await fetch('/api/taste-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ preferences: { cuisines: ['South Indian'], spiceLevel: 'medium' }})
  });

  // Surprise me
  const r = await fetch('/api/surprise-me?maxPrice=500&minRating=4.0', {
    headers: { Authorization: `Bearer ${token}` }
  });
  ```
- **Notes**: JWT required for user-specific endpoints; server performs validation and sensible fallbacks.
