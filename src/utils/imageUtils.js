/**
 * Utility functions for handling image URLs in the application
 */

/**
 * Formats an image URL to ensure it works in both development and production environments
 * 
 * @param {string} imageUrl - The image URL from the API response
 * @returns {string} - The properly formatted image URL
 */
export const getFormattedImageUrl = (imageUrl) => {
  // If the URL is null or undefined, return null
  if (!imageUrl) return null;
  
  // If the URL already starts with http or https, it's already a complete URL
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Otherwise, prepend the API base URL (without the /api part)
  return `${process.env.REACT_APP_API_BASE_URL.replace('/api', '')}${imageUrl}`;
};

/**
 * Creates a fallback element when an image fails to load
 * 
 * @param {Event} event - The error event from the image
 * @param {string} fallbackText - The text to display as fallback (usually first letter of name)
 * @param {string} className - Optional CSS class for the fallback element
 */
export const handleImageError = (event, fallbackText = '?', className = 'text-3xl') => {
  console.error('Error loading image:', event);
  
  // Hide the broken image
  event.target.style.display = 'none';
  
  // Create a fallback element
  const fallbackElement = document.createElement('span');
  fallbackElement.className = className;
  fallbackElement.innerHTML = fallbackText;
  
  // Add the fallback element to the parent of the image
  event.target.parentNode.appendChild(fallbackElement);
};