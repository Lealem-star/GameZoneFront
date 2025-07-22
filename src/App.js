import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Use Routes instead of Switch
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import GameControllerDashboard from './pages/gamer/GameControllerDashboard';
import GameDashboard from './pages/gamer/GameDashboard';
import GameControllerDetail from './pages/admin/GameControllerDetail';
import DrawWinner from './pages/gamer/DrawWinner';
import { AuthProvider } from './context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} /> {/* Use element prop instead of component */}
          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/GameController" element={<GameControllerDashboard />} />
          <Route path="/game/:gameId" element={<GameDashboard />} />
          <Route path="/gamecontrollerdashboard" element={<GameControllerDashboard />} />
          <Route path="/gameControllerDetail/:id" element={<GameControllerDetail />} />
          <Route path="/draw-winner/:gameId" element={<DrawWinner />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
