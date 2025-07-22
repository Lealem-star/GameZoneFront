import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gurshaLogo from '../../assets/gurshalogo.png';
import { getParticipants, getAllParticipants, getGameById, createParticipant, deleteGame } from '../../services/api';

// Toast notification component
const Toast = ({ message, type, onClose }) => (
    <div className={`fixed top-8 right-8 z-50 px-6 py-4 rounded shadow-lg text-white font-semibold transition-all duration-300 animate-fade-in-up ${type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}
        role="alert">
        <div className="flex items-center gap-2">
            {type === 'error' ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            )}
            <span>{message}</span>
            <button className="ml-4 text-white hover:text-gray-200" onClick={onClose}>&times;</button>
        </div>
    </div>
);

const AddParticipantModal = ({ open, onClose, onAdded, gameId }) => {
    const [name, setName] = useState('');
    const [photo, setPhoto] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    let stream = useRef(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (showCamera && videoRef.current) {
            (async () => {
                try {
                    stream.current = await navigator.mediaDevices.getUserMedia({ video: true });
                    videoRef.current.srcObject = stream.current;
                    videoRef.current.play();
                } catch (err) {
                    alert('Could not access camera');
                    setShowCamera(false);
                }
            })();
        }
        return () => {
            if (stream.current) {
                stream.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [showCamera]);

    useEffect(() => {
        if (toast) {
            const timeout = setTimeout(() => setToast(null), 3500);
            return () => clearTimeout(timeout);
        }
    }, [toast]);

    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            setCapturedImage(dataUrl);
            setPhoto(null); // clear file input if any
            setShowCamera(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        let photoBase64 = '';
        if (capturedImage) {
            photoBase64 = capturedImage;
        } else if (photo) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                photoBase64 = reader.result;
                try {
                    await createParticipant(gameId, { name, photo: photoBase64 });
                    setName('');
                    setPhoto(null);
                    setCapturedImage(null);
                    onAdded({ name, photo: photoBase64 });
                    onClose();
                    setToast({ message: 'Participant added successfully!', type: 'success' });
                } catch (err) {
                    setToast({ message: 'Failed to add participant', type: 'error' });
                } finally {
                    setSubmitting(false);
                }
            };
            reader.readAsDataURL(photo);
            return;
        }
        try {
            await createParticipant(gameId, { name, photo: photoBase64 });
            setName('');
            setPhoto(null);
            setCapturedImage(null);
            onAdded({ name, photo: photoBase64 });
            onClose();
            setToast({ message: 'Participant added successfully!', type: 'success' });
        } catch (err) {
            setToast({ message: 'Failed to add participant', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative animate-scale-in">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:rotate-90 transition-all duration-300" onClick={onClose}>&times;</button>
                <h2 className="text-xl font-bold mb-4">Add Participant</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required className="border p-2 rounded" />
                    <label className="text-sm font-medium">Photo</label>
                    {capturedImage ? (
                        <img src={capturedImage} alt="Captured" className="w-32 h-32 object-cover rounded mb-2 self-center" />
                    ) : null}
                    {showCamera ? (
                        <div className="flex flex-col items-center gap-2">
                            <video ref={videoRef} className="w-48 h-36 bg-black rounded" autoPlay playsInline />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                            <button type="button" className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition-all duration-200" onClick={handleCapture}>Capture</button>
                            <button type="button" className="text-gray-500 underline" onClick={() => setShowCamera(false)}>Cancel</button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {(!capturedImage && !showCamera) && (
                                <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-all duration-200" onClick={() => setShowCamera(true)}>Take Photo</button>
                            )}
                        </div>
                    )}
                    <button type="submit" className="bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition-all duration-200" disabled={submitting}>{submitting ? 'Adding...' : 'Add Participant'}</button>
                </form>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        </div>
    );
};


// Replace the marquee/scrolling participant images with a fixed-width, auto-rotating carousel
const ParticipantMarquee = ({ participants }) => {
    if (!participants || participants.length === 0) {
        return (
            <div className="overflow-hidden w-full" style={{ height: 120 }}>
                <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-r from-yellow-50 via-orange-100 to-pink-50 rounded-xl shadow-lg border-2 border-yellow-300 animate-pulse">
                    <div className="flex items-center gap-3 mb-2">
                        <svg className="w-10 h-10 text-yellow-500 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                        </svg>
                        <span className="text-2xl font-extrabold text-yellow-700 drop-shadow-lg">ማነው የመጀመሪያ ተመዝጋቢ ዕድለኛ የሚሆነው?</span>
                    </div>
                    <span className="text-lg text-orange-600 font-semibold">Be the first to join and try your luck!</span>
                </div>
            </div>
        );
    }
    // Duplicate the list for seamless looping
    const display = participants.concat(participants);
    // Calculate animation duration based on number of participants (longer for more)
    const duration = Math.max(10, participants.length * 1.5); // seconds
    return (
        <div className="overflow-hidden w-full flex items-center justify-center bg-gradient-to-r from-yellow-100 via-orange-50 to-pink-100 rounded-xl shadow-lg" style={{ height: 140, maxWidth: 950, margin: '0 auto' }}>
            <div
                className="flex flex-row gap-4"
                style={{
                    width: 'max-content',
                    animation: `participant-marquee ${duration}s linear infinite`,
                }}
            >
                {display.map((participant, idx) => (
                    <div
                        key={participant._id || idx}
                        className="bg-white bg-opacity-80 rounded-xl shadow-xl flex flex-col items-center justify-end w-24 h-36 min-w-[96px] mx-2 border-2 border-transparent hover:border-yellow-400 hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-fade-in-up overflow-hidden relative"
                        style={{ animationDelay: `${(idx % participants.length) * 0.1}s` }}
                    >
                        <img
                            src={participant.photo}
                            alt={participant.name}
                            className="absolute top-0 left-0 w-full h-full object-cover z-0"
                            onError={e => { e.target.onerror = null; e.target.src = gurshaLogo; }}
                        />
                        <div className="w-full absolute bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 z-10">
                            <div className="font-bold text-orange-100 text-center text-sm truncate w-full drop-shadow-sm">
                                {participant.name || 'Participant'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Inline style for keyframes if not in CSS file */}
            <style>{`
        @keyframes participant-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    );
};

const GameDashboard = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [participants, setParticipants] = useState([]);
    const [game, setGame] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentParticipant, setCurrentParticipant] = useState(null);
    const [showParticipantAnimation, setShowParticipantAnimation] = useState(false);
    const [toast, setToast] = useState(null); // Add toast state to GameDashboard
    const [showHaltModal, setShowHaltModal] = useState(false);
    const [haltLoading, setHaltLoading] = useState(false);

    const fetchParticipants = () => {
        if (gameId) {
            getParticipants(gameId).then(setParticipants).catch(() => setParticipants([]));
        }
    };

    useEffect(() => {
        if (gameId) {
            getGameById(gameId).then(setGame);
            fetchParticipants();
        }
    }, [gameId]);

    // Draw Winner logic
    const handleDrawWinner = () => {
        navigate(`/draw-winner/${gameId}`);
    };
    // Halt Game logic
    const handleHaltGame = () => {
        setShowHaltModal(true);
    };

    const confirmHaltGame = async () => {
        setHaltLoading(true);
        try {
            await deleteGame(gameId);
            setShowHaltModal(false);
            setToast({ message: 'Game halted successfully!', type: 'success' });
            setTimeout(() => {
                setToast(null);
                navigate('/gamecontrollerdashboard');
            }, 2000);
        } catch (err) {
            setShowHaltModal(false);
            setToast({ message: 'Failed to halt (delete) game', type: 'error' });
            setTimeout(() => setToast(null), 3500);
        } finally {
            setHaltLoading(false);
        }
    };

    const handleParticipantAdded = (participant) => {
        fetchParticipants();
        if (gameId) {
            getGameById(gameId).then(setGame);
        }
        if (participant) {
            setCurrentParticipant(participant);
            setShowParticipantAnimation(true);
            // Play welcome audio
            const audio = new Audio('/sounds/welcome-good-luck.mp3');
            audio.play();
            setTimeout(() => {
                setShowParticipantAnimation(false);
            }, 10000);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="bg-gradient-to-r from-orange-400 to-yellow-500 w-64 min-w-[12rem] max-w-xs flex flex-col items-center py-6 shadow-lg animate-fade-in-left overflow-x-auto">
                <img src={gurshaLogo} alt="Gursha Logo" className="h-32 mb-0 animate-fade-in-up" />
                {/* Back button */}
                <button className="mb-4 w-fit bg-gray-200 hover:bg-gray-300 text-gray-700 px-1 py-0 rounded font-semibold transition-all duration-200" onClick={() => navigate('/gamecontrollerdashboard')}>
                    &larr;
                </button>
                <div className="w-full flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-full border flex items-center justify-center text-lg font-bold mb-2 bg-white animate-fade-in-up delay-100 overflow-hidden">
                        <span className="truncate w-full text-center" title={game?.name}>{game?.name ? `${game.name}` : 'NoName'}</span>
                    </div>
                    <div className="w-full text-center py-2 border rounded mb-2 bg-white animate-fade-in-up delay-200 overflow-hidden">
                        <span className={`font-medium ${participants.length > 10 ? 'text-sm' : 'text-base'} truncate w-full block`} title={`ተወዳዳሪ ብዛት: ${participants.length}`}>
                            ተወዳዳሪ ብዛት: {participants.length}
                        </span>
                    </div>
                    <div className="w-full text-center py-2 border rounded mb-2 bg-white animate-fade-in-up delay-300 overflow-hidden">
                        <span className={`font-medium ${game?.prize?.amount?.toString().length > 5 ? 'text-sm' : 'text-base'} truncate w-full block`} title={game?.prize?.amount ? `ሽልማት፡ ${Math.floor(game.prize.amount)} ብር` : 'Award'}>
                            {game?.prize?.amount ? `ሽልማት፡ ${Math.floor(game.prize.amount)} ብር` : 'Award'}
                        </span>
                    </div>
                    <div className="w-24 h-24 rounded-full border flex items-center justify-center text-lg font-bold mt-4 bg-white animate-fade-in-up delay-400 overflow-hidden">
                        <span className="truncate w-full text-center" title={game?.entranceFee ? `በ ${game.entranceFee} ብር` : ''}>{game?.entranceFee ? `በ ${game.entranceFee} ብር` : ''}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-8 animate-fade-in-up">
                {/* Top bar above award image */}
                <div className="flex justify-between items-center mb-4 w-full">
                    <div className="text-xl font-bold capitalize">{game?.mealTime || 'Meal Time'}</div>
                    <div className="flex gap-2">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-all duration-200 animate-bounce-in" onClick={() => setShowAddModal(true)}>Add Participant</button>
                        <button className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition-all duration-200" onClick={handleDrawWinner} disabled={!participants.length}>Draw Winner</button>
                        <button className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition-all duration-200" onClick={handleHaltGame}>Halt Game</button>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow flex-1 flex flex-col items-center justify-center mb-6 animate-fade-in-up delay-200" style={{ maxHeight: 350 }}>
                    {game && game.prize && game.prize.image ? (
                        <img src={game.prize.image.startsWith('http') ? game.prize.image : `${game.prize.image}`} alt="Award" className="h-full w-full object-fit animate-float" style={{ maxHeight: '100%', maxWidth: '100%' }} onError={e => { e.target.onerror = null; e.target.src = gurshaLogo; }} />
                    ) : (
                        <div className="text-lg text-gray-500">Award image</div>
                    )}
                </div>
                {/* Marquee/scrolling participant images */}
                <ParticipantMarquee participants={participants} />
                <AddParticipantModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdded={handleParticipantAdded} gameId={gameId} />
                {showHaltModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in">
                        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center relative animate-scale-in">
                            <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold" onClick={() => setShowHaltModal(false)}>&times;</button>
                            <div className="flex flex-col items-center gap-4">
                                <div className="bg-red-100 rounded-full p-4 mb-2">
                                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                                <h2 className="text-2xl font-bold text-red-600 mb-2 text-center">Halt Game?</h2>
                                <p className="text-gray-700 text-center mb-4">Are you sure you want to halt (cancel) the game:<br /><span className="font-semibold text-red-500">{game?.name || ''}</span>?</p>
                                <div className="flex gap-4 mt-2">
                                    <button
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold shadow transition-all duration-200 disabled:opacity-60"
                                        onClick={confirmHaltGame}
                                        disabled={haltLoading}
                                    >
                                        {haltLoading ? 'Halting...' : 'Yes, Halt Game'}
                                    </button>
                                    <button
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded font-semibold shadow transition-all duration-200"
                                        onClick={() => setShowHaltModal(false)}
                                        disabled={haltLoading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {showParticipantAnimation && currentParticipant && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80 animate-fade-in">
                        <img src={currentParticipant.photo} alt={currentParticipant.name} className="w-48 h-48 rounded-full object-cover border-4 border-white mb-6" />
                        <div className="text-4xl text-white font-bold mb-2 animate-bounce">{currentParticipant.name}</div>
                        <div className="text-2xl text-yellow-200 font-semibold">Welcome to the game and good luck!</div>
                    </div>
                )}
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default GameDashboard; 