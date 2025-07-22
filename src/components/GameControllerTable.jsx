import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaPhone, FaMapMarkerAlt, FaUtensils, FaTrash } from 'react-icons/fa';

const GameControllerTable = ({ controllers, deletingId, handleDelete }) => {
    const navigate = useNavigate();

    if (!controllers || controllers.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No game controllers found</p>
                <p className="text-sm">Click "Add Game Controller" to create one</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow-lg mb-4 animate-fade-in-up">
                <thead>
                    <tr className="bg-gradient-to-r from-blue-100 to-blue-0">
                        <th className="px-4 py-2 text-left font-semibold text-blue-700"><FaUser className="inline mr-1" /> Name</th>
                        <th className="px-4 py-2 text-left font-semibold text-blue-700"><FaPhone className="inline mr-1" /> Phone Number</th>
                        <th className="px-4 py-2 text-left font-semibold text-blue-700"><FaMapMarkerAlt className="inline mr-1" /> Location</th>
                        <th className="px-4 py-2 text-left font-semibold text-blue-700"><FaUtensils className="inline mr-1" /> Restaurant Name</th>
                        <th className="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {controllers.map(controller => (
                        <tr
                            key={controller._id}
                            className="hover:bg-blue-50 cursor-pointer transition-all duration-0 animate-fade-in-up"
                            onClick={() => navigate(`/gameControllerDetail/${controller._id}`)}
                        >
                            <td className="px-4 py-2 font-semibold text-blue-800">{controller.username}</td>
                            <td className="px-4 py-2">{controller.phoneNumber}</td>
                            <td className="px-4 py-2">{controller.location}</td>
                            <td className="px-4 py-2">{controller.restaurantName}</td>
                            <td className="px-4 py-2">
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        handleDelete(controller._id);
                                    }}
                                    disabled={deletingId === controller._id}
                                    className="text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1"
                                >
                                    <FaTrash /> {deletingId === controller._id ? 'Deleting...' : 'Delete'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GameControllerTable; 