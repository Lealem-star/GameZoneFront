import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById, updateGame, getParticipants } from '../../services/api';
// Add confetti import
import Confetti from 'react-confetti';

const SPIN_DURATION = 60000; // 1 minute
const SHOW_WINNER_DURATION = 5000; // 5 seconds
const WINNER_ANNOUNCE_DURATION = 60000; // 2 minutes

const DrawWinner = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [game, setGame] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [spinning, setSpinning] = useState(true);
    const [winner, setWinner] = useState(null);
    const spinTimeout = useRef(null);
    const showWinnerTimeout = useRef(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [countdown, setCountdown] = useState(SPIN_DURATION / 1000);
    const tickingAudioRef = useRef(null);
    const celebrationAudioRef = useRef(null);
    const [randomPositions, setRandomPositions] = useState([]);

    useEffect(() => {
        const fetchGameAndParticipants = async () => {
            const g = await getGameById(gameId);
            setGame(g);
            const ps = await getParticipants(gameId);
            setParticipants(ps || []);
        };
        fetchGameAndParticipants();
    }, [gameId]);

    useEffect(() => {
        if (participants.length === 0) return;
        setSpinning(true);
        setShowConfetti(false);
        setCountdown(SPIN_DURATION / 1000);
        // Start ticking sound
        if (tickingAudioRef.current) {
            tickingAudioRef.current.currentTime = 0;
            tickingAudioRef.current.play().catch(() => { });
        }
        // Initialize random positions
        setRandomPositions(participants.map(() => ({ x: 0, y: 0 })));
        // Random movement interval
        let moveInterval = null;
        if (participants.length > 0) {
            moveInterval = setInterval(() => {
                setRandomPositions(
                    participants.map(() => {
                        // Area: 0 to 90vw/500px, but keep inside bounds
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
            if (tickingAudioRef.current && !tickingAudioRef.current.paused) tickingAudioRef.current.pause();
            const winnerIdx = Math.floor(Math.random() * participants.length);
            setWinner(participants[winnerIdx]);
            setSpinning(false);
            setShowConfetti(true);
            // Play celebration sound
            if (celebrationAudioRef.current) {
                celebrationAudioRef.current.currentTime = 0;
                celebrationAudioRef.current.play().catch(() => { });
            }
            // Update backend to mark game as completed and set winner
            updateGame(gameId, { winner: participants[winnerIdx], status: 'completed' });
            // After WINNER_ANNOUNCE_DURATION, redirect back
            showWinnerTimeout.current = setTimeout(() => {
                setShowConfetti(false);
                navigate('/GameController');
            }, WINNER_ANNOUNCE_DURATION);
        }, SPIN_DURATION);
        return () => {
            clearTimeout(spinTimeout.current);
            clearTimeout(showWinnerTimeout.current);
            clearInterval(interval);
            if (moveInterval) clearInterval(moveInterval);
            if (tickingAudioRef.current && !tickingAudioRef.current.paused) tickingAudioRef.current.pause();
            if (celebrationAudioRef.current && !celebrationAudioRef.current.paused) celebrationAudioRef.current.pause();
        };
    }, [participants, gameId, navigate]);

    if (!game) return <div className="p-8 text-center">Loading game...</div>;
    if (participants.length === 0) return <div className="p-8 text-center text-red-500">No participants to draw from.</div>;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 relative overflow-hidden">
            {/* Audio elements for suspense and celebration */}
            <audio ref={tickingAudioRef} src="/sounds/ticking.mp3" loop preload="auto" />
            <audio ref={celebrationAudioRef} src="/sounds/celebration.mp3" preload="auto" />
            {/* Countdown timer on the right */}
            {spinning && (
                <div className="fixed top-8 right-8 z-20 flex flex-col items-center bg-white bg-opacity-80 rounded-lg shadow-lg px-8 py-6 animate-fade-in-up">
                    <span className="text-4xl md:text-6xl font-extrabold text-orange-600 drop-shadow-lg">{countdown}</span>
                    <span className="text-lg font-semibold text-gray-700 mt-2">Seconds Left</span>
                </div>
            )}
            {/* Winner Full-Screen Announcement */}
            {!spinning && winner && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 animate-fade-in">
                    <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={500} recycle={true} />
                    <div className="flex flex-col items-center">
                        <img src={winner.photo || '/default-avatar.png'} alt={winner.name} className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover border-8 border-yellow-400 shadow-2xl mb-6 animate-bounce" />
                        <div className="text-5xl md:text-6xl font-extrabold text-yellow-300 mb-4 drop-shadow-lg animate-bounce">{winner.name}</div>
                        <div className="text-3xl md:text-4xl text-green-300 font-bold mb-2 animate-pulse">Congratulations!</div>
                        <div className="text-xl text-white font-medium">You are the winner!</div>
                    </div>
                </div>
            )}
            {/* Draw UI (hidden when winner is shown) */}
            {spinning && (
                <>
                    <h1 className="text-2xl md:text-4xl font-extrabold mb-4 text-orange-700 drop-shadow">Drawing Winner for: <span className="text-yellow-600">{game.name}</span></h1>
                    <div className="relative w-[90vw] max-w-[500px] h-[90vw] max-h-[500px] flex items-center justify-center">
                        {/* Randomly moving participants while spinning */}
                        {participants.map((p, idx) => {
                            const pos = randomPositions[idx] || { x: 0, y: 0 };
                            return (
                                <div
                                    key={p._id || idx}
                                    className="absolute transition-all duration-200 shadow-lg"
                                    style={{
                                        left: pos.x,
                                        top: pos.y,
                                        width: 90,
                                        height: 120,
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
                                    <img src={p.photo || '/default-avatar.png'} alt={p.name} className="w-full h-full object-cover" />
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