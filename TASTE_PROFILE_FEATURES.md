# Taste Profile & Surprise Me Features

This document describes the implementation of the "Taste Buds" quiz and "Surprise Me" button features for the food delivery app.

## 🎯 Features Overview

### 1. Taste Buds Quiz
A comprehensive onboarding quiz that creates a personalized "Taste Profile" to customize the user experience.

### 2. Surprise Me Button
For indecisive users - randomly selects highly-rated dishes within their budget based on their preferences.

### 3. Personalized Recommendations
Homepage shows personalized food recommendations based on the user's taste profile.

## 🏗️ Backend Implementation

### Models

#### TasteProfile Model (`server/src/models/TasteProfile.js`)
```javascript
{
  userId: ObjectId, // Reference to User
  preferences: {
    cuisines: [String], // e.g., ['South Indian', 'North Indian']
    spiceLevel: String, // 'mild', 'medium', 'hot', 'very-hot'
    dietaryRestrictions: [String], // e.g., ['vegetarian', 'vegan']
    categories: [String], // e.g., ['curries', 'rice', 'breads']
    priceRange: { min: Number, max: Number },
    mealTypes: [String], // e.g., ['breakfast', 'lunch', 'dinner']
    textures: [String], // e.g., ['crispy', 'soft', 'creamy']
    flavors: [String] // e.g., ['sweet', 'sour', 'spicy']
  },
  quizResponses: [{
    questionId: String,
    answer: Mixed,
    timestamp: Date
  }],
  recommendedFoods: [{
    foodId: ObjectId,
    score: Number, // 0-1 recommendation score
    reason: String,
    addedAt: Date
  }],
  behavior: {
    totalOrders: Number,
    favoriteRestaurants: [ObjectId],
    dislikedFoods: [ObjectId],
    lastUpdated: Date
  },
  isComplete: Boolean,
  completionPercentage: Number
}
```

#### Updated User Model
Added `tasteProfileId` field to reference the user's taste profile.

### API Endpoints

#### Taste Profile Routes (`/api/taste-profile`)

- `GET /` - Get user's taste profile
- `POST /` - Create or update taste profile
- `GET /recommendations` - Get personalized recommendations
- `POST /behavior` - Update user behavior (orders, likes, dislikes)

#### Surprise Me Routes (`/api/surprise-me`)

- `GET /` - Get single surprise dish
- `GET /multiple` - Get multiple surprise options

### Key Features

1. **Smart Recommendations**: Algorithm considers cuisine preferences, dietary restrictions, price range, and user behavior
2. **Fallback System**: If no matches found, falls back to highly-rated dishes
3. **Behavior Tracking**: Learns from user interactions to improve recommendations
4. **Scoring System**: Uses multiple factors to calculate recommendation scores

## 🎨 Frontend Implementation

### Components

#### 1. TasteBudsQuiz (`front/src/components/TasteBudsQuiz/`)
- Interactive quiz with 10 questions
- Progress tracking
- Real-time validation
- Beautiful UI with animations
- Responsive design

**Questions Include:**
- Cuisine preferences
- Spice level tolerance
- Dietary restrictions
- Food categories
- Price range
- Meal timing
- Texture preferences
- Flavor preferences
- Cooking styles
- Ordering frequency

#### 2. SurpriseMeButton (`front/src/components/SurpriseMeButton/`)
- Budget selector
- Animated surprise reveal
- Detailed food information
- Add to cart functionality
- Restaurant navigation

#### 3. PersonalizedRecommendations (`front/src/components/PersonalizedRecommendations/`)
- Displays top 6 recommendations
- Match percentage scoring
- Recommendation reasons
- Quick actions (Add to Cart, View Restaurant)
- Empty state handling

### Integration

#### Updated Hero Component
- Added Taste Quiz button for logged-in users
- Integrated Surprise Me button
- Modal for quiz display

#### Updated Home Page
- Added Personalized Recommendations section
- Positioned after Hero, before other sections
- Conditional rendering based on user state

## 🚀 Usage

### For Users

1. **Take the Quiz**: Click "Taste Quiz" button in the hero section
2. **Answer Questions**: Complete the 10-question quiz about food preferences
3. **Get Recommendations**: View personalized food recommendations on homepage
4. **Use Surprise Me**: Click "Surprise Me!" button for random recommendations
5. **Set Budget**: Choose your budget range for surprise selections

### For Developers

#### Testing the Backend
```bash
# Run the test script
node test-taste-profile.js
```

#### API Usage Examples

**Create Taste Profile:**
```javascript
POST /api/taste-profile
{
  "preferences": {
    "cuisines": ["South Indian", "North Indian"],
    "spiceLevel": "medium",
    "dietaryRestrictions": ["vegetarian"],
    "categories": ["curries", "rice"],
    "priceRange": { "min": 100, "max": 500 }
  },
  "quizResponses": [...]
}
```

**Get Surprise Me:**
```javascript
GET /api/surprise-me?maxPrice=500&minRating=4.0
```

**Get Recommendations:**
```javascript
GET /api/taste-profile/recommendations
```

## 🎨 UI/UX Features

### Design Elements
- **Gradient Backgrounds**: Modern gradient designs
- **Smooth Animations**: Hover effects and transitions
- **Progress Indicators**: Visual progress tracking
- **Responsive Design**: Mobile-first approach
- **Bootstrap Integration**: Consistent styling
- **Icon Usage**: Bootstrap Icons throughout

### Color Scheme
- **Primary**: Blue (#007bff)
- **Success**: Green (#28a745)
- **Warning**: Yellow (#ffc107)
- **Danger**: Red (#dc3545)
- **Info**: Light Blue (#17a2b8)

## 🔧 Configuration

### Environment Variables
- `MONGO_URI`: MongoDB connection string
- `VITE_API_BASE`: Frontend API base URL

### Dependencies
- **Backend**: mongoose, express, cors
- **Frontend**: react, react-bootstrap, react-router-dom

## 📱 Responsive Design

- **Mobile**: Stacked layout, full-width buttons
- **Tablet**: 2-column grid for recommendations
- **Desktop**: 3-column grid for recommendations
- **Touch-friendly**: Large touch targets, easy navigation

## 🧪 Testing

The implementation includes:
- Backend model validation
- API endpoint testing
- Frontend component testing
- Error handling
- Fallback mechanisms

## 🚀 Future Enhancements

1. **Machine Learning**: Implement ML-based recommendation engine
2. **Social Features**: Share taste profiles with friends
3. **Advanced Analytics**: Detailed preference analytics
4. **Seasonal Recommendations**: Time-based suggestions
5. **Restaurant Preferences**: Learn from restaurant choices
6. **Group Ordering**: Collaborative taste profiles

## 📊 Performance Considerations

- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Recommendation caching for better performance
- **Lazy Loading**: Component lazy loading for better UX
- **Image Optimization**: Responsive images with proper sizing

## 🔒 Security

- **Authentication**: JWT-based authentication required
- **Data Validation**: Server-side validation for all inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **Data Privacy**: User data is properly secured and not shared

## 📈 Analytics

The system tracks:
- Quiz completion rates
- Recommendation click-through rates
- Surprise Me usage
- User behavior patterns
- Popular preferences

This implementation provides a comprehensive personalization system that enhances user experience and increases engagement with the food delivery platform.
