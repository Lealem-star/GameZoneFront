import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaUsers, FaDollarSign, FaGamepad, FaCog, FaUserCircle, FaPlus, FaSignOutAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { getGames, createGame, getUserById, createParticipant, getGamesControllerById } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getFormattedImageUrl, handleImageError, checkImageExists } from '../../utils/imageUtils';
import gurshaLogo from '../../assets/gurshalogo.png';
import ParticipantForm from '../../components/ParticipantForm';

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [controller, setController] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [imageExists, setImageExists] = useState(false);

  useEffect(() => {
    const fetchController = async () => {
      // Log all localStorage items for debugging
      console.log('DEBUG - All localStorage items:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`${key}: ${localStorage.getItem(key)}`);
      }

      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');
      const role = localStorage.getItem('role');

      console.log('DEBUG - User info from localStorage:', { userId, username, role });

      if (!userId) {
        console.warn('No userId found in localStorage');
        setLoading(false);
        return;
      }

      try {
        // Use the user endpoint which is accessible to all authenticated users
        console.log('DEBUG - Calling getUserById with userId:', userId);
        const data = await getUserById(userId);
        console.log('DEBUG - Sidebar fetched user data:', data);

        if (data) {
          console.log('DEBUG - Setting controller with API data:', data);
          console.log('DEBUG - Controller image:', data.image);
          setController(data);

          // Check if the controller image exists
          if (data.image) {
            const imageUrl = getFormattedImageUrl(data.image);
            console.log('DEBUG - Formatted image URL:', imageUrl);
            const exists = await checkImageExists(imageUrl);
            console.log('DEBUG - Image exists:', exists);
            setImageExists(exists);
          } else {
            console.log('DEBUG - No image in controller data');
          }

          // Only fetch daily revenue if user is admin
          if (data.role === 'admin') {
            try {
              const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/admin/controllers/${userId}/revenue`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              const revenueData = await response.json();
              setDailyRevenue(revenueData.dailySystemRevenue || 0); // Use system revenue instead of total revenue
              console.log('DEBUG - Revenue data:', revenueData);
            } catch (error) {
              console.error('Error fetching daily revenue:', error);
            }
          }

          // Check if package is depleted
          if (data.package && !data.package.isUnlimited && data.package.remainingAmount <= 0) {
            console.log('DEBUG - Package depleted, redirecting to package-depleted page');
            navigate('/package-depleted');
            return;
          }
        } else {
          console.warn('No controller data returned from API');
          // Fallback to localStorage data if API returns null
          if (username && role) {
            console.log('DEBUG - Using localStorage data as fallback');
            setController({
              username: username,
              role: role,
              image: null
            });
          } else {
            console.log('DEBUG - No username/role in localStorage, setting controller to null');
            setController(null);
          }
        }
      } catch (e) {
        console.error('Error fetching user profile:', e);
        if (username && role) {
          console.log('DEBUG - Error occurred, using localStorage data as fallback');
          setController({
            username: username,
            role: role,
            image: null
          });
        } else {
          console.log('DEBUG - Error occurred, no username/role in localStorage, setting controller to null');
          setController(null);
        }
      } finally {
        setLoading(false);
      }
    };
    // Execute the async function
    fetchController();
  }, [navigate]);

  // Add a separate useEffect to check image existence when controller changes
  useEffect(() => {
    const checkImage = async () => {
      if (controller && controller.image) {
        const imageUrl = getFormattedImageUrl(controller.image);
        console.log('Checking image existence for:', imageUrl);
        const exists = await checkImageExists(imageUrl);
        console.log('Image exists check result:', exists);
        setImageExists(exists);
      } else {
        setImageExists(false);
      }
    };
    checkImage();
  }, [controller]);

  const handleLogout = async () => {
    try {
      // Use the async logout function from authService
      await logout();
      // Redirect to login page
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      // Redirect to login page even if there's an error
      navigate('/');
    }
  };

  // Calculate remaining package amount
  const getRemainingPackage = () => {
    if (!controller || !controller.package) return null;

    if (controller.package.isUnlimited) {
      return 'Unlimited';
    } else {
      return `${controller.package.remainingAmount} ETB`;
    }
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

        {/* Package Information */}
        {controller && controller.package && (
          <div className="mt-4 px-6 py-4 bg-yellow-600 rounded-lg mx-3 shadow-inner">
            <h3 className="text-white font-bold mb-2">Package Status</h3>
            <div className="flex items-center justify-between">
              <span>Remaining:</span>
              <span className="font-bold text-white bg-yellow-700 px-3 py-1 rounded-full">
                {getRemainingPackage()}
              </span>
            </div>
            {!controller.package.isUnlimited && (
              <div className="mt-2 text-xs text-yellow-100">
                <p>Daily System Revenue: {dailyRevenue} ETB</p>
                <p className="mt-1">Original Package: {controller.package.amount} ETB</p>
                <p className="mt-1">Used: {controller.package.amount - controller.package.remainingAmount} ETB</p>
              </div>
            )}
          </div>
        )}

        <nav className="mt-4 flex-1">
          <div className="uppercase text-xs text-blue-200 px-6 mt-6 mb-2">Settings</div>
          <ul>
            <li><a href="#" className="flex items-center gap-3 px-6 py-2"><FaCog /> Settings</a></li>
            <li>
              <a href="/manage-devices" className="flex items-center gap-3 px-6 py-2 hover:text-yellow-200 transition-colors">
                <FaUserCircle /> Manage Devices
              </a>
            </li>
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
          <div className="relative w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <img
              src={getFormattedImageUrl(controller.image)}
              alt={`${controller.username || 'User'} profile`}
              className="w-12 h-12 rounded-full object-cover border-2 border-white"
              onError={(e) => {
                console.log('Profile image failed to load:', controller.image);
                console.log('Attempted URL:', e.target.src);

                // Try alternative URL formats
                const baseUrl = process.env.REACT_APP_API_BASE_URL.replace('/api', '');
                const alternativeUrl = `${baseUrl}/uploads/${controller.image}`;

                if (e.target.src !== alternativeUrl) {
                  console.log('Trying alternative URL:', alternativeUrl);
                  e.target.src = alternativeUrl;
                  return; // Don't show fallback yet, let it try the alternative URL
                }

                // Use a more descriptive fallback with the user's initials if available
                const initials = controller.username ? controller.username.charAt(0).toUpperCase() : '👤';
                handleImageError(e, initials, 'text-3xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-700');
                setImageExists(false); // Update state to prevent future attempts
              }}
            />
          </div>
        ) : (
          <div className="relative w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            {controller && controller.username ? (
              <span className="text-3xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-700">
                {controller.username.charAt(0).toUpperCase()}
              </span>
            ) : (
              <FaUserCircle className="text-3xl" />
            )}
          </div>
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

const CreateGameModal = ({ open, onClose, onGameCreated, games, transferParticipants, setTransferParticipants }) => {
  const [name, setName] = useState('');
  const [entranceFee, setEntranceFee] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedGame, setSelectedGame] = useState('');
  const [previousGames, setPreviousGames] = useState([]);

  useEffect(() => {
    // Filter completed games that have participants
    if (games && games.length > 0) {
      console.log('DEBUG - Filtering games for transfer dropdown');
      console.log('DEBUG - Total games available:', games.length);
      const completedWithParticipants = games.filter(g =>
        g.status === 'completed' && Array.isArray(g.participants) && g.participants.length > 0
      );
      console.log('DEBUG - Completed games with participants:', completedWithParticipants);
      setPreviousGames(completedWithParticipants);
    }
  }, [games]);

  // Reset selectedGame when transferParticipants is toggled off
  useEffect(() => {
    if (!transferParticipants) {
      setSelectedGame('');
    }
  }, [transferParticipants]);

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
      // Create the new game
      const gameData = { name, mealTime, entranceFee: Number(entranceFee), gameControllerId };
      console.log('🎮 Creating game with data:', gameData);
      const created = await createGame(gameData);
      const newGameId = created?.newGame?._id || created?.newGame?.id;

      // Play new game announcement sound
      try {
        const audio = new Audio(process.env.PUBLIC_URL + '/sounds/Gamestart.mp3');
        audio.play().catch((error) => { 
          console.error('Game start audio play error:', error);
        });
      } catch (error) { 
        console.error('Game start audio creation error:', error);
      }

      // If transferring participants is enabled and a game is selected
      if (transferParticipants && selectedGame) {
        // Find the selected game
        const sourceGame = games.find(g => g._id === selectedGame);

        if (sourceGame && Array.isArray(sourceGame.participants) && sourceGame.participants.length > 0) {
          console.log('DEBUG - Transferring participants from:', sourceGame._id);
          console.log('DEBUG - Source game participants:', sourceGame.participants);
          // Transfer each participant to the new game
          for (const participant of sourceGame.participants) {
            console.log('DEBUG - Transferring participant:', participant);
            const transferData = {
              name: participant.name,
              photo: participant.photo,
              emoji: participant.emoji
            };
            console.log('DEBUG - Transfer data being sent:', transferData);
            await createParticipant(newGameId, transferData);
          }
          console.log('DEBUG - Participants transferred successfully.');
        } else {
          console.warn('No participants found in selected game or game not found.');
        }
      }

      setName('');
      setEntranceFee('');
      setSelectedGame('');
      setTransferParticipants(false);
      onGameCreated(newGameId);
      onClose();
    } catch (err) {
      console.error('Error creating game or transferring participants:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create game or transfer participants';
      alert(`Error: ${errorMessage}`);
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

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="transferParticipants"
              checked={transferParticipants}
              onChange={e => setTransferParticipants(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="transferParticipants" className="text-sm font-medium text-gray-700">Transfer participants from previous game</label>
          </div>

          {transferParticipants && (
            <select
              value={selectedGame}
              onChange={e => setSelectedGame(e.target.value)}
              className="border p-2 rounded mt-2"
              required={transferParticipants}
            >
              <option value="">Select a previous game</option>
              {previousGames.map(game => (
                <option key={game._id} value={game._id}>
                  {game.name} ({game.participants.length} participants)
                </option>
              ))}
            </select>
          )}

          <button type="submit" className="bg-blue-600 text-white py-2 rounded font-semibold mt-2" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Game'}
          </button>
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

const SummaryCards = ({ totalGames, totalParticipants, systemRevenue, showRevenue, onToggleRevenue }) => (
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
      <div className="flex items-center gap-3 mb-2">
        <FaDollarSign className="text-3xl text-green-400" />
        <span className="font-semibold text-gray-700 text-lg">የዛሬ አጠቃላይ ገቢ</span>
        <button
          type="button"
          onClick={onToggleRevenue}
          className="ml-2 text-green-700/70 hover:text-green-800 transition-colors"
          title={showRevenue ? 'Hide amount' : 'Show amount'}
        >
          {showRevenue ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      <div className="text-3xl font-extrabold text-green-700">
        {showRevenue ? `$${systemRevenue.toFixed(2)}` : '••••'}
      </div>
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
                    const prize70 = (totalCollected * 0.7).toFixed(2);
                    const systemRevenue = (totalCollected * 0.3).toFixed(2);
                    return (
                      <tr key={game._id} className="hover:bg-yellow-50 border-b border-gray-100 transition-all duration-200 animate-fade-in-up">
                        <td className="px-4 py-2 font-semibold text-orange-700">{game.name || '-'}</td>
                        <td className="px-4 py-2">{game.entranceFee} ETB</td>
                        <td className="px-4 py-2">{participantCount}</td>
                        <td className="px-4 py-2">{prize70} ETB</td>
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

const OngoingGamesSection = ({ games, onGameClick }) => {
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
              onClick={() => {
                onGameClick && onGameClick();
                navigate(`/game/${game._id}`);
              }}
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
  const [showRevenue, setShowRevenue] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showParticipantAnimation, setShowParticipantAnimation] = useState(false);
  const [currentGameForParticipant, setCurrentGameForParticipant] = useState(null);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [transferParticipants, setTransferParticipants] = useState(false);
  const drawWinnerAudioRef = useRef(null);
  const navigate = useNavigate();

  const playDrawWinnerSound = () => {
    if (drawWinnerAudioRef.current) {
      drawWinnerAudioRef.current.currentTime = 0;
      drawWinnerAudioRef.current.play().catch(err => console.log('Draw winner audio blocked:', err));
    }
  };

  const fetchData = async () => {
    const userId = localStorage.getItem('userId');

    // Check if userId exists before making the API call
    if (!userId) {
      console.warn('No user ID found in localStorage');
      setGames([]);
      setTotalGamesToday(0);
      setTotalParticipants(0);
      setSystemRevenue(0);
      setRevenue(0);
      return;
    }

    try {
      const gamesData = await getGamesControllerById(userId);
      console.log('DEBUG - All games fetched:', gamesData);
      setGames(gamesData);
      const todayGames = gamesData.filter(g => isToday(g.createdAt));
      const totalGamesToday = todayGames.length;
      const totalParticipantsToday = todayGames.reduce((sum, g) => {
        return sum + (Array.isArray(g.participants) ? g.participants.length : 0);
      }, 0);
      const systemRevenueToday = todayGames.reduce((sum, g) => {
        const fee = Number(g.entranceFee) || 0;
        const count = Array.isArray(g.participants) ? g.participants.length : 0;
        return sum + (fee * count * 0.3); // 30% of total collected
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
    } catch (error) {
      console.error('Error fetching games data:', error);
      setGames([]);
    }
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
          <audio ref={drawWinnerAudioRef} src={process.env.PUBLIC_URL + "/sounds/drawwinner.mp3"} preload="auto" onError={(e) => console.error('Draw winner audio load error:', e.target.src)} />
          <SummaryCards
            totalGames={totalGamesToday}
            totalParticipants={totalParticipants}
            systemRevenue={systemRevenue}
            showRevenue={showRevenue}
            onToggleRevenue={() => setShowRevenue((prev) => !prev)}
          />
          <OngoingGamesSection games={ongoingGames} onGameClick={playDrawWinnerSound} />
          <CompletedGamesTable games={completedGames} />
        </div>
        <CreateGameModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onGameCreated={(gameId) => {
            if (gameId) navigate(`/game/${gameId}`);
          }}
          games={games}
          transferParticipants={transferParticipants}
          setTransferParticipants={setTransferParticipants}
        />
        {showParticipantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowParticipantModal(false)}>&times;</button>
              <ParticipantForm
                onSubmit={handleParticipantSubmit}
                games={games}
                showSuggestions={!transferParticipants}
              />
            </div>
          </div>
        )}
        {showParticipantAnimation && currentParticipant && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80 animate-fade-in">
            {currentParticipant.photo ? (
              <img
                src={getFormattedImageUrl(currentParticipant.photo)}
                alt={currentParticipant.name}
                className="w-48 h-48 rounded-full object-cover border-4 border-white mb-6"
                onError={(e) => {
                  console.error('GameControllerDashboard animation image load error:', e);
                  // If the image fails to load, show a default emoji
                  e.target.style.display = 'none';
                  // Create a fallback element with the participant's emoji or a default
                  const fallbackElement = document.createElement('div');
                  fallbackElement.className = "w-48 h-48 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-200 border-4 border-white mb-6 text-8xl";
                  fallbackElement.innerHTML = `<span role="img" aria-label="participant-emoji">${currentParticipant.emoji || '😀'}</span>`;
                  e.target.parentNode.appendChild(fallbackElement);
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
