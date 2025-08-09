/**
 * Utility functions for handling image URLs in the application
 */

/**
 * Checks if an image exists at the given URL
 * 
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - Promise that resolves to true if the image exists, false otherwise
 */
export const checkImageExists = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * Formats an image URL to ensure it works in both development and production environments
 * 
 * @param {string} imageUrl - The image URL from the API response
 * @returns {string} - The properly formatted image URL
 */
export const getFormattedImageUrl = (imageUrl) => {
  // If the URL is null, undefined, or an empty string, return null
  if (!imageUrl || imageUrl.trim() === '') return null;

  // If the URL already starts with http or https, it's already a complete URL
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // Otherwise, prepend the API base URL (without the /api part)
  const baseUrl = process.env.REACT_APP_API_BASE_URL.replace('/api', '');

  // Make sure the imageUrl starts with a slash if it doesn't already
  const formattedImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  // Check if the URL points to a valid image file extension
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.JPG', '.JPEG', '.PNG'];
  const hasValidExtension = validExtensions.some(ext => formattedImageUrl.toLowerCase().endsWith(ext.toLowerCase()));

  // If the URL doesn't have a valid image extension, log a warning in development
  if (!hasValidExtension && process.env.NODE_ENV === 'development') {
    console.warn(`Warning: Image URL may not point to a valid image file: ${formattedImageUrl}`);
  }

  return `${baseUrl}${formattedImageUrl}`;
};

/**
 * Handles image loading errors by hiding the broken image and creating a fallback element
 * 
 * @param {Event} event - The error event from the image
 * @param {string} fallbackText - Text to display in the fallback element (usually first letter of name)
 * @param {string} className - Optional CSS class for the fallback element
 */
export const handleImageError = (event, fallbackText = '👤', className = 'text-3xl') => {
  // Log a more helpful error message with the image source
  const imgSrc = event.target.src || 'unknown source';

  // Only log to console in development environment to avoid cluttering production logs
  if (process.env.NODE_ENV === 'development') {
    console.error(`Error loading image from ${imgSrc}`);
  }

  try {
    // Hide the broken image
    event.target.style.display = 'none';

    // Check if a fallback element already exists to prevent duplicates
    const parent = event.target.parentNode;
    if (!parent) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Cannot create fallback: Image has no parent element');
      }
      return;
    }

    // Add a title attribute to the parent for better UX
    parent.setAttribute('title', 'Image could not be loaded');

    // Extract the first class name to use as a selector, or use a default if className is empty
    const firstClass = className && className.split(' ')[0] ? className.split(' ')[0] : 'image-fallback';
    const existingFallback = parent.querySelector(`.${firstClass}`);

    if (existingFallback) {
      // Update existing fallback text if provided
      if (fallbackText && fallbackText !== existingFallback.textContent) {
        existingFallback.textContent = fallbackText;
      }
      return;
    }

    // Create a fallback element
    const fallbackElement = document.createElement('span');
    fallbackElement.className = `image-fallback ${className}`;
    fallbackElement.textContent = fallbackText;

    // Add the fallback element to the parent of the image
    parent.appendChild(fallbackElement);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in handleImageError function:', error);
    }
  }
};