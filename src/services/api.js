import axios from 'axios';
// Import the offline API functions
import * as offlineApi from './offlineApi';
import { updateItem } from './offlineApi';

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
        // Check if this is a public endpoint that doesn't require auth
        const publicEndpoints = ['/games/', '/participants'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => config.url.includes(endpoint));

        if (!isPublicEndpoint) {
            console.log('⚠️  No token found for protected request:', config.url);
        }
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

// Listen for online status changes
window.addEventListener('online', () => {
    console.log('🌐 Back online, attempting to sync...');
    offlineApi.syncOfflineActions();
});

// Listen for offline status changes
window.addEventListener('offline', () => {
    console.log('📴 Device is now offline, switching to offline mode');
});

export const fetchUsers = async () => {
    try {
        if (isOnline()) {
            const res = await api.get('/users');
            return res.data;
        } else {
            return await offlineApi.fetchUsers();
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        // Try offline as fallback
        return await offlineApi.fetchUsers();
    }
};

export const fetchGames = async () => {
    try {
        if (isOnline()) {
            const res = await api.get('/games');
            return res.data;
        } else {
            return await offlineApi.fetchGames();
        }
    } catch (error) {
        console.error('Error fetching games:', error);
        // Try offline as fallback
        return await offlineApi.fetchGames();
    }
};

// Game Controllers API
export const getGameControllers = async () => {
    try {
        console.log('📋 Fetching game controllers...');
        if (isOnline()) {
            const response = await api.get('/admin/controllers');
            console.log('✅ Game controllers fetched:', response.data);
            return response.data;
        } else {
            console.log('📴 Fetching game controllers from offline storage');
            return await offlineApi.getGameControllers();
        }
    } catch (error) {
        console.error('💥 Error fetching game controllers:', error.response?.data || error.message);
        // Try offline as fallback
        try {
            return await offlineApi.getGameControllers();
        } catch (offlineError) {
            console.error('💥 Offline fallback also failed:', offlineError);
            throw error; // Throw the original error
        }
    }
};

export const createGameController = async (controllerData) => {
    try {
        console.log('📝 Creating game controller:', controllerData.username || 'with image');

        // Check if controllerData is FormData (file upload) or regular object
        const isFormData = controllerData instanceof FormData;

        if (isOnline()) {
            // Configure request based on data type
            const config = {
                headers: {
                    'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            };

            const response = await api.post('/admin/controllers', controllerData, config);
            console.log('✅ Game controller created:', response.data);
            return response.data;
        } else {
            console.log('📴 Creating game controller in offline mode');
            if (isFormData) {
                console.log('📤 Queuing file upload for when online');
                return await offlineApi.queueFileUpload('controllers', controllerData);
            } else {
                return await offlineApi.createGameController(controllerData);
            }
        }
    } catch (error) {
        console.error('💥 Error creating game controller:', error.response?.data || error.message);
        throw error;
    }
};

export const updateGameController = async (userId, controllerData) => {
    try {
        console.log('🔄 Updating game controller:', userId);
        if (isOnline()) {
            const response = await api.put(`/admin/controllers/${userId}`, controllerData);
            console.log('✅ Game controller updated:', response.data);
            return response.data;
        } else {
            console.log('📴 Updating game controller in offline mode');
            return await offlineApi.updateGameController(userId, controllerData);
        }
    } catch (error) {
        console.error('💥 Error updating game controller:', error.response?.data || error.message);
        throw error;
    }
};

export const deleteGameController = async (userId) => {
    try {
        console.log('🗑️  Deleting game controller:', userId);
        if (isOnline()) {
            const response = await api.delete(`/admin/controllers/${userId}`);
            console.log('✅ Game controller deleted:', response.data);
            return response.data;
        } else {
            console.log('📴 Deleting game controller in offline mode');
            return await offlineApi.deleteGameController(userId);
        }
    } catch (error) {
        console.error('💥 Error deleting game controller:', error.response?.data || error.message);
        throw error;
    }
};

// Revenue API
export const getTotalRevenue = async () => {
    try {
        console.log('💰 Fetching total revenue...');
        // Since there's no specific revenue endpoint, we'll calculate from games
        let games;
        if (isOnline()) {
            const response = await api.get('/games');
            games = response.data;
        } else {
            console.log('📴 Fetching games from offline storage for revenue calculation');
            games = await offlineApi.fetchGames();
        }
        const totalRevenue = games.reduce((sum, game) => sum + (game.totalRevenue || 0), 0);
        console.log('✅ Total revenue calculated:', totalRevenue);
        return totalRevenue;
    } catch (error) {
        console.error('💥 Error fetching total revenue:', error.response?.data || error.message);
        // Try offline as fallback
        try {
            const games = await offlineApi.fetchGames();
            return games.reduce((sum, game) => sum + (game.totalRevenue || 0), 0);
        } catch (offlineError) {
            console.error('💥 Offline fallback also failed:', offlineError);
            return 0;
        }
    }
};

// Games API
export const getGames = async () => {
    try {
        console.log('🎮 Fetching games...');
        if (isOnline()) {
            const response = await api.get('/games');
            console.log('✅ Games fetched:', response.data.length, 'games');
            return response.data;
        } else {
            console.log('📴 Fetching games from offline storage');
            const games = await offlineApi.getGames();
            console.log('✅ Games fetched from offline storage:', games.length, 'games');
            return games;
        }
    } catch (error) {
        console.error('💥 Error fetching games:', error.response?.data || error.message);
        // Try offline as fallback
        try {
            const games = await offlineApi.getGames();
            return games;
        } catch (offlineError) {
            console.error('💥 Offline fallback also failed:', offlineError);
            return [];
        }
    }
};

export const createGame = async (gameData) => {
    try {
        console.log('🎮 Creating game:', gameData);
        if (isOnline()) {
            const response = await api.post('/games', gameData);
            console.log('✅ Game created:', response.data);
            return response.data;
        } else {
            console.log('📴 Creating game in offline mode');
            return await offlineApi.createGame(gameData);
        }
    } catch (error) {
        console.error('💥 Error creating game:', error.response?.data || error.message);
        throw error;
    }
};

export const updateGame = async (gameId, gameData) => {
    try {
        console.log('🔄 Updating game:', gameId);
        if (isOnline()) {
            const response = await api.put(`/games/${gameId}`, gameData);
            console.log('✅ Game updated:', response.data);
            return response.data;
        } else {
            console.log('📴 Updating game in offline mode');
            return await offlineApi.updateGame(gameId, gameData);
        }
    } catch (error) {
        console.error('💥 Error updating game:', error.response?.data || error.message);
        throw error;
    }
};

export const deleteGame = async (gameId) => {
    try {
        console.log('🗑️  Deleting game:', gameId);
        if (isOnline()) {
            const response = await api.delete(`/games/${gameId}`);
            console.log('✅ Game deleted:', response.data);
            return response.data;
        } else {
            console.log('📴 Deleting game in offline mode');
            return await offlineApi.deleteGame(gameId);
        }
    } catch (error) {
        console.error('💥 Error deleting game:', error.response?.data || error.message);
        throw error;
    }
};

// Participants API
export const getParticipants = async (gameId) => {
    try {
        console.log('👥 Fetching participants for game:', gameId);
        if (isOnline()) {
            const response = await api.get(`/games/${gameId}/participants`);
            console.log('✅ Participants fetched:', response.data.length, 'participants');
            return response.data;
        } else {
            console.log('📴 Fetching participants from offline storage');
            const participants = await offlineApi.getParticipants(gameId);
            console.log('✅ Participants fetched from offline storage:', participants.length, 'participants');
            return participants;
        }
    } catch (error) {
        console.error('💥 Error fetching participants:', error.response?.data || error.message);
        // Try offline as fallback
        try {
            return await offlineApi.getParticipants(gameId);
        } catch (offlineError) {
            console.error('💥 Offline fallback also failed:', offlineError);
            return [];
        }
    }
};

export const createParticipant = async (gameId, participantData) => {
    try {
        console.log('👥 Creating participant for game:', gameId, participantData);

        // Check if participantData is FormData (file upload) or regular object
        const isFormData = participantData instanceof FormData;

        if (isOnline()) {
            const config = isFormData ? {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            } : undefined;

            const response = await api.post(`/games/${gameId}/participants`, participantData, config);
            console.log('✅ Participant created:', response.data);
            return response.data;
        } else {
            console.log('📴 Creating participant in offline mode');
            if (isFormData) {
                console.log('📤 Queuing file upload for when online');
                return await offlineApi.createParticipant(gameId, participantData);
            } else {
                return await offlineApi.createParticipant(gameId, participantData);
            }
        }
    } catch (error) {
        console.error('💥 Error creating participant:', error.response?.data || error.message);
        throw error;
    }
};

// Prizes API
export const getPrizes = async () => {
    try {
        console.log('🏆 Fetching prizes...');
        if (isOnline()) {
            const response = await api.get('/prizes');
            console.log('✅ Prizes fetched:', response.data.length, 'prizes');
            return response.data;
        } else {
            console.log('📴 Offline mode: Prizes are not available offline');
            return [];
        }
    } catch (error) {
        console.error('💥 Error fetching prizes:', error.response?.data || error.message);
        return [];
    }
};

export const createPrize = async (prizeData) => {
    try {
        console.log('🏆 Creating prize:', prizeData);

        // Create FormData if prizeData is not already FormData
        let formData;
        if (prizeData instanceof FormData) {
            formData = prizeData;
        } else {
            formData = new FormData();
            formData.append('name', prizeData.name);
            if (prizeData.amount) formData.append('amount', prizeData.amount);
            if (prizeData.image) formData.append('image', prizeData.image);
        }

        if (isOnline()) {
            const response = await api.post('/prizes', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            console.log('✅ Prize created:', response.data);
            return response.data;
        } else {
            console.log('📴 Queuing prize creation for when online');
            // Use the offlineApi's queueFileUpload function
            return await offlineApi.queueFileUpload('prizes', formData);
        }
    } catch (error) {
        console.error('💥 Error creating prize:', error.response?.data || error.message);
        throw error;
    }
};

// Users API
export const getUsers = async () => {
    try {
        console.log('👤 Fetching users...');
        if (isOnline()) {
            const response = await api.get('/users');
            console.log('✅ Users fetched:', response.data.length, 'users');
            return response.data;
        } else {
            console.log('📴 Fetching users from offline storage');
            return await offlineApi.fetchUsers();
        }
    } catch (error) {
        console.error('💥 Error fetching users:', error.response?.data || error.message);
        // Try offline as fallback
        try {
            return await offlineApi.fetchUsers();
        } catch (offlineError) {
            console.error('💥 Offline fallback also failed:', offlineError);
            return [];
        }
    }
};

export const updateUser = async (userId, userData) => {
    try {
        console.log('🔄 Updating user:', userId);
        if (isOnline()) {
            const response = await api.put(`/users/${userId}`, userData);
            console.log('✅ User updated:', response.data);
            return response.data;
        } else {
            console.log('📴 Updating user in offline mode');
            // Use the updateItem function directly
            return await updateItem('users', { ...userData, _id: userId });
        }
    } catch (error) {
        console.error('💥 Error updating user:', error.response?.data || error.message);
        throw error;
    }
};

export const getAllParticipants = async () => {
    try {
        console.log('👥 Fetching all participants...');
        const response = await api.get('/participants');
        console.log('✅ All participants fetched:', response.data.length, 'participants');
        return response.data;
    } catch (error) {
        console.error('💥 Error fetching all participants:', error.response?.data || error.message);
        return [];
    }
};

// Get participants by controller (restaurant-specific)
export const getParticipantsByController = async (controllerId) => {
    try {
        console.log('👥 Fetching participants for controller:', controllerId);
        const response = await api.get(`/participants/controller/${controllerId}`);
        console.log('✅ Controller participants fetched:', response.data.length, 'participants');
        return response.data;
    } catch (error) {
        console.error('💥 Error fetching controller participants:', error.response?.data || error.message);
        return [];
    }
};

export const getGameById = async (gameId) => {
    try {
        console.log('🎮 Fetching game by ID:', gameId);
        const response = await api.get(`/games/${gameId}`);
        console.log('✅ Game fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('💥 Error fetching game by ID:', error.response?.data || error.message);
        return null;
    }
};

export const getGameControllerById = async (id) => {
    try {
        // Check if id is null, undefined, or the string "null" or "undefined"
        if (!id || id === 'null' || id === 'undefined') {
            console.warn('⚠️ Invalid controller ID provided to getGameControllerById:', id);
            return null;
        }

        const response = await api.get(`/admin/controllers/${id}`);
        return response.data;
    } catch (error) {
        console.error('💥 Error fetching game controller by ID:', error.response?.data || error.message);
        return null; // Return null instead of throwing error to prevent component crashes
    }
};

export const getUserById = async (id) => {
    try {
        const response = await api.get(`/users/${id}`);
        return response.data;
    } catch (error) {
        console.error('💥 Error fetching user by ID:', error.response?.data || error.message);
        throw error;
    }
};



// Get all games managed by a specific controller
export const getGamesControllerById = async (controllerId) => {
    // Check if controllerId is valid
    if (!controllerId || controllerId === 'null' || controllerId === 'undefined') {
        console.warn('⚠️ Invalid controller ID provided:', controllerId);
        return [];
    }

    try {
        console.log('🎮 Fetching games for controller:', controllerId);
        if (isOnline()) {
            const res = await api.get(`/games/controller/${controllerId}`);
            return res.data;
        } else {
            console.log('📴 Fetching games for controller from offline storage');
            // Get all games and filter by controllerId
            const games = await offlineApi.getAllItems('games');
            return games.filter(game => game.controllerId === controllerId);
        }
    } catch (error) {
        console.error('💥 Error fetching games for controller:', error);
        // Try offline as fallback
        try {
            const games = await offlineApi.getAllItems('games');
            return games.filter(game => game.controllerId === controllerId);
        } catch (offlineError) {
            console.error('💥 Offline fallback also failed:', offlineError);
            return [];
        }
    }
};

// Get total revenue for a specific controller
export const getControllerRevenue = async (controllerId) => {
    // Check if controllerId is valid
    if (!controllerId || controllerId === 'null' || controllerId === 'undefined') {
        console.warn('⚠️ Invalid controller ID provided:', controllerId);
        return { totalRevenue: 0 };
    }

    try {
        console.log('💰 Fetching revenue for controller:', controllerId);
        if (isOnline()) {
            const res = await api.get(`/games/controller/${controllerId}/revenue`);
            return res.data;
        } else {
            console.log('📴 Calculating revenue for controller from offline storage');
            // Get all games for this controller and calculate revenue
            const games = await offlineApi.getAllItems('games');
            const controllerGames = games.filter(game => game.controllerId === controllerId);
            const totalRevenue = controllerGames.reduce((sum, game) => sum + (game.totalRevenue || 0), 0);
            return { totalRevenue };
        }
    } catch (error) {
        console.error('💥 Error fetching revenue for controller:', error);
        // Try offline as fallback
        try {
            const games = await offlineApi.getAllItems('games');
            const controllerGames = games.filter(game => game.controllerId === controllerId);
            const totalRevenue = controllerGames.reduce((sum, game) => sum + (game.totalRevenue || 0), 0);
            return { totalRevenue };
        } catch (offlineError) {
            console.error('💥 Offline fallback also failed:', offlineError);
            return { totalRevenue: 0 };
        }
    }
};

// Add a function to check online status
export const checkOnlineStatus = () => {
    return isOnline();
};

// Add a function to manually trigger sync
export const syncOfflineData = async () => {
    if (isOnline()) {
        console.log('🔄 Syncing offline data...');
        try {
            // Sync regular offline actions
            const syncResult = await offlineApi.syncOfflineActions();

            // Return the combined results
            return {
                ...syncResult,
                message: `Sync complete! ${syncResult.success} items synchronized${syncResult.fileUploads > 0 ? `, ${syncResult.fileUploads} files uploaded` : ''}${syncResult.conflicts > 0 ? `, ${syncResult.conflicts} conflicts resolved` : ''}${syncResult.failures > 0 ? `, ${syncResult.failures} failed` : ''}.`
            };
        } catch (error) {
            console.error('💥 Error during sync:', error);
            throw error;
        }
    } else {
        throw new Error('Cannot sync while offline');
    }
};
