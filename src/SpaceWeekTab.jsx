import { useState, useRef, useEffect, useCallback } from 'react'
import { useLang } from './LanguageContext.jsx'
import PageHeading from './PageHeading.jsx'
import { useAuth } from './AuthContext.jsx'
import { api } from './api.js'
import { Rocket, Clock, Video, Maximize, Minimize, Gamepad2, CalendarDays, Loader2 } from 'lucide-react'

// localStorage keys used by the game (same origin as the site)
const GAME_KEYS = ['icarus_coins', 'icarus_unlocked_skins', 'icarus_selected_skin', 'icarusBest', 'icarusScores', 'icarusStats']
const OWNER_KEY = 'icarus_game_owner'

function readLocalProgress() {
    const parse = (k, fallback) => {
        try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback }
    }
    return {
        coins: parseInt(localStorage.getItem('icarus_coins') || '0', 10) || 0,
        unlockedSkins: parse('icarus_unlocked_skins', ['classic']),
        selectedSkin: localStorage.getItem('icarus_selected_skin') || 'classic',
        bestScore: parseInt(localStorage.getItem('icarusBest') || '0', 10) || 0,
        scores: parse('icarusScores', []),
        stats: parse('icarusStats', null),
    }
}

function writeLocalProgress(p) {
    localStorage.setItem('icarus_coins', String(p.coins ?? 0))
    localStorage.setItem('icarus_unlocked_skins', JSON.stringify(p.unlockedSkins ?? ['classic']))
    localStorage.setItem('icarus_selected_skin', p.selectedSkin || 'classic')
    localStorage.setItem('icarusBest', String(p.bestScore ?? 0))
    localStorage.setItem('icarusScores', JSON.stringify(p.scores ?? []))
    if (p.stats) localStorage.setItem('icarusStats', JSON.stringify(p.stats))
    else localStorage.removeItem('icarusStats')
}

const hasLocalProgress = () => GAME_KEYS.some((k) => localStorage.getItem(k) !== null)
const clearLocalProgress = () => GAME_KEYS.forEach((k) => localStorage.removeItem(k))

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
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
    const [fullscreen, setFullscreen] = useState(false)
    const [pseudoFullscreen, setPseudoFullscreen] = useState(false)
    const [isTouch] = useState(() => window.matchMedia?.('(pointer: coarse)').matches ?? false)
    const [gameReady, setGameReady] = useState(false)
    const gameRef = useRef(null)
    const frameRef = useRef(null)
    const syncEnabled = useRef(false)
    const userId = user?.id

    const formatDate = (iso) =>
        new Date(`${iso}T12:00:00+05:00`).toLocaleDateString(LOCALES[lang] || 'en-US', {
            weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Almaty',
        })

    // ── Load progress from the account BEFORE the game starts ──
    useEffect(() => {
        let cancelled = false
        syncEnabled.current = false
        setGameReady(false)
        if (isAuthLoading) return () => { cancelled = true }

        async function init() {
            if (!isAuthenticated || !userId) {
                // Guest: play with whatever is stored locally, no syncing
                if (!cancelled) setGameReady(true)
                return
            }
            try {
                const { progress } = await api.get('/game/progress')
                const owner = localStorage.getItem(OWNER_KEY)
                if (progress) {
                    writeLocalProgress(progress)            // account data wins
                } else if (owner && owner !== userId) {
                    clearLocalProgress()                    // belongs to another account
                } else if (hasLocalProgress()) {
                    await api.put('/game/progress', readLocalProgress()) // first sync: upload guest progress
                }
                localStorage.setItem(OWNER_KEY, userId)
                syncEnabled.current = true
            } catch (err) {
                console.error('Game progress sync failed:', err)
            }
            if (!cancelled) setGameReady(true)
        }
        init()
        return () => { cancelled = true }
    }, [isAuthenticated, userId, isAuthLoading])

    // ── Save to the account whenever the game reports a change ──
    useEffect(() => {
        const onMessage = (e) => {
            if (e.origin !== window.location.origin) return
            if (e.source !== frameRef.current?.contentWindow) return
            if (e.data?.type !== 'icarus-progress-changed' || !syncEnabled.current) return
            api.put('/game/progress', readLocalProgress()).catch((err) => console.error('Game progress save failed:', err))
        }
        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
    }, [])

    // ── Pause the game when fullscreen is exited (ESC is swallowed by the browser) ──
    // The game is only playable in fullscreen, so also take keyboard focus away from
    // the frame — otherwise ESC/arrow keys would still reach it in the small window.
    const pauseGame = useCallback(() => {
        frameRef.current?.contentWindow?.postMessage({ type: 'icarus-pause' }, window.location.origin)
        frameRef.current?.blur()
    }, [])

    useEffect(() => {
        const onFsChange = () => {
            const active = document.fullscreenElement === gameRef.current
            setFullscreen(active)
            if (!active) pauseGame()
        }
        document.addEventListener('fullscreenchange', onFsChange)
        return () => document.removeEventListener('fullscreenchange', onFsChange)
    }, [pauseGame])

    // ── iPhone Safari has no element Fullscreen API: fall back to a fixed overlay ──
    useEffect(() => {
        if (!pseudoFullscreen) return
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prevOverflow }
    }, [pseudoFullscreen])

    const toggleFullscreen = () => {
        const el = gameRef.current
        if (!el) return
        if (pseudoFullscreen) {
            setPseudoFullscreen(false)
            pauseGame()
        } else if (document.fullscreenElement) {
            document.exitFullscreen?.()
        } else if (el.requestFullscreen) {
            el.requestFullscreen().catch(() => setPseudoFullscreen(true))
        } else {
            setPseudoFullscreen(true)
        }
    }
    const isFullscreen = fullscreen || pseudoFullscreen

    // Entering fullscreen hands keyboard focus to the game right away
    useEffect(() => {
        if (isFullscreen) frameRef.current?.contentWindow?.focus()
    }, [isFullscreen])

    return (
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-12 lg:py-20">
            <PageHeading
                eyebrow={<span translate="no">Oct 5 – 11</span>}
                title={t('spaceWeek.title')}
                subtitle={t('spaceWeek.subtitle')}
                align="center"
            />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Seminars */}
                <section className="lg:col-span-2 glass-panel rounded-3xl p-5 sm:p-6" aria-labelledby="seminars-heading">
                    <div className="flex items-center gap-2.5 mb-1">
                        <span className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center" aria-hidden="true">
                            <CalendarDays size={16} className="text-yellow-400" />
                        </span>
                        <h2 id="seminars-heading" className="font-display text-sm font-bold uppercase tracking-[0.18em] text-white">
                            {t('spaceWeek.seminars')}
                        </h2>
                    </div>
                    <p className="text-[11px] text-neutral-500 mb-5 uppercase tracking-widest">{t('spaceWeek.timezone')}</p>

                    {/* data-lenis-prevent: Lenis smooth scroll otherwise swallows the mouse wheel here */}
                    <ul data-lenis-prevent className="space-y-3 lg:max-h-[640px] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
                        {SEMINARS.map((s) => (
                            <li
                                key={s.link}
                                className="group rounded-2xl p-4 bg-black/30 border border-white/[0.06]
                                           transition-[border-color,background-color,transform] duration-300
                                           hover:border-yellow-500/35 hover:bg-black/40 hover:-translate-y-0.5"
                            >
                                <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-400 mb-1.5 capitalize">
                                    {formatDate(s.date)}
                                </p>
                                <h3 className="text-sm font-bold text-white leading-snug mb-1">{s.title}</h3>
                                <p className="text-xs text-neutral-400 mb-3">{s.speaker}</p>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-1.5 text-xs text-neutral-300 tabular-nums">
                                        <Clock size={13} className="text-neutral-500" aria-hidden="true" />
                                        {s.time}
                                    </span>
                                    <a
                                        id={`seminar-join-${s.date}`}
                                        href={s.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-gold px-4 py-1.5 text-xs"
                                    >
                                        <Video size={13} aria-hidden="true" />
                                        {t('spaceWeek.join')}
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Game */}
                <section className="lg:col-span-3" aria-labelledby="game-heading">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center" aria-hidden="true">
                                <Gamepad2 size={16} className="text-yellow-400" />
                            </span>
                            <h2 id="game-heading" translate="no" className="font-display text-sm font-bold uppercase tracking-[0.18em] text-white">
                                Icarus Pixel
                            </h2>
                        </div>
                        <button
                            id="game-fullscreen-btn"
                            onClick={toggleFullscreen}
                            className="btn-ghost px-4 py-2 text-xs"
                        >
                            {isFullscreen ? <Minimize size={13} aria-hidden="true" /> : <Maximize size={13} aria-hidden="true" />}
                            {t('spaceWeek.fullscreen')}
                        </button>
                    </div>
                    <div
                        ref={gameRef}
                        className={pseudoFullscreen
                            ? 'fixed inset-0 z-[10001] bg-black'
                            : 'relative w-full rounded-3xl overflow-hidden border border-white/[0.08] bg-black shadow-[0_30px_80px_-30px_rgba(234,179,8,0.25)] aspect-[3/4] max-h-[78vh] min-h-[420px] sm:aspect-[16/10] sm:max-h-none'}
                    >
                        {gameReady ? (
                            <iframe
                                key={userId || 'guest'}
                                ref={frameRef}
                                id="icarus-pixel-frame"
                                title="Icarus Pixel"
                                src="/icarus-pixel/index.html"
                                className="absolute inset-0 w-full h-full border-0"
                                allow="fullscreen; autoplay"
                                tabIndex={isFullscreen ? 0 : -1}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 size={32} className="text-yellow-600 animate-spin" />
                            </div>
                        )}
                        {/* The game is playable only in fullscreen: in the small window this
                            overlay covers the frame so no clicks or touches reach it */}
                        {gameReady && !isFullscreen && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center bg-black/65 backdrop-blur-sm">
                                <button
                                    id="game-play-fullscreen-btn"
                                    onClick={toggleFullscreen}
                                    className="btn-gold px-7 py-3 text-sm"
                                >
                                    <Maximize size={18} />
                                    {t('spaceWeek.playFullscreen')}
                                </button>
                                <p className="max-w-xs text-xs text-neutral-400">{t('spaceWeek.fullscreenOnly')}</p>
                            </div>
                        )}
                        {/* Phones have no pause button in the game — this is the only in-game control (exiting pauses the game) */}
                        {(pseudoFullscreen || (fullscreen && isTouch)) && (
                            <button
                                id="game-exit-fullscreen-btn"
                                onClick={toggleFullscreen}
                                aria-label={t('spaceWeek.exitFullscreen')}
                                className="absolute top-3 right-3 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-black/60 border border-neutral-700 text-neutral-300 cursor-pointer"
                            >
                                <Minimize size={18} />
                            </button>
                        )}
                    </div>
                    <p className="mt-3 text-xs text-neutral-500 flex items-center gap-1.5">
                        <Rocket size={13} /> {t(isTouch ? 'spaceWeek.gameHintTouch' : 'spaceWeek.gameHint')}
                    </p>
                    {!isAuthenticated && !isAuthLoading && (
                        <p className="mt-1 text-xs text-yellow-600/80">{t('spaceWeek.signInToSave')}</p>
                    )}
                </section>
            </div>
        </div>
    )
}
