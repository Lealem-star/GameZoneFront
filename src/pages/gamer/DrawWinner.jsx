import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getGameById, updateGame, getParticipants } from '../../services/api';
import Confetti from 'react-confetti';
import PrizeDisplay from '../../components/PrizeDisplay'; // Adjust the import path as necessary

const SPIN_DURATION = 30000; // 30 seconds
const WINNER_ANNOUNCE_DURATION = 30000; // 10 seconds

const DrawWinner = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [game, setGame] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [spinning, setSpinning] = useState(true);
    const [winner, setWinner] = useState(null);
    const spinTimeout = useRef(null);
    const showWinnerTimeout = useRef(null);
    const [countdown, setCountdown] = useState(SPIN_DURATION / 1000);
    const tickingAudioRef = useRef(null);
    const celebrationAudioRef = useRef(null);
    const [randomPositions, setRandomPositions] = useState([]);

    useEffect(() => {
        const fetchGameAndParticipants = async () => {
            try {
                const g = await getGameById(gameId);
                setGame(g);
                
                // Check if we have filtered participants from the NumberGuessingGame
                if (location.state && location.state.filteredParticipants) {
                    console.log('Using filtered participants from NumberGuessingGame:', location.state.filteredParticipants);
                    setParticipants(location.state.filteredParticipants);
                } else {
                    // Fallback to fetching all participants if not coming from NumberGuessingGame
                    const ps = await getParticipants(gameId);
                    setParticipants(ps || []);
                }
            } catch (error) {
                console.error('Error fetching game or participants:', error);
                // Set default values to prevent crashes
                if (!game) setGame({name: 'Game'});
                if (participants.length === 0 && location.state && location.state.filteredParticipants) {
                    setParticipants(location.state.filteredParticipants);
                }
            }
        };
        fetchGameAndParticipants();
    }, [gameId, location.state, game, participants.length]);

    useEffect(() => {
        // Safety check - if component is unmounting or not fully initialized, don't proceed
        if (!gameId) return;
        
        // Handle case when there are no participants
        if (participants.length === 0) {
            // Show message and redirect back after a short delay
            const redirectTimer = setTimeout(() => {
                navigate('/GameController');
            }, 3000);
            return () => clearTimeout(redirectTimer);
        }
        
        // Check if we should skip the drawing animation
        if (location.state && location.state.skipDrawing && location.state.winner) {
            // Skip drawing and immediately show the winner
            setSpinning(false);
            setWinner(location.state.winner);
            
            // Play celebration sound
            if (celebrationAudioRef.current) {
                celebrationAudioRef.current.currentTime = 0;
                celebrationAudioRef.current.play().catch((error) => { 
                    console.log('Audio play was prevented:', error);
                });
            }
            
            // After WINNER_ANNOUNCE_DURATION, redirect back
            showWinnerTimeout.current = setTimeout(() => {
                navigate('/GameController');
            }, WINNER_ANNOUNCE_DURATION);
            
            return () => {
                if (showWinnerTimeout.current) clearTimeout(showWinnerTimeout.current);
            };
        }
        
        // Normal drawing process
        setSpinning(true);
        setCountdown(SPIN_DURATION / 1000);
        
        // Start ticking sound
        if (tickingAudioRef.current) {
            tickingAudioRef.current.currentTime = 0;
            tickingAudioRef.current.play().catch((error) => { 
                console.log('Audio play was prevented:', error);
            });
        }
        
        // Initialize random positions
        setRandomPositions(participants.map(() => ({ x: 0, y: 0 })));
        
        // Random movement interval
        let moveInterval = null;
        if (participants.length > 0) {
            moveInterval = setInterval(() => {
                setRandomPositions(
                    participants.map(() => {
                        const areaW = Math.min(window.innerWidth * 0.9, 500) - 64;
                        const areaH = Math.min(window.innerWidth * 0.9, 500) - 64;
                        const x = Math.random() * areaW;
                        const y = Math.random() * areaH;
                        return { x, y };
                    })
                );
            }, 200);
        }
        
        // Countdown interval
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        // After SPIN_DURATION, pick a winner
        spinTimeout.current = setTimeout(() => {
            try {
                if (tickingAudioRef.current && !tickingAudioRef.current.paused) {
                    tickingAudioRef.current.pause();
                }
                
                // Safety check to ensure participants array is still valid
                if (!participants || participants.length === 0) {
                    console.error('No participants available when selecting winner');
                    navigate('/GameController');
                    return;
                }
                
                const winnerIdx = Math.floor(Math.random() * participants.length);
                const selectedWinner = participants[winnerIdx];
                setWinner(selectedWinner);
                setSpinning(false);
                
                // Play celebration sound
                if (celebrationAudioRef.current) {
                    celebrationAudioRef.current.currentTime = 0;
                    celebrationAudioRef.current.play().catch((error) => {
                        console.log('Celebration audio play was prevented:', error);
                    });
                }
                
                // Update backend to mark game as completed and set winner
                updateGame(gameId, { winner: selectedWinner, status: 'completed' })
                    .catch(error => {
                        console.error('Error updating game with winner:', error);
                    });
                
                // After WINNER_ANNOUNCE_DURATION, redirect back
                showWinnerTimeout.current = setTimeout(() => {
                    navigate('/GameController');
                }, WINNER_ANNOUNCE_DURATION);
            } catch (error) {
                console.error('Error in winner selection process:', error);
                // Fallback - return to game controller
                navigate('/GameController');
            }
        }, SPIN_DURATION);
        
        // Cleanup function
        return () => {
            if (spinTimeout.current) clearTimeout(spinTimeout.current);
            if (showWinnerTimeout.current) clearTimeout(showWinnerTimeout.current);
            clearInterval(interval);
            if (moveInterval) clearInterval(moveInterval);
            
            // Store refs in variables to avoid the exhaustive-deps warning
            const tickingAudio = tickingAudioRef.current;
            const celebrationAudio = celebrationAudioRef.current;
            
            if (tickingAudio && !tickingAudio.paused) tickingAudio.pause();
            if (celebrationAudio && !celebrationAudio.paused) celebrationAudio.pause();
        };
    }, [participants, gameId, navigate, location.state]);

    if (!game) return <div className="p-8 text-center">Loading game...</div>;

    // Show a message when there are no participants
    if (participants.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 relative overflow-hidden">
                <div className="text-center p-8 bg-white bg-opacity-90 rounded-xl shadow-xl">
                    <h2 className="text-3xl font-bold text-red-600 mb-4">No participants to draw from</h2>
                    <p className="text-lg text-gray-700">Redirecting back to game controller...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 relative overflow-hidden">
            <audio ref={tickingAudioRef} src={encodeURI("/sounds/ticking.mp3")} loop preload="auto" />
            <audio ref={celebrationAudioRef} src={encodeURI("/sounds/celebration.mp3")} preload="auto" />
            {spinning && (
                <div className="fixed top-8 right-8 z-20 flex flex-col items-center bg-white bg-opacity-80 rounded-lg shadow-lg px-8 py-6 animate-fade-in-up">
                    <span className="text-4xl md:text-6xl font-extrabold text-orange-600 drop-shadow-lg">{countdown}</span>
                    <span className="text-lg font-semibold text-gray-700 mt-2">ቀረው</span>
                </div>
            )}
            {/* Winner Full-Screen Announcement */}
            {!spinning && winner && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 animate-fade-in">
                    <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={500} recycle={true} />
                    <div className="flex flex-col items-center">
                        {winner.photo ? (
                            <img 
                                src={winner.photo.startsWith('http') ? winner.photo : winner.photo} 
                                alt={winner.name} 
                                className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover border-8 border-yellow-400 shadow-2xl mb-6 animate-bounce" 
                                onError={(e) => {
                                    console.error('Winner image load error:', e);
                                    // If the image fails to load, show a default emoji
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = `<div class="w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-200 border-8 border-yellow-400 shadow-2xl mb-6 animate-bounce text-8xl">${winner.emoji || '🏆'}</div>`;
                                }}
                            />
                        ) : (
                            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-200 border-8 border-yellow-400 shadow-2xl mb-6 animate-bounce text-8xl">
                                <span role="img" aria-label="winner-emoji">{winner.emoji || '🏆'}</span>
                            </div>
                        )}
                        <div className="text-5xl md:text-6xl font-extrabold text-yellow-300 mb-4 drop-shadow-lg animate-bounce">{winner.name}</div>
                        <div className="text-3xl md:text-4xl text-green-300 font-bold mb-2 animate-pulse">Congratulations!</div>
                        <div className="text-xl text-white font-medium">አሸናፊያችን እንኳን ደስ ያለህ!</div>
                        {/* Prize Display */}
                        <PrizeDisplay prizeAmount={game?.totalCollected ? Math.floor(game.totalCollected * 0.7) : 0} />
                    </div>
                </div>
            )}
            {/* Draw UI (hidden when winner is shown) */}
            {spinning && (
                <>
                    <h1 className="text-2xl md:text-4xl font-extrabold mb-4 text-orange-700 drop-shadow">የ<span className="text-yellow-600">{game.name} አሸናፊ...</span></h1>
                    <div className="relative w-[90vw] max-w-[500px] h-[90vw] max-h-[500px] flex items-center justify-center">
                        {participants.map((p, idx) => {
                            const pos = randomPositions[idx] || { x: 0, y: 0 };
                            return (
                                <div
                                    key={p._id || idx}
                                    className="absolute transition-all duration-200 shadow-lg"
                                    style={{
                                        left: pos.x,
                                        top: pos.y,
                                        width: 150,
                                        height: 200,
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '3px solid #fff',
                                        background: '#eee',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    {p.photo ? (
                                        <img 
                                            src={p.photo.startsWith('http') ? p.photo : p.photo} 
                                            alt={p.name} 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => {
                                                console.error('DrawWinner image load error:', e);
                                                // If the image fails to load, show a default emoji
                                                e.target.style.display = 'none';
                                                e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-200 text-8xl">${p.emoji || '😀'}</div>`;
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-200 text-8xl">
                                            <span role="img" aria-label="participant-emoji">{p.emoji || '😀'}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-8 text-lg md:text-xl text-gray-700 font-medium">
                        Spinning participants...
                    </div>
                </>
            )}
        </div>
    );
};

export default DrawWinner;
