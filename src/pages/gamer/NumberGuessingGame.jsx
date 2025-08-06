import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById, getParticipants, updateGame } from '../../services/api';
import { getFormattedImageUrl, handleImageError } from '../../utils/imageUtils';
import PrizeDisplay from '../../components/PrizeDisplay';

const NumberGuessingGame = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [game, setGame] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [activeParticipants, setActiveParticipants] = useState([]);
    const [currentNumber, setCurrentNumber] = useState(null);
    const [previousNumber, setPreviousNumber] = useState(null);
    const [gamePhase, setGamePhase] = useState('initial'); // 'initial', 'round1', 'round2', 'complete'
    const [round, setRound] = useState(0);
    const [guesses, setGuesses] = useState({});
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(true);

    // Sound effects
    const tickingAudioRef = useRef(null);
    const correctGuessAudioRef = useRef(null);
    const wrongGuessAudioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Set up background music when component mounts, but don't autoplay
    useEffect(() => {
        if (tickingAudioRef.current) {
            tickingAudioRef.current.loop = true;
            setIsPlaying(false);

            return () => {
                if (tickingAudioRef.current) {
                    tickingAudioRef.current.pause();
                    tickingAudioRef.current.currentTime = 0;
                }
            };
        }
    }, [gamePhase]);

    // Fetch game and participants data
    useEffect(() => {
        const fetchGameAndParticipants = async () => {
            try {
                setLoading(true);
                const gameData = await getGameById(gameId);
                setGame(gameData);

                const participantsData = await getParticipants(gameId);
                if (participantsData && participantsData.length > 0) {
                    setParticipants(participantsData);
                    setActiveParticipants(participantsData);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchGameAndParticipants();
    }, [gameId]);

    // Initialize the game with a random number
    useEffect(() => {
        if (participants.length > 0 && gamePhase === 'initial') {
            // Generate a random number between 1 and 100
            const randomNum = Math.floor(Math.random() * 1000) + 1;
            setCurrentNumber(randomNum);
            setGamePhase('round1');
        }
    }, [participants, gamePhase]);

    // Handle player guess
    const handleGuess = (participantId, guess) => {
        setGuesses(prev => ({
            ...prev,
            [participantId]: guess
        }));
    };

    // Generate next number and evaluate guesses
    const handleNextNumber = () => {
        // Store current number as previous
        setPreviousNumber(currentNumber);

        // Generate a new random number
        const newNumber = Math.floor(Math.random() * 100) + 1;
        setCurrentNumber(newNumber);

        // Show the result screen
        setShowResult(true);

        // Evaluate guesses after a short delay
        setTimeout(() => {
            evaluateGuesses(newNumber);
        }, 2000);
    };

    // Evaluate all guesses and update active participants
    const evaluateGuesses = (newNumber) => {
        const survivors = activeParticipants.filter(participant => {
            const guess = guesses[participant._id];
            if (!guess) return false; // No guess made

            const isCorrect =
                (guess === 'higher' && newNumber > previousNumber) ||
                (guess === 'lower' && newNumber < previousNumber) ||
                (newNumber === previousNumber); // Draw case, keep participant

            // No automatic sound playing for wrong guesses anymore
            // User only wants tsehay music which is controlled manually

            return isCorrect;
        });

        // Update active participants
        setActiveParticipants(survivors);

        // Reset guesses for next round
        setGuesses({});

        // Hide result screen after evaluation
        setTimeout(() => {
            setShowResult(false);

            // Update game phase
            setRound(prev => prev + 1);

            // If there are no survivors (all players failed), show message and redirect to GameController
            if (survivors.length === 0) {
                // Update backend to mark game as completed with a message
                updateGame(gameId, { status: 'completed', message: 'All players eliminated' })
                    .then(() => {
                        // Show message and redirect after 5 seconds
                        setGamePhase('all-lost');
                        setTimeout(() => {
                            navigate('/GameController');
                        }, 5000);
                    })
                    .catch(error => {
                        console.error('Error updating game status:', error);
                        // Still show message and redirect even if update fails
                        setGamePhase('all-lost');
                        setTimeout(() => {
                            navigate('/GameController');
                        }, 5000);
                    });
            }
            // If there's only one survivor after any round, declare them the winner
            else if (survivors.length === 1) {
                // Update backend to mark game as completed and set winner
                const winner = survivors[0];
                updateGame(gameId, { winner: winner, status: 'completed' })
                    .then(() => {
                        // Navigate directly to winner celebration after successful update
                        navigate(`/draw-winner/${gameId}`, {
                            state: {
                                filteredParticipants: survivors,
                                skipDrawing: true,
                                winner: winner
                            }
                        });
                    })
                    .catch(error => {
                        console.error('Error updating game with winner:', error);
                        // Still navigate even if update fails
                        navigate(`/draw-winner/${gameId}`, {
                            state: {
                                filteredParticipants: survivors,
                                skipDrawing: true,
                                winner: winner
                            }
                        });
                    });
            } else if (round === 0) {
                // If multiple survivors after first round, proceed to second round
                setGamePhase('round2');
            } else {
                // After two rounds with multiple survivors, proceed to DrawWinner
                setGamePhase('complete');

                // Update game status before navigating
                updateGame(gameId, { status: 'completed' })
                    .then(() => {
                        // Multiple survivors, proceed to normal DrawWinner after successful update
                        navigate(`/draw-winner/${gameId}`, {
                            state: { filteredParticipants: survivors }
                        });
                    })
                    .catch(error => {
                        console.error('Error updating game status:', error);
                        // Still navigate even if update fails
                        navigate(`/draw-winner/${gameId}`, {
                            state: { filteredParticipants: survivors }
                        });
                    });
            }
        }, 3000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100">
                <div className="text-2xl font-bold text-orange-600">Loading game...</div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100">
                <div className="text-2xl font-bold text-red-600">Game not found!</div>
            </div>
        );
    }

    if (participants.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100">
                <div className="text-2xl font-bold text-red-600">No participants found for this game!</div>
            </div>
        );
    }

    // Show the 'all players lost' message when gamePhase is 'all-lost'
    if (gamePhase === 'all-lost') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100">
                <div className="text-center p-8 bg-white bg-opacity-90 rounded-xl shadow-xl max-w-md">
                    <h2 className="text-3xl font-bold text-red-600 mb-4">Game Over ጭዋታውን በዝረራ ተሸንፋችኋል!</h2>
                    <p className="text-xl text-gray-800 mb-6">All players have been eliminated!</p>
                    <p className="text-lg text-gray-600">The system swallowed everyone...</p>
                    {/* <p className="text-md text-gray-500 mt-4">Redirecting to dashboard in 5 seconds...</p> */}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 relative overflow-hidden">
            {/* Audio elements */}
            <audio ref={tickingAudioRef} src={encodeURI("/sounds/tsehay.mp3")} preload="auto" />
            <audio ref={correctGuessAudioRef} src={encodeURI("/sounds/celebration.mp3")} preload="auto" />
            <audio ref={wrongGuessAudioRef} src={encodeURI("/sounds/ticking.mp3")} preload="auto" />

            {/* Audio control button */}
            <button
                onClick={() => {
                    if (isPlaying) {
                        tickingAudioRef.current.pause();
                        setIsPlaying(false);
                    } else {
                        tickingAudioRef.current.play()
                            .then(() => {
                                setIsPlaying(true);
                            })
                            .catch(error => {
                                console.log('Audio play was prevented:', error);
                                setIsPlaying(false);
                            });
                    }
                }}
                className="fixed top-4 right-4 z-50 bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 shadow-xl transition-all duration-200 border-2 border-white flex items-center gap-2"
                title={isPlaying ? "Pause Music" : "Play Music"}
            >
                {isPlaying ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Pause Music</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Play Music</span>
                    </>
                )}
            </button>

            {/* Game header */}
            <div className="w-full text-center py-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-orange-700 drop-shadow">
                    {game.name}
                </h1>

                {/* Prize display */}
                <div className="w-full max-w-md mx-auto mt-2">
                    <PrizeDisplay prizeAmount={game?.totalCollected ? Math.floor(game.totalCollected * 0.7) : 0} />
                </div>
            </div>

            {/* Main content - Two column layout */}
            <div className="flex flex-col md:flex-row w-full h-full px-4 md:px-8 gap-6 pb-8">
                {/* Left column - Participants list with guess buttons */}
                <div className="md:w-1/2 bg-white bg-opacity-90 rounded-lg shadow-lg p-6 h-full">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                        የተጫዋቾች ዝርዝር
                    </h2>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {activeParticipants.map(participant => (
                            <div key={participant._id}
                                className={`p-3 rounded-lg shadow transition-all ${guesses[participant._id] ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    {/* Participant info */}
                                    <div className="flex items-center space-x-3">
                                        {participant.photo ? (
                                            <img
                                                src={participant.photo.startsWith('http') ? participant.photo : `${process.env.REACT_APP_API_BASE_URL.replace('/api', '')}${participant.photo}`}
                                                alt={participant.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-orange-300"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.innerHTML = `<div class="w-12 h-12 rounded-full flex items-center justify-center bg-orange-200 text-2xl">${participant.emoji || '😀'}</div>`;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-200 text-2xl">
                                                <span role="img" aria-label="participant-emoji">{participant.emoji || '😀'}</span>
                                            </div>
                                        )}
                                        <span className="font-semibold text-lg">{participant.name}</span>
                                    </div>

                                    {/* Guess result (only shown during result phase) */}
                                    {showResult && (
                                        <div className={`px-4 py-2 rounded-full font-semibold ${guesses[participant._id] === 'higher' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {guesses[participant._id] === 'higher' ? 'Higher' : 'Lower'}
                                        </div>
                                    )}
                                </div>

                                {/* Guess buttons directly under participant info */}
                                {!showResult && (
                                    <div className="flex justify-end space-x-2 mt-1">
                                        <button
                                            onClick={() => handleGuess(participant._id, 'higher')}
                                            className={`px-4 py-2 rounded-full font-semibold transition-all ${guesses[participant._id] === 'higher' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                                        >
                                            Higher
                                        </button>
                                        <button
                                            onClick={() => handleGuess(participant._id, 'lower')}
                                            className={`px-4 py-2 rounded-full font-semibold transition-all ${guesses[participant._id] === 'lower' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                                        >
                                            Lower
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right column - Number display and guessing */}
                <div className="md:w-1/2 flex flex-col items-center justify-start">
                    {/* Round indicator */}
                    <div className="mb-6 text-xl font-semibold text-gray-700 bg-white px-6 py-2 rounded-full shadow-md">
                        Round {round + 1} of 2
                    </div>

                    {/* Current number display */}
                    <div className="relative w-48 h-48 rounded-full bg-white shadow-xl flex items-center justify-center mb-8 border-4 border-orange-500">
                        <div className="absolute inset-0 rounded-full border-8 border-orange-300 flex items-center justify-center">
                            <div className="text-6xl font-bold text-orange-600">{currentNumber}</div>
                        </div>
                        {previousNumber !== null && showResult && (
                            <div className="absolute -bottom-12 text-xl font-semibold bg-white px-4 py-1 rounded-full shadow">
                                Previous: {previousNumber}
                            </div>
                        )}
                    </div>



                    {/* Next number button */}
                    {!showResult && Object.keys(guesses).length === activeParticipants.length && activeParticipants.length > 0 && (
                        <button
                            onClick={handleNextNumber}
                            className="mt-8 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-300"
                        >
                            Draw Next Number
                        </button>
                    )}

                    {/* No guesses made yet */}
                    {!showResult && Object.keys(guesses).length !== activeParticipants.length && (
                        <div className="mt-6 text-lg text-gray-600 italic bg-white px-6 py-3 rounded-lg shadow">
                            ቀጣይ የሚወጣው ቁጥር የሚበልጥ ወይስ የሚያንስ...?
                        </div>
                    )}

                    {/* Show results message */}
                    {showResult && (
                        <div className="text-xl font-semibold text-orange-700 animate-pulse bg-white px-6 py-3 rounded-lg shadow">
                            Evaluating guesses...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NumberGuessingGame;