import axios from 'axios';

//const API_BASE_URL = 'http://localhost:5000/api'; 
const API_BASE_URL = 'gursha-backend.vercel.app/api'
    
// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Add request interceptor for debugging
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔐 Adding token to request:', config.url);
    } else {
        console.log('⚠️  No token found for request:', config.url);
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

export const fetchUsers = async () => {
    const res = await api.get('/users');
    return res.data;
};

export const fetchGames = async () => {
    const res = await api.get('/games');
    return res.data;
};

// Game Controllers API
export const getGameControllers = async () => {
    try {
        console.log('📋 Fetching game controllers...');
        const response = await api.get('/admin/controllers');
        console.log('✅ Game controllers fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('💥 Error fetching game controllers:', error.response?.data || error.message);
        throw error;
    }
};

export const createGameController = async (controllerData) => {
    try {
        console.log('📝 Creating game controller:', controllerData.username || 'with image');

        // Check if controllerData is FormData (file upload) or regular object
        const isFormData = controllerData instanceof FormData;

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
    } catch (error) {
        console.error('💥 Error creating game controller:', error.response?.data || error.message);
        throw error;
    }
};

export const updateGameController = async (userId, controllerData) => {
    try {
        console.log('🔄 Updating game controller:', userId);
        const response = await api.put(`/admin/controllers/${userId}`, controllerData);
        console.log('✅ Game controller updated:', response.data);
        return response.data;
    } catch (error) {
        console.error('💥 Error updating game controller:', error.response?.data || error.message);
        throw error;
    }
};

export const deleteGameController = async (userId) => {
    try {
        console.log('🗑️  Deleting game controller:', userId);
        const response = await api.delete(`/admin/controllers/${userId}`);
        console.log('✅ Game controller deleted:', response.data);
        return response.data;
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
        const response = await api.get('/games');
        const games = response.data;
        const totalRevenue = games.reduce((sum, game) => sum + (game.totalRevenue || 0), 0);
        console.log('✅ Total revenue calculated:', totalRevenue);
        return totalRevenue;
    } catch (error) {
        console.error('💥 Error fetching total revenue:', error.response?.data || error.message);
        return 0;
    }
};

// Games API
export const getGames = async () => {
    try {
        console.log('🎮 Fetching games...');
        const response = await api.get('/games');
        console.log('✅ Games fetched:', response.data.length, 'games');
        return response.data;
    } catch (error) {
        console.error('💥 Error fetching games:', error.response?.data || error.message);
        return [];
    }
};

export const createGame = async (gameData) => {
    try {
        console.log('🎮 Creating game:', gameData);
        const response = await api.post('/games', gameData);
        console.log('✅ Game created:', response.data);
        return response.data;
    } catch (error) {
        console.error('💥 Error creating game:', error.response?.data || error.message);
        throw error;
    }
};

export const updateGame = async (gameId, gameData) => {
    try {
        console.log('🔄 Updating game:', gameId);
        const response = await api.put(`/games/${gameId}`, gameData);
        console.log('✅ Game updated:', response.data);
        return response.data;
    } catch (error) {
        console.error('💥 Error updating game:', error.response?.data || error.message);
        throw error;
    }
};

export const deleteGame = async (gameId) => {
    try {
        console.log('🗑️  Deleting game:', gameId);
        const response = await api.delete(`/games/${gameId}`);
        console.log('✅ Game deleted:', response.data);
        return response.data;
    } catch (error) {
        console.error('💥 Error deleting game:', error.response?.data || error.message);
        throw error;
    }
};

// Participants API
export const getParticipants = async (gameId) => {
    try {
        console.log('👥 Fetching participants for game:', gameId);
        const response = await api.get(`/games/${gameId}/participants`);
        console.log('✅ Participants fetched:', response.data.length, 'participants');
        return response.data;
    } catch (error) {
        console.error('💥 Error fetching participants:', error.response?.data || error.message);
        return [];
    }
};

export const createParticipant = async (gameId, participantData) => {
    try {
        console.log('👥 Creating participant for game:', gameId, participantData);
        const response = await api.post(`/games/${gameId}/participants`, participantData);
        console.log('✅ Participant created:', response.data);
        return response.data;
    } catch (error) {
        console.error('💥 Error creating participant:', error.response?.data || error.message);
        throw error;
    }
};

// Prizes API
export const getPrizes = async () => {
    try {
        console.log('🏆 Fetching prizes...');
        const response = await api.get('/prizes');
        console.log('✅ Prizes fetched:', response.data.length, 'prizes');
        return response.data;
    } catch (error) {
        console.error('💥 Error fetching prizes:', error.response?.data || error.message);
        return [];
    }
};

export const createPrize = async (prizeData) => {
    try {
        console.log('🏆 Creating prize:', prizeData);
        const formData = new FormData();
        formData.append('name', prizeData.name);
        if (prizeData.amount) formData.append('amount', prizeData.amount);
        if (prizeData.image) formData.append('image', prizeData.image);
        const response = await api.post('/prizes', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('✅ Prize created:', response.data);
        return response.data;
    } catch (error) {
        console.error('💥 Error creating prize:', error.response?.data || error.message);
        throw error;
    }
};

// Users API
export const getUsers = async () => {
    try {
        console.log('👤 Fetching users...');
        const response = await api.get('/users');
        console.log('✅ Users fetched:', response.data.length, 'users');
        return response.data;
    } catch (error) {
        console.error('💥 Error fetching users:', error.response?.data || error.message);
        return [];
    }
};

export const updateUser = async (userId, userData) => {
    try {
        console.log('🔄 Updating user:', userId);
        const response = await api.put(`/users/${userId}`, userData);
        console.log('✅ User updated:', response.data);
        return response.data;
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
        const response = await api.get(`/admin/controllers/${id}`);
        return response.data;
    } catch (error) {
        console.error('💥 Error fetching game controller by ID:', error.response?.data || error.message);
        throw error;
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
