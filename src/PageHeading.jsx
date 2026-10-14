import React from 'react'

// Shared section heading for the top-level pages: small gold eyebrow with a
// pulsing dot, a big display-font title and an optional subtitle.
export default function PageHeading({ eyebrow, title, subtitle, align = 'left', className = '' }) {
    const centered = align === 'center'
    return (
        <div className={`mb-10 md:mb-14 ${centered ? 'text-center' : ''} ${className}`}>
            {eyebrow && (
                <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass-panel text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] text-yellow-400 mb-5`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_2px_rgba(250,204,21,0.6)]" aria-hidden="true" />
                    {eyebrow}
                </div>
            )}
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tight text-white leading-[1.05] [text-wrap:balance]">
                {title}
            </h1>
            {subtitle && (
                <p className={`mt-5 text-base md:text-lg text-neutral-400 leading-relaxed max-w-2xl [text-wrap:pretty] ${centered ? 'mx-auto' : ''}`}>
                    {subtitle}
                </p>
            )}
        </div>
    )
}
