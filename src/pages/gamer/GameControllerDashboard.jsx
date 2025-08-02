import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaUsers, FaDollarSign, FaGamepad, FaCog, FaUserCircle, FaPlus, FaSignOutAlt } from 'react-icons/fa';
import { getGames, createGame, getUserById, createParticipant, getGamesControllerById } from '../../services/api';
import gurshaLogo from '../../assets/gurshalogo.png';
import ParticipantForm from '../../components/ParticipantForm';

const Sidebar = () => {
  const navigate = useNavigate();
  const [controller, setController] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchController = async () => {
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');
      const role = localStorage.getItem('role');

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserById(userId);
        console.log('Sidebar fetched user data:', data);
        setController(data);
      } catch (e) {
        console.error('Error fetching user profile:', e);
        if (username && role) {
          setController({
            username: username,
            role: role,
            image: null
          });
        } else {
          setController(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchController();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="bg-gradient-to-r from-orange-400 to-yellow-500 text-white w-64 min-h-screen flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 px-6 py-6 text-2xl font-bold border-b border-purple-800">
          <span>
            <div className="flex flex-col items-center mb-4 md:mb-0">
              <img src={gurshaLogo} alt="Gursha Logo" className="h-23 md:h-35 mb-2" />
            </div>
          </span>
        </div>
        <nav className="mt-4 flex-1">
          <div className="uppercase text-xs text-blue-200 px-6 mt-6 mb-2">Settings</div>
          <ul>
            <li><a href="#" className="flex items-center gap-3 px-6 py-2"><FaCog /> Settings</a></li>
            <li>
              <span onClick={handleLogout} className="flex items-center gap-3 px-6 py-2 cursor-pointer hover:text-yellow-200 transition-colors"><FaSignOutAlt /> Logout</span>
            </li>
          </ul>
        </nav>
      </div>
      <div className="flex items-center gap-3 px-6 py-4 border-t border-blue-800">
        {loading ? (
          <FaUserCircle className="text-3xl" />
        ) : controller && controller.image ? (
          <img src={`http://localhost:5000${controller.image}`} alt={controller.username} className="w-12 h-12 rounded-full object-cover border-2 border-white" />
        ) : (
          <FaUserCircle className="text-3xl" />
        )}
        <div>
          {loading ? (
            <div className="font-semibold">Loading...</div>
          ) : controller ? (
            <>
              <div className="font-semibold">{controller.username}</div>
              <div className="text-xs text-blue-200">{controller.role}</div>
            </>
          ) : (
            <div className="font-semibold">Unknown</div>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateGameModal = ({ open, onClose, onGameCreated }) => {
  const [name, setName] = useState('');
  const [entranceFee, setEntranceFee] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getMealTime = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 17) return 'lunch';
    return 'dinner';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const mealTime = getMealTime();
    const gameControllerId = localStorage.getItem('userId');
    try {
      const gameData = { name, mealTime, entranceFee: Number(entranceFee), gameControllerId };
      const created = await createGame(gameData);
      setName('');
      setEntranceFee('');
      onGameCreated(created?.newGame?._id || created?.newGame?.id);
      onClose();
    } catch (err) {
      alert('Failed to create game or prize');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <div className="flex flex-col items-center mb-4">
          <img src={gurshaLogo} alt="Gursha Logo" className="h-16 mb-2" />
          <h2 className="text-xl font-bold">Create Game</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" placeholder="Game Name" value={name} onChange={e => setName(e.target.value)} required className="border p-2 rounded" />
          <input type="number" placeholder="Entrance Fee" value={entranceFee} onChange={e => setEntranceFee(e.target.value)} required className="border p-2 rounded" />
          <button type="submit" className="bg-blue-600 text-white py-2 rounded font-semibold" disabled={submitting}>{submitting ? 'Creating...' : 'Create Game'}</button>
        </form>
      </div>
    </div>
  );
};

const TopBar = ({ onCreateGame }) => (
  <div className="flex items-center justify-between px-8 py-4 border-b bg-white sticky top-0 z-10">
    <div className="flex items-center gap-3 text-2xl font-extrabold bg-gradient-to-r from-orange-500 via-yellow-400 to-pink-500 bg-clip-text text-transparent drop-shadow-lg tracking-wide animate-fade-in-up">
      <FaGamepad className="text-3xl text-orange-400 drop-shadow" />
      የአጫዋች መስሪያ ቦታ
    </div>
    <div className="flex items-center gap-4">
      <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold flex items-center gap-2" onClick={onCreateGame}><FaPlus /> አዲስ ጌም ጀምር</button>
    </div>
  </div>
);

const SummaryCards = ({ totalGames, totalParticipants, systemRevenue }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
    <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-lg p-6 flex flex-col gap-2 items-center animate-fade-in-up">
      <div className="flex items-center gap-2 mb-2"><FaGamepad className="text-3xl text-blue-400" /><span className="font-semibold text-gray-700 text-lg">የዛሬ የጨዋታ ብዛት</span></div>
      <div className="text-3xl font-extrabold text-blue-700">{totalGames}</div>
    </div>
    <div className="bg-gradient-to-br from-orange-100 to-yellow-200 rounded-xl shadow-lg p-6 flex flex-col gap-2 items-center animate-fade-in-up delay-100">
      <div className="flex items-center gap-2 mb-2"><FaUsers className="text-3xl text-orange-400" /><span className="font-semibold text-gray-700 text-lg">የዛሬ የተጫዋች ብዛት</span></div>
      <div className="text-3xl font-extrabold text-orange-700">{totalParticipants}</div>
    </div>
    <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-lg p-6 flex flex-col gap-2 items-center animate-fade-in-up delay-200">
      <div className="flex items-center gap-2 mb-2"><FaDollarSign className="text-3xl text-green-400" /><span className="font-semibold text-gray-700 text-lg">የዛሬ አጠቃላይ ገቢ</span></div>
      <div className="text-3xl font-extrabold text-green-700">${systemRevenue.toFixed(2)}</div>
    </div>
  </div>
);

function isToday(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

const CompletedGamesTable = ({ games }) => {
  function formatDateOnly(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const gamesByDate = games.reduce((acc, game) => {
    const date = formatDateOnly(game.createdAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(game);
    return acc;
  }, {});

  const sortedDates = Object.keys(gamesByDate).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2 text-yellow-700 animate-fade-in-up">
        <FaTrophy className="text-yellow-500" /> የተጠናቀቁ ጨዋታዎች
      </h2>
      {sortedDates.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No completed games yet.</div>
      ) : (
        sortedDates.map(date => (
          <div key={date} className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <FaTrophy className="text-yellow-400" />
              <span className="text-lg font-bold text-gray-800">{date}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow-lg text-sm animate-fade-in-up">
                <thead>
                  <tr className="bg-gradient-to-r from-yellow-100 to-orange-100 border-b border-gray-200">
                    <th className="px-4 py-2 text-left">Game Name</th>
                    <th className="px-4 py-2 text-left">Entrance Fee</th>
                    <th className="px-4 py-2 text-left">Participants</th>
                    <th className="px-4 py-2 text-left">70% Prize</th>
                    <th className="px-4 py-2 text-left">Winner Name</th>
                    <th className="px-4 py-2 text-left">System Revenue (30%)</th>
                  </tr>
                </thead>
                <tbody>
                  {gamesByDate[date].map(game => {
                    const participantCount = Array.isArray(game.participants) ? game.participants.length : 0;
                    const totalCollected = participantCount * (Number(game.entranceFee) || 0);
                    const prize80 = (totalCollected * 0.7).toFixed(2);
                    const systemRevenue = (totalCollected * 0.3).toFixed(2);
                    return (
                      <tr key={game._id} className="hover:bg-yellow-50 border-b border-gray-100 transition-all duration-200 animate-fade-in-up">
                        <td className="px-4 py-2 font-semibold text-orange-700">{game.name || '-'}</td>
                        <td className="px-4 py-2">{game.entranceFee} ETB</td>
                        <td className="px-4 py-2">{participantCount}</td>
                        <td className="px-4 py-2">{prize80} ETB</td>
                        <td className="px-4 py-2 text-green-700 font-semibold">{game.winner?.name || '-'}</td>
                        <td className="px-4 py-2">{systemRevenue} ETB</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const OngoingGamesSection = ({ games }) => {
  const navigate = useNavigate();
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2 text-orange-700 animate-fade-in-up">
        <FaGamepad className="text-orange-400" /> በመካሄድ ላይ ያሉ ጨዋታዎች
      </h2>
      {games.length === 0 ? (
        <div className="text-gray-400">No ongoing games.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map(game => (
            <div
              key={game._id}
              className="bg-gradient-to-br from-yellow-100 to-orange-200 rounded-xl shadow-lg p-6 flex flex-col gap-3 hover:scale-105 transition-transform duration-200 animate-fade-in-up cursor-pointer"
              onClick={() => navigate(`/game/${game._id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-orange-700">{game.name}</span>
                <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">Ongoing</span>
              </div>
              <div className="flex items-center gap-4 text-gray-700 text-sm">
                <span className="flex items-center gap-1"><FaUsers /> {Array.isArray(game.participants) ? game.participants.length : 0} Participants</span>
                <span className="flex items-center gap-1"><FaDollarSign /> {game.entranceFee} ETB</span>
                <span className="flex items-center gap-1"><FaGamepad /> {game.mealTime}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const GameControllerDashboard = () => {
  const [games, setGames] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [totalGamesToday, setTotalGamesToday] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [systemRevenue, setSystemRevenue] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showParticipantAnimation, setShowParticipantAnimation] = useState(false);
  const [currentGameForParticipant, setCurrentGameForParticipant] = useState(null);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    const userId = localStorage.getItem('userId');
    const gamesData = await getGamesControllerById(userId);
    setGames(gamesData);
    const todayGames = gamesData.filter(g => isToday(g.createdAt));
    const totalGamesToday = todayGames.length;
    const totalParticipantsToday = todayGames.reduce((sum, g) => {
      return sum + (Array.isArray(g.participants) ? g.participants.length : 0);
    }, 0);
    const systemRevenueToday = todayGames.reduce((sum, g) => {
      const fee = Number(g.entranceFee) || 0;
      const count = Array.isArray(g.participants) ? g.participants.length : 0;
      return sum + (fee * count * 0.3);
    }, 0);
    setTotalGamesToday(totalGamesToday);
    setTotalParticipants(totalParticipantsToday);
    setSystemRevenue(systemRevenueToday);
    const todayRevenue = todayGames.reduce((sum, g) => {
      const fee = Number(g.entranceFee) || 0;
      const count = Array.isArray(g.participants) ? g.participants.length : 0;
      return sum + (fee * count);
    }, 0);
    setRevenue(todayRevenue);
  };

  useEffect(() => {
    fetchData();
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const completedGames = games.filter(g => g.winner);
  const ongoingGames = games.filter(g => !g.winner);

  const handleParticipantSubmit = async (participantData) => {
    if (!currentGameForParticipant) return;
    try {
      await createParticipant(currentGameForParticipant._id, participantData);
      const gamesData = await getGames();
      setGames(gamesData);
      setCurrentParticipant(participantData);
      setShowParticipantModal(false);
      setShowParticipantAnimation(true);
      const audio = new Audio('/welcome-good-luck.mp3');
      audio.play();
      setTimeout(() => {
        setShowParticipantAnimation(false);
      }, 10000);
    } catch (err) {
      alert('Failed to add participant');
      setShowParticipantModal(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar onCreateGame={() => setShowCreateModal(true)} />
        <div className="px-8 py-6 flex-1 overflow-y-auto">
          <SummaryCards
            totalGames={totalGamesToday}
            totalParticipants={totalParticipants}
            systemRevenue={systemRevenue}
          />
          <OngoingGamesSection games={ongoingGames} />
          <CompletedGamesTable games={completedGames} />
        </div>
        <CreateGameModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onGameCreated={(gameId) => {
          if (gameId) navigate(`/game/${gameId}`);
        }} />
        {showParticipantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowParticipantModal(false)}>&times;</button>
              <ParticipantForm onSubmit={handleParticipantSubmit} />
            </div>
          </div>
        )}
        {showParticipantAnimation && currentParticipant && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80 animate-fade-in">
            {currentParticipant.photo ? (
              <img 
                src={currentParticipant.photo.startsWith('http') ? currentParticipant.photo : currentParticipant.photo} 
                alt={currentParticipant.name} 
                className="w-48 h-48 rounded-full object-cover border-4 border-white mb-6" 
                onError={(e) => {
                  console.error('GameControllerDashboard animation image load error:', e);
                  // If the image fails to load, show a default emoji
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = `<div class="w-48 h-48 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-200 border-4 border-white mb-6 text-8xl">${currentParticipant.emoji || '😀'}</div>`;
                }}
              />
            ) : (
              <div className="w-48 h-48 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-200 border-4 border-white mb-6 text-8xl">
                <span role="img" aria-label="participant-emoji">{currentParticipant.emoji || '😀'}</span>
              </div>
            )}
            <div className="text-4xl text-white font-bold mb-2 animate-bounce">{currentParticipant.name}</div>
            <div className="text-2xl text-yellow-200 font-semibold">Welcome to the game and good luck!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameControllerDashboard;
