/* ══════════════════════════════════════════════════════════
   ICARUS — Contact Us
   Glassmorphism social cards matching the dark gold/amber theme
   ══════════════════════════════════════════════════════════ */

const contacts = [
    {
        id: 'instagram',
        label: 'Instagram',
        handle: '@icarusrockets',
        url: 'https://www.instagram.com/icarusrockets/',
        description: 'Follow us for mission updates, team spotlights, and behind-the-scenes looks at our aerospace projects.',
        gradient: 'from-amber-500/20 via-rose-500/10 to-purple-600/15',
        borderGlow: 'hover:border-rose-500/40',
        glowShadow: 'hover:shadow-rose-500/10',
        iconGradient: 'from-amber-400 via-rose-500 to-purple-600',
        // Instagram brand SVG path
        Icon: () => (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
        ),
    },
    {
        id: 'telegram',
        label: 'Telegram',
        handle: '@icarusrockets',
        url: 'https://t.me/icarusrockets',
        description: 'Join our Telegram channel for real-time announcements, competition results, and direct access to the ICARUS community.',
        gradient: 'from-sky-500/20 via-cyan-500/10 to-blue-600/15',
        borderGlow: 'hover:border-sky-500/40',
        glowShadow: 'hover:shadow-sky-500/10',
        iconGradient: 'from-sky-400 to-blue-600',
        // Telegram brand SVG path
        Icon: () => (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
        ),
    },
]

export default function ContactUs() {
    return (
        <section className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 md:py-28">

            {/* ── Section Header ─────────────────────────── */}
            <div className="text-center mb-16 max-w-2xl mx-auto">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-yellow-600 mb-4">
                    Get In Touch
                </p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-[0.1em] text-white mb-5 leading-tight">
                    Contact{' '}
                    <span
                        className="text-transparent bg-clip-text"
                        style={{ backgroundImage: 'linear-gradient(90deg, #A8863E, #D4B06A, #A8863E)' }}
                    >
                        ICARUS
                    </span>
                </h1>
                <p className="text-neutral-400 text-base md:text-lg leading-relaxed">
                    Reach out to us on social media. We're building the next generation of
                    aerospace engineers — come fly with us.
                </p>
            </div>

            {/* ── Contact Cards ──────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                {contacts.map(({ id, label, handle, url, description, gradient, borderGlow, glowShadow, iconGradient, Icon }) => (
                    <a
                        key={id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                            group relative overflow-hidden
                            rounded-2xl border border-neutral-800 bg-neutral-900/60
                            backdrop-blur-xl p-8
                            transition-all duration-500 ease-out
                            hover:scale-[1.02] hover:shadow-2xl
                            ${borderGlow} ${glowShadow}
                            cursor-pointer
                        `}
                        style={{ textDecoration: 'none' }}
                        aria-label={`Visit ICARUS on ${label}`}
                    >
                        {/* Glassmorphism gradient overlay */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                        />

                        {/* Animated top-left corner glow */}
                        <div
                            className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"
                            style={{ background: `linear-gradient(135deg, ${id === 'instagram' ? '#f59e0b, #f43f5e' : '#38bdf8, #3b82f6'})` }}
                        />

                        <div className="relative z-10">
                            {/* Icon */}
                            <div
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6
                                            bg-gradient-to-br ${iconGradient}
                                            shadow-lg group-hover:scale-110 transition-transform duration-300`}
                            >
                                <Icon />
                            </div>

                            {/* Label + handle */}
                            <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-white mb-1.5">
                                {label}
                            </h2>
                            <p className="text-sm font-bold tracking-widest text-yellow-600/80 mb-4">
                                {handle}
                            </p>

                            {/* Description */}
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                {description}
                            </p>

                            {/* CTA row */}
                            <div className="mt-7 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 group-hover:text-white transition-colors duration-300">
                                <span>Open {label}</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                    className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform duration-300">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            {/* ── Decorative Divider ─────────────────────── */}
            <div className="mt-20 flex items-center gap-4 opacity-30">
                <div className="h-px w-24 bg-gradient-to-r from-transparent to-yellow-600" />
                <div className="w-2 h-2 rounded-full bg-yellow-600" />
                <div className="h-px w-24 bg-gradient-to-l from-transparent to-yellow-600" />
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">
                ICARUS Aerospace · {new Date().getFullYear()}
            </p>
        </section>
    )
}
