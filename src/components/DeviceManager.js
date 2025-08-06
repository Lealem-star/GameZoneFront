import React, { useState, useEffect } from 'react';
import { getUserDevices, removeDevice as removeDeviceApi } from '../services/deviceService';

const DeviceManager = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to view devices');
        setLoading(false);
        return;
      }

      const response = await getUserDevices();
      setDevices(response.devices || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError('Failed to load devices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    if (!window.confirm('Are you sure you want to remove this device?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to remove devices');
        setLoading(false);
        return;
      }

      await removeDeviceApi(deviceId);

      // Remove the device from the local state
      setDevices(devices.filter(device => device.deviceId !== deviceId));
      setSuccessMessage('Device removed successfully');
    } catch (error) {
      console.error('Error removing device:', error);
      setError('Failed to remove device. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date to a readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Check if the current device is in the list
  const isCurrentDevice = (deviceId) => {
    const currentDeviceId = localStorage.getItem('deviceId');
    return deviceId === currentDeviceId;
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage Your Devices</h2>
      <p className="mb-4 text-gray-600">
        You can log in on up to 2 devices at the same time. Remove devices you no longer use.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading devices...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {devices.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No devices registered</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {devices.map((device) => (
                <li key={device.deviceId} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {device.deviceName}
                        {isCurrentDevice(device.deviceId) && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Current Device
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Last login: {formatDate(device.lastLogin)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDevice(device.deviceId)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={fetchDevices}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
          disabled={loading}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default DeviceManager;