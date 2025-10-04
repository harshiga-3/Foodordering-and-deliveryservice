# Food Delivery Backend Server

This is the backend server for the Food Delivery application, built with Node.js, Express, and MongoDB.

## Project Structure

```
server/
├── src/
│   ├── models/          # MongoDB/Mongoose schemas
│   ├── routes/          # API route handlers
│   ├── middleware/      # Authentication middleware
│   └── index.js         # Main server file
├── package.json
└── README.md
```

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Role Management**: Support for User, Owner, and Delivery roles
- **Food Management**: CRUD operations for food items (Owner only)
- **Restaurant Management**: CRUD operations for restaurants (Owner only)
- **Order Management**: Order creation, tracking, and status updates
- **Favorites System**: Users can favorite/unfavorite food items
- **Review System**: Users can rate and review food items
- **Search & Filtering**: Advanced search with multiple filters

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Users
- `GET /api/users` - List users (filtered by role)

### Foods
- `GET /api/foods` - Get all foods with search/filtering
- `GET /api/foods/:id` - Get single food
- `POST /api/foods` - Create food (Owner only)
- `PUT /api/foods/:id` - Update food (Owner only)
- `DELETE /api/foods/:id` - Delete food (Owner only)

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get single restaurant
- `GET /api/restaurants/owner/:ownerId` - Get restaurants by owner
- `POST /api/restaurants` - Create restaurant (Owner only)
- `PUT /api/restaurants/:id` - Update restaurant (Owner only)
- `DELETE /api/restaurants/:id` - Delete restaurant (Owner only)

### Orders
- `POST /api/orders` - Create order (User only)
- `GET /api/orders` - Get orders (role-based)
- `PATCH /api/orders/:id/assign` - Assign delivery person (Owner only)
- `PATCH /api/orders/:id/status` - Update order status

### Favorites
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:foodId` - Remove from favorites
- `GET /api/favorites/check/:foodId` - Check if favorited

### Reviews
- `GET /api/reviews/food/:foodId` - Get reviews for food
- `GET /api/reviews/user` - Get user's reviews
- `POST /api/reviews` - Create review (User only)
- `PUT /api/reviews/:id` - Update review (User only)
- `DELETE /api/reviews/:id` - Delete review (User only)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with:
   ```
   MONGO_URI=mongodb://127.0.0.1:27017/food_delivery
   JWT_SECRET=your_jwt_secret_here
   PORT=4000
   ```

3. Start the server:
   ```bash
   npm run dev    # Development mode
   npm start      # Production mode
   ```

## Database Models

- **User**: Authentication and role management
- **Food**: Food items with restaurant association
- **Restaurant**: Restaurant information and ownership
- **Order**: Order tracking and delivery management
- **Favorite**: User food favorites
- **Review**: Food ratings and comments

## Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Secure password hashing with bcrypt
- CORS configuration

## Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Environment**: dotenv
- **CORS**: cors middleware
