import React, { useState } from 'react';
import Carousel from '../components/Carousel';
import logo from '../assets/gurshalogo.png'; // Update with the correct path to your logo image
import Modal from '../components/Modal'; // Import the Modal component
import LoginForm from '../components/LoginForm'; // Import the LoginForm component

const LandingPage = () => {
  const [isModalOpen, setModalOpen] = useState(false); // State to manage modal visibility

  const handleLoginClick = () => {
    setModalOpen(true); // Open the modal
  };

  const handleCloseModal = () => {
    setModalOpen(false); // Close the modal
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-orange-400 to-yellow-500 overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-center w-full pt-1 pr-4 pl-4 animate-fade-in-down">
        <div className="flex flex-col items-center mb-4 md:mb-0">
          <img src={logo} alt="Gursha Logo" className="h-24 md:h-36 mb-2 animate-fade-in-up" />
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center animate-fade-in-up delay-200">Gursha Ticket</h1>
        </div>
        <button
          onClick={handleLoginClick}
          className="bg-blue-600 text-white px-6 py-2 rounded shadow-lg hover:bg-blue-700 transition duration-200 animate-bounce-in hover:animate-pulse focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          Login
        </button>
      </div>
      <Carousel />
      <div className="mt-8 text-center animate-fade-in-up delay-300">
        <p className="text-white text-sm md:text-base mb-4">Welcome to the Gursha Ticket system. Enjoy our engaging lottery experience!</p>
        <div className="inline-block bg-white bg-opacity-80 px-6 py-3 rounded-full shadow-lg animate-float text-orange-600 font-semibold text-lg mt-2">
          🎉 Try your luck and win amazing prizes every meal! 🎉
        </div>
      </div>
      {/* Modal for LoginForm */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <LoginForm />
      </Modal>
    </div>
  );
};

export default LandingPage;
