import React, { useEffect, useState, useCallback } from 'react';
import { getGameControllers, getTotalRevenue, deleteGameController, fetchUsers, fetchGames } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/gurshalogo.png';
import lealemppl from '../../assets/IMG_4741.JPG';
import AddGameControllerModal from '../../components/AddGameControllerModal';
import GameControllerTable from '../../components/GameControllerTable';
import { FaDollarSign } from 'react-icons/fa';
import ConfirmModal from '../../components/ConfirmModal';


const SIDEBAR_LINKS = [
  { label: 'Dashboard', icon: '📊' },
  { label: 'Settings', icon: '⚙️' },
  { label: 'Logout', icon: '🚪' },
];

const AdminDashboard = () => {
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  //const [controllers, setControllers] = useState([]);`
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [controllerToDelete, setControllerToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const usersData = await fetchUsers();
      setUsers(usersData);
      const gamesData = await fetchGames();
      setGames(gamesData);
    };
    fetchData();
  }, []);

  // Aggregations
  const totalRevenue = games.reduce((sum, g) => sum + (g.totalRevenue || 0), 0);
  const controllers = users.filter(u => u.role === 'gameController');

  const handleAddSuccess = async () => {
    // Refresh the data after adding a new controller
    try {
      const usersData = await fetchUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error refreshing users data:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [controllersData, totalRevenue] = await Promise.all([
        getGameControllers(),
        getTotalRevenue()
      ]);
      //setControllers(controllersData);
      setRevenue(totalRevenue);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="p-4 animate-fade-in">
        <h2 className="text-xl font-bold mb-4">Admin Dashboard</h2>
        <div className="text-center py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Replace handleDelete to show modal
  const handleDelete = (controllerId) => {
    setControllerToDelete(controllerId);
    setConfirmModalOpen(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (!controllerToDelete) return;
    setDeletingId(controllerToDelete);
    setConfirmModalOpen(false);
    try {
      await deleteGameController(controllerToDelete);
      setUsers(prevUsers => {
        const updated = prevUsers.filter(u => u._id !== controllerToDelete);
        console.log('Users after delete:', updated);
        return updated;
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setUsers(prevUsers => {
          const updated = prevUsers.filter(u => u._id !== controllerToDelete);
          console.log('Users after 404 delete:', updated);
          return updated;
        });
      } else {
        console.error('Error deleting controller:', error);
        alert('Error deleting controller');
      }
    } finally {
      setDeletingId(null);
      setControllerToDelete(null);
    }
  };

  const isToday = (dateString) => {
    const gameDate = new Date(dateString);
    const today = new Date();
    return gameDate.getDate() === today.getDate() &&
      gameDate.getMonth() === today.getMonth() &&
      gameDate.getFullYear() === today.getFullYear();
  };

  // Calculate today's total system revenue across all controllers
  // Use createdAt for date filtering
  const todayGames = games.filter(g => isToday(g.createdAt));
  console.log('Games:', games);
  console.log('Today Games:', todayGames);
  const totalSystemRevenueToday = todayGames.reduce((sum, game) => {
    const fee = Number(game.entranceFee) || 0;
    const count = Array.isArray(game.participants) ? game.participants.length : 0;
    return sum + (fee * count * 0.4);
  }, 0);


  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-r from-orange-400 to-yellow-500 text-white flex flex-col animate-fade-in-left">
        <div className="flex items-center gap-2 px-6 py-6 text-2xl font-bold border-b border-purple-800 animate-fade-in-down">
          <span><div className="flex flex-col items-center mb-4 md:mb-0">
            <img src={logo} alt="Gursha Logo" className="h-23 md:h-35 mb-2 animate-fade-in-up" />
            <h1 className="text-2xl md:text-xl font-bold text-white text-center animate-fade-in-up delay-0">Gursha Ticket</h1>
          </div></span>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          {SIDEBAR_LINKS.map(link => (
            <button
              key={link.label}
              onClick={link.label === 'Logout' ? handleLogout : undefined}
              className={`flex items-center gap-3 px-6 py-3 text-lg hover:bg-purple-800 transition ${link.label === 'Dashboard' ? 'bg-purple-900' : ''} animate-fade-in-left`}
            >
              <span>{link.icon}</span> {link.label}
            </button>
          ))}
        </div>
        <div className="mt-auto px-6 py-4 flex items-center gap-3 border-t border-purple-800 animate-fade-in-up">
          <img src={lealemppl} alt="profile" className="w-10 h-10 rounded-full" />
          <div>
            <div className="font-semibold">Lealem Meseret</div>
            <div className="text-xs text-purple-0">System Admin</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 animate-fade-in-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-down">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-orange-400 via-yellow-500 to-purple-600 bg-clip-text text-transparent drop-shadow flex items-center gap-3">
            <span role="img" aria-label="burger">🍔</span>
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow-lg animate-bounce-in focus:outline-none focus:ring-4 focus:ring-blue-300">
              Add Game Controller
            </button>

            <AddGameControllerModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSuccess={handleAddSuccess}
            />

          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-100 to-green-0 rounded-xl shadow-lg p-6 flex flex-col gap-2 items-center animate-fade-in-up">
            <div className="flex items-center gap-2 mb-2"><FaDollarSign className="text-3xl text-green-400" /><span className="font-semibold text-gray-700 text-lg">Total System Revenue (Today)</span></div>
            <div className="text-3xl font-extrabold text-green-700">ETB {totalSystemRevenueToday.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <h3 className="text-2xl font-extrabold bg-gradient-to-r from-orange-400 via-yellow-500 to-purple-600 bg-clip-text text-transparent drop-shadow flex items-center gap-2 animate-fade-in-up delay-0">
          <span role="img" aria-label="burger">🍔</span>
          Game Controller Lists
        </h3>
        <div className="grid grid-cols-1 gap-6 p-8">
          <GameControllerTable controllers={controllers} deletingId={deletingId} handleDelete={handleDelete} rowClassName="hover:bg-blue-50 transition-all duration-0 animate-fade-in-up" />
          <ConfirmModal
            isOpen={confirmModalOpen}
            title="Delete Game Controller"
            message="Are you sure you want to delete this game controller? This action cannot be undone."
            onConfirm={confirmDelete}
            onCancel={() => { setConfirmModalOpen(false); setControllerToDelete(null); }}
          />
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
