export default function Preloader({ isVisible = false }) {
    return (
        <div
            className={`fixed inset-0 z-[1000] bg-neutral-950 flex flex-col items-center justify-center
                        transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Glow ring behind the logo */}
            <div className="relative mb-6">
                <div className="absolute inset-0 w-32 h-32 rounded-full bg-yellow-600/20 blur-2xl animate-pulse" />
                <img
                    src="/logo_white.png"
                    alt="ICARUS"
                    className="relative h-16 w-auto animate-pulse drop-shadow-[0_0_25px_rgba(202,138,4,0.8)]"
                />
            </div>
            <p className="text-[11px] sm:text-sm font-bold uppercase tracking-[0.45em] text-neutral-400 mb-2">
                LOADING ICARUS...
            </p>
            {/* Subtle loading bar */}
            <div className="w-40 h-[2px] bg-neutral-800 rounded-full overflow-hidden mt-3">
                <div
                    className="h-full bg-gradient-to-r from-yellow-700 to-yellow-500 rounded-full"
                    style={{ animation: 'preloaderBar 2s ease-in-out forwards' }}
                />
            </div>
        </div>
    )
}
