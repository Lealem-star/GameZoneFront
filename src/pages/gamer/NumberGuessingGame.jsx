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
    const [eliminatedParticipants, setEliminatedParticipants] = useState([]);
    const [currentRoundFailed, setCurrentRoundFailed] = useState([]);
    const [currentNumber, setCurrentNumber] = useState(null);
    const [previousNumber, setPreviousNumber] = useState(null);
    const [gamePhase, setGamePhase] = useState('initial'); // 'initial', 'round1', 'round2', 'complete', 'elimination'
    const [round, setRound] = useState(0);
    const [guesses, setGuesses] = useState({});
    const [showResult, setShowResult] = useState(false);
    const [showElimination, setShowElimination] = useState(false);
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
            // Generate a random number between 1 and 10000
            const randomNum = Math.floor(Math.random() * 10000) + 1;
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
        const newNumber = Math.floor(Math.random() * 10000) + 1;
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
        console.log('🔍 Evaluating guesses...');
        console.log('Previous number:', previousNumber);
        console.log('New number:', newNumber);
        console.log('Active participants:', activeParticipants.length);
        console.log('Guesses:', guesses);

        // Determine who passed and who failed
        const survivors = [];
        const failed = [];

        activeParticipants.forEach(participant => {
            const guess = guesses[participant._id];

            // Determine if the guess is correct
            let isCorrect = false;

            // If numbers are equal, ALL players pass regardless of their guess
            if (newNumber === previousNumber) {
                console.log(`✅ ${participant.name}: Numbers equal - ALL PASS`);
                isCorrect = true;
            } else {
                // Numbers are different - check if guess is correct
                if (!guess) {
                    // No guess made - player fails when numbers are different
                    console.log(`❌ ${participant.name}: No guess made - ELIMINATED`);
                    isCorrect = false;
                } else {
                    // Guess was made - check if it's correct
                    if (guess === 'higher' && newNumber > previousNumber) {
                        console.log(`✅ ${participant.name}: guessed ${guess}, result: PASS`);
                        isCorrect = true;
                    } else if (guess === 'lower' && newNumber < previousNumber) {
                        console.log(`✅ ${participant.name}: guessed ${guess}, result: PASS`);
                        isCorrect = true;
                    } else {
                        // Wrong guess
                        console.log(`❌ ${participant.name}: guessed ${guess}, result: FAIL`);
                        isCorrect = false;
                    }
                }
            }

            console.log(`   ${previousNumber} -> ${newNumber} (${guess ? guess : 'no guess'})`);

            if (isCorrect) {
                survivors.push(participant);
            } else {
                failed.push(participant);
            }
        });

        console.log('🏆 Survivors:', survivors.length);
        console.log('💀 Failed:', failed.length);
        console.log('📊 Original count:', activeParticipants.length);

        // Store the original number of participants before updating
        const originalParticipantCount = activeParticipants.length;

        // Update active participants to survivors only
        setActiveParticipants(survivors);

        // Add failed participants to eliminated list
        setEliminatedParticipants(prev => [...prev, ...failed]);
        setCurrentRoundFailed(failed);

        // Reset guesses for next round
        setGuesses({});

        // Show elimination screen if there are failed participants
        if (failed.length > 0) {
            setShowElimination(true);
            setTimeout(() => {
                setShowElimination(false);
                setCurrentRoundFailed([]); // Clear current round failed
                proceedToNextPhase(survivors, originalParticipantCount);
            }, 15000); // Show elimination for 15 seconds
        } else {
            // No one failed, proceed immediately
            proceedToNextPhase(survivors, originalParticipantCount);
        }
    };

    // Handle the next phase after evaluation
    const proceedToNextPhase = (survivors, originalParticipantCount) => {
        // Hide result screen
        setShowResult(false);

        // Helper function to update game status with retry
        const updateGameStatus = (updateData, retryCount = 0) => {
            return updateGame(gameId, updateData)
                .then(() => {
                    console.log('✅ Game status updated successfully');
                    return true;
                })
                .catch(error => {
                    console.error(`❌ Error updating game status (attempt ${retryCount + 1}):`, error);
                    if (retryCount < 2) {
                        // Retry after 1 second
                        setTimeout(() => {
                            updateGameStatus(updateData, retryCount + 1);
                        }, 1000);
                    }
                    return false;
                });
        };

        // Update game phase
        setRound(prev => {
            const newRound = prev + 1;
            console.log('🎮 Game phase decision:');
            console.log('- Survivors:', survivors.length);
            console.log('- Original count:', originalParticipantCount);
            console.log('- Current round:', prev);
            console.log('- New round:', newRound);
            return newRound;
        });

        // If there are no survivors (all players failed), show message and redirect to GameController
        if (survivors.length === 0) {
            console.log('💀 ALL PLAYERS FAILED - Game Over');
            const updateData = {
                status: 'completed',
                message: 'All players eliminated',
                endTime: new Date().toISOString(),
                winner: null
            };

            updateGameStatus(updateData).then((success) => {
                setGamePhase('all-lost');
                setTimeout(() => {
                    navigate('/GameController');
                }, 5000);
            });
        }
        // If all players passed (all participants survived), proceed to next round
        else if (survivors.length === originalParticipantCount) {
            console.log('🎉 ALL PLAYERS PASSED - Continue to next round');
            setRound(prev => {
                const currentRound = prev;
                if (currentRound === 0) {
                    console.log('🔄 Round 1 complete, proceeding to Round 2');
                    setGamePhase('round2');
                } else {
                    console.log('🏁 Round 2 complete, proceeding to DrawWinner');
                    setGamePhase('complete');
                    const updateData = {
                        status: 'completed',
                        endTime: new Date().toISOString(),
                        message: 'All players survived - proceeding to draw'
                    };

                    updateGameStatus(updateData).then((success) => {
                        navigate(`/draw-winner/${gameId}`, {
                            state: { filteredParticipants: survivors, sourceGameId: gameId }
                        });
                    });
                }
                return prev + 1;
            });
        }
        // If there's only one survivor after any round, declare them the winner
        else if (survivors.length === 1) {
            console.log('👑 ONE WINNER - Declare winner immediately');
            const winner = survivors[0];
            const updateData = {
                status: 'completed',
                winner: winner?._id,
                endTime: new Date().toISOString(),
                message: `Winner: ${winner.name}`
            };

            updateGameStatus(updateData).then((success) => {
                navigate(`/draw-winner/${gameId}`, {
                    state: {
                        filteredParticipants: survivors,
                        skipDrawing: true,
                        winner: winner,
                        sourceGameId: gameId
                    }
                });
            });
        } else {
            // Mixed results - check current round
            setRound(prev => {
                const currentRound = prev;
                if (currentRound === 0) {
                    console.log('🔄 MIXED RESULTS - Continue to Round 2');
                    setGamePhase('round2');
                } else {
                    console.log('🏁 MIXED RESULTS - Proceed to DrawWinner');
                    setGamePhase('complete');
                    const updateData = {
                        status: 'completed',
                        endTime: new Date().toISOString(),
                        message: `Multiple survivors (${survivors.length}) - proceeding to draw`
                    };

                    updateGameStatus(updateData).then((success) => {
                        navigate(`/draw-winner/${gameId}`, {
                            state: { filteredParticipants: survivors, sourceGameId: gameId }
                        });
                    });
                }
                return prev + 1;
            });
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100">
                <div className="text-2xl font-bold text-orange-600">አሸናፊውን ልናወጣ ነው ዝግጁጁ...?</div>
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

    // Show elimination screen when showElimination is true
    if (showElimination) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
                <div className="text-center p-8 bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-2xl border-2 border-purple-200">
                    <h2 className="text-4xl font-black text-red-600 mb-6 flex items-center justify-center gap-3">
                        <span className="text-4xl">🎯</span>
                        Round {round} Results
                    </h2>
                    <div className="mb-8 text-center">
                        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-xl shadow-lg mb-6 border-2 border-purple-200">
                            <div className="text-3xl font-black mb-3 bg-white bg-opacity-90 px-6 py-3 rounded-xl shadow-lg">
                                {previousNumber} → {currentNumber}
                            </div>
                            <div className="text-2xl">
                                {currentNumber > previousNumber ? (
                                    <span className="text-green-600 font-black bg-green-100 px-4 py-2 rounded-full">Number is HIGHER ⬆️</span>
                                ) : currentNumber < previousNumber ? (
                                    <span className="text-red-600 font-black bg-red-100 px-4 py-2 rounded-full">Number is LOWER ⬇️</span>
                                ) : (
                                    <span className="text-blue-600 font-black bg-blue-100 px-4 py-2 rounded-full">Number is SAME =</span>
                                )}
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Eliminated Players:</h3>
                        <div className="space-y-2">
                            {currentRoundFailed.map((participant, index) => (
                                <div key={participant._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="flex items-center space-x-3">
                                        {participant.photo ? (
                                            <img
                                                src={participant.photo.startsWith('http') ? participant.photo : `${process.env.REACT_APP_API_BASE_URL.replace('/api', '')}${participant.photo}`}
                                                alt={participant.name}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-red-300"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.innerHTML = `<div class="w-10 h-10 rounded-full flex items-center justify-center bg-red-200 text-lg">${participant.emoji || '😀'}</div>`;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-200 text-lg">
                                                <span role="img" aria-label="participant-emoji">{participant.emoji || '😀'}</span>
                                            </div>
                                        )}
                                        <span className="font-semibold text-lg text-gray-800">{participant.name}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-600">Guessed:</span>
                                            <span className={`font-bold ${currentNumber === previousNumber ? 'text-blue-600' :
                                                guesses[participant._id] === 'higher' ? 'text-green-600' :
                                                    guesses[participant._id] === 'lower' ? 'text-red-600' :
                                                        'text-gray-600'
                                                }`}>
                                                {currentNumber === previousNumber ? '✅ Equal - PASS' :
                                                    !guesses[participant._id] ? 'No Guess' :
                                                        guesses[participant._id] === 'higher' ? '⬆️ Higher' : '⬇️ Lower'}
                                            </span>
                                        </div>
                                        <span className="text-red-600 font-bold mt-1">Eliminated!</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-lg text-gray-600">Continuing to next round...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 relative overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-40 right-20 w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-40 left-20 w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-20 right-10 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
            </div>

            {/* Audio elements */}
            <audio ref={tickingAudioRef} src={encodeURI("/sounds/tsehay.mp3")} preload="auto" />
            <audio ref={correctGuessAudioRef} src={encodeURI("/sounds/celebration.mp3")} preload="auto" />
            <audio ref={wrongGuessAudioRef} src={encodeURI("/sounds/ticking.mp3")} preload="auto" />

            {/* Enhanced Audio control button */}
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
                className="fixed top-6 right-6 z-50 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-6 py-3 shadow-2xl transition-all duration-300 border-2 border-white flex items-center gap-3 backdrop-blur-sm"
                title={isPlaying ? "Pause Music" : "Play Music"}
            >
                {isPlaying ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-bold">Pause</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-bold">Play</span>
                    </>
                )}
            </button>


            {/* Enhanced Game header */}
            <div className="w-full text-center py-6 relative z-10">
                <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mx-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
                        {game.name}
                    </h1>

                    {/* Prize display */}
                    <div className="w-full max-w-md mx-auto mt-4">
                        <PrizeDisplay prizeAmount={game?.totalCollected ? Math.floor(game.totalCollected * 0.7) : 0} />
                    </div>
                </div>
            </div>

            {/* Main content - Two column layout */}
            <div className="flex flex-col md:flex-row w-full h-full px-4 md:px-8 gap-6 pb-8 relative z-10">
                {/* Left column - Participants list with guess buttons */}
                <div className="md:w-1/2 bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 h-full border border-purple-200">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-4 border-gradient-to-r from-purple-400 to-pink-400 pb-3 flex items-center gap-3">
                        <span className="text-2xl">👥</span>
                        የተጫዋቾች ዝርዝር
                    </h2>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {activeParticipants.map(participant => (
                            <div key={participant._id}
                                className={`p-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${guesses[participant._id] ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 shadow-blue-200' : 'bg-gradient-to-r from-gray-50 to-gray-100'
                                    }`}>
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
                                        <span className="font-bold text-lg text-gray-800">{participant.name}</span>
                                    </div>

                                    {/* Guess result (only shown during result phase) */}
                                    {showResult && (
                                        <div className={`px-4 py-2 rounded-full font-semibold ${currentNumber === previousNumber ? 'bg-blue-500 text-white' :
                                            guesses[participant._id] === 'higher' ? 'bg-green-500 text-white' :
                                                guesses[participant._id] === 'lower' ? 'bg-red-500 text-white' :
                                                    'bg-gray-500 text-white'
                                            }`}>
                                            {currentNumber === previousNumber ? '✅ Equal - PASS' :
                                                guesses[participant._id] === 'higher' ? '⬆️ Higher' :
                                                    guesses[participant._id] === 'lower' ? '⬇️ Lower' :
                                                        'No Guess'}
                                        </div>
                                    )}
                                </div>

                                {/* Enhanced Guess buttons */}
                                {!showResult && (
                                    <div className="flex justify-end space-x-3 mt-3">
                                        <button
                                            onClick={() => handleGuess(participant._id, 'higher')}
                                            className={`px-6 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-110 shadow-lg ${guesses[participant._id] === 'higher'
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-300'
                                                : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200'
                                                }`}
                                        >
                                            ⬆️ Higher
                                        </button>
                                        <button
                                            onClick={() => handleGuess(participant._id, 'lower')}
                                            className={`px-6 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-110 shadow-lg ${guesses[participant._id] === 'lower'
                                                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-300'
                                                : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 hover:from-red-200 hover:to-pink-200'
                                                }`}
                                        >
                                            ⬇️ Lower
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Enhanced Eliminated participants section */}
                    {eliminatedParticipants.length > 0 && (
                        <div className="mt-6 bg-gradient-to-r from-red-50 to-pink-50 bg-opacity-95 backdrop-blur-sm rounded-xl p-4 border border-red-200 shadow-lg">
                            <h3 className="text-xl font-bold text-red-800 mb-4 border-b-2 border-red-300 pb-2 flex items-center gap-2">
                                <span className="text-xl">💀</span>
                                የተሰናከሉ ተጫዋቾች ({eliminatedParticipants.length})
                            </h3>
                            <div className="space-y-2 max-h-[20vh] overflow-y-auto">
                                {eliminatedParticipants.map(participant => (
                                    <div key={participant._id}
                                        className="flex items-center space-x-2 p-2 rounded bg-red-100 border-l-2 border-red-400">
                                        {participant.photo ? (
                                            <img
                                                src={participant.photo.startsWith('http') ? participant.photo : `${process.env.REACT_APP_API_BASE_URL.replace('/api', '')}${participant.photo}`}
                                                alt={participant.name}
                                                className="w-8 h-8 rounded-full object-cover border border-red-300"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.innerHTML = `<div class="w-8 h-8 rounded-full flex items-center justify-center bg-red-200 text-sm">${participant.emoji || '😀'}</div>`;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-200 text-sm">
                                                <span role="img" aria-label="participant-emoji">{participant.emoji || '😀'}</span>
                                            </div>
                                        )}
                                        <span className="font-medium text-sm text-red-800">{participant.name}</span>
                                        <span className="text-red-600 font-bold text-xs">Eliminated</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Enhanced Right column - Number display and guessing */}
                <div className="md:w-1/2 flex flex-col items-center justify-start">
                    {/* Enhanced Round indicator */}
                    <div className="mb-8 text-2xl font-bold text-gray-800 bg-gradient-to-r from-purple-100 to-pink-100 px-8 py-4 rounded-full shadow-xl border-2 border-purple-200 backdrop-blur-sm">
                        <span className="text-3xl mr-2">🎮</span>
                        Round {round + 1} of 2
                    </div>

                    {/* Enhanced Current number display */}
                    <div className="relative w-56 h-56 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 shadow-2xl flex items-center justify-center mb-8 border-8 border-white transform hover:scale-105 transition-all duration-300">
                        <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center shadow-inner">
                            <div className="text-7xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent animate-pulse">
                                {currentNumber}
                            </div>
                        </div>
                        {previousNumber !== null && showResult && (
                            <div className="absolute -bottom-16 text-2xl font-bold bg-white bg-opacity-95 backdrop-blur-sm px-6 py-3 rounded-full shadow-2xl border-2 border-purple-200">
                                Previous: {previousNumber}
                            </div>
                        )}
                    </div>



                    {/* Enhanced Next number button */}
                    {!showResult && Object.keys(guesses).length === activeParticipants.length && activeParticipants.length > 0 && (
                        <button
                            onClick={handleNextNumber}
                            className="mt-8 px-10 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white font-black text-xl rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-300 border-2 border-white"
                        >
                            🎲 Draw Next Number
                        </button>
                    )}

                    {/* Enhanced Guessing status */}
                    {!showResult && (
                        <div className="mt-6 text-lg text-gray-700 italic bg-white bg-opacity-95 backdrop-blur-sm px-8 py-4 rounded-xl shadow-lg border border-purple-200">
                            {Object.keys(guesses).length === 0 ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="text-2xl">🤔</span>
                                    ቀጣይ የሚወጣው ቁጥር የሚበልጥ ወይስ የሚያንስ...?
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="text-2xl">📊</span>
                                    Guesses made: {Object.keys(guesses).length}/{activeParticipants.length} (All players must guess)
                                </span>
                            )}
                        </div>
                    )}

                    {/* Enhanced Show results message */}
                    {showResult && (
                        <div className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-purple-100 to-pink-100 bg-opacity-95 backdrop-blur-sm px-8 py-6 rounded-2xl shadow-2xl border-2 border-purple-200">
                            <div className="animate-pulse mb-4 flex items-center justify-center gap-3">
                                <span className="text-3xl">🔍</span>
                                Evaluating guesses...
                            </div>
                            {previousNumber !== null && currentNumber !== null && (
                                <div className="text-center">
                                    <div className="text-2xl font-black mb-3 bg-white bg-opacity-90 px-6 py-3 rounded-xl shadow-lg">
                                        {previousNumber} → {currentNumber}
                                    </div>
                                    <div className="text-xl">
                                        {currentNumber > previousNumber ? (
                                            <span className="text-green-600 font-black bg-green-100 px-4 py-2 rounded-full">Number is HIGHER ⬆️</span>
                                        ) : currentNumber < previousNumber ? (
                                            <span className="text-red-600 font-black bg-red-100 px-4 py-2 rounded-full">Number is LOWER ⬇️</span>
                                        ) : (
                                            <span className="text-blue-600 font-black bg-blue-100 px-4 py-2 rounded-full">Number is SAME =</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NumberGuessingGame;