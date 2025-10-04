// Test script to verify combo creation
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4000/api';

async function testComboCreation() {
  try {
    // First, let's test if the server is running
    console.log('Testing server connection...');
    const healthCheck = await fetch(`${API_BASE}/restaurants`);
    console.log('Server is running, status:', healthCheck.status);
    
    // Test combo creation with sample data
    const comboData = {
      name: 'Test Combo',
      description: 'A test combo for debugging',
      restaurantId: '507f1f77bcf86cd799439011', // This will fail, but we'll see the error
      items: '1x Test Item, 1x Another Item',
      comboPrice: 299,
      category: 'special',
      tags: ['test', 'debug'],
      isFeatured: false,
      isActive: true
    };
    
    console.log('Testing combo creation with data:', comboData);
    
    const response = await fetch(`${API_BASE}/combos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token' // This will fail auth, but we'll see the error
      },
      body: JSON.stringify(comboData)
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testComboCreation();
