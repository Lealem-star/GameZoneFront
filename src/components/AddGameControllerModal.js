import React, { useState } from 'react';
import { createGameController } from '../services/api';

const AddGameControllerModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        location: '',
        restaurantName: '',
        phoneNumber: ''
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts typing
        if (error) {
            setError('');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }

            setSelectedImage(file);
            setError('');

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('🔄 Starting game controller creation...');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            // Create FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('username', formData.username);
            formDataToSend.append('password', formData.password);
            formDataToSend.append('role', 'gameController');
            formDataToSend.append('location', formData.location);
            formDataToSend.append('restaurantName', formData.restaurantName);
            formDataToSend.append('phoneNumber', formData.phoneNumber);

            if (selectedImage) {
                formDataToSend.append('image', selectedImage);
            }

            console.log('📝 Creating game controller with data:', {
                username: formData.username,
                hasImage: !!selectedImage
            });

            const response = await createGameController(formDataToSend);
            console.log('✅ Game controller created successfully:', response);

            // Reset form
            setFormData({
                username: '',
                password: '',
                confirmPassword: '',
                location: '',
                restaurantName: '',
                phoneNumber: ''
            });
            setSelectedImage(null);
            setImagePreview(null);

            onSuccess(); // Refresh the controllers list
            onClose(); // Close the modal
        } catch (error) {
            console.error('💥 Error creating game controller:', error);

            // Handle specific error cases
            if (error.response?.status === 401) {
                setError('Session expired. Please log in again.');
            } else if (error.response?.status === 403) {
                setError('Access denied. You do not have permission to create game controllers.');
            } else if (error.response?.status === 400) {
                setError(error.response.data.message || 'Invalid data provided');
            } else if (error.response?.status === 409) {
                setError('Username already exists. Please choose a different username.');
            } else if (error.code === 'ECONNREFUSED') {
                setError('Cannot connect to server. Please make sure the server is running.');
            } else {
                setError(error.response?.data?.message || 'Error creating game controller. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Add Game Controller</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            <div className="font-medium">Error:</div>
                            <div>{error}</div>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter username"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirm password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Location
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter location"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Restaurant Name
                        </label>
                        <input
                            type="text"
                            name="restaurantName"
                            value={formData.restaurantName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter restaurant name"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter phone number"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Controller Image (Optional)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Accepted formats: JPG, PNG, GIF. Max size: 5MB
                        </p>
                    </div>

                    {imagePreview && (
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Image Preview
                            </label>
                            <div className="relative">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-32 object-cover rounded-md border border-gray-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                    disabled={loading}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Controller'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGameControllerModal; 