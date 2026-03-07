import { useState, useRef, useEffect } from 'react'
import {
    Rocket,
    Flame,
    Trophy,
    User,
    Star,
    CheckCircle2,
    Clock,
    Circle,
    ChevronRight,
    ChevronLeft,
    Play,
    Award,
    Target,
    Zap,
    Shield,
    Crown,
    Medal,
    Compass,
    Crosshair,
    Globe,
    ArrowLeft,
    Lock,
    Hexagon,
    BookOpen,
    Atom,
    Orbit,
    Sparkles,
    X,
    Settings,
    LogOut,
    Users,
    UserCircle,
    Terminal,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════
   ICARUS DASHBOARD — Aerospace Innovation Platform
   ═══════════════════════════════════════════════════════════ */

// ── Mock Data ───────────────────────────────────────────
const userData = { name: 'Alex Novak', email: 'engineer@icarus.com', score: 2_450, streak: 5 }

const trainingCategories = [
    {
        id: 'aerospace',
        title: 'AEROSPACE ENGINEERING',
        icon: Rocket,
        courses: [
            {
                id: 'aero',
                title: 'AERODYNAMICS FUNDAMENTALS',
                masteryPoints: 2800,
                modules: [
                    {
                        id: 'm1', title: 'Module 1: Lift and Drag',
                        progress: [true, true, true, false, false, false],
                        lessons: [
                            { title: 'Introduction to Lift', status: 'mastered' },
                            { title: 'Drag Forces Overview', status: 'mastered' },
                            { title: 'Thrust & Propulsion Basics', status: 'mastered' },
                            { title: 'Bernoulli\'s Principle', status: 'familiar' },
                            { title: 'Airfoil Geometry Analysis', status: 'not_started' },
                            { title: 'Quiz: Forces of Flight', status: 'not_started' },
                        ],
                    },
                    {
                        id: 'm2', title: 'Module 2: Boundary Layers',
                        progress: [true, false, false, false, false],
                        lessons: [
                            { title: 'Laminar vs Turbulent Flow', status: 'familiar' },
                            { title: 'Reynolds Number', status: 'not_started' },
                            { title: 'Boundary Layer Separation', status: 'not_started' },
                            { title: 'Surface Roughness Effects', status: 'not_started' },
                            { title: 'Quiz: Boundary Layers', status: 'not_started' },
                        ],
                    },
                    {
                        id: 'm3', title: 'Module 3: Supersonic Flight',
                        progress: [false, false, false, false],
                        lessons: [
                            { title: 'Mach Number & Regimes', status: 'not_started' },
                            { title: 'Shock Wave Theory', status: 'not_started' },
                            { title: 'Area-Velocity Relation', status: 'not_started' },
                            { title: 'Final Assessment', status: 'not_started' },
                        ],
                    },
                ],
            },
            {
                id: 'orbital',
                title: 'ORBITAL MECHANICS',
                masteryPoints: 3200,
                modules: [
                    {
                        id: 'm1', title: 'Module 1: Keplerian Motion',
                        progress: [false, false, false, false, false],
                        lessons: [
                            { title: 'Kepler\'s Three Laws', status: 'not_started' },
                            { title: 'Elliptical Orbits', status: 'not_started' },
                            { title: 'Orbital Elements', status: 'not_started' },
                            { title: 'Two-Body Problem', status: 'not_started' },
                            { title: 'Quiz: Kepler\'s Laws', status: 'not_started' },
                        ],
                    },
                    {
                        id: 'm2', title: 'Module 2: Transfer Orbits',
                        progress: [false, false, false, false],
                        lessons: [
                            { title: 'Hohmann Transfer', status: 'not_started' },
                            { title: 'Bi-Elliptic Transfers', status: 'not_started' },
                            { title: 'Gravitational Slingshot', status: 'not_started' },
                            { title: 'Mission Planning Lab', status: 'not_started' },
                        ],
                    },
                ],
            },
            {
                id: 'propulsion',
                title: 'PROPULSION SYSTEMS',
                masteryPoints: 4100,
                modules: [
                    {
                        id: 'm1', title: 'Module 1: Chemical Rockets',
                        progress: [true, true, true, true, false, false],
                        lessons: [
                            { title: 'Tsiolkovsky Equation', status: 'mastered' },
                            { title: 'Liquid Propellants', status: 'mastered' },
                            { title: 'Solid Rocket Motors', status: 'mastered' },
                            { title: 'Nozzle Design', status: 'mastered' },
                            { title: 'Staging Optimization', status: 'familiar' },
                            { title: 'Quiz: Rocket Propulsion', status: 'not_started' },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: 'software',
        title: 'SOFTWARE & SYSTEMS',
        icon: Terminal,
        courses: [
            {
                id: 'control',
                title: 'FLIGHT CONTROL SYSTEMS',
                masteryPoints: 3600,
                modules: [
                    {
                        id: 'm1', title: 'Module 1: PID Controllers',
                        progress: [false, false, false, false],
                        lessons: [
                            { title: 'Control Loop Basics', status: 'not_started' },
                            { title: 'P, I, D Components', status: 'not_started' },
                            { title: 'Tuning Methods', status: 'not_started' },
                            { title: 'Simulation Lab', status: 'not_started' },
                        ],
                    },
                ],
            },
            {
                id: 'embedded',
                title: 'EMBEDDED AVIONICS',
                masteryPoints: 2900,
                modules: [
                    {
                        id: 'm1', title: 'Module 1: Sensor Fusion',
                        progress: [true, true, false, false, false],
                        lessons: [
                            { title: 'IMU Fundamentals', status: 'mastered' },
                            { title: 'Kalman Filtering', status: 'mastered' },
                            { title: 'GPS Integration', status: 'not_started' },
                            { title: 'Redundancy Architecture', status: 'not_started' },
                            { title: 'Quiz: Avionics', status: 'not_started' },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: 'physics',
        title: 'APPLIED PHYSICS',
        icon: Atom,
        courses: [
            {
                id: 'thermal',
                title: 'THERMAL PROTECTION',
                masteryPoints: 2400,
                modules: [
                    {
                        id: 'm1', title: 'Module 1: Heat Transfer',
                        progress: [true, false, false, false],
                        lessons: [
                            { title: 'Conduction & Convection', status: 'familiar' },
                            { title: 'Radiative Heat Transfer', status: 'not_started' },
                            { title: 'Ablative Shields', status: 'not_started' },
                            { title: 'TPS Material Selection', status: 'not_started' },
                        ],
                    },
                ],
            },
            {
                id: 'structural',
                title: 'STRUCTURAL ANALYSIS',
                masteryPoints: 3800,
                modules: [
                    {
                        id: 'm1', title: 'Module 1: Stress & Strain',
                        progress: [false, false, false, false, false],
                        lessons: [
                            { title: 'Tensor Fundamentals', status: 'not_started' },
                            { title: 'Material Properties', status: 'not_started' },
                            { title: 'Finite Element Intro', status: 'not_started' },
                            { title: 'Fatigue Analysis', status: 'not_started' },
                            { title: 'Quiz: Structures', status: 'not_started' },
                        ],
                    },
                ],
            },
        ],
    },
]

const leaderboard = [
    { rank: 1, team: 'PHOENIX ASCENDANT', score: 12_840, streak: 14, members: 5 },
    { rank: 2, team: 'NOVA ENGINEERING', score: 11_520, streak: 9, members: 4 },
    { rank: 3, team: 'ORBIT BREAKERS', score: 10_990, streak: 7, members: 5 },
    { rank: 4, team: 'STELLAR DYNAMICS', score: 9_870, streak: 5, members: 4 },
    { rank: 5, team: 'AETHER COLLECTIVE', score: 8_450, streak: 3, members: 6 },
    { rank: 6, team: 'TITAN AEROSPACE', score: 7_230, streak: 2, members: 4 },
    { rank: 7, team: 'ECLIPSE SQUADRON', score: 6_100, streak: 0, members: 5 },
]

const TABS = [
    { id: 'journey', label: 'THE JOURNEY', icon: Compass },
    { id: 'training', label: 'TRAINING', icon: Crosshair },
    { id: 'ranking', label: 'GLOBAL RANKING', icon: Globe },
]


/* ── Shared Components ─────────────────────────────────── */

function ProgressBar({ value, height = 'h-1.5', gold = true }) {
    return (
        <div className={`w-full ${height} bg-neutral-800 rounded-full overflow-hidden`}>
            <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                    width: `${value}%`,
                    background: value === 100
                        ? 'linear-gradient(90deg, #10B981, #34D399)'
                        : gold
                            ? 'linear-gradient(90deg, #A8863E, #D4B06A)'
                            : 'linear-gradient(90deg, #C5A059, #D4B06A)',
                }}
            />
        </div>
    )
}

function RankBadge({ rank }) {
    if (rank === 1) return (
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center shadow-lg shadow-yellow-600/25">
            <Crown size={17} className="text-black" />
        </div>
    )
    if (rank === 2) return (
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
            <Medal size={17} className="text-black" />
        </div>
    )
    if (rank === 3) return (
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center">
            <Award size={17} className="text-black" />
        </div>
    )
    return (
        <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
            <span className="text-sm font-bold text-neutral-400">{rank}</span>
        </div>
    )
}


/* ── Profile Dropdown ─────────────────────────────────────── */

function ProfileDropdown({ isOpen, onClose }) {
    const ref = useRef(null)

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) onClose()
        }
        if (isOpen) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const items = [
        { icon: UserCircle, label: 'Your Profile' },
        { icon: Users, label: 'Team Dashboard' },
        { icon: Settings, label: 'Settings' },
    ]

    return (
        <div
            ref={ref}
            className="absolute right-0 mt-2 w-64 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl shadow-black/60 z-[60]
                       animate-in fade-in slide-in-from-top-2"
            style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
        >
            {/* User info */}
            <div className="px-4 py-3 border-b border-neutral-800">
                <p className="text-xs text-neutral-500">Signed in as</p>
                <p className="text-sm font-semibold text-white truncate">{userData.name}</p>
                <p className="text-xs text-neutral-400 truncate">{userData.email}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
                {items.map(item => {
                    const Icon = item.icon
                    return (
                        <button
                            key={item.label}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 cursor-pointer
                                       transition-colors duration-200 hover:bg-neutral-900 hover:text-white"
                        >
                            <Icon size={15} className="text-neutral-500" />
                            {item.label}
                        </button>
                    )
                })}
            </div>

            {/* Sign out */}
            <div className="border-t border-neutral-800 py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 cursor-pointer
                                   transition-colors duration-200 hover:bg-neutral-900 hover:text-red-400">
                    <LogOut size={15} />
                    Sign Out
                </button>
            </div>
        </div>
    )
}


/* ── Competition Modal ───────────────────────────────────── */

function CompetitionModal({ isOpen, onClose }) {
    const [mode, setMode] = useState('create')
    const [teamName, setTeamName] = useState('')
    const [inviteCode, setInviteCode] = useState('')

    if (!isOpen) return null

    const inputClass = `w-full px-4 py-3 rounded-xl text-sm text-white placeholder-neutral-500
        bg-neutral-950 border border-neutral-700
        focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 focus:outline-none
        transition-all duration-300`

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] px-4"
            onClick={onClose}
        >
            <div
                className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-7 relative
                           shadow-2xl shadow-black/60"
                onClick={e => e.stopPropagation()}
                style={{ animation: 'fadeSlideIn 0.25s ease-out' }}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                    <X size={20} />
                </button>

                {/* Title */}
                <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-1 text-center">
                    REGISTER FOR ICARUS
                </h2>
                <p className="text-xs text-neutral-500 text-center mb-6 tracking-wider uppercase">
                    Join the aerospace competition
                </p>

                {/* Mode Toggle */}
                <div className="flex rounded-xl bg-neutral-950 border border-neutral-800 p-1 mb-6">
                    <button
                        onClick={() => setMode('create')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer
                            ${mode === 'create'
                                ? 'bg-yellow-600/15 text-yellow-600 border border-yellow-600/30'
                                : 'text-neutral-500 hover:text-neutral-300 border border-transparent'}`}
                    >
                        Create Team
                    </button>
                    <button
                        onClick={() => setMode('join')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer
                            ${mode === 'join'
                                ? 'bg-yellow-600/15 text-yellow-600 border border-yellow-600/30'
                                : 'text-neutral-500 hover:text-neutral-300 border border-transparent'}`}
                    >
                        Join With Code
                    </button>
                </div>

                {/* Form */}
                {mode === 'create' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">Team Name</label>
                            <input
                                type="text"
                                placeholder="Enter Team Name"
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">Callsign</label>
                            <input
                                type="text"
                                placeholder="Choose a 3-5 letter callsign"
                                className={inputClass}
                            />
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">Invite Code</label>
                        <input
                            type="text"
                            placeholder="Enter 6-digit Invite Code"
                            maxLength={6}
                            value={inviteCode}
                            onChange={e => setInviteCode(e.target.value.toUpperCase())}
                            className={`${inputClass} text-center text-lg tracking-[0.5em] font-mono`}
                        />
                    </div>
                )}

                {/* Submit */}
                <button className="mt-6 w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-[0.15em] cursor-pointer
                                   bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                                   shadow-lg shadow-yellow-600/20
                                   transition-all duration-300 ease-out
                                   hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-600/30
                                   active:scale-100">
                    {mode === 'create' ? 'INITIALIZE SEQUENCE' : 'JOIN SQUADRON'}
                </button>

                <p className="text-[10px] text-neutral-600 text-center mt-4 tracking-wide">
                    By registering you agree to the ICARUS competition protocol
                </p>
            </div>
        </div>
    )
}


/* ── Header ──────────────────────────────────────────────── */

function Header({ onOpenModal }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 backdrop-blur-2xl bg-neutral-950/80 border-b border-neutral-800/50">
            <div className="max-w-7xl mx-auto w-full px-6">
                <div className="flex items-center justify-between h-20">
                    {/* Logo + Motto */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5 group cursor-pointer">
                            <img
                                src="/logo_white.png"
                                alt="ICARUS"
                                className="h-9 w-auto transition-transform duration-500 group-hover:scale-110"
                            />
                            <span className="text-2xl font-black uppercase tracking-[0.2em] text-white">
                                ICARUS
                            </span>
                        </div>
                        <div className="hidden md:block h-6 w-px bg-neutral-700" />
                        <span className="hidden md:block text-[11px] italic text-neutral-500 tracking-wide">
                            to be is to innovate
                        </span>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* JOIN CTA */}
                        <button
                            onClick={onOpenModal}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer
                                       bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                                       shadow-md shadow-yellow-600/15
                                       transition-all duration-300
                                       hover:scale-105 hover:shadow-lg hover:shadow-yellow-600/25
                                       active:scale-100"
                        >
                            <Rocket size={14} />
                            Join Competition
                        </button>

                        {/* Streak */}
                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-yellow-600/10 border border-yellow-600/25">
                            <Flame size={18} className="text-yellow-600 animate-gold-pulse" />
                            <span className="text-sm font-bold text-yellow-600 tracking-wide">
                                {userData.streak} days
                            </span>
                        </div>
                        {/* Score */}
                        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-neutral-800/60 border border-neutral-700/50">
                            <Star size={15} className="text-yellow-600" />
                            <span className="text-sm font-semibold text-white tabular-nums">
                                {userData.score.toLocaleString()}
                            </span>
                        </div>
                        {/* Avatar + Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="relative cursor-pointer group"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-yellow-600/15">
                                    <User size={19} className="text-black" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-neutral-950" />
                            </button>
                            <ProfileDropdown isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}


/* ── Tab Navigation ──────────────────────────────────────── */

function TabNav({ activeTab, setActiveTab }) {
    return (
        <nav className="border-b border-neutral-800/50 bg-neutral-950/50 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto w-full px-6">
                <div className="flex items-center justify-center gap-1">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-2.5 px-6 py-4 text-xs sm:text-[13px] font-bold uppercase tracking-[0.15em]
                           transition-all duration-300 ease-out cursor-pointer
                           ${isActive ? 'text-yellow-600' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                <Icon size={16} />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ').pop()}</span>
                                {isActive && (
                                    <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-yellow-600" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}


/* ── Tab 1: THE JOURNEY ──────────────────────────────────── */

function JourneyTab() {
    return (
        <div className="max-w-7xl mx-auto w-full px-6 py-16 sm:py-24">
            {/* Cinematic Title */}
            <div className="text-center mb-14 sm:mb-20">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.4em] text-neutral-500 mb-4">
                    Module 01 — Foundation
                </p>
                <h1 className="leading-none mb-6">
                    <span className="block text-4xl sm:text-6xl lg:text-8xl font-black uppercase tracking-[0.1em] text-white mb-2">
                        THE JOURNEY OF
                    </span>
                    <span className="block text-5xl sm:text-7xl lg:text-9xl font-black uppercase tracking-[0.12em] text-gold-shimmer">
                        ICARUS
                    </span>
                </h1>
                <p className="mt-6 text-sm sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                    Master the engineering principles that defy gravity. Your path to innovation begins here.
                </p>
            </div>

            {/* Video Placeholder */}
            <div className="relative max-w-5xl mx-auto group">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-yellow-600/30 via-transparent to-yellow-600/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl shadow-black/50"
                    style={{ boxShadow: '0 0 40px rgba(197,160,89,0.08), 0 8px 40px rgba(0,0,0,0.6)' }}>
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: "linear-gradient(to bottom, rgba(10,10,10,0.2), rgba(10,10,10,0.85)), url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2048&auto=format&fit=crop')",
                            }}
                        />
                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <button className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center
                             bg-yellow-600/20 border-2 border-yellow-600/50 backdrop-blur-sm cursor-pointer
                             transition-all duration-500 ease-out
                             group-hover:scale-110 group-hover:bg-yellow-600/30 group-hover:border-yellow-600/70
                             group-hover:shadow-2xl group-hover:shadow-yellow-600/20">
                                <Play size={32} className="text-yellow-600 ml-1" fill="currentColor" />
                            </button>
                        </div>
                        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[11px] font-semibold text-neutral-300 tracking-wider">24:35</div>
                        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-600/80 mb-1">Episode 01</p>
                            <h3 className="text-sm sm:text-lg font-bold text-white tracking-wide">Introduction to Aerospace Engineering</h3>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-yellow-600/30 rounded-tl-xl -translate-x-1.5 -translate-y-1.5" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-yellow-600/30 rounded-br-xl translate-x-1.5 translate-y-1.5" />
            </div>
        </div>
    )
}


/* ── Tab 2: TRAINING (Khan Academy Style) ─────────────── */

/* -- State A: Accordion Catalog -- */

function CategoryAccordion({ category, onSelectCourse }) {
    const [isOpen, setIsOpen] = useState(false)
    const Icon = category.icon

    return (
        <div className="rounded-xl overflow-hidden border border-neutral-800/60 transition-colors duration-300">
            {/* Category header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-6 py-5 bg-neutral-900 cursor-pointer
                           transition-all duration-300 hover:bg-neutral-800/80"
            >
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-600/10 border border-yellow-600/30 text-yellow-500">
                        <Icon size={20} />
                    </div>
                    <span className="text-sm sm:text-base font-black uppercase tracking-widest text-white">
                        {category.title}
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider ml-1">
                        {category.courses.length} courses
                    </span>
                </div>
                <ChevronRight
                    size={18}
                    className={`text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
                />
            </button>

            {/* Expanded course list */}
            {isOpen && (
                <div className="bg-neutral-950/50 border-t border-neutral-800/40 px-6 py-3">
                    {category.courses.map(course => {
                        const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0)
                        const masteredLessons = course.modules.reduce((s, m) => s + m.lessons.filter(l => l.status === 'mastered').length, 0)
                        return (
                            <button
                                key={course.id}
                                onClick={() => onSelectCourse(course)}
                                className="w-full flex items-center justify-between py-3.5 px-3 rounded-lg cursor-pointer
                                           transition-all duration-200 hover:bg-neutral-900/60 hover:pl-5 group"
                            >
                                <span className="text-sm font-semibold text-neutral-300 tracking-wide transition-colors duration-200 group-hover:text-yellow-600">
                                    {course.title}
                                </span>
                                <span className="text-[11px] font-semibold text-neutral-600 tabular-nums">
                                    {masteredLessons}/{totalLessons}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function TrainingCatalog({ onSelectCourse }) {
    return (
        <>
            <div className="mb-10">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.35em] text-yellow-600 mb-2">
                    Learning Path
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-widest text-white">
                    COURSE CATALOG
                </h2>
            </div>
            <div className="space-y-4">
                {trainingCategories.map(cat => (
                    <CategoryAccordion key={cat.id} category={cat} onSelectCourse={onSelectCourse} />
                ))}
            </div>
        </>
    )
}


/* -- State B: Course Detail (Khan Academy layout) -- */

function MasteryLegend() {
    const items = [
        { label: 'Mastered', color: 'bg-yellow-600' },
        { label: 'Familiar', color: 'bg-yellow-600/40' },
        { label: 'Not Started', color: 'bg-transparent border border-neutral-600' },
    ]
    return (
        <div className="flex items-center gap-5 sm:gap-6">
            {items.map(item => (
                <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-sm ${item.color}`} />
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{item.label}</span>
                </div>
            ))}
        </div>
    )
}

function ModuleTracker({ mod }) {
    return (
        <div className="flex items-center gap-4 py-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider w-24 sm:w-28 shrink-0">
                {mod.title.split(':')[0]}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
                {mod.progress.map((filled, i) => (
                    <div
                        key={i}
                        className={`w-5 h-5 rounded-sm transition-colors duration-300
                            ${filled
                                ? 'bg-yellow-600 shadow-sm shadow-yellow-600/30'
                                : 'border border-neutral-600 bg-transparent'}`}
                    />
                ))}
            </div>
        </div>
    )
}

function ModuleContentBlock({ mod }) {
    const statusIcon = (status) => {
        if (status === 'mastered') return <CheckCircle2 size={14} className="text-yellow-600 shrink-0" />
        if (status === 'familiar') return <Circle size={14} className="text-yellow-600/50 shrink-0" />
        return <Circle size={14} className="text-neutral-600 shrink-0" />
    }

    return (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 mb-4">
            <h4 className="text-sm sm:text-base font-black uppercase tracking-widest text-white mb-5">
                {mod.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {mod.lessons.map((lesson, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 py-1.5 group cursor-pointer
                                   transition-colors duration-200 hover:text-yellow-600"
                    >
                        {statusIcon(lesson.status)}
                        <span className={`text-sm leading-snug transition-colors duration-200
                            ${lesson.status === 'mastered' ? 'text-neutral-400' : 'text-neutral-300'}
                            group-hover:text-yellow-600`}>
                            {lesson.title}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function KhanCourseDetail({ course, onBack }) {
    const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0)
    const mastered = course.modules.reduce((s, m) => s + m.lessons.filter(l => l.status === 'mastered').length, 0)

    return (
        <>
            {/* Back */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm font-semibold text-neutral-400 mb-8 cursor-pointer
                   transition-colors duration-300 hover:text-yellow-600"
            >
                <ArrowLeft size={16} />
                Back to Catalog
            </button>

            {/* Course Header */}
            <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-widest text-white mb-2">
                    {course.title}
                </h2>
                <p className="text-sm text-neutral-500 font-semibold tracking-wide">
                    {course.masteryPoints.toLocaleString()} possible mastery points
                    <span className="mx-3 text-neutral-700">|</span>
                    <span className="text-yellow-600">{mastered}/{totalLessons}</span> lessons completed
                </p>
            </div>

            {/* Visual Legend */}
            <div className="mb-10">
                <MasteryLegend />
            </div>

            {/* Module Trackers */}
            <div className="rounded-xl bg-neutral-900/30 border border-neutral-800/50 px-6 py-4 mb-10">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-yellow-600 mb-3">Module Progress</h3>
                {course.modules.map(mod => (
                    <ModuleTracker key={mod.id} mod={mod} />
                ))}
            </div>

            {/* Module Content Blocks */}
            <div className="space-y-4">
                {course.modules.map(mod => (
                    <ModuleContentBlock key={mod.id} mod={mod} />
                ))}
            </div>
        </>
    )
}

function TrainingTab() {
    const [selectedCourse, setSelectedCourse] = useState(null)

    return (
        <div className="max-w-7xl mx-auto w-full px-6 py-14 sm:py-20">
            <div key={selectedCourse ? selectedCourse.id : 'catalog'} className="tab-animate">
                {selectedCourse
                    ? <KhanCourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />
                    : <TrainingCatalog onSelectCourse={setSelectedCourse} />
                }
            </div>
        </div>
    )
}


/* ── Tab 3: GLOBAL RANKING (Podium + Card List) ─────────── */

function PodiumBlock({ entry, height, theme }) {
    const themes = {
        gold: {
            bg: 'bg-gradient-to-t from-yellow-700 via-yellow-600 to-yellow-400',
            text: 'text-black',
            shadow: 'shadow-[0_0_50px_rgba(202,138,4,0.35)]',
            label: '1ST',
            nameSize: 'text-base sm:text-lg',
        },
        silver: {
            bg: 'bg-gradient-to-t from-neutral-500 via-neutral-400 to-neutral-300',
            text: 'text-black',
            shadow: 'shadow-[0_0_30px_rgba(163,163,163,0.25)]',
            label: '2ND',
            nameSize: 'text-sm sm:text-base',
        },
        bronze: {
            bg: 'bg-gradient-to-t from-orange-900 via-orange-700 to-orange-600',
            text: 'text-white',
            shadow: 'shadow-[0_0_30px_rgba(194,65,12,0.25)]',
            label: '3RD',
            nameSize: 'text-sm sm:text-base',
        },
    }
    const t = themes[theme]

    return (
        <div className="flex flex-col items-center" style={{ width: theme === 'gold' ? '30%' : '25%', maxWidth: theme === 'gold' ? 220 : 200 }}>
            {/* Crown for 1st */}
            {theme === 'gold' && (
                <div className="mb-3 animate-float">
                    <Crown size={32} className="text-yellow-400 drop-shadow-lg" />
                </div>
            )}

            {/* Podium box */}
            <div
                className={`w-full rounded-t-2xl ${t.bg} ${t.text} ${t.shadow} p-4 sm:p-6 text-center
                           transition-all duration-500 hover:scale-[1.03]`}
                style={{ minHeight: height }}
            >
                {/* Rank label */}
                <p className={`text-2xl sm:text-3xl font-black tracking-wider mb-2 ${theme === 'bronze' ? 'opacity-90' : 'opacity-80'}`}>
                    {t.label}
                </p>

                {/* Team name */}
                <h3 className={`${t.nameSize} font-black uppercase tracking-widest leading-tight mb-3`}>
                    {entry.team}
                </h3>

                {/* Score */}
                <p className={`text-xl sm:text-2xl font-black tabular-nums mb-3 ${theme === 'bronze' ? '' : 'opacity-90'}`}>
                    {entry.score.toLocaleString()}
                </p>

                {/* Stats row */}
                <div className={`flex items-center justify-center gap-3 text-xs font-semibold ${theme === 'bronze' ? 'text-white/70' : 'opacity-60'}`}>
                    {entry.streak > 0 && (
                        <span className="flex items-center gap-1">
                            <Flame size={13} />
                            {entry.streak}d
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <User size={13} />
                        {entry.members}
                    </span>
                </div>
            </div>
        </div>
    )
}

function RankingTab({ onOpenModal }) {
    const top3 = leaderboard.filter(e => e.rank <= 3)
    const rest = leaderboard.filter(e => e.rank > 3)
    const second = top3.find(e => e.rank === 2)
    const first = top3.find(e => e.rank === 1)
    const third = top3.find(e => e.rank === 3)

    return (
        <div className="max-w-7xl mx-auto w-full px-6 py-14 sm:py-20">
            {/* Header */}
            <div className="text-center mb-10 sm:mb-14">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.35em] text-yellow-600 mb-2">
                    Competition
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-widest text-white">
                    TEAM RANKINGS
                </h2>
                <div className="flex items-center justify-center gap-2 text-neutral-500 mt-3">
                    <Trophy size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Season 2026</span>
                </div>
            </div>

            {/* ── Part A: The Podium ── */}
            <div className="flex justify-center items-end gap-3 sm:gap-6 md:gap-8 mb-14 mt-8">
                {/* 2nd Place — Silver (left) */}
                {second && <PodiumBlock entry={second} height="180px" theme="silver" />}
                {/* 1st Place — Gold (center, tallest) */}
                {first && <PodiumBlock entry={first} height="240px" theme="gold" />}
                {/* 3rd Place — Bronze (right, shortest) */}
                {third && <PodiumBlock entry={third} height="150px" theme="bronze" />}
            </div>

            {/* ── Part B: Card List (Ranks 4+) ── */}
            {rest.length > 0 && (
                <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                    {rest.map(entry => (
                        <div
                            key={entry.rank}
                            className="flex items-center justify-between bg-neutral-900/80 border border-neutral-800 rounded-xl px-5 sm:px-6 py-4
                                       transition-all duration-300 ease-out hover:border-yellow-600/40 hover:bg-neutral-900 cursor-pointer"
                        >
                            {/* Left: Rank + Name */}
                            <div className="flex items-center gap-4">
                                <span className="text-lg font-black text-neutral-600 tabular-nums w-8">
                                    {entry.rank}
                                </span>
                                <span className="text-sm font-bold uppercase tracking-wider text-white">
                                    {entry.team}
                                </span>
                            </div>

                            {/* Right: Score + Streak + Members */}
                            <div className="flex items-center gap-4 sm:gap-6">
                                <span className="text-sm font-bold text-yellow-600 tabular-nums">
                                    {entry.score.toLocaleString()}
                                    <span className="text-[10px] text-neutral-600 ml-1">pts</span>
                                </span>
                                {entry.streak > 0 && (
                                    <span className="hidden sm:flex items-center gap-1 text-sm text-orange-400">
                                        <Flame size={14} />
                                        <span className="font-bold tabular-nums">{entry.streak}d</span>
                                    </span>
                                )}
                                <span className="hidden sm:flex items-center gap-1 text-sm text-neutral-500">
                                    <User size={13} />
                                    {entry.members}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CTA */}
            <div className="mt-14 text-center">
                <button
                    onClick={onOpenModal}
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl cursor-pointer
                             bg-gradient-to-r from-yellow-700 to-yellow-600
                             text-black text-sm font-bold uppercase tracking-[0.15em]
                             shadow-lg shadow-yellow-600/20
                             transition-all duration-300 ease-out
                             hover:scale-105 hover:shadow-2xl hover:shadow-yellow-600/30 active:scale-100"
                >
                    <Trophy size={17} />
                    JOIN THE COMPETITION
                </button>
            </div>
        </div>
    )
}


/* ── Footer ──────────────────────────────────────────────── */

function Footer() {
    return (
        <footer className="mt-auto border-t border-neutral-800/40 py-10 bg-neutral-950/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto w-full px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img src="/logo_white.png" alt="ICARUS" className="h-5 w-auto opacity-70" />
                        <span className="text-sm font-bold uppercase tracking-[0.15em] text-neutral-400">ICARUS</span>
                        <span className="text-neutral-700 mx-1">|</span>
                        <span className="text-xs italic text-neutral-600">to be is to innovate</span>
                    </div>
                    <p className="text-xs text-neutral-600">© 2026 ICARUS Platform. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}


/* ── Main App ────────────────────────────────────────────── */

export default function App() {
    const [activeTab, setActiveTab] = useState('journey')
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <div
            className="min-h-screen w-full text-white bg-neutral-950 flex flex-col"
            style={{
                backgroundImage: "linear-gradient(to bottom, rgba(18,18,18,0.85), rgba(18,18,18,1)), url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048&auto=format&fit=crop')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <Header onOpenModal={() => setIsModalOpen(true)} />
            <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-1">
                <div key={activeTab} className="tab-animate">
                    {activeTab === 'journey' && <JourneyTab />}
                    {activeTab === 'training' && <TrainingTab />}
                    {activeTab === 'ranking' && <RankingTab onOpenModal={() => setIsModalOpen(true)} />}
                </div>
            </main>
            <Footer />
            <CompetitionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    )
}
