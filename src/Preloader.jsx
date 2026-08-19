export default function Preloader({ isVisible = false }) {
    return (
        <div
            className={`fixed inset-0 z-[1000] bg-neutral-950 flex flex-col items-center justify-center
                        transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
                {/* Glow ring behind the logo */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 w-40 h-40 -translate-x-4 -translate-y-4 rounded-full bg-yellow-600/20 blur-3xl animate-pulse" />
                    <img
                        src="/logo_white.png"
                        alt="ICARUS"
                        className="relative h-20 w-auto animate-pulse drop-shadow-[0_0_35px_rgba(202,138,4,0.8)]"
                    />
                </div>
                <p className="text-[12px] sm:text-sm font-black uppercase tracking-[0.6em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 mb-3 animate-pulse">
                    LOADING ICARUS
                </p>
                {/* Subtle loading bar */}
                <div className="w-48 h-[2px] bg-neutral-800/80 rounded-full overflow-hidden mt-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-600 to-transparent blur-sm" style={{ animation: 'shimmer 2s infinite' }} />
                    <div
                        className="h-full bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-400 rounded-full shadow-[0_0_10px_rgba(202,138,4,0.8)]"
                        style={{ animation: 'preloaderBar 2s ease-in-out forwards' }}
                    />
                </div>
            </div>
        </div>
    )
}
