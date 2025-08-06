// Utility functions for device identification and management

/**
 * Generates a unique device ID or retrieves the existing one from localStorage
 * @returns {string} A unique device identifier
 */
export const getDeviceId = () => {
  // Check if device ID already exists in localStorage
  let deviceId = localStorage.getItem('deviceId');
  
  // If not, generate a new one
  if (!deviceId) {
    deviceId = generateUniqueId();
    localStorage.setItem('deviceId', deviceId);
  }
  
  return deviceId;
};

/**
 * Generates a unique identifier based on device information and random values
 * @returns {string} A unique identifier
 */
const generateUniqueId = () => {
  // Combine various browser/device information
  const platform = navigator.platform || '';
  const userAgent = navigator.userAgent || '';
  const screenWidth = window.screen.width || 0;
  const screenHeight = window.screen.height || 0;
  const colorDepth = window.screen.colorDepth || 0;
  const timestamp = new Date().getTime();
  const randomValue = Math.random().toString(36).substring(2, 15);
  
  // Create a string with all the information
  const rawId = `${platform}-${userAgent}-${screenWidth}x${screenHeight}-${colorDepth}-${timestamp}-${randomValue}`;
  
  // Hash the string to create a shorter, more manageable ID
  // Simple hash function for demonstration
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    const char = rawId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to a positive hex string and add a random component
  return Math.abs(hash).toString(16) + '-' + randomValue;
};

/**
 * Gets the device name based on browser and OS information
 * @returns {string} A human-readable device name
 */
export const getDeviceName = () => {
  const userAgent = navigator.userAgent;
  let deviceName = 'Unknown Device';
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (userAgent.indexOf('Safari') > -1) browser = 'Safari';
  else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';
  else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) browser = 'Internet Explorer';
  
  // Detect OS
  let os = 'Unknown';
  if (userAgent.indexOf('Windows') > -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') > -1) os = 'MacOS';
  else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
  else if (userAgent.indexOf('Android') > -1) os = 'Android';
  else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) os = 'iOS';
  
  deviceName = `${browser} on ${os}`;
  
  return deviceName;
};

/**
 * Removes the device ID from localStorage
 */
export const clearDeviceId = () => {
  localStorage.removeItem('deviceId');
};