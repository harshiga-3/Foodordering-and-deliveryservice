import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { restaurantAPI, foodAPI, orderAPI, userAPI } from '../utils/api';
import AnalyticsDashboard from '../components/AnalyticsDashboard/AnalyticsDashboard';
import './OwnerDashboard.css';
import { useNavigate } from 'react-router-dom';

const OwnerDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const isOwner = user?.role === 'owner' || user?.role === 'Owner';

  // Food management states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  
  // Restaurant management states
  const [showAddRestaurantModal, setShowAddRestaurantModal] = useState(false);
  const [showEditRestaurantModal, setShowEditRestaurantModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  
  // Combo management states
  const [showAddComboModal, setShowAddComboModal] = useState(false);
  const [showEditComboModal, setShowEditComboModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [combos, setCombos] = useState([]);
  const [selectedRestaurantForCombo, setSelectedRestaurantForCombo] = useState('');
  const [comboItems, setComboItems] = useState([]);
  const [comboImage, setComboImage] = useState(null);
  const [comboImagePreview, setComboImagePreview] = useState('');
  // Edit combo form state
  const [editComboForm, setEditComboForm] = useState({
    name: '',
    description: '',
    comboPrice: '',
    category: 'special',
    tags: '',
    isFeatured: false,
    isActive: true,
    validUntil: ''
  });
  const [editComboImagePreview, setEditComboImagePreview] = useState('');
  const [restaurantFoods, setRestaurantFoods] = useState([]);
  const [loadingRestaurantFoods, setLoadingRestaurantFoods] = useState(false);
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(false);

  // Data states
  const [ownerRestaurants, setOwnerRestaurants] = useState([]);
  const [ownerFoods, setOwnerFoods] = useState([]);
  const [ownerOrders, setOwnerOrders] = useState([]);
  const [assigning, setAssigning] = useState({});
  const [deliveryUsers, setDeliveryUsers] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    restaurantId: '',
    image: '',
    isVeg: true,
    tags: '',
    foodType: ''
  });
  
  const [restaurantFormData, setRestaurantFormData] = useState({
    name: '',
    cuisine: '',
    location: '',
    image: '',
    tags: [],
    latitude: '',
    longitude: ''
  });
  
  const [imagePreview, setImagePreview] = useState('');
  const [restaurantImagePreview, setRestaurantImagePreview] = useState('');

  const categories = useMemo(() => ['Breakfast', 'Biryani', 'Curry', 'Bread', 'Dessert', 'Snacks', 'Beverages'], []);
  const foodTypes = useMemo(() => ['dosa','idli','biryani','curry','bread','dessert','beverage','snack'], []);
  const cuisineTypes = useMemo(() => ['South Indian', 'North Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese', 'Mediterranean', 'Fusion'], []);
  const locations = useMemo(() => ['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad'], []);

  // Image resize helper
  const resizeImageToBase64 = (file, maxSize = 1024, quality = 0.9) => new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => {
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxSize / Math.max(width, height));
        const targetW = Math.round(width * scale);
        const targetH = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetW, targetH);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result || '';
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Load owner's data
  useEffect(() => {
    if (isOwner && user?.id) {
      loadOwnerData();
      loadOwnerOrders();
      loadDeliveryUsers();
      loadCombos();
    }
  }, [isOwner, user?.id]);

  const loadOwnerData = async () => {
    setLoading(true);
    try {
      console.log('Loading owner data for user:', user.id);
      const [restaurants, foods] = await Promise.all([
        restaurantAPI.getByOwner(user.id),
        foodAPI.getByOwner(user.id)
      ]);
      
      console.log('Restaurants loaded:', restaurants);
      console.log('Foods loaded:', foods);
      
      setOwnerRestaurants(restaurants || []);
      setOwnerFoods(foods || []);
      
      if (restaurants && restaurants.length > 0 && !formData.restaurantId) {
        setFormData(prev => ({ ...prev, restaurantId: restaurants[0]._id }));
      }
    } catch (error) {
      console.error('Error loading owner data:', error);
      setError('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOwnerOrders = async () => {
    try {
      const orders = await orderAPI.getOwnerOrders();
      setOwnerOrders(orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Failed to load orders: ' + err.message);
    }
  };

  const loadDeliveryUsers = async () => {
    try {
      const users = await userAPI.list('delivery');
      setDeliveryUsers(users || []);
    } catch (e) {
      console.error('Failed to load delivery users:', e);
    }
  };

  const handleAssign = async (orderId, deliveryUserId) => {
    if (!deliveryUserId) return;
    setAssigning((prev) => ({ ...prev, [orderId]: true }));
    setError(null);
    try {
      await orderAPI.assignDelivery(orderId, deliveryUserId);
      await loadOwnerOrders();
      setSuccess('Order assigned successfully.');
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setError('Failed to assign: ' + e.message);
    } finally {
      setAssigning((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const loadCombos = async () => {
    if (!user?.id || !token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/combos/owner/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Combos loaded from database:', data);
        console.log('Number of combos:', data.length);
        setCombos(data || []);
      } else {
        console.error('Failed to load combos:', response.status, response.statusText);
        setCombos([]);
      }
    } catch (error) {
      console.error('Error loading combos:', error);
      setCombos([]);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      description: '', 
      price: '', 
      category: '', 
      restaurantId: ownerRestaurants[0]?._id || '', 
      image: '', 
      isVeg: true, 
      tags: '', 
      foodType: '' 
    });
    setImagePreview('');
  };
  
  const resetRestaurantForm = () => {
    setRestaurantFormData({ name: '', cuisine: '', location: '', image: '', tags: [], latitude: '', longitude: '' });
    setRestaurantImagePreview('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const resized = await resizeImageToBase64(file, 1024, 0.9);
      setFormData(prev => ({ ...prev, image: resized }));
      setImagePreview(resized);
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result || '';
        setFormData(prev => ({ ...prev, image: base64 }));
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRestaurantFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const resized = await resizeImageToBase64(file, 1024, 0.9);
      setRestaurantFormData(prev => ({ ...prev, image: resized }));
      setRestaurantImagePreview(resized);
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result || '';
        setRestaurantFormData(prev => ({ ...prev, image: base64 }));
        setRestaurantImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (!formData.name.trim()) return setError('Please enter a food name.');
      if (!formData.description.trim()) return setError('Please enter a description.');
      if (!formData.category) return setError('Please select a category.');
      if (!formData.foodType) return setError('Please select a food type.');
      if (!formData.restaurantId) return setError('Please select a restaurant.');
      const priceNum = parseFloat(formData.price);
      if (Number.isNaN(priceNum) || priceNum <= 0) return setError('Please enter a valid price greater than 0.');
      const imageData = formData.image || imagePreview;
      if (!imageData) return setError('Please upload an image.');

      const foodData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: priceNum,
        category: formData.category,
        restaurantId: formData.restaurantId,
        image: imageData,
        isVeg: !!formData.isVeg,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        foodType: formData.foodType
      };
      
      await foodAPI.create(foodData);
      await loadOwnerData();
      setShowAddModal(false);
      resetForm();
      setSuccess('Food item added successfully.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (error) {
      setError('Failed to add food: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (!restaurantFormData.name.trim()) return setError('Please enter a restaurant name.');
      if (!restaurantFormData.cuisine) return setError('Please select a cuisine type.');
      if (!restaurantFormData.location) return setError('Please select a location.');
      const imageData = restaurantFormData.image || restaurantImagePreview;
      if (!imageData) return setError('Please upload an image.');

      const restaurantData = {
        name: restaurantFormData.name.trim(),
        cuisine: restaurantFormData.cuisine,
        location: restaurantFormData.location,
        image: imageData,
        tags: restaurantFormData.tags,
        rating: 4.0,
        deliveryTime: "30-40 min",
        costForTwo: "₹500 for two",
        isActive: true,
        address: {
          street: "Restaurant Street",
          city: restaurantFormData.location,
          state: "Tamil Nadu",
          pincode: "600001"
        },
        ...(restaurantFormData.latitude && restaurantFormData.longitude ? {
          locationGeo: {
            type: 'Point',
            coordinates: [Number(restaurantFormData.longitude), Number(restaurantFormData.latitude)]
          }
        } : {})
      };
      
      console.log('Creating restaurant with data:', restaurantData);
      const newRestaurant = await restaurantAPI.create(restaurantData);
      console.log('Restaurant created:', newRestaurant);
      
      await loadOwnerData();
      setShowAddRestaurantModal(false);
      resetRestaurantForm();
      setSuccess('Restaurant added successfully.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (error) {
      console.error('Restaurant creation failed:', error);
      setError('Failed to add restaurant: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      description: food.description,
      price: String(food.price),
      category: food.category,
      restaurantId: food.restaurantId._id || food.restaurantId,
      image: food.image,
      isVeg: food.isVeg,
      tags: Array.isArray(food.tags) ? food.tags.join(', ') : '',
      foodType: food.foodType || ''
    });
    setImagePreview(food.image || '');
    setShowEditModal(true);
  };
  
  const openEditRestaurantModal = (restaurant) => {
    setEditingRestaurant(restaurant);
    setRestaurantFormData({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      location: restaurant.location,
      image: restaurant.image,
      tags: restaurant.tags || [],
      latitude: Array.isArray(restaurant.locationGeo?.coordinates) ? String(restaurant.locationGeo.coordinates[1]) : '',
      longitude: Array.isArray(restaurant.locationGeo?.coordinates) ? String(restaurant.locationGeo.coordinates[0]) : ''
    });
    setRestaurantImagePreview(restaurant.image || '');
    setShowEditRestaurantModal(true);
  };

  const handleEditFood = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const foodData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        restaurantId: formData.restaurantId,
        image: formData.image || imagePreview,
        isVeg: !!formData.isVeg,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        foodType: formData.foodType
      };
      
      await foodAPI.update(editingFood._id, foodData);
      await loadOwnerData();
      setShowEditModal(false);
      setEditingFood(null);
      resetForm();
      setSuccess('Food item updated successfully.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (error) {
      setError('Failed to update food: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditRestaurant = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updates = {
        name: restaurantFormData.name.trim(),
        cuisine: restaurantFormData.cuisine,
        location: restaurantFormData.location,
        image: restaurantFormData.image || restaurantImagePreview,
        tags: restaurantFormData.tags,
        ...(restaurantFormData.latitude && restaurantFormData.longitude ? {
          locationGeo: {
            type: 'Point',
            coordinates: [Number(restaurantFormData.longitude), Number(restaurantFormData.latitude)]
          }
        } : {})
      };
      
      await restaurantAPI.update(editingRestaurant._id, updates);
      await loadOwnerData();
      setShowEditRestaurantModal(false);
      setEditingRestaurant(null);
      resetRestaurantForm();
      setSuccess('Restaurant updated successfully.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (error) {
      setError('Failed to update restaurant: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFood = async (id) => {
    if (window.confirm('Are you sure you want to delete this food item?')) {
      setLoading(true);
      try {
        await foodAPI.delete(id);
        await loadOwnerData();
        setSuccess('Food item deleted successfully.');
        setTimeout(() => setSuccess(null), 2500);
      } catch (error) {
        setError('Failed to delete food: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (window.confirm('Are you sure you want to delete this restaurant? This will also delete all associated food items.')) {
      setLoading(true);
      try {
        await restaurantAPI.delete(id);
        await loadOwnerData();
        setSuccess('Restaurant deleted successfully.');
        setTimeout(() => setSuccess(null), 2500);
      } catch (error) {
        setError('Failed to delete restaurant: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleRestaurantStatus = async (restaurantId) => {
    try {
      setLoading(true);
      console.log('Attempting to toggle status for restaurant:', restaurantId);
      const response = await restaurantAPI.toggleStatus(restaurantId);
      console.log('Toggle status response:', response);
      setSuccess(response.message);
      await loadOwnerData();
      setTimeout(() => setSuccess(null), 2500);
    } catch (error) {
      console.error('Toggle status error:', error);
      setError(error.message || 'Failed to toggle restaurant status');
      setTimeout(() => setError(null), 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCombo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting combo creation...');
      console.log('Selected restaurant:', selectedRestaurantForCombo);
      console.log('Available restaurants:', ownerRestaurants);
      console.log('Selected restaurant details:', ownerRestaurants.find(r => r._id === selectedRestaurantForCombo));
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      if (!selectedRestaurantForCombo) {
        setError('Please select a restaurant');
        return;
      }
      
      const formData = new FormData(e.target);
      
      if (!formData.get('items') || formData.get('items').trim() === '') {
        setError('Please describe the items included in this combo');
        return;
      }
      
      const comboData = {
        name: formData.get('name'),
        description: formData.get('description'),
        restaurantId: selectedRestaurantForCombo,
        items: formData.get('items'),
        comboPrice: parseFloat(formData.get('comboPrice')),
        category: formData.get('category'),
        tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
        isFeatured: formData.get('isFeatured') === 'on',
        isActive: true,
        image: comboImagePreview || 'images/combo/default-combo.jpg'
      };

      console.log('Combo data to send:', comboData);

      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/combos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(comboData)
      });

      console.log('API response status:', response.status);
      
      if (response.ok) {
          const result = await response.json();
        console.log('Combo created successfully and saved to database:', result);
        console.log('Combo ID:', result._id);
        console.log('Combo name:', result.name);
        console.log('Restaurant ID:', result.restaurantId);
        setSuccess('Combo created successfully and saved to database!');
          setShowAddComboModal(false);
          setComboItems([]);
          setSelectedRestaurantForCombo('');
          setComboImage(null);
          setComboImagePreview('');
          e.target.reset();
          await loadCombos();
          setTimeout(() => setSuccess(null), 2500);
      } else {
          const errorData = await response.json();
        console.error('API error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        setError(errorData.message || `Server error (${response.status}): ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating combo:', error);
      setError('Failed to create combo: ' + (error.message || 'Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleComboImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setComboImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setComboImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open edit combo modal with prefilled data
  const openEditComboModal = (combo) => {
    setEditingCombo(combo);
    setEditComboForm({
      name: combo.name || '',
      description: combo.description || '',
      comboPrice: String(combo.comboPrice ?? ''),
      category: combo.category || 'special',
      tags: Array.isArray(combo.tags) ? combo.tags.join(', ') : (combo.tags || ''),
      isFeatured: !!combo.isFeatured,
      isActive: !!combo.isActive,
      validUntil: combo.validUntil ? String(combo.validUntil).slice(0, 10) : ''
    });
    setEditComboImagePreview(combo.image || '');
    setShowEditComboModal(true);
  };

  const handleEditComboImageChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEditComboImagePreview(ev.target?.result || '');
    reader.readAsDataURL(file);
  };

  // Submit combo edits
  const handleEditComboSubmit = async (e) => {
    e.preventDefault();
    if (!editingCombo) return;
    setLoading(true);
    setError(null);
    try {
      const base = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
      const payload = {
        name: editComboForm.name?.trim(),
        description: editComboForm.description?.trim(),
        comboPrice: parseFloat(editComboForm.comboPrice),
        category: editComboForm.category,
        tags: editComboForm.tags ? editComboForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        isFeatured: !!editComboForm.isFeatured,
        isActive: !!editComboForm.isActive,
        ...(editComboForm.validUntil ? { validUntil: editComboForm.validUntil } : {}),
        ...(editComboImagePreview ? { image: editComboImagePreview } : {})
      };
      const res = await fetch(`${base}/api/combos/${editingCombo._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      await loadCombos();
      setSuccess('Combo updated successfully.');
      setShowEditComboModal(false);
      setEditingCombo(null);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to update combo: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Delete combo
  const handleDeleteCombo = async (comboId) => {
    if (!window.confirm('Are you sure you want to delete this combo offer?')) return;
    setLoading(true);
    setError(null);
    try {
      const base = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
      const res = await fetch(`${base}/api/combos/${comboId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      await loadCombos();
      setSuccess('Combo deleted successfully.');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to delete combo: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Helpers: set coordinates without manual lat/lng
  const fillRestaurantGeoFromBrowser = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      setRestaurantFormData(prev => ({
        ...prev,
        latitude: String(pos.coords.latitude),
        longitude: String(pos.coords.longitude)
      }));
    }, () => setError('Failed to get current location'), { enableHighAccuracy: true, timeout: 10000 });
  };

  const geocodeFromAddress = async () => {
    try {
      const query = [restaurantFormData.name, restaurantFormData.location].filter(Boolean).join(', ');
      if (!query) { setError('Please enter restaurant name or location first'); return; }
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setRestaurantFormData(prev => ({ ...prev, latitude: String(data[0].lat), longitude: String(data[0].lon) }));
        setSuccess('Coordinates filled from address');
        setTimeout(() => setSuccess(null), 1500);
      } else {
        setError('Could not find coordinates for that address');
      }
    } catch (e) {
      setError('Geocoding failed');
    }
  };

  // Early return conditions
  if (!isOwner) {
    return (
      <Container className="py-5 text-center">
        <h3>Access denied</h3>
        <p className="text-muted">Only restaurant owners can access this page.</p>
        <Button variant="primary" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-5 text-center">
        <h3>Authentication Required</h3>
        <p className="text-muted">Please log in to access the owner dashboard.</p>
        <Button variant="primary" onClick={() => navigate('/login')}>
          Login
        </Button>
      </Container>
    );
  }

  if (loading && ownerRestaurants.length === 0) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your restaurant data...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="dashboard-title">Restaurant Owner Dashboard</h1>
          <p className="dashboard-subtitle">Manage your restaurants and food menu</p>
          {success && (
            <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="mt-2">
              {success}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible className="mt-2">
              {error}
            </Alert>
          )}
        </Col>
        <Col xs="auto" className="mt-3 mt-md-0">
          <Button variant="outline-secondary" onClick={() => window.print()}>Print</Button>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="analytics" title="Analytics">
          <Card className="mb-4">
            <Card.Body>
              <AnalyticsDashboard />
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="foods" title="Food Items">
          <Row className="mb-4">
            <Col>
              <Button 
                variant="primary" 
                size="lg" 
                onClick={() => setShowAddModal(true)}
                disabled={ownerRestaurants.length === 0}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add New Food Item
              </Button>
              {ownerRestaurants.length === 0 && (
                <Alert variant="warning" className="mt-2">
                  You need to create a restaurant first before adding food items.
                </Alert>
              )}
            </Col>
          </Row>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Your Food Items ({ownerFoods.length})</h5>
            </Card.Header>
            <Card.Body>
              {ownerFoods.length === 0 ? (
                <p className="text-muted text-center py-4">
                  {ownerRestaurants.length === 0 
                    ? 'No restaurants created yet. Create a restaurant first to add food items.' 
                    : 'No food items added yet.'}
                </p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Restaurant</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerFoods.map((food) => (
                      <tr key={food._id}>
                        <td>
                          <img 
                            src={food.image} 
                            alt={food.name} 
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        </td>
                        <td>{food.name}</td>
                        <td>{food.category}</td>
                        <td>₹{food.price}</td>
                        <td>
                          {food.restaurantId?.name || `Restaurant ${food.restaurantId}`}
                        </td>
                        <td>
                          <Badge bg={food.isVeg ? 'success' : 'danger'}>
                            {food.isVeg ? 'Veg' : 'Non-Veg'}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => openEditModal(food)}
                            className="me-2"
                            disabled={loading}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleDeleteFood(food._id)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="restaurants" title="Restaurants">
          <Row className="mb-4">
            <Col>
              <Button variant="success" size="lg" onClick={() => setShowAddRestaurantModal(true)}>
                <i className="bi bi-plus-circle me-2"></i>
                Add New Restaurant
              </Button>
            </Col>
          </Row>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Your Restaurants ({ownerRestaurants.length})</h5>
            </Card.Header>
            <Card.Body>
              {ownerRestaurants.length === 0 ? (
                <p className="text-muted text-center py-4">No restaurants created yet.</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Cuisine</th>
                      <th>Location</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerRestaurants.map((restaurant) => (
                      <tr key={restaurant._id}>
                        <td>
                          <img 
                            src={restaurant.image} 
                            alt={restaurant.name} 
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        </td>
                        <td>{restaurant.name}</td>
                        <td>{restaurant.cuisine}</td>
                        <td>{restaurant.location}</td>
                        <td>{restaurant.rating}</td>
                        <td>
                          <Badge 
                            bg={restaurant.isOpen ? 'success' : 'danger'}
                            className="me-2"
                          >
                            {restaurant.isOpen ? 'Open' : 'Closed'}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant={restaurant.isOpen ? 'outline-danger' : 'outline-success'}
                            size="sm" 
                            onClick={() => handleToggleRestaurantStatus(restaurant._id)}
                            className="me-2"
                            disabled={loading}
                          >
                            {restaurant.isOpen ? 'Close' : 'Open'}
                          </Button>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => openEditRestaurantModal(restaurant)}
                            className="me-2"
                            disabled={loading}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleDeleteRestaurant(restaurant._id)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="combos" title="Combo Offers">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Combo Offers Management</h5>
                <Button variant="primary" onClick={() => setShowAddComboModal(true)}>
                  <i className="bi bi-plus-circle me-1"></i>
                  Add New Combo
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {combos.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-gift display-1 text-muted"></i>
                  <h5 className="mt-3 text-muted">No combo offers yet</h5>
                  <p className="text-muted">Create your first combo offer to attract more customers!</p>
                  <Button variant="primary" onClick={() => setShowAddComboModal(true)}>
                    Create Combo Offer
                  </Button>
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Combo Name</th>
                      <th>Restaurant</th>
                      <th>Items</th>
                      <th>Combo Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combos.map((combo) => (
                      <tr key={combo._id}>
                        <td>
                          <img
                            src={combo.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0zMCAxNEwzNiAyMEgyNEwzMCAxNFoiIGZpbGw9IiNDQ0NDQ0MiLz4KPGNpcmNsZSBjeD0iMzAiIGN5PSIyNiIgcj0iNCIgZmlsbD0iI0NDQ0NDQyIvPgo8dGV4dCB4PSIzMCIgeT0iMzIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4Ij5Db21ibzwvdGV4dD4KPC9zdmc+Cg=='}
                            alt={combo.name}
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            className="img-thumbnail"
                          />
                        </td>
                        <td>
                          <div>
                            <strong>{combo.name}</strong>
                            <br />
                            <small className="text-muted">{combo.description}</small>
                          </div>
                        </td>
                        <td>{combo.restaurantId?.name}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {typeof combo.items === 'string' ? (
                              <span className="text-muted">{combo.items}</span>
                            ) : (
                              combo.items?.slice(0, 3).map((item, index) => (
                              <Badge key={index} bg="secondary" className="small">
                                {item.name} x{item.quantity}
                              </Badge>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="text-success fw-bold">₹{combo.comboPrice}</td>
                        <td>
                          <Badge bg={combo.isActive ? 'success' : 'secondary'}>
                            {combo.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => openEditComboModal(combo)}
                            disabled={loading}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleDeleteCombo(combo._id)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="delivery" title="Delivery Orders">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Pending / Unassigned Orders</h5>
                <Button variant="outline-secondary" size="sm" onClick={loadOwnerOrders}>Refresh</Button>
              </div>
            </Card.Header>
            <Card.Body>
              {ownerOrders.length === 0 ? (
                <p className="text-muted mb-0">No orders yet.</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Assigned To</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerOrders.map((o) => (
                      <tr key={o._id}>
                        <td>#{o.orderId}</td>
                        <td><Badge bg="secondary">{o.orderStatus || o.status}</Badge></td>
                        <td>₹{o.finalAmount ?? o.totalAmount ?? o.totalPrice}</td>
                        <td>
                          {o.assignedTo ? (
                            typeof o.assignedTo === 'object' ? (o.assignedTo.name || o.assignedTo.email || o.assignedTo._id) : String(o.assignedTo)
                          ) : (
                            <span className="text-muted">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2 align-items-center">
                            <Form.Select size="sm" style={{ maxWidth: 260 }} onChange={(e) => (o.__assignCandidate = e.target.value)} defaultValue={o.__assignCandidate || ''}>
                              <option value="">Select delivery person</option>
                              {deliveryUsers.map((u) => (
                                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                              ))}
                            </Form.Select>
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={assigning[o.orderId]}
                              onClick={() => handleAssign(o.orderId, o.__assignCandidate)}
                            >
                              {assigning[o.orderId] ? 'Assigning...' : 'Assign'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Add Food Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Food Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddFood}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Food Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter food name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Food Type *</Form.Label>
                  <Form.Select
                    value={formData.foodType}
                    onChange={(e) => setFormData({...formData, foodType: e.target.value})}
                    required
                  >
                    <option value="">Select Food Type</option>
                    {foodTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Restaurant *</Form.Label>
                  <Form.Select
                    value={formData.restaurantId}
                    onChange={(e) => setFormData({...formData, restaurantId: e.target.value})}
                    required
                  >
                    <option value="">Select Restaurant</option>
                    {ownerRestaurants.map(restaurant => (
                      <option key={restaurant._id} value={restaurant._id}>{restaurant.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vegetarian</Form.Label>
                  <Form.Check
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({...formData, isVeg: e.target.checked})}
                    label="Is vegetarian"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter food description"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tags</Form.Label>
              <Form.Control
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="Enter tags separated by commas"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Food Image *</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                  />
                </div>
              )}
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Food Item'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Combo Modal */}
      <Modal show={showEditComboModal} onHide={() => setShowEditComboModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Combo Offer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditComboSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Combo Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editComboForm.name}
                    onChange={(e) => setEditComboForm({ ...editComboForm, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Combo Price (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    value={editComboForm.comboPrice}
                    onChange={(e) => setEditComboForm({ ...editComboForm, comboPrice: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editComboForm.description}
                onChange={(e) => setEditComboForm({ ...editComboForm, description: e.target.value })}
                required
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={editComboForm.category}
                    onChange={(e) => setEditComboForm({ ...editComboForm, category: e.target.value })}
                  >
                    <option value="special">Special</option>
                    <option value="family">Family</option>
                    <option value="couple">Couple</option>
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tags (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    value={editComboForm.tags}
                    onChange={(e) => setEditComboForm({ ...editComboForm, tags: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Valid Until</Form.Label>
                  <Form.Control
                    type="date"
                    value={editComboForm.validUntil}
                    onChange={(e) => setEditComboForm({ ...editComboForm, validUntil: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Feature on homepage"
                    checked={editComboForm.isFeatured}
                    onChange={(e) => setEditComboForm({ ...editComboForm, isFeatured: e.target.checked })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    checked={editComboForm.isActive}
                    onChange={(e) => setEditComboForm({ ...editComboForm, isActive: e.target.checked })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Combo Image</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleEditComboImageChange} />
              {editComboImagePreview && (
                <div className="mt-2">
                  <img
                    src={editComboImagePreview}
                    alt="Preview"
                    style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover' }}
                    className="img-thumbnail"
                  />
                </div>
              )}
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditComboModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Combo'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Food Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Food Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditFood}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Food Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter food name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Food Type *</Form.Label>
                  <Form.Select
                    value={formData.foodType}
                    onChange={(e) => setFormData({...formData, foodType: e.target.value})}
                    required
                  >
                    <option value="">Select Food Type</option>
                    {foodTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Restaurant *</Form.Label>
                  <Form.Select
                    value={formData.restaurantId}
                    onChange={(e) => setFormData({...formData, restaurantId: e.target.value})}
                    required
                  >
                    {ownerRestaurants.map(restaurant => (
                      <option key={restaurant._id} value={restaurant._id}>{restaurant.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vegetarian</Form.Label>
                  <Form.Check
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({...formData, isVeg: e.target.checked})}
                    label="Is vegetarian"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter food description"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tags</Form.Label>
              <Form.Control
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="Enter tags separated by commas"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Food Image *</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                  />
                </div>
              )}
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Food Item'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Add Restaurant Modal */}
      <Modal show={showAddRestaurantModal} onHide={() => setShowAddRestaurantModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Restaurant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddRestaurant}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Restaurant Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={restaurantFormData.name}
                    onChange={(e) => setRestaurantFormData({...restaurantFormData, name: e.target.value})}
                    placeholder="Enter restaurant name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cuisine Type *</Form.Label>
                  <Form.Select
                    value={restaurantFormData.cuisine}
                    onChange={(e) => setRestaurantFormData({...restaurantFormData, cuisine: e.target.value})}
                    required
                  >
                    <option value="">Select Cuisine</option>
                    {cuisineTypes.map(cuisine => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location *</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      list="cityOptions"
                      value={restaurantFormData.location}
                      onChange={(e) => setRestaurantFormData({ ...restaurantFormData, location: e.target.value })}
                      placeholder="Type a place (e.g., Chennai Central)"
                      required
                    />
                    <Button variant="outline-secondary" onClick={geocodeFromAddress}>Find on Map</Button>
                  </div>
                  <datalist id="cityOptions">
                    {locations.map(city => (<option key={city} value={city} />))}
                  </datalist>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tags</Form.Label>
                  <Form.Control
                    type="text"
                    value={restaurantFormData.tags.join(', ')}
                    onChange={(e) => setRestaurantFormData({
                      ...restaurantFormData, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    placeholder="Enter tags separated by commas"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Restaurant Image *</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleRestaurantFileChange}
                required
              />
              {restaurantImagePreview && (
                <div className="mt-2">
                  <img 
                    src={restaurantImagePreview} 
                    alt="Preview" 
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                  />
                </div>
              )}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Latitude</Form.Label>
                  <Form.Control
                    type="text"
                    value={restaurantFormData.latitude}
                    onChange={(e) => setRestaurantFormData({ ...restaurantFormData, latitude: e.target.value })}
                    placeholder="e.g., 13.0827"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Longitude</Form.Label>
                  <Form.Control
                    type="text"
                    value={restaurantFormData.longitude}
                    onChange={(e) => setRestaurantFormData({ ...restaurantFormData, longitude: e.target.value })}
                    placeholder="e.g., 80.2707"
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex gap-2 mb-3">
              <Button variant="outline-primary" size="sm" onClick={fillRestaurantGeoFromBrowser}>
                Use Current Location
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={geocodeFromAddress}>
                Get from Address
              </Button>
            </div>
            <div className="d-flex gap-2 mb-3">
              <Button variant="outline-primary" size="sm" onClick={fillRestaurantGeoFromBrowser}>
                Use Current Location
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={geocodeFromAddress}>
                Get from Address
              </Button>
            </div>

            {restaurantFormData.latitude && restaurantFormData.longitude && (
              <div className="mb-3">
                <div className="ratio ratio-16x9">
                  <iframe
                    title="map-preview-add"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(restaurantFormData.latitude)},${encodeURIComponent(restaurantFormData.longitude)}&z=15&output=embed`}
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowAddRestaurantModal(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="success" type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Restaurant'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Restaurant Modal */}
      <Modal show={showEditRestaurantModal} onHide={() => setShowEditRestaurantModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Restaurant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditRestaurant}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Restaurant Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={restaurantFormData.name}
                    onChange={(e) => setRestaurantFormData({...restaurantFormData, name: e.target.value})}
                    placeholder="Enter restaurant name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cuisine Type *</Form.Label>
                  <Form.Select
                    value={restaurantFormData.cuisine}
                    onChange={(e) => setRestaurantFormData({...restaurantFormData, cuisine: e.target.value})}
                    required
                  >
                    <option value="">Select Cuisine</option>
                    {cuisineTypes.map(cuisine => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location *</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      list="cityOptionsEdit"
                      value={restaurantFormData.location}
                      onChange={(e) => setRestaurantFormData({ ...restaurantFormData, location: e.target.value })}
                      placeholder="Type a place (e.g., Chennai Central)"
                      required
                    />
                    <Button variant="outline-secondary" onClick={geocodeFromAddress}>Find on Map</Button>
                  </div>
                  <datalist id="cityOptionsEdit">
                    {locations.map(city => (<option key={city} value={city} />))}
                  </datalist>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tags</Form.Label>
                  <Form.Control
                    type="text"
                    value={restaurantFormData.tags.join(', ')}
                    onChange={(e) => setRestaurantFormData({
                      ...restaurantFormData, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    placeholder="Enter tags separated by commas"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Restaurant Image *</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleRestaurantFileChange}
              />
              {restaurantImagePreview && (
                <div className="mt-2">
                  <img 
                    src={restaurantImagePreview} 
                    alt="Preview" 
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                  />
                </div>
              )}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Latitude</Form.Label>
                  <Form.Control
                    type="text"
                    value={restaurantFormData.latitude}
                    onChange={(e) => setRestaurantFormData({ ...restaurantFormData, latitude: e.target.value })}
                    placeholder="e.g., 13.0827"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Longitude</Form.Label>
                  <Form.Control
                    type="text"
                    value={restaurantFormData.longitude}
                    onChange={(e) => setRestaurantFormData({ ...restaurantFormData, longitude: e.target.value })}
                    placeholder="e.g., 80.2707"
                  />
                </Form.Group>
              </Col>
            </Row>

            {restaurantFormData.latitude && restaurantFormData.longitude && (
              <div className="mb-3">
                <div className="ratio ratio-16x9">
                  <iframe
                    title="map-preview-edit"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(restaurantFormData.latitude)},${encodeURIComponent(restaurantFormData.longitude)}&z=15&output=embed`}
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditRestaurantModal(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Restaurant'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Add Combo Modal */}
      <Modal show={showAddComboModal} onHide={() => {
        setShowAddComboModal(false);
        setRestaurantFoods([]);
        setComboItems([]);
        setSelectedRestaurantForCombo('');
      }} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Create New Combo Offer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddCombo}>
            <div className="alert alert-info mb-4">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Step 1:</strong> Select a restaurant from the dropdown below
              <br />
              <strong>Step 2:</strong> Describe the items included in your combo
              <br />
              <strong>Step 3:</strong> Set your combo price and details
            </div>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Combo Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="e.g., Weekend Family Feast"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Restaurant *</Form.Label>
               <Form.Select
                 value={selectedRestaurantForCombo}
                 onChange={(e) => {
                   console.log('Restaurant selected:', e.target.value);
                   setSelectedRestaurantForCombo(e.target.value);
                      setComboItems([]);
                 }}
                 required
               >
                    <option value="">Select Restaurant</option>
                    {ownerRestaurants.length > 0 ? (
                      ownerRestaurants.map((restaurant) => (
                        <option key={restaurant._id} value={restaurant._id}>
                          {restaurant.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No restaurants available</option>
                    )}
                  </Form.Select>
                  {ownerRestaurants.length === 0 && (
                    <Form.Text className="text-warning">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      You need to create a restaurant first before creating combo offers.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                placeholder="Describe what's included in this combo..."
                required
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select name="category">
                    <option value="special">Special</option>
                    <option value="family">Family</option>
                    <option value="couple">Couple</option>
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Combo Price (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="comboPrice"
                    step="0.01"
                    min="0"
                    placeholder="299"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tags (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    placeholder="popular, weekend, family"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="isFeatured"
                label="Feature this combo on homepage"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Combo Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleComboImageChange}
                className="mb-2"
              />
              {comboImagePreview && (
                <div className="mt-2">
                  <img
                    src={comboImagePreview}
                    alt="Combo preview"
                    style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover' }}
                    className="img-thumbnail"
                  />
                </div>
              )}
              <Form.Text className="text-muted">
                Upload an attractive image for your combo offer (optional)
              </Form.Text>
            </Form.Group>

            <div className="mb-4">
              <h6>Combo Items Details</h6>
              <Form.Group className="mb-3">
                <Form.Label>Items Included in Combo *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="items"
                  placeholder="Enter the food items included in this combo (e.g., 1x Chicken Biryani, 2x Samosas, 1x Raita, 1x Gulab Jamun)"
                  required
                />
                <Form.Text className="text-muted">
                  Describe what items are included in this combo offer
                </Form.Text>
              </Form.Group>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowAddComboModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading || !selectedRestaurantForCombo}
              >
                {loading ? 'Creating...' : 'Create Combo'}
              </Button>
            </div>
            
            {!selectedRestaurantForCombo && (
              <div className="alert alert-warning mt-2">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Please select a restaurant for your combo.
              </div>
            )}
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default OwnerDashboard;
