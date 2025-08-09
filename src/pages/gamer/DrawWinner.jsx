import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getGameById, updateGame, getParticipants } from '../../services/api';
import { getFormattedImageUrl } from '../../utils/imageUtils';
import Confetti from 'react-confetti';
import PrizeDisplay from '../../components/PrizeDisplay';

const SPIN_DURATION = 30000; // 30 seconds
const WINNER_ANNOUNCE_DURATION = 30000; // 30 seconds

const DrawWinner = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [game, setGame] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [spinning, setSpinning] = useState(true);
    const [winner, setWinner] = useState(null);
    const [countdown, setCountdown] = useState(SPIN_DURATION / 1000);
    const [randomPositions, setRandomPositions] = useState([]);

    const tickingAudioRef = useRef(null);
    const celebrationAudioRef = useRef(null);
    const spinTimeout = useRef(null);
    const showWinnerTimeout = useRef(null);

    useEffect(() => {
        const fetchGameAndParticipants = async () => {
            try {
                const fetchedGame = await getGameById(gameId);
                setGame(fetchedGame);

                const fetchedParticipants = await getParticipants(gameId);
                setParticipants(fetchedParticipants || []);
            } catch (error) {
                console.error('Error fetching game or participants:', error);
                if (!game) setGame({ name: 'Game' });
            }
        };
        fetchGameAndParticipants();
        // We don't include game/participants in deps to avoid refetch loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId, location.state]);

    useEffect(() => {
        if (!gameId) return;

        if (participants.length === 0) {
            const redirectTimer = setTimeout(() => {
                navigate('/GameController');
            }, 3000);
            return () => clearTimeout(redirectTimer);
        }

        if (location.state && location.state.skipDrawing && location.state.winner) {
            setSpinning(false);
            setWinner(location.state.winner);

            if (celebrationAudioRef.current) {
                celebrationAudioRef.current.currentTime = 0;
                celebrationAudioRef.current.play().catch(() => { });
            }

            showWinnerTimeout.current = setTimeout(() => {
                navigate('/GameController');
            }, WINNER_ANNOUNCE_DURATION);

            return () => {
                if (showWinnerTimeout.current) clearTimeout(showWinnerTimeout.current);
            };
        }

        setSpinning(true);
        setCountdown(SPIN_DURATION / 1000);

        if (tickingAudioRef.current) {
            tickingAudioRef.current.currentTime = 0;
            tickingAudioRef.current.play().catch(() => { });
        }

        setRandomPositions(participants.map(() => ({ x: 0, y: 0 })));

        let moveInterval = null;
        if (participants.length > 0) {
            moveInterval = setInterval(() => {
                setRandomPositions(
                    participants.map(() => {
                        const areaW = Math.min(window.innerWidth * 0.9, 500) - 64;
                        const areaH = Math.min(window.innerWidth * 0.9, 500) - 64;
                        return { x: Math.random() * areaW, y: Math.random() * areaH };
                    })
                );
            }, 200);
        }

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        spinTimeout.current = setTimeout(() => {
            try {
                if (tickingAudioRef.current && !tickingAudioRef.current.paused) {
                    tickingAudioRef.current.pause();
                }

                if (!participants || participants.length === 0) {
                    navigate('/GameController');
                    return;
                }

                const winnerIdx = Math.floor(Math.random() * participants.length);
                const selectedWinner = participants[winnerIdx];
                setWinner(selectedWinner);
                setSpinning(false);

                if (celebrationAudioRef.current) {
                    celebrationAudioRef.current.currentTime = 0;
                    celebrationAudioRef.current.play().catch(() => { });
                }

                updateGame(gameId, { winner: selectedWinner?._id, status: 'completed' }).catch(() => { });

                showWinnerTimeout.current = setTimeout(() => {
                    navigate('/GameController');
                }, WINNER_ANNOUNCE_DURATION);
            } catch (error) {
                console.error('Error in winner selection process:', error);
                navigate('/GameController');
            }
        }, SPIN_DURATION);

        return () => {
            if (spinTimeout.current) clearTimeout(spinTimeout.current);
            if (showWinnerTimeout.current) clearTimeout(showWinnerTimeout.current);
            clearInterval(interval);
            if (moveInterval) clearInterval(moveInterval);

            const tickingAudio = tickingAudioRef.current;
            const celebrationAudio = celebrationAudioRef.current;
            if (tickingAudio && !tickingAudio.paused) tickingAudio.pause();
            if (celebrationAudio && !celebrationAudio.paused) celebrationAudio.pause();
        };
    }, [participants, gameId, navigate, location.state]);

    if (!game) return <div className="p-8 text-center">Loading game...</div>;

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
            <audio ref={tickingAudioRef} src={encodeURI('/sounds/ticking.mp3')} loop preload="auto" />
            <audio ref={celebrationAudioRef} src={encodeURI('/sounds/celebration.mp3')} preload="auto" />

            {spinning && (
                <div className="fixed top-8 right-8 z-20 flex flex-col items-center bg-white bg-opacity-80 rounded-lg shadow-lg px-8 py-6 animate-fade-in-up">
                    <span className="text-4xl md:text-6xl font-extrabold text-orange-600 drop-shadow-lg">{countdown}</span>
                    <span className="text-lg font-semibold text-gray-700 mt-2">ቀረው</span>
                </div>
            )}

            {!spinning && winner && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 animate-fade-in">
                    <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={500} recycle={true} />
                    <div className="flex flex-col items-center">
                        {winner.photo ? (
                            <img
                                src={getFormattedImageUrl(winner.photo)}
                                alt={winner.name}
                                className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover border-8 border-yellow-400 shadow-2xl mb-6 animate-bounce"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallbackElement = document.createElement('div');
                                    fallbackElement.className = 'w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-200 border-8 border-yellow-400 shadow-2xl mb-6 animate-bounce text-8xl';
                                    fallbackElement.innerHTML = `<span role="img" aria-label="winner-emoji">${winner.emoji || '🏆'}</span>`;
                                    e.currentTarget.parentNode.appendChild(fallbackElement);
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
                        <PrizeDisplay prizeAmount={game?.totalCollected ? Math.floor(game.totalCollected * 0.7) : 0} />
                    </div>
                </div>
            )}

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
                                            src={getFormattedImageUrl(p.photo)}
                                            alt={p.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const fallbackElement = document.createElement('div');
                                                fallbackElement.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-200 text-8xl';
                                                fallbackElement.innerHTML = `<span role="img" aria-label="participant-emoji">${p.emoji || '😀'}</span>`;
                                                e.currentTarget.parentNode.appendChild(fallbackElement);
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
                    <div className="mt-8 text-lg md:text-xl text-gray-700 font-medium">Spinning participants...</div>
                </>
            )}
        </div>
    );
};

export default DrawWinner;


