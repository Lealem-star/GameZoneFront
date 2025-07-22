import React, { useState } from 'react';

const AnimatedDrawing = () => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [winner, setWinner] = useState(null);

    const startDrawing = () => {
        setIsDrawing(true);
        setWinner(null);

        // Simulate drawing process
        setTimeout(() => {
            const participants = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'];
            const randomWinner = participants[Math.floor(Math.random() * participants.length)];
            setWinner(randomWinner);
            setIsDrawing(false);
        }, 3000);
    };

    return (
        <div className="mb-4">
            <h3 className="text-lg font-semibold">Animated Drawing</h3>
            <div className="bg-white p-4 rounded shadow">
                {!isDrawing && !winner && (
                    <button
                        onClick={startDrawing}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition duration-200"
                    >
                        Start Drawing
                    </button>
                )}

                {isDrawing && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-lg font-medium text-blue-600">Drawing in progress...</p>
                        <p className="text-sm text-gray-500">Please wait while we select the winner</p>
                    </div>
                )}

                {winner && (
                    <div className="text-center py-6">
                        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                            <h4 className="font-bold text-lg">🎉 Winner! 🎉</h4>
                            <p className="text-xl font-semibold">{winner}</p>
                        </div>
                        <button
                            onClick={() => setWinner(null)}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Draw Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnimatedDrawing;
