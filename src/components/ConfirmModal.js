import React from 'react';
import logo from '../assets/gurshalogo.png';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-md animate-scale-in relative overflow-hidden">
                {/* Top Gradient Bar with Logo */}
                <div className="flex flex-col items-center justify-center bg-gradient-to-r from-orange-400 to-yellow-500 p-4 pb-2">
                    <img src={logo} alt="Gursha Logo" className="h-12 mb-2 animate-float" />
                    <h2 className="text-xl font-bold text-white drop-shadow mb-1 animate-fade-in-down">{title}</h2>
                </div>
                <div className="p-6 pt-4 flex flex-col items-center">
                    <p className="mb-6 text-center text-gray-700 animate-fade-in-up">{message}</p>
                    <div className="flex justify-center gap-4 w-full">
                        <button
                            className="px-5 py-2 rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 font-semibold shadow hover:from-gray-300 hover:to-gray-400 transition"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold shadow hover:from-red-600 hover:to-orange-600 transition"
                            onClick={onConfirm}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal; 