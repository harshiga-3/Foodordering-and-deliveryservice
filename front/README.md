# Food Delivery Dashboard

A modern, responsive food delivery application built with React and featuring a beautiful dashboard-style interface inspired by the Savory Dashboard design.

## Features

### 🎨 Modern Dashboard Design
- **Left Sidebar Navigation**: Collapsible sidebar with intuitive navigation
- **Top Header**: Search bar, notifications, and user profile
- **Main Content Area**: Flexible grid layout for content
- **Right Sidebar**: Order information, payment cards, and delivery status

### 🍽️ Food Management
- **Categories**: Horizontal scrollable food categories
- **Featured Foods**: Beautiful food cards with images, ratings, and pricing
- **Promotional Banners**: Eye-catching promotional content
- **Order Management**: Real-time order tracking and status

### 📱 Responsive Design
- **Mobile-First**: Optimized for all device sizes
- **Collapsible Sidebar**: Adaptive navigation for smaller screens
- **Grid Layouts**: Responsive grid systems that adapt to screen size

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd food-delivery
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── DashboardLayout/          # Main dashboard layout component
│   │   ├── DashboardLayout.jsx   # Layout logic and structure
│   │   ├── DashboardLayout.css   # Layout-specific styles
│   │   └── index.js             # Export file
│   ├── DashboardHome/            # Home dashboard content
│   │   ├── DashboardHome.jsx     # Home page content
│   │   ├── DashboardHome.css     # Home-specific styles
│   │   └── index.js             # Export file
│   └── ...                      # Other components
├── pages/                        # Page components
├── context/                      # React context providers
├── data/                         # Static data and mock data
└── utils/                        # Utility functions
```

## Dashboard Components

### DashboardLayout
The main layout component that provides:
- **Left Sidebar**: Navigation menu with collapsible functionality
- **Top Header**: Search, notifications, and user profile
- **Main Content Area**: Flexible content container
- **Responsive Behavior**: Adaptive layout for different screen sizes

### DashboardHome
The home page content featuring:
- **Promotional Banner**: Hero section with call-to-action
- **Food Categories**: Horizontal scrollable category list
- **Featured Foods**: Grid of food cards with detailed information
- **Right Sidebar**: Order summary, payment info, and delivery status

## Customization

### Colors and Themes
The dashboard uses a modern color palette:
- **Primary**: Green (#059669) - Used for buttons, active states, and accents
- **Background**: Light blue gradient (#f0f9ff to #e0f2fe)
- **Cards**: White with subtle shadows
- **Text**: Dark grays for readability

### Styling
- **CSS Variables**: Easy to customize colors and spacing
- **Responsive Breakpoints**: Mobile-first approach with tablet and desktop breakpoints
- **Smooth Animations**: CSS transitions and hover effects

### Adding New Pages
To add a new page with the dashboard layout:

```jsx
import DashboardLayout from './components/DashboardLayout';

function NewPage() {
  return (
    <DashboardLayout user={{ name: 'User Name', role: 'User' }}>
      <div className="dashboard-content">
        {/* Your page content here */}
      </div>
    </DashboardLayout>
  );
}
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Dependencies

- **React**: UI library
- **React Router**: Navigation and routing
- **Bootstrap**: CSS framework and components
- **Bootstrap Icons**: Icon library
- **Vite**: Build tool and dev server

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository.
