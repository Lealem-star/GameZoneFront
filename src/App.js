import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Use Routes instead of Switch
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import GameControllerDashboard from './pages/gamer/GameControllerDashboard';
import GameDashboard from './pages/gamer/GameDashboard';
import GameControllerDetail from './pages/admin/GameControllerDetail';
import DrawWinner from './pages/gamer/DrawWinner';
import PackageDepleted from './components/PackageDepleted';
import DeviceManager from './components/DeviceManager';
import MaxDevicesReached from './components/MaxDevicesReached';
import { AuthProvider } from './context/AuthContext';
import NetworkStatus from './components/NetworkStatus';

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
          <Route path="/package-depleted" element={<PackageDepleted />} />
          <Route path="/manage-devices" element={<DeviceManager />} />
          <Route path="/max-devices-reached" element={<MaxDevicesReached />} />
        </Routes>
        <NetworkStatus />
      </Router>
    </AuthProvider>
  );
};

export default App;
