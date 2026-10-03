import { useState, useRef } from 'react'
import { useLang } from './LanguageContext.jsx'
import { Rocket, Clock, Video, Maximize, Minimize, Gamepad2, CalendarDays, Sparkles } from 'lucide-react'

// All times: Asia/Almaty (UTC+5)
const SEMINARS = [
    { speaker: 'Abilbek Raimbek', title: 'Model Rocket Sport', date: '2026-10-05', time: '19:30 – 20:30', link: 'https://meet.google.com/ygq-rpvr-fkf' },
    { speaker: 'Tabyldy Assan', title: 'Space Settlement Contest and International Space Development Conference', date: '2026-10-06', time: '18:00 – 19:00', link: 'https://meet.google.com/ixx-sjqp-hni' },
    { speaker: 'Tsoy Anastassiya', title: 'How to develop your aerospace project', date: '2026-10-07', time: '20:00 – 21:00', link: 'https://meet.google.com/idz-gkda-qob' },
    { speaker: 'Marat Zhanikeyev', title: 'Future of the Aerospace Engineering in Kazakhstan', date: '2026-10-08', time: '18:00 – 19:00', link: 'https://meet.google.com/xju-qpdv-wue' },
    { speaker: 'Friedman Mordy', title: 'WSPEC', date: '2026-10-09', time: '19:00 – 20:00', link: 'https://meet.google.com/kka-sikb-rro' },
    { speaker: 'Symbat Basrakyzy', title: 'Halsat and USS', date: '2026-10-10', time: '18:00 – 19:00', link: 'https://meet.google.com/edc-cgva-yzq' },
    { speaker: 'Assan Tabyldy', title: 'Conclusions of the week', date: '2026-10-11', time: '19:00 – 20:00', link: 'https://meet.google.com/grn-zrqh-zer' },
]

const LOCALES = { kk: 'kk-KZ', ru: 'ru-RU', en: 'en-US', ro: 'ro-RO' }

export default function SpaceWeekTab() {
    const { t, lang } = useLang()
    const [fullscreen, setFullscreen] = useState(false)
    const gameRef = useRef(null)

    const formatDate = (iso) =>
        new Date(`${iso}T12:00:00+05:00`).toLocaleDateString(LOCALES[lang] || 'en-US', {
            weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Almaty',
        })

    const toggleFullscreen = () => {
        const el = gameRef.current
        if (!el) return
        if (document.fullscreenElement) {
            document.exitFullscreen?.()
            setFullscreen(false)
        } else if (el.requestFullscreen) {
            el.requestFullscreen().then(() => setFullscreen(true)).catch(() => {})
        }
    }

    return (
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-12 lg:py-20">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="px-5 py-1.5 rounded-full bg-yellow-600/10 border border-yellow-600/20 inline-flex items-center gap-2 mb-6">
                    <Sparkles size={14} className="text-yellow-600" />
                    <span className="text-yellow-600 text-xs font-bold uppercase tracking-widest">Oct 5 – 11</span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-widest mb-4 drop-shadow-lg">
                    {t('spaceWeek.title')}
                </h1>
                <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                    {t('spaceWeek.subtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Seminars */}
                <section className="lg:col-span-2 bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-2xl p-5 shadow-2xl shadow-black/50" aria-labelledby="seminars-heading">
                    <div className="flex items-center gap-2 mb-1">
                        <CalendarDays size={18} className="text-yellow-600" />
                        <h2 id="seminars-heading" className="text-sm font-black uppercase tracking-[0.2em] text-white">
                            {t('spaceWeek.seminars')}
                        </h2>
                    </div>
                    <p className="text-[11px] text-neutral-500 mb-4 uppercase tracking-widest">{t('spaceWeek.timezone')}</p>

                    <ul className="space-y-3 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1">
                        {SEMINARS.map((s) => (
                            <li
                                key={s.link}
                                className="group bg-neutral-950/60 border border-neutral-800 hover:border-yellow-600/40 rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5"
                            >
                                <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-600 mb-1 capitalize">
                                    {formatDate(s.date)}
                                </p>
                                <h3 className="text-sm font-bold text-white leading-snug mb-1">{s.title}</h3>
                                <p className="text-xs text-neutral-400 mb-3">{s.speaker}</p>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1.5 text-xs text-neutral-300 tabular-nums">
                                        <Clock size={13} className="text-neutral-500" />
                                        {s.time}
                                    </span>
                                    <a
                                        id={`seminar-join-${s.date}`}
                                        href={s.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-black uppercase tracking-wider transition-colors"
                                    >
                                        <Video size={13} />
                                        {t('spaceWeek.join')}
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Game */}
                <section className="lg:col-span-3" aria-labelledby="game-heading">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Gamepad2 size={18} className="text-yellow-600" />
                            <h2 id="game-heading" className="text-sm font-black uppercase tracking-[0.2em] text-white">
                                Icarus Pixel
                            </h2>
                        </div>
                        <button
                            id="game-fullscreen-btn"
                            onClick={toggleFullscreen}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 hover:border-yellow-600/50 text-neutral-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            {fullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
                            {t('spaceWeek.fullscreen')}
                        </button>
                    </div>
                    <div
                        ref={gameRef}
                        className="relative w-full rounded-2xl overflow-hidden border border-neutral-800 bg-black shadow-2xl shadow-yellow-600/10"
                        style={{ aspectRatio: '16 / 10', minHeight: 420 }}
                    >
                        <iframe
                            id="icarus-pixel-frame"
                            title="Icarus Pixel"
                            src="/icarus-pixel/index.html"
                            className="absolute inset-0 w-full h-full border-0"
                            allow="fullscreen; autoplay"
                            loading="lazy"
                        />
                    </div>
                    <p className="mt-3 text-xs text-neutral-500 flex items-center gap-1.5">
                        <Rocket size={13} /> {t('spaceWeek.gameHint')}
                    </p>
                </section>
            </div>
        </div>
    )
}
