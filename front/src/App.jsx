// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import FloatingSurpriseButton from "./components/FloatingSurpriseButton/FloatingSurpriseButton";
import Home from "./pages/Home";
//import TestPage from "./TestPage";
import Restaurants from "./pages/Restaurants";
import RestaurantDetailPage from "./pages/RestaurantDetailPage";
import FoodDetailPage from "./pages/FoodDetailPage";
import FoodPage from "./pages/FoodPage";
import CartPage from "./pages/CartPage";
import Favorites from "./pages/Favorites.jsx";
import Reviews from "./pages/Reviews.jsx";
import Account from "./pages/Account.jsx";
// Using backend restaurants instead of local data
import './App.css';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import OrderHistory from './components/OrderHistory';
import OrderTracker from './pages/OrderTracker.jsx';
import DeliveryLocationShare from './pages/DeliveryLocationShare.jsx';
import RestaurantOrders from './pages/RestaurantOrders.jsx';
import DriverTracking from './pages/DriverTracking.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';
import DriverDashboard from './pages/DriverDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ComboDetail from './components/ComboDetail/ComboDetail';

function AppContent() {
  const { user } = useAuth();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const location = useLocation();

  // Determine if current route is under /admin
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Hydrate cart from localStorage on first load
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cart') || '[]');
      if (Array.isArray(saved)) setCart(saved);
    } catch {}
  }, []);

  const persistCart = (nextCart) => {
    try {
      localStorage.setItem('cart', JSON.stringify(nextCart));
      window.dispatchEvent(new CustomEvent('cart:changed', { detail: { count: nextCart.reduce((t,i) => t + (i.quantity || 1), 0) } }));
    } catch (e) {
      console.error('Error persisting cart:', e);
    }
  };

  const handleUpdateCart = (updatedCart) => {
    setCart(updatedCart);
    persistCart(updatedCart);
  };

  const navigate = useNavigate();

  const handleRestaurantClick = (restaurantOrId) => {
    try {
      const id = typeof restaurantOrId === 'string' ? restaurantOrId : (restaurantOrId?._id || restaurantOrId?.id);
      if (id) navigate(`/restaurant/${id}`);
    } catch (e) {
      console.error('Error navigating to restaurant:', e);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleAddToCart = (item) => {
    setCart(prevCart => {
      // For combo items, we don't merge them as they're unique combinations
      if (item.isCombo) {
        const updatedCart = [...prevCart, { ...item, quantity: item.quantity || 1 }];
        persistCart(updatedCart);
        return updatedCart;
      }
      
      // For regular items, check if they already exist in cart
      const existingItemIndex = prevCart.findIndex(
        cartItem => cartItem._id === item._id && !cartItem.isCombo
      );
      
      let updatedCart;
      
      if (existingItemIndex >= 0) {
        // If item exists, update quantity
        updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: (updatedCart[existingItemIndex].quantity || 1) + (item.quantity || 1)
        };
      } else {
        // If it's a new item, add it to cart
        updatedCart = [...prevCart, { ...item, quantity: item.quantity || 1 }];
      }
      
      // Persist updates
      persistCart(updatedCart);
      return updatedCart;
    });
  };

  return (
    <div className="App">
        {!isAdminRoute && (
          <Header 
            cartItemsCount={cart.reduce((total, item) => total + (item.quantity || 1), 0)}
            cart={cart}
            onUpdateCart={handleUpdateCart}
          />
        )}
        <main>
          <Routes>
            {/* Home with cart and handlers */}
            <Route 
              path="/" 
              element={
                <Home 
                  onRestaurantClick={handleRestaurantClick}
                  onAddToCart={handleAddToCart}
                  cart={cart}
                />
              }
            />

            {/* Admin */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Dashboards */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner"
              element={
                <ProtectedRoute>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Restaurants and Food */}
            <Route 
              path="/restaurants" 
              element={
                <Restaurants 
                  onBack={handleBackToHome}
                  onAddToCart={handleAddToCart}
                />
              } 
            />
            <Route 
              path="/restaurant/:id" 
              element={
                <RestaurantDetailPage 
                  onBack={handleBackToHome}
                  onAddToCart={handleAddToCart}
                  cart={cart}
                />
              } 
            />
            <Route 
              path="/food" 
              element={
                <FoodPage onAddToCart={handleAddToCart} cart={cart} user={user} />
              } 
            />
            <Route 
              path="/food/:id" 
              element={
                <FoodDetailPage 
                  onBack={handleBackToHome}
                  onAddToCart={handleAddToCart}
                />
              } 
            />
            <Route 
              path="/cart" 
              element={
                <CartPage 
                  cart={cart}
                  onUpdateCart={handleUpdateCart}
                  onBack={handleBackToHome}
                  user={user}
                />
              }
            />
            <Route 
              path="/favorites" 
              element={<Favorites />} 
            />
            
            {/* Combo Detail */}
            <Route 
              path="/combo/:id" 
              element={
                <ComboDetail 
                  onAddToCart={handleAddToCart}
                />
              } 
            />

            {/* Orders */}
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/order-confirmation/:orderId" 
              element={<OrderConfirmation />}
            />
            {/* Tracking - Leaflet based */}
            <Route 
              path="/track/:id" 
              element={
                <ProtectedRoute>
                  <OrderTracker />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/tracking/:id" 
              element={<OrderTracker />}
            />

            {/* Driver */}
            <Route 
              path="/driver" 
              element={
                <ProtectedRoute>
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/driver/tracking/:orderId" 
              element={
                <ProtectedRoute>
                  <DriverTracking />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/deliver/location" 
              element={
                <ProtectedRoute>
                  <DeliveryLocationShare />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reviews" 
              element={
                <ProtectedRoute>
                  <Reviews />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account" 
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        {!isAdminRoute && <Footer />}
        {/* <FloatingSurpriseButton 
          onAddToCart={handleAddToCart}
          onRestaurantClick={handleRestaurantClick}
        /> */}
      </div>
    );
  }

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;