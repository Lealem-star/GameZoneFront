const PrizeDisplay = ({ prizeAmount }) => {
    return (
        <div className="w-full text-center py-2 border rounded mb-2 bg-white animate-fade-in-up delay-300 overflow-hidden">
            <span className={`font-medium ${prizeAmount?.toString().length > 5 ? 'text-sm' : 'text-base'} truncate w-full block`} title={prizeAmount ? `ሽልማት፡ ${Math.floor(prizeAmount)} ብር` : 'Award'}>
                {prizeAmount ? `የሽልማት መጠን፡ ${Math.floor(prizeAmount)} ብር` : 'Award'}
            </span>
        </div>
    );
};

export default PrizeDisplay;