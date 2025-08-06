import axios from 'axios';
import {
  addItem,
  getAllItems,
  getItemByKey,
  updateItem,
  deleteItem,
  getItemsByIndex,
  recordOfflineAction,
  getPendingOfflineActions,
  markOfflineActionSynced
} from '../utils/indexedDB';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor for debugging and authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔐 Adding token to request:', config.url);
  } else {
    console.log('⚠️ No token found for request:', config.url);
  }
  console.log('🚀 Making request to:', config.url, config.data);
  return config;
}, (error) => {
  console.error('❌ Request error:', error);
  return Promise.reject(error);
});

// Add response interceptor for debugging
api.interceptors.response.use((response) => {
  console.log('✅ Response received:', response.status, response.config.url);
  return response;
}, (error) => {
  console.error('❌ Response error:', error.response?.status, error.response?.data, error.config?.url);

  // Handle specific error cases
  if (error.response?.status === 401) {
    console.error('🔒 Unauthorized - Token might be invalid or expired');
    // Optionally redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
  }

  if (error.response?.status === 403) {
    console.error('🚫 Forbidden - User does not have required permissions');
  }

  return Promise.reject(error);
});

// Check if we're online
const isOnline = () => {
  return navigator.onLine;
};

// Sync function to send offline actions to server when back online
export const syncOfflineActions = async () => {
  if (!isOnline()) {
    console.log('Still offline, cannot sync');
    return { success: 0, failed: 0, conflicts: 0, fileUploads: 0, message: 'Cannot sync while offline' };
  }

  try {
    const pendingActions = await getPendingOfflineActions();
    console.log(`Found ${pendingActions.length} pending actions to sync`);
    
    let successCount = 0;
    let failedCount = 0;
    let conflictCount = 0;
    let fileUploadCount = 0;
    
    // Sort actions by timestamp to ensure proper order (oldest first)
    const sortedActions = pendingActions.sort((a, b) => a.timestamp - b.timestamp);

    for (const action of sortedActions) {
      try {
        console.log(`Syncing action: ${action.type} ${action.endpoint}`);
        
        // For PUT operations, check for conflicts first
        if (action.type === 'PUT' && action.storeName && action.data && action.data._id) {
          try {
            // Get the current server version
            const serverResponse = await api.get(action.endpoint);
            const serverItem = serverResponse.data;
            
            // Check if server version is newer than our local version
            if (serverItem && serverItem.updatedAt && action.data.updatedAt && 
                new Date(serverItem.updatedAt) > new Date(action.data.updatedAt)) {
              console.warn(`Conflict detected for ${action.storeName} item ${action.data._id}`);
              conflictCount++;
              
              // Implement last-write-wins strategy with conflict tracking
              // We'll still apply our changes but log the conflict
              console.log('Using last-write-wins strategy for conflict resolution');
              
              // Store conflict information for potential UI display
              await recordOfflineAction({
                type: 'CONFLICT',
                endpoint: action.endpoint,
                storeName: action.storeName,
                localData: action.data,
                serverData: serverItem,
                timestamp: Date.now(),
                synced: 1,  // Use 1 instead of true for consistency
                resolved: true
              });
            }
          } catch (error) {
            console.log('Could not check for conflicts, proceeding with update');
          }
        }
        
        let response;
        
        // Handle file uploads
        if (action.type === 'FILE_UPLOAD') {
          // Get the pending upload from IndexedDB
          const pendingUpload = await getItemByKey(action.storeName, action.localId);
          
          if (!pendingUpload) {
            console.error(`Pending upload not found: ${action.localId}`);
            continue;
          }
          
          // Create a new FormData object
          const formData = new FormData();
          
          // Add all JSON data to FormData
          for (const [key, value] of Object.entries(pendingUpload.jsonData)) {
            formData.append(key, value);
          }
          
          // Add all files to FormData
          for (const fileEntry of pendingUpload.fileEntries) {
            // Convert base64 back to File object
            const file = await base64ToFile(
              fileEntry.data,
              fileEntry.filename,
              fileEntry.type
            );
            formData.append(fileEntry.key, file);
          }
          
          // Send the FormData to the server
          response = await api.post(action.endpoint, formData);
          fileUploadCount++;
          
          // Update the status of the pending upload
          pendingUpload.status = 'completed';
          pendingUpload.serverResponse = response.data;
          await updateItem(action.storeName, pendingUpload);
        } else {
          // Handle regular actions
          switch (action.type) {
            case 'POST':
              response = await api.post(action.endpoint, action.data);
              break;
            case 'PUT':
              response = await api.put(action.endpoint, action.data);
              break;
            case 'DELETE':
              response = await api.delete(action.endpoint);
              break;
            default:
              console.error(`Unknown action type: ${action.type}`);
              continue;
          }
        }

        console.log(`Successfully synced action: ${action.id}`);
        await markOfflineActionSynced(action.id);
        successCount++;

        // If this was creating a new item, we need to update the local ID with the server ID
        if ((action.type === 'POST' || action.type === 'FILE_UPLOAD') && response.data && response.data._id) {
          const localItem = await getItemByKey(action.storeName, action.localId);
          if (localItem) {
            // Update with server data but keep any local changes that might have happened
            const updatedItem = { ...localItem, _id: response.data._id };
            await updateItem(action.storeName, updatedItem);
            // Also delete the temporary local item
            await deleteItem(action.storeName, action.localId);
          }
        }
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        failedCount++;
        // We'll leave it as unsynced and try again later
      }
    }

    console.log(`Sync completed: ${successCount} successful, ${failedCount} failed, ${conflictCount} conflicts, ${fileUploadCount} file uploads`);
    
    let message = `Sync complete! ${successCount} items synchronized.`;
    if (fileUploadCount > 0) {
      message = `Sync complete! ${successCount} items synchronized, including ${fileUploadCount} file uploads.`;
    }
    if (conflictCount > 0) {
      message = `Sync complete with ${conflictCount} conflicts resolved using last-write-wins strategy.`;
    }
    
    return { 
      success: successCount, 
      failed: failedCount, 
      conflicts: conflictCount,
      fileUploads: fileUploadCount,
      message
    };
  } catch (error) {
    console.error('Error during sync process:', error);
    return { success: 0, failed: 0, conflicts: 0, fileUploads: 0, message: `Sync error: ${error.message}` };
  }
};

// Helper function to convert base64 back to File
const base64ToFile = async (dataUrl, filename, mimeType) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType });
};

// Listen for online status changes
window.addEventListener('online', () => {
  console.log('🌐 Back online, attempting to sync...');
  syncOfflineActions();
});

// Generic function to handle API requests with offline support
const offlineRequest = async (method, endpoint, data = null, options = {}) => {
  const { storeName, idField = '_id', localIdPrefix = 'local_' } = options;

  try {
    // If we're online, try the actual API request
    if (isOnline()) {
      let response;
      switch (method) {
        case 'GET':
          response = await api.get(endpoint);
          
          // If we have a storeName, cache the data
          if (storeName) {
            const items = Array.isArray(response.data) ? response.data : [response.data];
            for (const item of items) {
              if (item && item[idField]) {
                await updateItem(storeName, item);
              }
            }
          }
          
          return response.data;
          
        case 'POST':
          response = await api.post(endpoint, data);
          
          // If we have a storeName, cache the new item
          if (storeName && response.data && response.data[idField]) {
            await addItem(storeName, response.data);
          }
          
          return response.data;
          
        case 'PUT':
          response = await api.put(endpoint, data);
          
          // If we have a storeName, update the cached item
          if (storeName && response.data && response.data[idField]) {
            await updateItem(storeName, response.data);
          }
          
          return response.data;
          
        case 'DELETE':
          response = await api.delete(endpoint);
          
          // If we have a storeName and an ID to delete
          if (storeName && options.deleteId) {
            await deleteItem(storeName, options.deleteId);
          }
          
          return response.data;
          
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    } else {
      // We're offline, use IndexedDB
      console.log(`📴 Offline mode for ${method} ${endpoint}`);
      
      switch (method) {
        case 'GET':
          if (!storeName) {
            throw new Error('Cannot perform offline GET without a storeName');
          }
          
          // If we're getting a specific item by ID
          if (options.getId) {
            const item = await getItemByKey(storeName, options.getId);
            if (!item) {
              throw new Error(`Item not found offline: ${options.getId}`);
            }
            return item;
          }
          
          // If we're getting items by a specific field value
          if (options.getByField && options.getByValue) {
            return await getItemsByIndex(storeName, options.getByField, options.getByValue);
          }
          
          // Otherwise, get all items
          return await getAllItems(storeName);
          
        case 'POST':
          if (!storeName || !data) {
            throw new Error('Cannot perform offline POST without storeName and data');
          }
          
          // Create a temporary local ID
          const localId = `${localIdPrefix}${Date.now()}`;
          const newItem = { ...data, [idField]: localId, _isLocalOnly: true };
          
          // Save to IndexedDB
          await addItem(storeName, newItem);
          
          // Record this action for later sync
          await recordOfflineAction({
            type: 'POST',
            endpoint,
            data,
            storeName,
            localId
          });
          
          return newItem;
          
        case 'PUT':
          if (!storeName || !data || !data[idField]) {
            throw new Error('Cannot perform offline PUT without storeName, data, and ID');
          }
          
          // Check if the item exists
          const existingItem = await getItemByKey(storeName, data[idField]);
          if (!existingItem) {
            throw new Error(`Cannot update non-existent item: ${data[idField]}`);
          }
          
          // Update the item
          const updatedItem = { ...existingItem, ...data };
          await updateItem(storeName, updatedItem);
          
          // Record this action for later sync
          await recordOfflineAction({
            type: 'PUT',
            endpoint,
            data,
            storeName
          });
          
          return updatedItem;
          
        case 'DELETE':
          if (!storeName || !options.deleteId) {
            throw new Error('Cannot perform offline DELETE without storeName and deleteId');
          }
          
          // Delete from IndexedDB
          await deleteItem(storeName, options.deleteId);
          
          // Record this action for later sync
          await recordOfflineAction({
            type: 'DELETE',
            endpoint,
            storeName,
            deleteId: options.deleteId
          });
          
          return { message: 'Item deleted offline' };
          
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    }
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error);
    
    // If we're online but the request failed, and we have offline data, fall back to it
    if (isOnline() && method === 'GET' && storeName) {
      console.log('Online request failed, falling back to offline data');
      
      try {
        if (options.getId) {
          return await getItemByKey(storeName, options.getId);
        } else if (options.getByField && options.getByValue) {
          return await getItemsByIndex(storeName, options.getByField, options.getByValue);
        } else {
          return await getAllItems(storeName);
        }
      } catch (offlineError) {
        console.error('Offline fallback also failed:', offlineError);
        throw error; // Throw the original error
      }
    }
    
    throw error;
  }
};

// API functions with offline support
export const fetchUsers = async () => {
  return await offlineRequest('GET', '/users', null, { storeName: 'users' });
};

export const fetchGames = async () => {
  return await offlineRequest('GET', '/games', null, { storeName: 'games' });
};

export const getGameControllers = async () => {
  return await offlineRequest('GET', '/admin/controllers', null, {
    storeName: 'users',
    getByField: 'role',
    getByValue: 'gameController'
  });
};

export const createGameController = async (controllerData) => {
  // Handle FormData separately as it can't be stored directly in IndexedDB
  const isFormData = controllerData instanceof FormData;
  
  if (isFormData && !isOnline()) {
    // Instead of throwing an error, queue the file upload for later
    return await queueFileUpload('controllers', controllerData);
  }
  
  const config = {
    headers: {
      'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  };
  
  if (isFormData) {
    // For FormData, we need to use the regular API
    const response = await api.post('/admin/controllers', controllerData, config);
    // Cache the result
    await addItem('users', response.data.user);
    return response.data;
  } else {
    return await offlineRequest('POST', '/admin/controllers', controllerData, {
      storeName: 'users'
    });
  }
};

export const updateGameController = async (userId, controllerData) => {
  return await offlineRequest('PUT', `/admin/controllers/${userId}`, controllerData, {
    storeName: 'users'
  });
};

export const deleteGameController = async (userId) => {
  return await offlineRequest('DELETE', `/admin/controllers/${userId}`, null, {
    storeName: 'users',
    deleteId: userId
  });
};

export const getGames = async () => {
  return await offlineRequest('GET', '/games', null, { storeName: 'games' });
};

export const createGame = async (gameData) => {
  return await offlineRequest('POST', '/games', gameData, { storeName: 'games' });
};

export const updateGame = async (gameId, gameData) => {
  return await offlineRequest('PUT', `/games/${gameId}`, gameData, {
    storeName: 'games'
  });
};

export const deleteGame = async (gameId) => {
  return await offlineRequest('DELETE', `/games/${gameId}`, null, {
    storeName: 'games',
    deleteId: gameId
  });
};

export const getParticipants = async (gameId) => {
  return await offlineRequest('GET', `/games/${gameId}/participants`, null, {
    storeName: 'participants',
    getByField: 'gameId',
    getByValue: gameId
  });
};

export const createParticipant = async (gameId, participantData) => {
  // Handle FormData separately
  const isFormData = participantData instanceof FormData;
  
  if (isFormData && !isOnline()) {
    // Instead of throwing an error, we'll store the file and form data for later upload
    return await queueFileUpload('participants', participantData, gameId);
  }
  
  if (isFormData) {
    const response = await api.post(`/games/${gameId}/participants`, participantData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    // Cache the result
    await addItem('participants', response.data);
    return response.data;
  } else {
    return await offlineRequest('POST', `/games/${gameId}/participants`, participantData, {
      storeName: 'participants'
    });
  }
};

// Queue a file upload for when we're back online
export const queueFileUpload = async (storeName, formData, gameId = null) => {
  try {
    // Generate a temporary local ID
    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract file data and convert to base64 for storage
    const fileEntries = [];
    const jsonData = {};
    
    // Process all form data entries
    for (const [key, value] of formData.entries()) {
      // If it's a file, convert to base64
      if (value instanceof File) {
        const base64Data = await fileToBase64(value);
        fileEntries.push({
          key,
          filename: value.name,
          type: value.type,
          size: value.size,
          data: base64Data
        });
      } else {
        // For non-file data, store as is
        jsonData[key] = value;
      }
    }
    
    // Add gameId if provided
    if (gameId) {
      jsonData.gameId = gameId;
    }
    
    // Create a record of the pending upload
    const pendingUpload = {
      _id: localId,
      jsonData,
      fileEntries,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // Store in IndexedDB
    await updateItem(`${storeName}_uploads`, pendingUpload);
    
    // Record this action for later sync
    await recordOfflineAction({
      type: 'FILE_UPLOAD',
      endpoint: gameId ? `/games/${gameId}/${storeName}` : `/${storeName}`,
      storeName: `${storeName}_uploads`,
      localId,
      timestamp: Date.now(),
      synced: 0  // Use 0 instead of false for consistency
    });
    
    console.log(`File upload queued for later with ID: ${localId}`);
    
    // Return a mock response similar to what the API would return
    return {
      _id: localId,
      ...jsonData,
      imageUrl: fileEntries.length > 0 ? 'pending_upload' : null,
      _isLocalOnly: true,
      _hasPendingUpload: true
    };
  } catch (error) {
    console.error('Error queuing file upload:', error);
    throw new Error('Failed to store file for later upload: ' + error.message);
  }
};

// Helper function to convert File to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export const updateParticipant = async (participantId, participantData) => {
  return await offlineRequest('PUT', `/participants/${participantId}`, participantData, {
    storeName: 'participants'
  });
};

export const deleteParticipant = async (participantId) => {
  return await offlineRequest('DELETE', `/participants/${participantId}`, null, {
    storeName: 'participants',
    deleteId: participantId
  });
};

// Export the original API for cases where we need direct access
export { api };

// Export the isOnline function for external use
export { isOnline };

// Export getAllItems and getItemByKey for direct access to IndexedDB
// (These are already exported at the bottom with updateItem)

// Define the missing getTotalRevenue function
export const getTotalRevenue = async () => {
  try {
    // Get all games from IndexedDB
    const games = await getAllItems('games');
    
    // Calculate total revenue from all games
    const totalRevenue = games.reduce((sum, game) => sum + (game.totalRevenue || 0), 0);
    
    return { totalRevenue };
  } catch (error) {
    console.error('Error calculating total revenue offline:', error);
    return { totalRevenue: 0 };
  }
};

// Export offlineApi as a named export for compatibility with api.js imports
// Define updateUser function
export const updateUser = async (userId, userData) => {
  try {
    // Get the existing user
    const existingUser = await getItemByKey('users', userId);
    if (!existingUser) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    
    // Update the user with new data
    const updatedUser = { ...existingUser, ...userData, _id: userId };
    
    // Save to IndexedDB
    await updateItem('users', updatedUser);
    
    // Record this action for later sync
    await recordOfflineAction({
      type: 'PUT',
      endpoint: `/users/${userId}`,
      data: userData,
      storeName: 'users',
      itemId: userId
    });
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user offline:', error);
    throw error;
  }
};

// Export utility functions for direct use
export { updateItem, getAllItems, getItemByKey };

// Function to check for complex operations that might be limited in offline mode
export const getOfflineLimitations = async () => {
  try {
    // Check for pending file uploads
    const participantUploads = await getAllItems('participants_uploads') || [];
    const controllerUploads = await getAllItems('controllers_uploads') || [];
    const prizeUploads = await getAllItems('prizes_uploads') || [];
    
    // Count pending uploads
    const pendingUploads = 
      participantUploads.filter(upload => upload.status === 'pending').length +
      controllerUploads.filter(upload => upload.status === 'pending').length +
      prizeUploads.filter(upload => upload.status === 'pending').length;
    
    // Get pending offline actions
    const pendingActions = await getPendingOfflineActions();
    
    // Define complex operations that are limited in offline mode
    const complexOperations = [
      {
        name: 'Advanced Reporting',
        description: 'Complex reports and analytics require server-side processing',
        status: 'limited'
      },
      {
        name: 'Real-time Collaboration',
        description: 'Multi-user editing and real-time updates are not available offline',
        status: 'unavailable'
      },
      {
        name: 'Data Validation',
        description: 'Some complex validation rules may be simplified in offline mode',
        status: 'limited'
      }
    ];
    
    return {
      pendingUploads,
      pendingActions: pendingActions.length,
      complexOperations
    };
  } catch (error) {
    console.error('Error getting offline limitations:', error);
    return {
      pendingUploads: 0,
      pendingActions: 0,
      complexOperations: []
    };
  }
};

export const offlineApi = {
  syncOfflineActions,
  fetchUsers,
  fetchGames,
  getGameControllers,
  createGameController,
  updateGameController,
  deleteGameController,
  getTotalRevenue,
  getGames,
  createGame,
  updateGame,
  deleteGame,
  getParticipants,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  updateUser,
  getAllItems,
  getItemByKey,
  updateItem,
  getOfflineLimitations,
  queueFileUpload
};