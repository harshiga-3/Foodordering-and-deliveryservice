# Owner Analytics Dashboard

This document describes the comprehensive Owner Analytics Dashboard implementation for the food delivery app, providing restaurant owners with detailed insights into their business performance.

## 🎯 Features Overview

### 1. Daily Order Analysis
- **Total orders** with status breakdown (pending, confirmed, preparing, out_for_delivery, delivered, cancelled)
- **Real-time order tracking** showing recent orders from the last 2 hours
- **Order volume trends** and comparisons across different time periods
- **Hourly distribution patterns** showing peak ordering times

### 2. Financial Performance
- **Daily revenue calculations** with gain/loss analysis compared to previous periods
- **Order value statistics** (average, highest, lowest order values)
- **Payment method breakdown** showing distribution of payment types
- **Profit margins** calculation and tracking
- **Revenue trends** over time with visual charts

### 3. Time-based Analytics
- **Day-to-day order and income comparisons** for the last 7 days
- **Hourly order distribution patterns** showing peak hours
- **Weekly/Monthly performance trends** with historical data
- **Seasonal performance insights** and peak time identification

## 🏗️ Backend Implementation

### API Endpoints (`/api/analytics`)

#### 1. Daily Orders Analysis
```
GET /api/analytics/daily-orders?period=today&date=2024-01-15
```

**Query Parameters:**
- `period`: today, yesterday, week, month
- `date`: specific date (YYYY-MM-DD format)

**Response:**
```json
{
  "totalOrders": 45,
  "statusBreakdown": {
    "pending": 5,
    "confirmed": 8,
    "preparing": 12,
    "out_for_delivery": 15,
    "delivered": 3,
    "cancelled": 2
  },
  "hourlyDistribution": {
    "0": 0, "1": 0, ..., "23": 3
  },
  "realTimeOrders": [...],
  "period": "today",
  "dateRange": { "startDate": "...", "endDate": "..." }
}
```

#### 2. Financial Performance
```
GET /api/analytics/financial-performance?period=today
```

**Response:**
```json
{
  "dailyRevenue": 12500.50,
  "revenueGainLoss": 2500.25,
  "orderValueStats": {
    "average": 278.90,
    "highest": 850.00,
    "lowest": 120.50
  },
  "paymentMethodBreakdown": {
    "razorpay": 25,
    "cod": 15,
    "stripe": 5
  },
  "profitMargins": 3750.15,
  "totalOrders": 45,
  "period": "today"
}
```

#### 3. Time Analytics
```
GET /api/analytics/time-analytics?type=all
```

**Query Parameters:**
- `type`: hourly, daily, weekly, monthly, all

**Response:**
```json
{
  "hourlyDistribution": { "0": 0, "1": 0, ... },
  "dailyComparison": [
    {
      "date": "2024-01-15",
      "orders": 45,
      "revenue": 12500.50
    }
  ],
  "weeklyTrends": [...],
  "monthlyTrends": [...],
  "seasonalInsights": {
    "peakHours": [
      { "hour": "12:00", "orders": 8 },
      { "hour": "19:00", "orders": 12 }
    ]
  }
}
```

#### 4. Dashboard Overview
```
GET /api/analytics/dashboard
```

**Response:**
```json
{
  "summary": {
    "totalRestaurants": 3,
    "totalFoodItems": 45,
    "totalOrders": 1250,
    "totalRevenue": 125000.50
  },
  "recentOrders": [...],
  "topFoodItems": [
    {
      "foodId": "...",
      "name": "Chicken Biryani",
      "orderCount": 45
    }
  ],
  "orderStatusBreakdown": {...},
  "revenueTrend": [...]
}
```

### Data Models

The analytics system leverages existing models:
- **Order Model**: For order data and status tracking
- **Restaurant Model**: For restaurant ownership validation
- **Food Model**: For food item tracking and popularity
- **Payment Model**: For payment method analysis

### Security & Access Control

- All analytics endpoints require authentication (`authRequired` middleware)
- Only users with `role: 'owner'` can access analytics data
- Data is filtered to show only orders from the owner's restaurants
- Soft-deleted orders are excluded from analytics

## 🎨 Frontend Implementation

### Components

#### 1. AnalyticsDashboard (`/components/AnalyticsDashboard/`)
- **Main dashboard component** with tabbed interface
- **Real-time data loading** with refresh functionality
- **Responsive design** for mobile and desktop
- **Interactive charts** using Chart.js and react-chartjs-2

#### 2. Chart Types
- **Doughnut Charts**: Order status breakdown, payment methods
- **Bar Charts**: Hourly distribution, top food items
- **Line Charts**: Revenue trends, daily comparisons

### Dashboard Tabs

#### 1. Overview Tab
- **Summary cards** showing key metrics
- **Order status breakdown** with visual representation
- **Payment method distribution**
- **Revenue trend chart** for last 7 days

#### 2. Order Analysis Tab
- **Hourly order distribution** bar chart
- **Real-time orders** list with live updates
- **Order tracking** with status badges

#### 3. Financial Performance Tab
- **Financial metrics cards** with gain/loss indicators
- **Order value statistics** (highest, average, lowest)
- **Payment method breakdown** chart
- **Profit margin calculations**

#### 4. Time Analytics Tab
- **Daily revenue comparison** line chart
- **Hourly distribution** bar chart
- **Top performing food items** list
- **Seasonal insights** and recommendations

### UI/UX Features

#### Design Elements
- **Gradient backgrounds** for visual appeal
- **Smooth animations** and hover effects
- **Responsive grid layout** for all screen sizes
- **Interactive charts** with tooltips and legends
- **Color-coded status indicators**

#### Color Scheme
- **Primary**: Blue gradient (#667eea to #764ba2)
- **Success**: Green (#28a745)
- **Warning**: Yellow (#ffc107)
- **Danger**: Red (#dc3545)
- **Info**: Light Blue (#17a2b8)

## 📊 Analytics Features

### 1. Real-time Monitoring
- **Live order tracking** with 2-hour window
- **Status updates** in real-time
- **Revenue calculations** updated instantly
- **Order volume monitoring**

### 2. Historical Analysis
- **7-day revenue trends** with daily breakdown
- **Weekly performance** comparisons
- **Monthly trends** for long-term insights
- **Seasonal patterns** identification

### 3. Performance Metrics
- **Order completion rates** by status
- **Average order values** and trends
- **Peak hour identification** for staffing
- **Popular food items** tracking

### 4. Financial Insights
- **Revenue growth** tracking
- **Profit margin** calculations
- **Payment method** preferences
- **Cost analysis** and optimization

## 🚀 Usage

### For Restaurant Owners

1. **Access Analytics**: Navigate to Owner Dashboard → Analytics tab
2. **Select Time Period**: Choose from Today, Yesterday, Last 7 Days, This Month
3. **View Overview**: Check summary cards and key metrics
4. **Analyze Orders**: Review order status breakdown and real-time orders
5. **Monitor Finances**: Track revenue, profit margins, and payment methods
6. **Study Trends**: Examine hourly patterns and seasonal insights

### For Developers

#### API Integration
```javascript
// Load daily orders
const response = await fetch('/api/analytics/daily-orders?period=today', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

// Load financial performance
const financialData = await fetch('/api/analytics/financial-performance?period=week');
```

#### Chart Configuration
```javascript
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: 'Analytics Overview' }
  }
};
```

## 🔧 Configuration

### Environment Variables
- `MONGO_URI`: MongoDB connection string
- `VITE_API_BASE`: Frontend API base URL

### Dependencies
- **Backend**: mongoose, express, cors
- **Frontend**: react, react-bootstrap, chart.js, react-chartjs-2

## 📱 Responsive Design

- **Mobile**: Stacked layout, full-width charts
- **Tablet**: 2-column grid for metrics
- **Desktop**: 4-column grid for overview cards
- **Touch-friendly**: Large touch targets, easy navigation

## 🧪 Testing

The implementation includes:
- **API endpoint testing** with proper error handling
- **Data validation** for all analytics queries
- **Chart rendering** with fallback for empty data
- **Responsive design** testing across devices

## 🚀 Future Enhancements

1. **Advanced Analytics**: Machine learning-based insights
2. **Custom Date Ranges**: Flexible time period selection
3. **Export Functionality**: PDF/Excel report generation
4. **Real-time Notifications**: Alert system for important metrics
5. **Comparative Analysis**: Multi-restaurant performance comparison
6. **Predictive Analytics**: Forecasting future trends

## 📈 Performance Considerations

- **Database Indexing**: Optimized queries with proper indexes
- **Data Caching**: Analytics data caching for better performance
- **Chart Optimization**: Efficient chart rendering with large datasets
- **Lazy Loading**: Component lazy loading for better UX

## 🔒 Security

- **Authentication Required**: JWT-based authentication for all endpoints
- **Role-based Access**: Only restaurant owners can access analytics
- **Data Filtering**: Orders filtered by restaurant ownership
- **Input Validation**: Server-side validation for all parameters

## 📊 Analytics Insights

The system provides insights into:
- **Order patterns** and peak times
- **Revenue trends** and growth
- **Customer preferences** through food popularity
- **Operational efficiency** through status tracking
- **Financial performance** and profitability

This comprehensive analytics dashboard empowers restaurant owners with data-driven insights to optimize their operations, improve customer service, and maximize profitability.
