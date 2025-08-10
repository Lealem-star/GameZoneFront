import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gurshaLogo from '../../assets/gurshalogo.png';
import { getParticipants, getGameById, createParticipant, deleteGame, getAllParticipants, getParticipantsByController } from '../../services/api';
import { getFormattedImageUrl, handleImageError } from '../../utils/imageUtils';
import PrizeDisplay from '../../components/PrizeDisplay'; // Import the PrizeDisplay component

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

const AddParticipantModal = ({ open, onClose, onAdded, gameId, game }) => {
    const [name, setName] = useState('');
    const [photo, setPhoto] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [emoji, setEmoji] = useState('😀'); // Default emoji
    const [useEmoji, setUseEmoji] = useState(false); // Toggle between photo and emoji
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const nameInputRef = useRef(null);
    const [toast, setToast] = useState(null);
    const [recentParticipants, setRecentParticipants] = useState([]);
    const [hasCameraSupport, setHasCameraSupport] = useState(true); // Assume camera support by default
    
    // Check if device has camera capabilities
    useEffect(() => {
        if (open) {
            // Check if the device has camera capabilities
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                console.log('Device has camera capabilities');
                setHasCameraSupport(true);
            } else {
                console.log('Device does not have camera capabilities');
                setHasCameraSupport(false);
                // If no camera support, default to emoji mode
                setUseEmoji(true);
            }
        }
    }, [open]);

    useEffect(() => {
        if (showCamera && videoRef.current) {
            (async () => {
                try {
                    // First try to use the back camera (for mobile devices)
                    try {
                        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
                            video: { facingMode: { exact: "environment" } } 
                        });
                        console.log('Using back camera');
                    } catch (mobileErr) {
                        // If back camera fails, try to use any available camera (for PC/laptop)
                        console.log('Back camera not available, trying default camera', mobileErr);
                        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
                            video: true 
                        });
                        console.log('Using default camera');
                    }
                    
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.play();
                } catch (err) {
                    console.error('Could not access any camera:', err);
                    alert('Could not access camera. Please make sure camera permissions are granted.');
                    setShowCamera(false);
                }
            })();
        }
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [showCamera]);

    // Fetch participants when modal opens to use for suggestions
    useEffect(() => {
        if (open && game?.gameControllerId) {
            console.log('🏪 Fetching participants for controller:', game.gameControllerId);
            // Get participants for this specific controller for autocomplete suggestions
            getParticipantsByController(game.gameControllerId)
                .then(data => {
                    console.log('✅ Controller participants fetched:', data.length, 'participants');
                    // Create a unique list of participant names
                    const uniqueNames = [...new Set(data.map(p => p.name))];
                    setRecentParticipants(uniqueNames);
                    console.log('📝 Unique participant names for suggestions:', uniqueNames);
                })
                .catch(err => {
                    console.error('Error fetching controller participants for suggestions:', err);
                    // Fallback to all participants if controller-specific fetch fails
                    getAllParticipants()
                        .then(data => {
                            const uniqueNames = [...new Set(data.map(p => p.name))];
                            setRecentParticipants(uniqueNames);
                        })
                        .catch(fallbackErr => console.error('Error fetching all participants for suggestions:', fallbackErr));
                });
        } else if (open) {
            console.log('⚠️ No controller info available, fetching all participants');
            // Fallback to all participants if no controller info available
            getAllParticipants()
                .then(data => {
                    const uniqueNames = [...new Set(data.map(p => p.name))];
                    setRecentParticipants(uniqueNames);
                })
                .catch(err => console.error('Error fetching all participants for suggestions:', err));
        }
    }, [open, game?.gameControllerId]);

    useEffect(() => {
        if (toast) {
            const timeout = setTimeout(() => setToast(null), 3500);
            return () => clearTimeout(timeout);
        }
    }, [toast]);

    // Handle name input changes and show suggestions
    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);

        if (value.length > 0) {
            // Filter suggestions based on input
            const filtered = recentParticipants.filter(p =>
                p.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion) => {
        // Set the name state with the full suggestion
        setName(suggestion);
        // Update the input value directly to ensure it's set correctly
        if (nameInputRef.current) {
            nameInputRef.current.value = suggestion;
        }
        // Hide suggestions immediately
        setShowSuggestions(false);
    };
    
    // Helper function to compress images before upload
    const compressImage = (dataUrl, maxWidth = 800, quality = 0.7) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions while maintaining aspect ratio
                if (width > maxWidth) {
                    height = Math.floor(height * (maxWidth / width));
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to compressed JPEG
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
        });
    };

    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            try {
                // Get the video dimensions
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;
                
                // Check if we have valid dimensions
                if (!videoWidth || !videoHeight) {
                    console.error('Invalid video dimensions:', videoWidth, videoHeight);
                    setToast({
                        message: 'Camera not ready yet. Please try again.',
                        type: 'error'
                    });
                    return;
                }
                
                // Set canvas dimensions to match video
                canvas.width = videoWidth;
                canvas.height = videoHeight;
                
                // Draw the video frame to the canvas
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Convert to data URL with reduced quality for better performance
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                
                // Compress the image before setting it
                compressImage(dataUrl, 800, 0.7).then(compressedImage => {
                    // Set the compressed captured image
                    setCapturedImage(compressedImage);
                    console.log('Image compressed successfully');
                });
                setPhoto(null); // Clear file input if any
                setShowCamera(false);
                
                // Stop the camera stream
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
            } catch (err) {
                console.error('Error capturing photo:', err);
                setToast({
                    message: 'Failed to capture photo. Please try again or use upload option.',
                    type: 'error'
                });
            }
        }
    };

    const handleRetake = () => {
        setCapturedImage(null); // Clear captured image
        
        // If device has camera support, show camera again
        if (hasCameraSupport) {
            setShowCamera(true); // Show camera again
        } else {
            // If no camera support, prompt for file upload
            document.getElementById('file-upload').click();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Initialize photoBase64 to an empty string
        let photoBase64 = '';

        // If using emoji, don't process photo
        if (useEmoji) {
            await addParticipant(null, emoji);
            return;
        }

        // Check if there is a captured image or selected photo
        if (capturedImage) {
            photoBase64 = capturedImage; // Use captured image
        } else if (photo) {
            // If a photo file is selected, read it
            const reader = new FileReader();
            reader.onloadend = async () => {
                photoBase64 = reader.result;
                await addParticipant(photoBase64, null);
            };
            reader.readAsDataURL(photo);
            return; // Exit early since we're handling the async read
        } else {
            // No photo selected, use emoji as fallback
            await addParticipant(null, emoji);
            return;
        }

        // Proceed to add the participant with the photo
        await addParticipant(photoBase64, null);
    };

    // Helper function to add participant
    const addParticipant = async (photoBase64, emojiValue) => {
        try {
            // Show loading toast
            setToast({ message: 'Adding participant...', type: 'success' });
            
            // Process the image if it exists
            let processedPhoto = photoBase64;
            if (photoBase64 && !photoBase64.startsWith('data:image/jpeg')) {
                try {
                    // Ensure the image is compressed for optimal performance
                    processedPhoto = await compressImage(photoBase64, 800, 0.7);
                    console.log('Final image compression applied before upload');
                } catch (compressionErr) {
                    console.error('Error in final compression:', compressionErr);
                    // Continue with the original image if compression fails
                    processedPhoto = photoBase64;
                }
            }
            
            // Create the participant with the processed image
            await createParticipant(gameId, {
                name,
                photo: processedPhoto,
                emoji: emojiValue || emoji
            }); // Include emoji in the participant data
            
            // Reset all states
            setName('');
            setPhoto(null);
            setCapturedImage(null);
            setEmoji('😀'); // Reset emoji to default
            setUseEmoji(false); // Reset to photo mode
            
            // Notify parent component and close modal
            onAdded({ name, photo: processedPhoto, emoji: emojiValue || emoji }); // Pass both photo and emoji
            onClose();
            
            // Show success toast
            setToast({ message: 'Participant added successfully!', type: 'success' });
        } catch (err) {
            console.error('Error adding participant:', err);
            setToast({ message: 'Failed to add participant. Please try again.', type: 'error' });
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
                {game?.gameControllerId && (
                    <p className="text-sm text-gray-600 mb-4">💡 Suggestions are from your restaurant's previous participants</p>
                )}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={handleNameChange}
                            onFocus={() => name.length > 0 && setSuggestions(recentParticipants.filter(p => p.toLowerCase().includes(name.toLowerCase())))}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                            required
                            className="border p-2 rounded w-full"
                            ref={nameInputRef}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // Prevent blur event from firing before click
                                            handleSelectSuggestion(suggestion);
                                        }}
                                    >
                                        {suggestion}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-medium">Choose representation:</span>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${!useEmoji ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                onClick={() => setUseEmoji(false)}
                            >
                                Photo
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${useEmoji ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                onClick={() => setUseEmoji(true)}
                            >
                                Emoji
                            </button>
                        </div>
                    </div>

                    {useEmoji ? (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Choose Emoji</label>
                            <div className="flex flex-col items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Insert Emoji"
                                    value={emoji}
                                    onChange={e => setEmoji(e.target.value)}
                                    className="border p-2 rounded text-center text-4xl w-full"
                                />
                                <div className="text-sm text-gray-500">Type or paste your favorite emoji</div>
                                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                                    {['😀', '😎', '🥳', '😍', '🤩', '🥰', '😇', '🤠', '🤑', '🤗'].map(e => (
                                        <button
                                            key={e}
                                            type="button"
                                            className="text-2xl p-2 hover:bg-gray-100 rounded-full transition-all"
                                            onClick={() => setEmoji(e)}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <label className="text-sm font-medium">Photo</label>
                            {capturedImage ? (
                                <div className="flex flex-col items-center">
                                    <img src={capturedImage} alt="Captured" className="w-32 h-32 object-cover rounded mb-2 self-center" />
                                    <button type="button" className="text-blue-500 underline" onClick={handleRetake}>Retake Photo</button>
                                </div>
                            ) : null}
                            {showCamera ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="relative w-full overflow-hidden rounded bg-black">
                                        <video 
                                            ref={videoRef} 
                                            className="w-full h-auto object-cover transform" 
                                            style={{ 
                                                transform: 'rotateY(0deg)', /* Fix mirroring issues on some devices */
                                                maxHeight: '50vh' /* Limit height on larger screens */
                                            }} 
                                            autoPlay 
                                            playsInline 
                                            muted /* Required for autoplay on some browsers */
                                        />
                                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                                            <div className="border-2 border-white border-opacity-50 rounded-lg w-4/5 h-4/5"></div>
                                        </div>
                                    </div>
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                    <div className="flex gap-3 w-full justify-center mt-2">
                                        <button 
                                            type="button" 
                                            className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition-all duration-200 flex-1 max-w-xs" 
                                            onClick={handleCapture}
                                        >
                                            Capture
                                        </button>
                                        <button 
                                            type="button" 
                                            className="bg-gray-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-600 transition-all duration-200 flex-1 max-w-xs" 
                                            onClick={() => {
                                                setShowCamera(false);
                                                // Stop the camera stream
                                                if (streamRef.current) {
                                                    streamRef.current.getTracks().forEach(track => track.stop());
                                                    streamRef.current = null;
                                                }
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {(!capturedImage && !showCamera) && (
                                <div className="flex flex-col gap-2 w-full">
                                    {hasCameraSupport && (
                                        <button 
                                            type="button" 
                                            className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-all duration-200 w-full" 
                                            onClick={() => setShowCamera(true)}
                                        >
                                            Take Photo with Camera
                                        </button>
                                    )}
                                    <div className="relative w-full">
                                        <button 
                                            type="button" 
                                            className="bg-purple-500 text-white px-4 py-2 rounded font-semibold hover:bg-purple-700 transition-all duration-200 w-full"
                                            onClick={() => document.getElementById('file-upload').click()}
                                        >
                                            Upload Photo
                                        </button>
                                        <input 
                                            id="file-upload"
                                            type="file" 
                                            accept="image/*"
                                            capture={hasCameraSupport ? undefined : "environment"}
                                            className="hidden" 
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const reader = new FileReader();
                                                    reader.onload = async (event) => {
                                                        try {
                                                            // Compress the uploaded image
                                                            const compressedImage = await compressImage(event.target.result, 800, 0.7);
                                                            setCapturedImage(compressedImage);
                                                            console.log('Uploaded image compressed successfully');
                                                        } catch (err) {
                                                            console.error('Error compressing uploaded image:', err);
                                                            // Fallback to original image if compression fails
                                                            setCapturedImage(event.target.result);
                                                        }
                                                    };
                                                    reader.readAsDataURL(e.target.files[0]);
                                                }
                                            }}
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        className="bg-yellow-500 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-600 transition-all duration-200 w-full"
                                        onClick={() => setUseEmoji(true)}
                                    >
                                        Use Emoji Instead
                                    </button>
                                </div>
                            )}
                                </div>
                            )}
                        </>
                    )}
                    <button type="submit" className="bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition-all duration-200 mt-4" disabled={submitting}>{submitting ? 'Adding...' : 'Add Participant'}</button>
                </form>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        </div>
    );
};

// ParticipantMarquee Component
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
    const duration = Math.max(10, participants.length * 1.5); // seconds

    return (
        <div className="overflow-hidden w-full flex items-center justify-center bg-gradient-to-r from-yellow-100 via-orange-50 to-pink-100 rounded-xl shadow-lg" style={{ height: 540, maxWidth: 950, margin: '0 auto' }}>
            <div
                className="flex flex-row gap-4"
                style={{
                    width: 'max-content',
                    animation: `participant-marquee ${duration}s linear infinite`,
                }}
            >
                {display.map((participant, idx) => (
                    <div
                        key={`${participant._id}-${idx}`} // Combine _id with index for uniqueness
                        className="bg-white bg-opacity-80 rounded-xl shadow-xl flex flex-col items-center justify-end w-64 h-72 min-w-[96px] mx-2 border-2 border-transparent hover:border-yellow-400 hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-fade-in-up overflow-hidden relative"
                        style={{ animationDelay: `${(idx % participants.length) * 0.1}s` }}
                    >
                        {participant.photo ? (
                            <>
                                <img
                                    src={participant.photo.startsWith('data:image') ? participant.photo : getFormattedImageUrl(participant.photo)}
                                    alt={participant.name}
                                    className="absolute top-0 left-0 w-full h-full object-cover z-0"
                                    onError={(e) => {
                                        console.error('Image load error for participant:', participant.name, 'Photo URL:', e.target.src);
                                        // Hide the broken image
                                        e.target.style.display = 'none';
                                        // Show the emoji fallback
                                        const fallbackElement = e.target.nextElementSibling;
                                        if (fallbackElement) {
                                            fallbackElement.style.display = 'flex';
                                        }
                                    }}
                                />
                                <div 
                                    className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-8xl z-0 bg-gradient-to-br from-yellow-100 to-orange-50"
                                    style={{ display: 'none' }} // Initially hidden
                                >
                                    <span role="img" aria-label="participant-emoji">{participant.emoji || '😀'}</span>
                                </div>
                            </>
                        ) : (
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-8xl z-0 bg-gradient-to-br from-yellow-100 to-orange-50">
                                <span role="img" aria-label="participant-emoji">{participant.emoji || '😀'}</span>
                            </div>
                        )}
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
    const [game, setGame] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showHaltModal, setShowHaltModal] = useState(false);
    const [haltLoading, setHaltLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [showParticipantAnimation, setShowParticipantAnimation] = useState(false);
    const [currentParticipant, setCurrentParticipant] = useState(null);
    const tickingAudioRef = useRef(null);
    const attentionAudioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const fetchParticipants = useCallback(() => {
        if (gameId) {
            getParticipants(gameId).then(setParticipants).catch(() => setParticipants([]));
        }
    }, [gameId]);

    useEffect(() => {
        if (gameId) {
            getGameById(gameId).then(setGame);
            fetchParticipants();
        }
    }, [gameId, fetchParticipants]);

    // Auto-play background music when component mounts
    useEffect(() => {
        // Don't attempt to autoplay on initial load
        // Audio will be played when user clicks the play button
        setIsPlaying(false);

        return () => {
            if (tickingAudioRef.current) {
                tickingAudioRef.current.pause();
                tickingAudioRef.current.currentTime = 0;
            }
        };
    }, []);

    const handleParticipantAdded = async (participant) => {
        await fetchParticipants(); // Re-fetch participants
        if (gameId) {
            const updatedGame = await getGameById(gameId); // Re-fetch game details
            console.log('Updated Game:', updatedGame); // Log the updated game object
            setGame(updatedGame); // Update game state with the latest data
        }
        if (participant) {
            setCurrentParticipant(participant);
            setShowParticipantAnimation(true);
            const playWelcomeAudio = () => {
                try {
                    // Use process.env.PUBLIC_URL to ensure correct path resolution
                    const audioPath = process.env.PUBLIC_URL + '/sounds/welcome-good-luck.mp3';
                    console.log('Attempting to play welcome audio from:', audioPath);
                    
                    const audio = new Audio(audioPath);
                    audio.volume = 1.0; // maximize loudness
                    
                    // Add error handling for the audio element
                    audio.onerror = (err) => {
                        console.error('Welcome audio failed to load:', err);
                    };
                    
                    // Play with catch for browsers that block autoplay
                    audio.play().catch(err => {
                        console.error('Welcome audio blocked:', err);
                        // If attentionAudioRef is available, try using that instead
                        if (attentionAudioRef.current) {
                            attentionAudioRef.current.play().catch(e => 
                                console.error('Fallback audio also blocked:', e)
                            );
                        }
                    });
                } catch (err) {
                    console.error('Error in playWelcomeAudio:', err);
                }
            };

            try {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window && participant.name) {
                    const synth = window.speechSynthesis;

                    const pickEthiopianVoice = () => {
                        const voices = synth.getVoices() || [];
                        // Prefer Amharic/Ethiopian voices if available
                        const byLang = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('am'));
                        if (byLang) return byLang;
                        const byName = voices.find(v => /amharic|ethiop/i.test(v.name || ''));
                        if (byName) return byName;
                        // Fallback to a clear English voice if none found
                        return voices.find(v => /en-GB|en-US/i.test(v.lang || '')) || voices[0];
                    };

                    const speak = () => {
                        const utterance = new SpeechSynthesisUtterance(participant.name);
                        const voice = pickEthiopianVoice();
                        if (voice) {
                            utterance.voice = voice;
                            utterance.lang = voice.lang || 'am-ET';
                        } else {
                            utterance.lang = 'am-ET';
                        }
                        utterance.volume = 1.0; // louder
                        utterance.rate = 0.9;   // slightly slower for clarity
                        utterance.pitch = 1.05; // subtle emphasis
                        utterance.onend = playWelcomeAudio;
                        synth.speak(utterance);
                    };

                    // Some browsers load voices asynchronously
                    if ((synth.getVoices() || []).length === 0) {
                        const handle = () => {
                            speak();
                            synth.removeEventListener('voiceschanged', handle);
                        };
                        synth.addEventListener('voiceschanged', handle);
                        setTimeout(() => {
                            if (!synth.speaking) speak();
                        }, 400);
                    } else {
                        speak();
                    }
                } else {
                    playWelcomeAudio();
                }
            } catch (e) {
                playWelcomeAudio();
            }
            setTimeout(() => {
                setShowParticipantAnimation(false);
            }, 10000);
        }
    };

    const handleDrawWinner = () => {
        // Play an attention sound to catch players' attention
        if (attentionAudioRef.current) {
            attentionAudioRef.current.currentTime = 0;
            attentionAudioRef.current.play().catch(err => console.log('Attention audio blocked:', err));
        }

        // Play background music before navigating
        if (tickingAudioRef.current) {
            tickingAudioRef.current.loop = true;
            tickingAudioRef.current.play()
                .then(() => {
                    setTimeout(() => {
                        navigate(`/draw-winner/${gameId}`);
                    }, 500);
                })
                .catch(error => {
                    console.log('Audio play before navigation was prevented:', error);
                    navigate(`/draw-winner/${gameId}`);
                });
        } else {
            navigate(`/draw-winner/${gameId}`);
        }
    };

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

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Audio elements with error handling */}
            <audio 
                ref={tickingAudioRef} 
                src={process.env.PUBLIC_URL + "/sounds/tsehay.mp3"} 
                preload="auto" 
                onError={(e) => {
                    console.error('Error loading audio file:', e);
                    // Set a flag or state to indicate audio failed to load
                    // This could be used to disable audio-dependent features
                }}
            />
            <audio 
                ref={attentionAudioRef} 
                src={process.env.PUBLIC_URL + "/sounds/welcome-good-luck.mp3"} 
                preload="auto" 
                onError={(e) => {
                    console.error('Error loading welcome audio file:', e);
                }}
            />

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

            {/* Sidebar */}
            <div className="bg-gradient-to-r from-orange-400 to-yellow-500 w-64 min-w-[12rem] max-w-xs flex flex-col items-center py-6 shadow-lg animate-fade-in-left overflow-x-auto">
                <img src={gurshaLogo} alt="Gursha Logo" className="h-32 mb-0 animate-fade-in-up" />
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

                    {/* Use PrizeDisplay Component Here */}
                    <PrizeDisplay prizeAmount={game?.totalCollected ? Math.floor(game.totalCollected * 0.7) : 0} />

                    <div className="w-24 h-24 rounded-full border flex items-center justify-center text-lg font-bold mt-4 bg-white animate-fade-in-up delay-400 overflow-hidden">
                        <span className="truncate w-full text-center" title={game?.entranceFee ? `በ ${game.entranceFee} ብር` : ''}>{game?.entranceFee ? `በ ${game.entranceFee} ብር` : 'No Entrance Fee'}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-8 animate-fade-in-up">
                {/* Top bar above award image */}
                <div className="flex justify-between items-center mb-4 w-full">
                    <div className="text-xl font-bold capitalize">{game?.mealTime || 'መልካም ዕድል'}</div>
                    <div className="flex gap-2">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-all duration-200 animate-bounce-in" onClick={() => setShowAddModal(true)}>ተጫዋች አስገባ</button>
                        <button className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition-all duration-200" onClick={handleDrawWinner} disabled={!participants.length}>ዕጣ አውጣ</button>
                        <button className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition-all duration-200" onClick={handleHaltGame}>ጨዋታ አቋርጥ</button>
                    </div>
                </div>

                {/* Marquee/scrolling participant images */}
                <ParticipantMarquee participants={participants} />
                <AddParticipantModal open={showAddModal} onClose={() => setShowAddModal(false)} onAdded={handleParticipantAdded} gameId={gameId} game={game} />
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
                {currentParticipant.photo ? (
                    <div className="relative w-48 h-48 mb-6">
                        <img
                            src={currentParticipant.photo.startsWith('data:image') ? currentParticipant.photo : getFormattedImageUrl(currentParticipant.photo)}
                            alt={currentParticipant.name}
                            className="w-full h-full rounded-full object-cover border-4 border-white"
                            onError={(e) => {
                                console.error('Participant animation image load error for:', currentParticipant.name, 'Photo URL:', e.target.src);
                                // Hide the broken image
                                e.target.style.display = 'none';
                                // Show the emoji fallback that's already in the DOM
                                const fallbackElement = e.target.nextElementSibling;
                                if (fallbackElement) {
                                    fallbackElement.style.display = 'flex';
                                }
                            }}
                        />
                        <div 
                            className="absolute top-0 left-0 w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-200 border-4 border-white text-8xl"
                            style={{ display: 'none' }} // Initially hidden
                        >
                            <span role="img" aria-label="participant-emoji">{currentParticipant.emoji || '😀'}</span>
                        </div>
                    </div>
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
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default GameDashboard;
