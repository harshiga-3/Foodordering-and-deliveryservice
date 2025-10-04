// src/data/menuItems.js
export const menuItems = [
  // Saravana Bhavan (ID: 1) - Vegetarian
  

  // Anjappar Chettinad (ID: 2) - Non-Vegetarian
 

  { id: 1, name: "Masala Dosa", description: "Crispy crepe filled with spiced potato filling", price: "₹90", category: "Breakfast", restaurantId: 1, image: "/food/f2.jpeg", isVeg: true, rating: 4.7, tags: ["popular", "tiffin"], foodType: "dosa" },
  { id: 2, name: "Plain Dosa", description: "Classic dosa without filling", price: "₹70", category: "Breakfast", restaurantId: 1, image: "/food/f1.jpg", isVeg: true, rating: 4.5, tags: ["basic"], foodType: "dosa" },
  { id: 3, name: "Rava Masala Dosa", description: "Crispy semolina crepe with potato filling", price: "₹110", category: "Breakfast", restaurantId: 1, image: "/food/f3.jpeg", isVeg: true, rating: 4.6, tags: ["special"], foodType: "dosa" },
  { id: 4, name: "Onion Rava Dosa", description: "Crispy dosa with onions and spices", price: "₹120", category: "Breakfast", restaurantId: 1, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", isVeg: true, rating: 4.6, tags: ["onion"], foodType: "dosa" },
  { id: 5, name: "Ghee Roast", description: "Dosa prepared with generous ghee", price: "₹130", category: "Breakfast", restaurantId: 3, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", isVeg: true, rating: 4.8, tags: ["premium"], foodType: "dosa" },
  { id: 6, name: "Paneer Dosa", description: "Dosa stuffed with paneer masala", price: "₹140", category: "Breakfast", restaurantId: 3, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", isVeg: true, rating: 4.7, tags: ["paneer"], foodType: "dosa" },
  { id: 7, name: "Cheese Dosa", description: "Dosa loaded with cheese", price: "₹150", category: "Breakfast", restaurantId: 4, image: "https://images.unsplash.com/photo-1668236543090-82d8bb61e10e?w=400", isVeg: true, rating: 4.8, tags: ["cheese"], foodType: "dosa" },
  { id: 8, name: "Mysore Masala Dosa", description: "Spicy Mysore chutney dosa", price: "₹140", category: "Breakfast", restaurantId: 4, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", isVeg: true, rating: 4.9, tags: ["spicy"], foodType: "dosa" },
  { id: 9, name: "Set Dosa", description: "Soft, spongy mini dosas", price: "₹100", category: "Breakfast", restaurantId: 5, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", isVeg: true, rating: 4.6, tags: ["soft"], foodType: "dosa" },
  { id: 10, name: "Paper Dosa", description: "Extra crispy thin dosa", price: "₹100", category: "Breakfast", restaurantId: 6, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", isVeg: true, rating: 4.5, tags: ["crispy"], foodType: "dosa" },
  { id: 11, name: "Uttapam", description: "Thick pancake with toppings", price: "₹120", category: "Breakfast", restaurantId: 7, image: "https://images.unsplash.com/photo-1668236543090-82d8bb61e10e?w=400", isVeg: true, rating: 4.7, tags: ["pancake"], foodType: "dosa" },
  { id: 12, name: "Onion Uttapam", description: "Uttapam topped with onions", price: "₹130", category: "Breakfast", restaurantId: 8, image: "https://images.unsplash.com/photo-1668236543090-82d8bb61e10e?w=400", isVeg: true, rating: 4.7, tags: ["onion"], foodType: "dosa" },
  { id: 13, name: "Tomato Uttapam", description: "Uttapam topped with tomatoes", price: "₹130", category: "Breakfast", restaurantId: 9, image: "https://images.unsplash.com/photo-1668236543090-82d8bb61e10e?w=400", isVeg: true, rating: 4.6, tags: ["tomato"], foodType: "dosa" },
  { id: 14, name: "Mixed Uttapam", description: "Uttapam with mixed vegetables", price: "₹140", category: "Breakfast", restaurantId: 10, image: "https://images.unsplash.com/photo-1668236543090-82d8bb61e10e?w=400", isVeg: true, rating: 4.8, tags: ["mixed"], foodType: "dosa" },
  { id: 15, name: "Kara Dosa", description: "Spicy dosa with special masala", price: "₹150", category: "Breakfast", restaurantId: 11, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", isVeg: true, rating: 4.7, tags: ["spicy"], foodType: "dosa" },

  // --- Idli Varieties (10 dishes) ---
  { id: 16, name: "Idli Vada", description: "Steamed idlis with crispy vadas", price: "₹80", category: "Breakfast", restaurantId: 1, image: "/images/Idli/o1.jpg", isVeg: true, rating: 4.5, tags: ["combo"], foodType: "idli" },
  { id: 17, name: "Podi Idli", description: "Idli coated with spicy lentil powder", price: "₹100", category: "Breakfast", restaurantId: 3, image: "/images/Idli/o2.jpg", isVeg: true, rating: 4.6, tags: ["spicy"], foodType: "idli" },
  { id: 18, name: "Mini Idli Sambar", description: "Small idlis soaked in hot sambar", price: "₹90", category: "Breakfast", restaurantId: 5, image: "/images/Idli/o3.jpg", isVeg: true, rating: 4.6, tags: ["kids special"], foodType: "idli" },
  { id: 19, name: "Rava Idli", description: "Soft idlis made with semolina", price: "₹85", category: "Breakfast", restaurantId: 5, image: "/images/Idli/o4.jpg", isVeg: true, rating: 4.5, tags: ["special"], foodType: "idli" },
  { id: 21, name: "Stuffed Idli", description: "Idli stuffed with potato masala", price: "₹120", category: "Breakfast", restaurantId: 8, image: "images/Idli/o5.jpg", isVeg: true, rating: 4.6, tags: ["stuffed"], foodType: "idli" },
  { id: 22, name: "Fried Idli", description: "Crispy fried idli pieces", price: "₹100", category: "Breakfast", restaurantId: 9, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400", isVeg: true, rating: 4.5, tags: ["crispy"], foodType: "idli" },
  { id: 23, name: "Thattu Idli", description: "Street-style flat idli", price: "₹95", category: "Breakfast", restaurantId: 10, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400", isVeg: true, rating: 4.6, tags: ["street food"], foodType: "idli" },
  { id: 24, name: "Mallige Idli", description: "Soft cotton-like idli", price: "₹90", category: "Breakfast", restaurantId: 11, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400", isVeg: true, rating: 4.7, tags: ["soft"], foodType: "idli" },
  { id: 20, name: "Kanchipuram Idli", description: "Spicy idli with pepper and cumin", price: "₹110", category: "Breakfast", restaurantId: 7, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400", isVeg: true, rating: 4.7, tags: ["spicy"], foodType: "idli" },
  { id: 25, name: "Idli Manchurian", description: "Crispy idli in Manchurian sauce", price: "₹130", category: "Starters", restaurantId: 12, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400", isVeg: true, rating: 4.8, tags: ["indo-chinese"], foodType: "idli" },



  // --- Biryani Varieties (15 dishes) ---
  { id: 26, name: "Chicken Biryani", description: "Fragrant rice with chicken", price: "₹200", category: "Biryani", restaurantId: 2, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.7, tags: ["popular"], foodType: "biryani" },
  { id: 27, name: "Mutton Biryani", description: "Rice cooked with mutton", price: "₹250", category: "Biryani", restaurantId: 2, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.6, tags: ["premium"], foodType: "biryani" },
  { id: 28, name: "Vegetable Biryani", description: "Rice with vegetables", price: "₹180", category: "Biryani", restaurantId: 5, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: true, rating: 4.3, tags: ["veg"], foodType: "biryani" },
  { id: 29, name: "Hyderabadi Biryani", description: "Spicy Hyderabadi style", price: "₹280", category: "Biryani", restaurantId: 12, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.8, tags: ["spicy"], foodType: "biryani" },
  { id: 30, name: "Ambur Biryani", description: "Famous Ambur style biryani", price: "₹250", category: "Biryani", restaurantId: 2, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.7, tags: ["premium"], foodType: "biryani" },
  { id: 31, name: "Egg Biryani", description: "Rice with boiled eggs", price: "₹160", category: "Biryani", restaurantId: 6, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.4, tags: ["egg"], foodType: "biryani" },
  { id: 32, name: "Fish Biryani", description: "Rice with spiced fish", price: "₹270", category: "Biryani", restaurantId: 6, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.5, tags: ["seafood"], foodType: "biryani" },
  { id: 33, name: "Paneer Biryani", description: "Rice cooked with paneer", price: "₹220", category: "Biryani", restaurantId: 4, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: true, rating: 4.6, tags: ["paneer"], foodType: "biryani" },
  { id: 34, name: "Prawn Biryani", description: "Rice with juicy prawns", price: "₹290", category: "Biryani", restaurantId: 8, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.7, tags: ["seafood"], foodType: "biryani" },
  { id: 35, name: "Kolkata Biryani", description: "Biryani with potato and egg", price: "₹240", category: "Biryani", restaurantId: 9, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.6, tags: ["kolkata"], foodType: "biryani" },
  { id: 36, name: "Dum Biryani", description: "Slow-cooked biryani", price: "₹260", category: "Biryani", restaurantId: 10, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.8, tags: ["dum"], foodType: "biryani" },
  { id: 37, name: "Keema Biryani", description: "Biryani with minced meat", price: "₹230", category: "Biryani", restaurantId: 11, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.5, tags: ["keema"], foodType: "biryani" },
  { id: 38, name: "Schezwan Biryani", description: "Spicy Indo-Chinese biryani", price: "₹250", category: "Biryani", restaurantId: 12, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.6, tags: ["schezwan"], foodType: "biryani" },
  { id: 39, name: "Kashmiri Biryani", description: "Mild and aromatic biryani", price: "₹270", category: "Biryani", restaurantId: 13, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.7, tags: ["kashmiri"], foodType: "biryani" },
  { id: 40, name: "Brunch Biryani", description: "Special weekend biryani", price: "₹300", category: "Biryani", restaurantId: 14, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", isVeg: false, rating: 4.9, tags: ["special"], foodType: "biryani" },

  // --- Curries (20 dishes) ---
  { id: 41, name: "Paneer Butter Masala", description: "Paneer in creamy tomato gravy", price: "₹180", category: "Curry", restaurantId: 7, image: "/images/curries/f1.png", isVeg: true, rating: 4.8, tags: ["paneer"], foodType: "curry" },
{ id: 42, name: "Chicken Curry", description: "Chicken cooked with spices", price: "₹220", category: "Curry", restaurantId: 7, image: "/images/curries/f2.png", isVeg: false, rating: 4.6, tags: ["spicy"], foodType: "curry" },
{ id: 43, name: "Mutton Curry", description: "Tender mutton in masala gravy", price: "₹260", category: "Curry", restaurantId: 8, image: "/images/curries/f3.png", isVeg: false, rating: 4.7, tags: ["mutton"], foodType: "curry" },
{ id: 44, name: "Veg Kurma", description: "Mixed veg kurma", price: "₹160", category: "Curry", restaurantId: 8, image: "/images/curries/f4.png", isVeg: true, rating: 4.5, tags: ["veg"], foodType: "curry" },
{ id: 45, name: "Butter Chicken", description: "Creamy butter chicken curry", price: "₹250", category: "Curry", restaurantId: 9, image: "/images/curries/f5.png", isVeg: false, rating: 4.8, tags: ["buttery"], foodType: "curry" },
{ id: 46, name: "Chana Masala", description: "Spicy chickpea curry", price: "₹140", category: "Curry", restaurantId: 10, image: "/images/curries/f6.png", isVeg: true, rating: 4.6, tags: ["chickpea"], foodType: "curry" },
{ id: 47, name: "Fish Curry", description: "Traditional South Indian fish curry", price: "₹230", category: "Curry", restaurantId: 11, image: "/images/curries/f7.png", isVeg: false, rating: 4.7, tags: ["seafood"], foodType: "curry" },
{ id: 48, name: "Egg Curry", description: "Boiled eggs in spicy gravy", price: "₹150", category: "Curry", restaurantId: 12, image: "/images/curries/f8.png", isVeg: false, rating: 4.5, tags: ["egg"], foodType: "curry" },
{ id: 49, name: "Malai Kofta", description: "Paneer balls in creamy gravy", price: "₹190", category: "Curry", restaurantId: 13, image: "/images/curries/f9.png", isVeg: true, rating: 4.8, tags: ["paneer"], foodType: "curry" },
{ id: 50, name: "Kadai Paneer", description: "Paneer with bell peppers", price: "₹200", category: "Curry", restaurantId: 14, image: "/images/curries/f10.png", isVeg: true, rating: 4.7, tags: ["kadai"], foodType: "curry" },
{ id: 51, name: "Chettinad Chicken", description: "Spicy Chettinad style chicken", price: "₹240", category: "Curry", restaurantId: 15, image: "/images/curries/f11.png", isVeg: false, rating: 4.9, tags: ["chettinad"], foodType: "curry" },
{ id: 52, name: "Dal Makhani", description: "Creamy black lentil curry", price: "₹170", category: "Curry", restaurantId: 16, image: "/images/curries/f12.png", isVeg: true, rating: 4.7, tags: ["dal"], foodType: "curry" },
{ id: 53, name: "Prawn Curry", description: "Prawns in coconut gravy", price: "₹260", category: "Curry", restaurantId: 17, image: "/images/curries/f13.png", isVeg: false, rating: 4.8, tags: ["seafood"], foodType: "curry" },
{ id: 54, name: "Palak Paneer", description: "Paneer in spinach gravy", price: "₹180", category: "Curry", restaurantId: 18, image: "/images/curries/f14.png", isVeg: true, rating: 4.7, tags: ["spinach"], foodType: "curry" },
{ id: 55, name: "Mushroom Masala", description: "Mushrooms in spicy gravy", price: "₹190", category: "Curry", restaurantId: 19, image: "/images/curries/f1.png", isVeg: true, rating: 4.6, tags: ["mushroom"], foodType: "curry" },
{ id: 56, name: "Navratan Korma", description: "Mixed vegetables in creamy sauce", price: "₹200", category: "Curry", restaurantId: 20, image: "/images/curries/f2.png", isVeg: true, rating: 4.7, tags: ["mixed"], foodType: "curry" },
{ id: 57, name: "Vindaloo", description: "Spicy Goan curry", price: "₹220", category: "Curry", restaurantId: 21, image: "/images/curries/f3.png", isVeg: false, rating: 4.8, tags: ["goan"], foodType: "curry" },
{ id: 58, name: "Sarson Ka Saag", description: "Mustard greens curry", price: "₹160", category: "Curry", restaurantId: 22, image: "/images/curries/f4.png", isVeg: true, rating: 4.6, tags: ["punjabi"], foodType: "curry" },
{ id: 59, name: "Baingan Bharta", description: "Smoked eggplant curry", price: "₹150", category: "Curry", restaurantId: 23, image: "/images/curries/f5.png", isVeg: true, rating: 4.7, tags: ["eggplant"], foodType: "curry" },

  { id: 60, name: "Aloo Gobi", description: "Potato and cauliflower curry", price: "₹140", category: "Curry", restaurantId: 24, image: "https://images.unsplash.com/photo-1605478580706-46d63f63e1a0?w=400", isVeg: true, rating: 4.5, tags: ["simple"], foodType: "curry" },

  // --- Breads (15 dishes) ---
  { id: 61, name: "Butter Naan", description: "Soft naan with butter", price: "₹60", category: "Bread", restaurantId: 7, image: "https://images.unsplash.com/photo-1617196038432-1be3f3f954ed?w=400", isVeg: true, rating: 4.6, tags: ["naan"], foodType: "bread" },
  { id: 62, name: "Garlic Naan", description: "Naan topped with garlic", price: "₹70", category: "Bread", restaurantId: 7, image: "https://images.unsplash.com/photo-1617196038432-1be3f3f954ed?w=400", isVeg: true, rating: 4.7, tags: ["garlic"], foodType: "bread" },
  { id: 63, name: "Tandoori Roti", description: "Whole wheat bread baked in tandoor", price: "₹40", category: "Bread", restaurantId: 9, image: "https://images.unsplash.com/photo-1617196038432-1be3f3f954ed?w=400", isVeg: true, rating: 4.5, tags: ["tandoor"], foodType: "bread" },
  { id: 64, name: "Aloo Paratha", description: "Stuffed potato paratha", price: "₹80", category: "Bread", restaurantId: 9, image: "https://images.unsplash.com/photo-1617196038432-1be3f3f954ed?w=400", isVeg: true, rating: 4.8, tags: ["stuffed"], foodType: "bread" },
  { id: 65, name: "Paneer Paratha", description: "Stuffed paneer paratha", price: "₹100", category: "Bread", restaurantId: 10, image: "https://images.unsplash.com/photo-1617196038432-1be3f3f954ed?w=400", isVeg: true, rating: 4.8, tags: ["paneer"], foodType: "bread" },
  { id: 66, name: "Lachha Paratha", description: "Layered paratha", price: "₹70", category: "Bread", restaurantId: 11, image: "https://images.unsplash.com/photo-1617196038432-1be3f3f954ed?w=400", isVeg: true, rating: 4.6, tags: ["layered"], foodType: "bread" },
  { id: 67, name: "Missi Roti", description: "Spiced gram flour roti", price: "₹50", category: "Bread", restaurantId: 12, image: "https://images.unsplash.com/photo-1617196038432-1be3f3f954ed?w=400", isVeg: true, rating: 4.5, tags: ["gram flour"], foodType: "bread" },
  { id: 68, name: "Bhatura", description: "Puffed fried bread", price: "₹60", category: "Bread", restaurantId: 13, image: "https://images.unsplash.com/photo-1617196038432-1be3f3f954ed?w=400", isVeg: true, rating: 4.7, tags: ["fried"], foodType: "bread" },
  { id: 69, name: "Kulcha", description: "Leavened bread", price: "₹65", category: "Bread", restaurantId: 14, image: "https://images.unsplash.com/photo-1617196038432-1be3f3f954ed?w=400", isVeg: true, rating: 4.6, tags: ["leavened"], foodType: "bread" },
  // Add more food items with foodType...
  // Make sure ALL items have a foodType property

  // --- Desserts (10 dishes) ---
  { id: 70, name: "Gulab Jamun", description: "Sweet milk solids in sugar syrup", price: "₹80", category: "Dessert", restaurantId: 1, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400", isVeg: true, rating: 4.8, tags: ["sweet", "traditional"], foodType: "dessert" },
  { id: 71, name: "Rasgulla", description: "Soft cottage cheese balls in syrup", price: "₹70", category: "Dessert", restaurantId: 2, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400", isVeg: true, rating: 4.7, tags: ["sweet", "bengali"], foodType: "dessert" },
  { id: 72, name: "Jalebi", description: "Crispy sweet pretzels", price: "₹60", category: "Dessert", restaurantId: 3, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400", isVeg: true, rating: 4.6, tags: ["sweet", "crispy"], foodType: "dessert" },
  { id: 73, name: "Kheer", description: "Rice pudding with nuts", price: "₹90", category: "Dessert", restaurantId: 4, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400", isVeg: true, rating: 4.8, tags: ["sweet", "pudding"], foodType: "dessert" },
  { id: 74, name: "Gajar Ka Halwa", description: "Carrot pudding with ghee", price: "₹100", category: "Dessert", restaurantId: 5, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400", isVeg: true, rating: 4.7, tags: ["sweet", "carrot"], foodType: "dessert" },
  { id: 75, name: "Rasmalai", description: "Soft cheese patties in milk", price: "₹110", category: "Dessert", restaurantId: 6, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400", isVeg: true, rating: 4.9, tags: ["sweet", "premium"], foodType: "dessert" },
  { id: 76, name: "Kulfi", description: "Traditional Indian ice cream", price: "₹80", category: "Dessert", restaurantId: 7, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400", isVeg: true, rating: 4.6, tags: ["sweet", "ice cream"], foodType: "dessert" },
  { id: 77, name: "Shahi Tukda", description: "Bread pudding with saffron", price: "₹120", category: "Dessert", restaurantId: 8, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400", isVeg: true, rating: 4.8, tags: ["sweet", "royal"], foodType: "dessert" },
  { id: 78, name: "Malpua", description: "Sweet pancakes with syrup", price: "₹85", category: "Dessert", restaurantId: 9, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400", isVeg: true, rating: 4.7, tags: ["sweet", "pancake"], foodType: "dessert" },
  { id: 79, name: "Phirni", description: "Ground rice pudding", price: "₹95", category: "Dessert", restaurantId: 10, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400", isVeg: true, rating: 4.6, tags: ["sweet", "rice"], foodType: "dessert" },

  // --- Beverages (10 dishes) ---
  { id: 80, name: "Masala Chai", description: "Spiced Indian tea with milk", price: "₹30", category: "Beverage", restaurantId: 1, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400", isVeg: true, rating: 4.5, tags: ["tea", "spiced"], foodType: "beverage" },
  { id: 81, name: "Filter Coffee", description: "Traditional South Indian coffee", price: "₹40", category: "Beverage", restaurantId: 2, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400", isVeg: true, rating: 4.6, tags: ["coffee", "traditional"], foodType: "beverage" },
  { id: 82, name: "Lassi", description: "Sweet yogurt drink", price: "₹50", category: "Beverage", restaurantId: 3, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400", isVeg: true, rating: 4.7, tags: ["yogurt", "sweet"], foodType: "beverage" },
  { id: 83, name: "Thandai", description: "Cold milk with nuts and spices", price: "₹60", category: "Beverage", restaurantId: 4, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400", isVeg: true, rating: 4.5, tags: ["milk", "nuts"], foodType: "beverage" },
  { id: 84, name: "Jaljeera", description: "Spicy cumin water", price: "₹35", category: "Beverage", restaurantId: 5, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400", isVeg: true, rating: 4.4, tags: ["spicy", "digestive"], foodType: "beverage" },
  { id: 85, name: "Rose Milk", description: "Milk with rose essence", price: "₹45", category: "Beverage", restaurantId: 6, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400", isVeg: true, rating: 4.6, tags: ["milk", "rose"], foodType: "beverage" },
  { id: 86, name: "Kesar Milk", description: "Saffron flavored milk", price: "₹55", category: "Beverage", restaurantId: 7, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400", isVeg: true, rating: 4.7, tags: ["milk", "saffron"], foodType: "beverage" },
  { id: 87, name: "Badam Milk", description: "Almond milk drink", price: "₹65", category: "Beverage", restaurantId: 8, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400", isVeg: true, rating: 4.8, tags: ["milk", "almond"], foodType: "beverage" },
  { id: 88, name: "Pista Milk", description: "Pistachio milk drink", price: "₹70", category: "Beverage", restaurantId: 9, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400", isVeg: true, rating: 4.7, tags: ["milk", "pistachio"], foodType: "beverage" },
  { id: 89, name: "Chocolate Milk", description: "Rich chocolate milk", price: "₹50", category: "Beverage", restaurantId: 10, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400", isVeg: true, rating: 4.5, tags: ["milk", "chocolate"], foodType: "beverage" },

  // --- Snacks (10 dishes) ---
  { id: 90, name: "Samosa", description: "Crispy pastry with potato filling", price: "₹25", category: "Snack", restaurantId: 1, image: "https://images.unsplash.com/photo-1603130412879-484f7990b127?w=400", isVeg: true, rating: 4.6, tags: ["crispy", "potato"], foodType: "snack" },
  { id: 91, name: "Vada", description: "Crispy lentil fritters", price: "₹30", category: "Snack", restaurantId: 2, image: "https://images.unsplash.com/photo-1603130412879-484f7990b127?w=400", isVeg: true, rating: 4.7, tags: ["crispy", "lentil"], foodType: "snack" },
  { id: 92, name: "Pakora", description: "Mixed vegetable fritters", price: "₹35", category: "Snack", restaurantId: 3, image: "https://images.unsplash.com/photo-1603130412879-484f7990b127?w=400", isVeg: true, rating: 4.5, tags: ["crispy", "vegetable"], foodType: "snack" },
  { id: 93, name: "Bhel Puri", description: "Puffed rice with chutneys", price: "₹40", category: "Snack", restaurantId: 4, image: "https://images.unsplash.com/photo-1603130412879-484f7990b127?w=400", isVeg: true, rating: 4.8, tags: ["tangy", "rice"], foodType: "snack" },
  { id: 94, name: "Pani Puri", description: "Hollow puris with spiced water", price: "₹45", category: "Snack", restaurantId: 5, image: "https://images.unsplash.com/photo-1603130412879-484f7990b127?w=400", isVeg: true, rating: 4.9, tags: ["tangy", "spicy"], foodType: "snack" },
  { id: 95, name: "Dahi Puri", description: "Puris with yogurt and chutneys", price: "₹50", category: "Snack", restaurantId: 6, image: "https://images.unsplash.com/photo-1603130412879-484f7990b127?w=400", isVeg: true, rating: 4.7, tags: ["yogurt", "sweet"], foodType: "snack" },
  { id: 96, name: "Sev Puri", description: "Puris topped with sev", price: "₹40", category: "Snack", restaurantId: 7, image: "https://images.unsplash.com/photo-1603130412879-484f7990b127?w=400", isVeg: true, rating: 4.6, tags: ["crispy", "sev"], foodType: "snack" },
  { id: 97, name: "Ragda Pattice", description: "Potato patties with white peas", price: "₹55", category: "Snack", restaurantId: 8, image: "https://images.unsplash.com/photo-1603130412879-484f7990b127?w=400", isVeg: true, rating: 4.8, tags: ["potato", "peas"], foodType: "snack" },
  { id: 98, name: "Khandvi", description: "Gram flour rolls", price: "₹35", category: "Snack", restaurantId: 9, image: "https://images.unsplash.com/photo-1603130412879-484f7990b127?w=400", isVeg: true, rating: 4.5, tags: ["gram flour", "rolls"], foodType: "snack" },
  { id: 99, name: "Dhokla", description: "Steamed gram flour cake", price: "₹40", category: "Snack", restaurantId: 10, image: "https://images.unsplash.com/photo-1603130412879-484f7990b127?w=400", isVeg: true, rating: 4.6, tags: ["steamed", "cake"], foodType: "snack" }
];

// Helper function to get food varieties by type
{/*export const getFoodVarietiesByType = (foodType, excludeId = null) => {
  if (!foodType) return [];
  
  return menuItems
    .filter(item => 
      item.foodType === foodType && 
      item.id !== excludeId
    )
    .slice(0, 8); // Return top 8 varieties
};*/}



// In the getFoodTypeDisplayName function, add a safety check:

// Helper function to get food type display name
// src/data/menuItems.js
// ... (all your menu items)

// Helper function to get menu items by restaurant ID
export const getMenuItemsByRestaurantId = (restaurantId) => {
  return menuItems.filter(item => item.restaurantId === restaurantId);
};

// Helper function to group menu items by category
export const groupMenuItemsByCategory = (items) => {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
};

// Helper function to filter menu items by type (veg/non-veg)
export const filterMenuItemsByType = (items, type) => {
  if (type === 'all') return items;
  return items.filter(item => 
    type === 'veg' ? item.isVeg : !item.isVeg
  );
};

// Helper function to filter menu items by tag
export const filterMenuItemsByTag = (items, tag) => {
  if (tag === 'all') return items;
  return items.filter(item => item.tags && item.tags.includes(tag));
};

// Helper function to get food varieties by type
export const getFoodVarietiesByType = (foodType, excludeId = null) => {
  if (!foodType) return [];
  
  return menuItems
    .filter(item => 
      item.foodType === foodType && 
      item.id !== excludeId
    )
    .slice(0, 8); // Return top 8 varieties
};

// Helper function to get food type display name
export const getFoodTypeDisplayName = (foodType) => {
  if (!foodType) return "Food Varieties";
  
  const displayNames = {
    'dosa': 'Dosa Varieties',
    'idli': 'Idli Varieties',
    'biryani': 'Biryani Varieties',
    'curry': 'Curry Varieties',
    'bread': 'Bread Varieties',
    'rice': 'Rice Varieties',
    'dessert': 'Dessert Varieties',
    'beverage': 'Beverage Varieties',
    'pongal': 'Pongal Varieties',
    'uttapam': 'Uttapam Varieties',
    'vada': 'Vada Varieties',
    'sambar': 'Sambar Varieties',
    'rasam': 'Rasam Varieties',
    'kootu': 'Kootu Varieties',
    'poriyal': 'Poriyal Varieties',
    'chutney': 'Chutney Varieties',
    'pickle': 'Pickle Varieties',
    'sweet': 'Sweet Varieties',
    'snack': 'Snack Varieties',
    'soup': 'Soup Varieties',
    'salad': 'Salad Varieries'
  };
  
  return displayNames[foodType] || `${foodType.charAt(0).toUpperCase() + foodType.slice(1)} Varieties`;
};