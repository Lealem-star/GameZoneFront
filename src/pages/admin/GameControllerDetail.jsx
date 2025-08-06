import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaDollarSign, FaCalendarAlt, FaGamepad, FaUsers, FaTrophy, FaGift } from 'react-icons/fa';
import { getFormattedImageUrl, handleImageError } from '../../utils/imageUtils';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function useCountUp(target, duration = 1200) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        let start = 0;
        const increment = target / (duration / 16);
        let raf;
        function step() {
            start += increment;
            if (start < target) {
                setValue(Math.floor(start));
                raf = requestAnimationFrame(step);
            } else {
                setValue(target);
            }
        }
        step();
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return value;
}

const GameControllerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [controller, setController] = useState(null);
    // const [revenue, setRevenue] = useState(0);
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [controllerRes, revenueRes, gamesRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/admin/controllers/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                    axios.get(`${API_BASE_URL}/admin/controllers/${id}/revenue`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                    axios.get(`${API_BASE_URL}/admin/controllers/${id}/games`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
                ]);
                setController(controllerRes.data);
                // setRevenue(revenueRes.data.totalRevenue);
                setGames(gamesRes.data);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError('Controller not found or has been deleted.');
                } else {
                    setError('Failed to load controller details.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);


    // Calculate total revenue for today only (30% system revenue)
    function isToday(dateStr) {
        const d = new Date(dateStr);
        const today = new Date();
        return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    }

    const todayGames = games.filter(game => isToday(game.createdAt));

    // 30% system revenue
    const totalRevenueToday = todayGames.reduce(
        (sum, game) => sum + ((Number(game.entranceFee) || 0) * (Array.isArray(game.participants) ? game.participants.length : 0) * 0.3), 0
    );

    const animatedRevenue = useCountUp(Math.round(totalRevenueToday));

    if (loading) return <div className="p-8 text-center animate-fade-in">Loading...</div>;
    if (error) {
        return (
            <div className="p-8 text-center text-red-500 animate-fade-in">
                {error}
            </div>
        );
    }
    if (!controller) return null;

    // Sort games by createdAt descending (latest first)
    const sortedGames = [...games].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="min-h-screen w-full bg-gray-50 flex flex-col">
            <div className="flex-1 flex flex-col justify-center">
                <div className="w-full px-0 sm:px-8 py-8">
                    <div className="flex justify-between items-start mb-6 w-full animate-fade-in-down">
                        {/* Profile Card */}
                        <div className="flex items-center gap-6 bg-gray-50 rounded-lg p-4 border border-gray-200 w-fit animate-fade-in-left">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                {controller.image ? (
                                    <img 
                                        src={getFormattedImageUrl(controller.image)} 
                                        alt={controller.username} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => handleImageError(e, controller.username?.charAt(0).toUpperCase() || '?', 'text-4xl text-gray-500 font-bold')}
                                    />
                                ) : (
                                    <span className="text-4xl text-gray-500 font-bold">{controller.username?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div>
                                <div className="text-xl font-bold">{controller.username}</div>
                                <div className="text-gray-600 text-sm">{controller.role}</div>
                                <div className="text-gray-600 text-sm">Phone: {controller.phoneNumber}</div>
                                <div className="text-gray-600 text-sm">Location: {controller.location}</div>
                                <div className="text-gray-600 text-sm">Restaurant: {controller.restaurantName}</div>
                            </div>
                        </div>
                        {/* Back Button */}
                        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold border border-gray-300 shadow-sm animate-fade-in-up">Back</button>
                    </div>

                    {/* Total Revenue Card */}
                    <div className="flex justify-center mb-8 w-full animate-fade-in-up">
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-lg px-8 py-6 text-lg font-semibold border border-blue-200 w-full max-w-2xl text-center flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-2"><FaDollarSign className="text-3xl text-blue-400" /><span className="font-semibold text-gray-700 text-lg">Total Revenue of Game Controller (today)</span></div>
                            <span className="text-3xl font-extrabold text-blue-700">${animatedRevenue}</span>
                        </div>
                    </div>

                    {/* Games Table */}
                    <div className="overflow-x-auto border-t border-gray-200 pt-4 w-full animate-fade-in-up delay-200">
                        <table className="min-w-full bg-white rounded-xl shadow-lg text-sm animate-fade-in-up">
                            <thead>
                                <tr className="bg-gradient-to-r from-yellow-100 to-orange-100 border-b border-gray-200">
                                    <th className="px-4 py-2 text-left font-semibold text-yellow-700"><FaCalendarAlt className="inline mr-1" /> Date</th>
                                    <th className="px-4 py-2 text-left font-semibold text-yellow-700"><FaGamepad className="inline mr-1" /> Meal Time</th>
                                    <th className="px-4 py-2 text-left font-semibold text-yellow-700">Game Name</th>
                                    <th className="px-4 py-2 text-left font-semibold text-yellow-700"><FaDollarSign className="inline mr-1" /> Entrance Fee</th>
                                    <th className="px-4 py-2 text-left font-semibold text-yellow-700"><FaUsers className="inline mr-1" /> Participant Number</th>
                                    <th className="px-4 py-2 text-left font-semibold text-yellow-700"><FaTrophy className="inline mr-1" /> Winner Name</th>
                                    <th className="px-4 py-2 text-left font-semibold text-yellow-700"><FaGift className="inline mr-1" /> Award Amount</th>
                                    <th className="px-4 py-2 text-left font-semibold text-yellow-700"><FaDollarSign className="inline mr-1" /> Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedGames.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-8 text-gray-400">No games found for this controller.</td>
                                    </tr>
                                ) : (
                                    sortedGames.map(game => (
                                        <tr key={game._id} className="hover:bg-yellow-50 border-b border-gray-100 transition-all duration-200 animate-fade-in-up">
                                            <td className="px-4 py-2 font-semibold text-yellow-800">{new Date(game.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 capitalize">{game.mealTime}</td>
                                            <td className="px-4 py-2">{game.name || '-'}</td>
                                            <td className="px-4 py-2">{game.entranceFee} ETB</td>
                                            <td className="px-4 py-2">{Array.isArray(game.participants) ? game.participants.length : 0}</td>
                                            <td className="px-4 py-2 text-green-700 font-semibold">{game.winner?.name || '-'}</td>
                                            <td className="px-4 py-2 font-semibold text-blue-700">{((Number(game.entranceFee) || 0) * (Array.isArray(game.participants) ? game.participants.length : 0) * 0.7).toFixed(2)} ETB</td>
                                            <td className="px-4 py-2 font-semibold text-green-700">{((Number(game.entranceFee) || 0) * (Array.isArray(game.participants) ? game.participants.length : 0) * 0.3).toFixed(2)} ETB</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameControllerDetail;