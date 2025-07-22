import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-red-500 hover:rotate-90 transition-all duration-300 text-xl focus:outline-none focus:ring-2 focus:ring-red-300"
          aria-label="Close modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
