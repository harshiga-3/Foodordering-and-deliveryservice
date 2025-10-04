/**
 * Utility functions for safe price parsing and formatting
 */

/**
 * Safely parses a price value that could be a string or number
 * @param {string|number} price - The price value to parse
 * @returns {number} - The parsed price as a number, or 0 if invalid
 */
export const parsePrice = (price) => {
  if (typeof price === 'number') {
    return price;
  }
  if (typeof price === 'string') {
    // Remove currency symbols, commas, and whitespace, then convert to number
    const cleanPrice = price.replace(/[₹$€£,]/g, '').trim();
    const parsed = parseFloat(cleanPrice);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0; // Fallback for invalid values
};

/**
 * Formats a price value as a currency string
 * @param {string|number} price - The price value to format
 * @param {string} currency - The currency symbol (default: '₹')
 * @returns {string} - The formatted price string
 */
export const formatPrice = (price, currency = '₹') => {
  const parsedPrice = parsePrice(price);
  return `${currency}${parsedPrice.toFixed(2)}`;
};

/**
 * Calculates the total price for cart items
 * @param {Array} items - Array of cart items with price and quantity
 * @returns {number} - The total price
 */
export const calculateCartTotal = (items) => {
  return items.reduce((total, item) => {
    const price = parsePrice(item.price);
    const quantity = item.quantity || 1;
    return total + (price * quantity);
  }, 0);
};

/**
 * Safely adds two price values
 * @param {string|number} price1 - First price
 * @param {string|number} price2 - Second price
 * @returns {number} - The sum of the two prices
 */
export const addPrices = (price1, price2) => {
  return parsePrice(price1) + parsePrice(price2);
};

/**
 * Safely multiplies a price by a quantity
 * @param {string|number} price - The price value
 * @param {number} quantity - The quantity to multiply by
 * @returns {number} - The multiplied price
 */
export const multiplyPrice = (price, quantity) => {
  return parsePrice(price) * quantity;
};
