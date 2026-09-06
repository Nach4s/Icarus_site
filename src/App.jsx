import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from './AuthContext.jsx'
import { useLang } from './LanguageContext.jsx'
import { api } from './api.js'
import AdminPage from './AdminPage.jsx'
import ResetPasswordPage from './ResetPasswordPage.jsx'
import LatestNewsBlock from './LatestNewsBlock.jsx'
import NewsPage from './NewsPage.jsx'
import NewsPostPage from './NewsPostPage.jsx'
import Preloader from './Preloader.jsx'
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
    ShieldCheck,
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
    Menu,
    Loader2,
    AlertTriangle,
    Activity,
    Minimize,
    MessageCircle,
    Newspaper,
    Maximize,
    Phone,
    Beaker,
    Microscope,
    Mail
} from 'lucide-react'
import ContactUs from './ContactUs.jsx'

/* ═══════════════════════════════════════════════════════════
   ICARUS DASHBOARD — Aerospace Innovation Platform
   ═══════════════════════════════════════════════════════════ */

// ── Fallback data (used when not authenticated) ─────────
const guestData = { name: 'Guest', email: '', score: 0, streak: 0 }

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



const TABS = [
    { id: 'journey', labelKey: 'nav.journey', icon: Compass },
    { id: 'news', labelKey: 'nav.news', icon: Newspaper },
    { id: 'training', labelKey: 'nav.training', icon: Crosshair },
    { id: 'ranking', labelKey: 'nav.ranking', icon: Globe },
    { id: 'contact', labelKey: 'nav.contact', icon: MessageCircle },
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

function ProfileDropdown({ isOpen, onClose, onNavigate }) {
    const ref = useRef(null)
    const { user, logout } = useAuth()
    const { t } = useLang()

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) onClose()
        }
        if (isOpen) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const items = [
        { icon: UserCircle, label: t('profile.yourProfile'), id: 'profile' },
        { icon: Users, label: t('profile.teamDashboard'), id: 'team' },
        { icon: Settings, label: t('profile.settings'), id: 'settings' },
        ...(user?.role === 'ADMIN' ? [{ icon: ShieldCheck, label: t('profile.adminPanel'), id: 'admin' }] : []),
    ]

    return (
        <div
            ref={ref}
            className="absolute right-0 mt-2 w-72 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl shadow-black/60 z-[60]
                       animate-in fade-in slide-in-from-top-2"
            style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
        >
            {/* User info */}
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-700 shrink-0 shadow-inner">
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User size={24} className="text-neutral-500" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">{t('profile.signedInAs')}</p>
                    <p className="text-base font-black text-white truncate">{user?.name ?? t('generic.guest')}</p>
                    <p className="text-sm text-neutral-400 truncate">{user?.email ?? ''}</p>
                </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
                {items.map(item => {
                    const Icon = item.icon
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id)
                                onClose()
                            }}
                            className="w-full flex items-center gap-4 px-5 py-3 text-base text-neutral-300 font-medium cursor-pointer
                                       transition-colors duration-200 hover:bg-neutral-900 hover:text-white"
                        >
                            <Icon size={18} className="text-neutral-500" />
                            {item.label}
                        </button>
                    )
                })}
            </div>

            {/* Sign out */}
            <div className="border-t border-neutral-800 py-1">
                <button
                    onClick={() => { logout(); onClose(); }}
                    className="w-full flex items-center gap-4 px-5 py-3 text-base font-bold uppercase tracking-wider text-red-400/80 cursor-pointer
                                   transition-colors duration-200 hover:bg-neutral-900 hover:text-red-400"
                >
                    <LogOut size={18} />
                    {t('profile.signOut')}
                </button>
            </div>
        </div>
    )
}


/* ── Competition Modal (Auth-first flow) ─────────────────── */

function CompetitionModal({ isOpen, onClose }) {
    const { isAuthenticated, user, login, register, updateUser, verifyEmail } = useAuth()
    const { t } = useLang()

    // Phase determines which view the user sees
    // 'login' | 'register' | 'verify' — unauthenticated
    // 'create' | 'join'               — authenticated
    const [phase, setPhase] = useState('login')

    // ── Form state ──────────────────────────────────────────
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [teamName, setTeamName] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [otpCode, setOtpCode] = useState('')

    // ── UX state ────────────────────────────────────────────
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')

    // When auth state changes, auto-advance to team phase (or close if already in a team)
    useEffect(() => {
        if (isAuthenticated && (phase === 'login' || phase === 'register' || phase === 'verify')) {
            if (user?.teamId) {
                // Already in a team — no need to show team creation, just close
                onClose()
            } else {
                setPhase('create')
            }
            setError('')
        }
    }, [isAuthenticated, user, phase, onClose])

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            // If user opens this modal while already authenticated with a team, close it immediately
            if (isAuthenticated && user?.teamId) {
                onClose()
                return
            }
            setPhase(isAuthenticated ? 'create' : 'login')
            setEmail('')
            setPassword('')
            setName('')
            setTeamName('')
            setInviteCode('')
            setOtpCode('')
            setError('')
            setSuccessMsg('')
        }
    }, [isOpen, isAuthenticated, user, onClose])

    if (!isOpen) return null

    const inputClass = `w-full px-5 py-4 rounded-2xl text-base text-white placeholder-neutral-500
        bg-neutral-950 border border-neutral-700
        focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 focus:outline-none
        transition-all duration-300`

    // ── Auth handlers ───────────────────────────────────────
    async function handleLogin(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(email, password)
        } catch (err) {
            if (err.data?.requiresVerification) {
                setPhase('verify')
                setSuccessMsg('Please verify your email to log in.')
            } else {
                setError(err.message || 'Login failed. Check your credentials.')
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleRegister(e) {
        e.preventDefault()
        setError('')
        if (!name.trim()) { setError('Name is required.'); return }
        if (!email.trim()) { setError('Email is required.'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
        setLoading(true)
        try {
            await register(email, password, name)
            setPhase('verify')
            setSuccessMsg('Account created! Please check your email for the verification code.')
        } catch (err) {
            setError(err.message || 'Registration failed.')
        } finally {
            setLoading(false)
        }
    }

    async function handleVerify(e) {
        e.preventDefault()
        setError('')
        if (otpCode.length !== 6) { setError('Please enter a 6-digit code.'); return }
        setLoading(true)
        try {
            await verifyEmail(email, otpCode)
            setSuccessMsg('Email verified successfully! Welcome to ICARUS.')
        } catch (err) {
            setError(err.message || 'Verification failed. Invalid code.')
        } finally {
            setLoading(false)
        }
    }

    async function handleForgot(e) {
        e.preventDefault()
        setError('')
        if (!email.trim()) { setError('Email is required.'); return }
        setLoading(true)
        try {
            const data = await api.post('/auth/forgot-password', { email })
            setSuccessMsg(data.message || 'Check your email for reset link.')
            setTimeout(() => setPhase('login'), 3000)
        } catch (err) {
            setError(err.message || 'Failed to send reset link.')
        } finally {
            setLoading(false)
        }
    }

    // ── Team handlers ───────────────────────────────────────
    async function handleCreateTeam(e) {
        e.preventDefault()
        setError('')
        if (!teamName.trim()) { setError('Team name is required.'); return }
        setLoading(true)
        try {
            const data = await api.post('/teams/create', { name: teamName })
            if (data.user) updateUser(data.user) // Update context with new team Id
            setSuccessMsg(`Team created! Invite code: ${data.team.inviteCode}`)
            setTeamName('')
        } catch (err) {
            setError(err.message || 'Failed to create team.')
        } finally {
            setLoading(false)
        }
    }

    async function handleJoinTeam(e) {
        e.preventDefault()
        setError('')
        if (!inviteCode.trim()) { setError('Invite code is required.'); return }
        setLoading(true)
        try {
            const data = await api.post('/teams/join', { inviteCode, userId: user.id })
            if (data.user) updateUser(data.user)
            setSuccessMsg(data.message || 'Successfully joined the team!')
            setInviteCode('')
        } catch (err) {
            setError(err.message || 'Failed to join team.')
        } finally {
            setLoading(false)
        }
    }

    // ── Determine which tabs to show ────────────────────────
    const isAuthPhase = phase === 'login' || phase === 'register' || phase === 'verify' || phase === 'forgot'

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] px-4 py-4"
            onClick={onClose}
        >
            <div
                className="bg-neutral-900 border border-neutral-800 rounded-[2rem] w-full max-w-xl p-8 md:p-14 relative
                           shadow-2xl shadow-black/60 overflow-y-auto max-h-[90dvh]"
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
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-white mb-2 text-center">
                    {isAuthPhase ? t('auth.accessIcarus') : user?.teamId ? t('auth.assignmentComplete') : t('auth.joinCompetition')}
                </h2>
                <p className="text-sm text-neutral-500 text-center mb-10 tracking-wider uppercase">
                    {isAuthPhase ? t('auth.authenticate') : `${t('auth.welcomeBack')}, ${user?.name}`}
                </p>

                {/* Mode Toggle */}
                {!(!isAuthPhase && user?.teamId) && phase !== 'verify' && phase !== 'forgot' && (
                    <div className="flex rounded-xl bg-neutral-950 border border-neutral-800 p-1 mb-6">
                    {isAuthPhase ? (
                        <>
                            <button
                                onClick={() => { setPhase('login'); setError(''); setSuccessMsg(''); }}
                                className={`flex-1 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer
                                    ${phase === 'login'
                                        ? 'bg-yellow-600/15 text-yellow-600 border border-yellow-600/30'
                                        : 'text-neutral-500 hover:text-neutral-300 border border-transparent'}`}
                            >
                                {t('auth.signIn')}
                            </button>
                            <button
                                onClick={() => { setPhase('register'); setError(''); setSuccessMsg(''); }}
                                className={`flex-1 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer
                                    ${phase === 'register'
                                        ? 'bg-yellow-600/15 text-yellow-600 border border-yellow-600/30'
                                        : 'text-neutral-500 hover:text-neutral-300 border border-transparent'}`}
                            >
                                {t('auth.register')}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => { setPhase('create'); setError(''); setSuccessMsg(''); }}
                                className={`flex-1 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer
                                    ${phase === 'create'
                                        ? 'bg-yellow-600/15 text-yellow-600 border border-yellow-600/30'
                                        : 'text-neutral-500 hover:text-neutral-300 border border-transparent'}`}
                            >
                                {t('auth.createTeam')}
                            </button>
                            <button
                                onClick={() => { setPhase('join'); setError(''); setSuccessMsg(''); }}
                                className={`flex-1 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer
                                    ${phase === 'join'
                                        ? 'bg-yellow-600/15 text-yellow-600 border border-yellow-600/30'
                                        : 'text-neutral-500 hover:text-neutral-300 border border-transparent'}`}
                            >
                                {t('auth.joinWithCode')}
                            </button>
                        </>
                    )}
                    </div>
                )}

                {/* ── Error / Success messages ── */}
                {error && (
                    <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold tracking-wide">
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide">
                        {successMsg}
                    </div>
                )}

                    <>
                        {/* ═════════ PHASE: VERIFY EMAIL ═════════ */}
                        {phase === 'verify' && (
                            <form onSubmit={handleVerify} className="space-y-4">
                                <div className="text-center mb-6">
                                    <Shield size={32} className="text-yellow-600 mx-auto mb-3" />
                                    <p className="text-sm text-neutral-400">
                                        {t('auth.codeSentTo')} <strong className="text-white">{email}</strong>.
                                    </p>
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="• • • • • •"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        className={`${inputClass} text-center text-3xl tracking-[0.5em] font-mono py-4`}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-6 w-full py-4 rounded-2xl text-base font-bold uppercase tracking-[0.15em] cursor-pointer
                                               bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                                               shadow-lg shadow-yellow-600/20
                                               transition-all duration-300 ease-out
                                               hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-600/30
                                               active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {loading ? t('auth.verifying') : t('auth.verifyAccess')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setPhase('login'); setError(''); setSuccessMsg(''); }}
                                    className="mt-4 w-full py-3 text-sm font-bold uppercase tracking-wider text-neutral-500 hover:text-white transition-colors cursor-pointer"
                                >
                                    {t('auth.backToSignIn')}
                                </button>
                            </form>
                        )}

                        {/* ═════════ PHASE: LOGIN ═════════ */}
                        {phase === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('auth.email')}</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={inputClass}
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('auth.password')}</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={inputClass}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full py-4 rounded-2xl text-base font-bold uppercase tracking-[0.15em] cursor-pointer
                                       bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                                       shadow-lg shadow-yellow-600/20
                                       transition-all duration-300 ease-out
                                       hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-600/30
                                       active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? t('auth.signingIn') : t('auth.signIn')}
                        </button>
                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={() => { setPhase('forgot'); setError(''); setSuccessMsg(''); }}
                                className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-white transition-colors cursor-pointer"
                            >
                                {t('auth.forgotPassword')}
                            </button>
                        </div>
                    </form>
                )}

                {/* ═════════ PHASE: FORGOT PASSWORD ═════════ */}
                {phase === 'forgot' && (
                    <form onSubmit={handleForgot} className="space-y-4">
                        <div className="text-center mb-6">
                            <Shield size={32} className="text-yellow-600 mx-auto mb-3" />
                            <p className="text-sm text-neutral-400">
                                {t('auth.forgotPasswordHint')}
                            </p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('auth.email')}</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={inputClass}
                                required
                                autoComplete="email"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full py-4 rounded-2xl text-base font-bold uppercase tracking-[0.15em] cursor-pointer
                                       bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                                       shadow-lg shadow-yellow-600/20
                                       transition-all duration-300 ease-out
                                       hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-600/30
                                       active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? t('auth.sendingLink') : t('auth.sendResetLink')}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setPhase('login'); setError(''); setSuccessMsg(''); }}
                            className="mt-4 w-full py-3 text-sm font-bold uppercase tracking-wider text-neutral-500 hover:text-white transition-colors cursor-pointer"
                        >
                            {t('auth.backToSignIn')}
                        </button>
                    </form>
                )}

                {/* ═════════ PHASE: REGISTER ═════════ */}
                {phase === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('auth.fullName')}</label>
                            <input
                                type="text"
                                placeholder="Alex Novak"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className={inputClass}
                                required
                                autoComplete="name"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('auth.email')}</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={inputClass}
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('auth.password')}</label>
                            <input
                                type="password"
                                placeholder={t('auth.minPassword')}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={inputClass}
                                required
                                minLength={6}
                                autoComplete="new-password"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full py-4 rounded-2xl text-base font-bold uppercase tracking-[0.15em] cursor-pointer
                                       bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                                       shadow-lg shadow-yellow-600/20
                                       transition-all duration-300 ease-out
                                       hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-600/30
                                       active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
                        </button>
                    </form>
                )}

                {/* ═════════ PHASE: CREATE TEAM ═════════ */}
                {phase === 'create' && (
                    <form onSubmit={handleCreateTeam} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('auth.teamName')}</label>
                            <input
                                type="text"
                                placeholder={t('auth.enterTeamName')}
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full py-4 rounded-2xl text-base font-bold uppercase tracking-[0.15em] cursor-pointer
                                       bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                                       shadow-lg shadow-yellow-600/20
                                       transition-all duration-300 ease-out
                                       hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-600/30
                                       active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? t('auth.creating') : t('auth.createTeam')}
                        </button>
                    </form>
                )}

                {/* ═════════ PHASE: JOIN TEAM ═════════ */}
                {phase === 'join' && (
                    <form onSubmit={handleJoinTeam} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('auth.inviteCode')}</label>
                            <input
                                type="text"
                                placeholder={t('auth.enter6digitCode')}
                                maxLength={6}
                                value={inviteCode}
                                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                className={`${inputClass} text-center text-lg tracking-[0.5em] font-mono`}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full py-4 rounded-2xl text-base font-bold uppercase tracking-[0.15em] cursor-pointer
                                       bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                                       shadow-lg shadow-yellow-600/20
                                       transition-all duration-300 ease-out
                                       hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-600/30
                                       active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? t('auth.joining') : t('auth.joinTeam')}
                        </button>
                    </form>
                )}
                </>

                <p className="text-[10px] text-neutral-600 text-center mt-4 tracking-wide">
                    {t('auth.protocol')}
                </p>
            </div>
        </div>
    )
}


/* ── Header ──────────────────────────────────────────────── */

function Header({ onSignInClick, onJoinClick, isRegistered, activeTab, setActiveTab, onNavigatePage }) {
    const { user, isAuthenticated } = useAuth()
    const { t } = useLang()
    const currentUser = isAuthenticated ? user : guestData
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const mobileMenuRef = useRef(null)

    useEffect(() => {
        function handleClick(e) {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
                setIsMobileMenuOpen(false)
            }
        }
        if (isMobileMenuOpen) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [isMobileMenuOpen])

    return (
        <header className="sticky top-0 z-50 backdrop-blur-2xl bg-neutral-950/80 border-b border-neutral-800/50">
            <div className="max-w-7xl mx-auto w-full px-4 md:px-6">
                <div className="flex items-center justify-between h-16 md:h-24">
                    {/* Logo + Motto */}
                    <div className="flex items-center gap-4">
                        <div 
                            className="flex items-center gap-3 group cursor-pointer"
                            onClick={() => onNavigatePage('home')}
                        >
                            <img
                                src="/logo_white.png"
                                alt="ICARUS"
                                className="h-8 md:h-11 w-auto transition-transform duration-500 group-hover:scale-110"
                            />
                            <span className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-white">
                                ICARUS
                            </span>
                        </div>
                        <div className="hidden md:block h-8 w-px bg-neutral-700" />
                        <span className="hidden md:block text-xs md:text-sm italic text-neutral-500 tracking-wide">
                            {t('header.motto')}
                        </span>
                    </div>

                    {/* Right side — tighter gaps on mobile */}
                    <div className="flex items-center gap-2 md:gap-5">
                        {isAuthenticated ? (
                            <>
                                {/* JOIN CTA */}
                                <button
                                    onClick={onJoinClick}
                                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider cursor-pointer
                                               bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                                               shadow-md shadow-yellow-600/15
                                               transition-all duration-300
                                               hover:scale-105 hover:shadow-lg hover:shadow-yellow-600/25
                                               active:scale-100"
                                >
                                    {isRegistered ? <CheckCircle2 size={16} /> : <Rocket size={16} />}
                                    {isRegistered ? t('header.registered') : t('header.joinCompetition')}
                                </button>
                                {/* Streak — smaller on mobile */}
                                <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-full bg-yellow-600/10 border border-yellow-600/25">
                                    <Flame size={16} className="text-yellow-600 animate-gold-pulse sm:w-[20px] sm:h-[20px]" />
                                    <span className="text-xs sm:text-base font-bold text-yellow-600 tracking-wide">
                                        {currentUser.currentStreak ?? 0}d
                                    </span>
                                </div>
                                {/* Score */}
                                <div className="hidden sm:flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-neutral-800/60 border border-neutral-700/50">
                                    <Star size={18} className="text-yellow-600" />
                                    <span className="text-base font-semibold text-white tabular-nums">
                                        {(currentUser.xp ?? 0).toLocaleString()}
                                    </span>
                                </div>
                                {/* Avatar + Dropdown */}
                                <div className="relative ml-1">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="relative cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-yellow-600/15 overflow-hidden">
                                            {currentUser?.avatarUrl ? (
                                                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={20} className="text-black md:w-[22px] md:h-[22px]" />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-neutral-950" />
                                    </button>
                                    <ProfileDropdown 
                                        isOpen={isProfileOpen} 
                                        onClose={() => setIsProfileOpen(false)} 
                                        onNavigate={onNavigatePage}
                                    />
                                </div>
                            </>
                        ) : (
                            /* Guest: show Sign In button */
                            <button
                                onClick={onSignInClick}
                                className="flex items-center gap-2 px-6 py-2.5 md:px-8 md:py-3 rounded-2xl text-sm md:text-base font-bold uppercase tracking-wider cursor-pointer
                                           border-2 border-neutral-700 text-neutral-300
                                           transition-all duration-300
                                           hover:border-yellow-600/50 hover:text-white hover:bg-neutral-800/60"
                            >
                                <User size={18} />
                                {t('header.signIn')}
                            </button>
                        )}

                        {/* ── Hamburger Menu (mobile only) ── */}
                        <div className="relative md:hidden" ref={mobileMenuRef}>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 rounded-lg transition-colors duration-200 hover:bg-neutral-800 cursor-pointer"
                                aria-label="Open navigation"
                            >
                                {isMobileMenuOpen
                                    ? <X size={22} className="text-white" />
                                    : <Menu size={22} className="text-white" />
                                }
                            </button>

                            {/* Mobile slide-down menu */}
                            {isMobileMenuOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-56 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl shadow-black/60 z-[60] overflow-hidden"
                                    style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
                                >
                                    {TABS.map(tab => {
                                        const Icon = tab.icon
                                        const isActive = activeTab === tab.id
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => {
                                                    onNavigatePage('home')
                                                    setActiveTab(tab.id)
                                                    setIsMobileMenuOpen(false)
                                                    if (tab.id === 'news') {
                                                        window.history.pushState({}, '', '/news')
                                                    } else if (window.location.pathname.startsWith('/news')) {
                                                        window.history.pushState({}, '', '/')
                                                    }
                                                }}
                                                className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold uppercase tracking-[0.15em]
                                                           transition-all duration-200 cursor-pointer
                                                           ${isActive
                                                        ? 'bg-yellow-600/10 text-yellow-600 border-l-2 border-yellow-600'
                                                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-white border-l-2 border-transparent'
                                                    }`}
                                            >
                                                <Icon size={15} />
                                                {t(tab.labelKey)}
                                            </button>
                                        )
                                    })}

                                    {/* Join CTA in mobile menu */}
                                    {isAuthenticated && (
                                    <div className="border-t border-neutral-800 p-3">
                                        <button
                                            onClick={() => {
                                                onJoinClick()
                                                setIsMobileMenuOpen(false)
                                            }}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer
                                                       bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                                                       transition-all duration-300 hover:scale-[1.02]"
                                        >
                                            {isRegistered ? <CheckCircle2 size={14} /> : <Rocket size={14} />}
                                            {isRegistered ? t('header.registered') : t('header.joinCompetition')}
                                        </button>
                                    </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}


/* ── Tab Navigation (hidden on mobile — accessible via hamburger) ── */

function TabNav({ activeTab, setActiveTab, onNavigatePage }) {
    const { t } = useLang()
    return (
        <nav className="hidden md:block border-b border-neutral-800/50 bg-neutral-950/50 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto w-full px-6">
                <div className="flex items-center justify-center gap-1">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    onNavigatePage('home')
                                    setActiveTab(tab.id)
                                    if (tab.id === 'news') {
                                        window.history.pushState({}, '', '/news')
                                    } else if (window.location.pathname.startsWith('/news')) {
                                        window.history.pushState({}, '', '/')
                                    }
                                }}
                                className={`relative flex items-center gap-3 px-8 py-5 text-sm md:text-base font-bold uppercase tracking-[0.15em]
                           transition-all duration-300 ease-out cursor-pointer
                           ${isActive ? 'text-yellow-600' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                <Icon size={18} />
                                {t(tab.labelKey)}
                                {isActive && (
                                    <div className="absolute bottom-0 left-4 right-4 h-[3px] rounded-full bg-yellow-600" />
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

function JourneyTab({ onPostClick }) {
    const { t } = useLang()
    return (
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 sm:py-16 md:py-24">
            {/* Cinematic Title — mobile-first font sizes */}
            <div className="relative text-center mb-16 sm:mb-24 lg:mb-32 max-w-6xl mx-auto">
                <div className="flex justify-center items-center gap-4 lg:gap-6 text-[10px] sm:text-xs lg:text-sm font-bold uppercase tracking-[0.4em] text-yellow-600 mb-8 lg:mb-10">
                    <div className="w-8 sm:w-16 lg:w-24 h-[1px] bg-yellow-600/50"></div>
                    {t('journey.welcomeTo')}
                    <div className="w-8 sm:w-16 lg:w-24 h-[1px] bg-yellow-600/50"></div>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg flex flex-col items-center justify-center gap-2 sm:gap-4 lg:gap-6">
                    <span className="text-center">{t('journey.subtitle')}</span>
                </h1>
                <div className="w-full max-w-sm lg:max-w-lg mx-auto h-[1px] bg-gradient-to-r from-transparent via-neutral-800 to-transparent mb-8 lg:mb-10"></div>
                <p className="text-sm lg:text-lg text-neutral-400 max-w-md lg:max-w-2xl mx-auto leading-relaxed font-medium tracking-wide px-4">
                    {t('journey.navigate')}
                </p>
                

            </div>

            {/* Latest News block replaces the old video block */}
            <LatestNewsBlock onPostClick={onPostClick} />

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
    const { t } = useLang()
    const { isAuthenticated, user } = useAuth()
    const [showForm, setShowForm] = useState(false)
    const [phone, setPhone] = useState('')
    const [interest, setInterest] = useState('')
    const [loading, setLoading] = useState(false)
    const [registrationStatus, setRegistrationStatus] = useState(null)
    const [error, setError] = useState('')
    const [statusLoading, setStatusLoading] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    const interestOptions = [
        { id: 'aerospace', label: 'Aerospace Engineering', icon: Rocket },
        { id: 'physics', label: 'Applied Physics', icon: Atom },
        { id: 'computer-science', label: 'Computer Science', icon: Terminal },
        { id: 'chemistry', label: 'Chemistry & Materials Science', icon: Beaker },
        { id: 'biotechnology', label: 'Biotechnology & Genetics', icon: Microscope },
    ]

    useEffect(() => {
        let isMounted = true
        
        const fetchClubStatus = async () => {
            if (!isAuthenticated) {
                setRegistrationStatus(null)
                setIsInitialized(true)
                return
            }
            
            setStatusLoading(true)
            try {
                const data = await api.get('/club/status')
                if (isMounted) {
                    setRegistrationStatus(data)
                }
            } catch (err) {
                console.error('Failed to fetch club status:', err)
                if (isMounted) {
                    setRegistrationStatus({ isRegistered: false, registration: null })
                }
            } finally {
                if (isMounted) {
                    setStatusLoading(false)
                    setIsInitialized(true)
                }
            }
        }

        fetchClubStatus()

        return () => {
            isMounted = false
        }
    }, [isAuthenticated])

    async function handleRegister(e) {
        e.preventDefault()
        setError('')
        if (!phone.trim()) { setError('Phone number is required.'); return }
        if (!interest.trim()) { setError('Area of interest is required.'); return }
        setLoading(true)
        try {
            const data = await api.post('/club/register', { phone, interest })
            setRegistrationStatus({ isRegistered: true, registration: data.registration })
            setShowForm(false)
            setPhone('')
            setInterest('')
        } catch (err) {
            console.error('Club registration error:', err)
            if (err.response?.data?.error) {
                setError(err.response.data.error)
            } else if (err.message) {
                setError(err.message)
            } else {
                setError('Registration failed. Please try again later.')
            }
        } finally {
            setLoading(false)
        }
    }

    const inputClass = `w-full px-5 py-4 rounded-2xl text-base text-white placeholder-neutral-500
        bg-neutral-950 border border-neutral-700
        focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 focus:outline-none
        transition-all duration-300`

    return (
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-20 lg:py-32 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Glowing Icon Container */}
            <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-yellow-600/20 rounded-full blur-2xl group-hover:bg-yellow-600/30 transition-colors duration-700" />
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-neutral-900 border border-neutral-700/50 flex items-center justify-center shadow-2xl shadow-black/50 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-transparent opacity-50" />
                    <Rocket size={48} className="text-yellow-600/50 animate-pulse" />
                </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg flex flex-col sm:flex-row items-center justify-center gap-3 break-words w-full">
                {t('training.modules')}
            </h1>

            {/* Status Badge */}
            <div className="px-6 py-2 rounded-full bg-yellow-600/10 border border-yellow-600/20 inline-flex items-center gap-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                <span className="text-yellow-600 text-xs md:text-sm font-bold uppercase tracking-widest">{t('training.comingSoon')}</span>
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-8">
                {t('training.description')}
            </p>

            {/* Club Registration Section */}
            {isAuthenticated && (
                <div className="w-full max-w-lg mt-12">
                    {/* Show loading state while fetching status */}
                    {statusLoading && !isInitialized && (
                        <div className="flex items-center justify-center gap-3 py-8">
                            <Loader2 size={20} className="animate-spin text-neutral-500" />
                            <span className="text-sm text-neutral-500">Loading...</span>
                        </div>
                    )}

                    {/* Show content when loaded or cached */}
                    {isInitialized && (
                        <>
                            {!registrationStatus?.isRegistered && !showForm && (
                                <div className="group relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-green-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="relative w-full py-5 rounded-2xl text-base font-bold uppercase tracking-[0.15em] cursor-pointer
                                                   bg-gradient-to-r from-yellow-700 via-yellow-600 to-green-600 text-black
                                                   shadow-lg shadow-yellow-600/20
                                                   transition-all duration-300 ease-out
                                                   hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-600/30
                                                   active:scale-100 flex items-center justify-center gap-3"
                                    >
                                        <Users size={20} />
                                        {t('club.join')}
                                    </button>
                                </div>
                            )}

                    {showForm && (
                        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl shadow-black/50">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-600/20 to-green-600/20 border border-yellow-600/30 flex items-center justify-center">
                                    <Users size={24} className="text-yellow-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white uppercase tracking-widest">
                                        {t('club.joinTitle')}
                                    </h3>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        {t('club.joinCommunity')}
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold tracking-wide flex items-center gap-2">
                                    <AlertTriangle size={16} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleRegister} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2 flex items-center gap-2">
                                        <Phone size={12} className="text-yellow-600" />
                                        {t('club.phone')}
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+7 777 123 4567"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3 flex items-center gap-2">
                                        <Target size={12} className="text-yellow-600" />
                                        {t('club.interest')}
                                    </label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {interestOptions.map((option) => {
                                            const Icon = option.icon
                                            const isSelected = interest === option.id
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => setInterest(option.id)}
                                                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer
                                                        ${isSelected
                                                            ? 'bg-yellow-600/20 border-yellow-600/50 text-yellow-500'
                                                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-850'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-yellow-600/30' : 'bg-neutral-800'}`}>
                                                        <Icon size={20} className={isSelected ? 'text-yellow-500' : 'text-neutral-500'} />
                                                    </div>
                                                    <span className="font-medium text-sm">{option.label}</span>
                                                    {isSelected && <CheckCircle2 size={18} className="ml-auto text-yellow-500" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowForm(false); setError(''); }}
                                        className="flex-1 py-4 rounded-xl text-sm font-bold uppercase tracking-widest
                                                   bg-neutral-800 text-white hover:bg-neutral-700 transition-colors cursor-pointer"
                                    >
                                        {t('generic.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !interest}
                                        className="flex-1 py-4 rounded-xl text-sm font-bold uppercase tracking-widest
                                                   bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                                                   shadow-lg shadow-yellow-600/20
                                                   transition-all duration-300 ease-out
                                                   hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-600/30
                                                   active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                        {loading ? t('club.submitting') : t('club.submit')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {registrationStatus?.isRegistered && (
                        <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-8 shadow-2xl shadow-emerald-500/10">
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <CheckCircle2 size={32} className="text-emerald-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-bold text-emerald-400 uppercase tracking-widest">
                                        {t('club.registered')}
                                    </h3>
                                    <p className="text-sm text-neutral-400 mt-1">
                                        {t('club.welcome')}
                                    </p>
                                </div>
                            </div>

                            <p className="text-base text-neutral-300 mb-6 leading-relaxed text-center">
                                {t('club.successMessage')}
                            </p>

                            <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-600/20 border border-green-600/30 flex items-center justify-center">
                                        <MessageCircle size={20} className="text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                                            WhatsApp Group
                                        </p>
                                        <p className="text-sm text-neutral-400">
                                            {t('club.joinCommunity')}
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href="https://chat.whatsapp.com/CAuuHtcTiD50bCtA013yeI?s=cl&p=i&mlu=4&ilr=4"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 w-full px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest
                                              bg-gradient-to-r from-green-600 to-green-500 text-white
                                              shadow-lg shadow-green-600/20
                                              transition-all duration-300 ease-out
                                              hover:scale-[1.02] hover:shadow-xl hover:shadow-green-600/30
                                              active:scale-100 cursor-pointer justify-center"
                                >
                                    <MessageCircle size={20} />
                                    {t('club.whatsappLink')}
                                </a>
                            </div>
                        </div>
                    )}
                        </>
                    )}
                </div>
            )}

            {!isAuthenticated && (
                <div className="mt-8 text-sm text-neutral-500">
                    {t('club.signInToJoin')}
                </div>
            )}
        </div>
    )
}


/* ── Tab 3: GLOBAL RANKING (Podium + Card List) ─────────── */

/* Desktop-only: tall vertical podium column */
function PodiumColumn({ entry, height, theme }) {
    const themes = {
        gold: {
            bg: 'bg-gradient-to-t from-yellow-700 via-yellow-600 to-yellow-400',
            text: 'text-black',
            shadow: 'shadow-[0_0_50px_rgba(202,138,4,0.35)]',
            label: '1ST',
            nameSize: 'text-lg',
        },
        silver: {
            bg: 'bg-gradient-to-t from-neutral-500 via-neutral-400 to-neutral-300',
            text: 'text-black',
            shadow: 'shadow-[0_0_30px_rgba(163,163,163,0.25)]',
            label: '2ND',
            nameSize: 'text-base',
        },
        bronze: {
            bg: 'bg-gradient-to-t from-orange-900 via-orange-700 to-orange-600',
            text: 'text-white',
            shadow: 'shadow-[0_0_30px_rgba(194,65,12,0.25)]',
            label: '3RD',
            nameSize: 'text-base',
        },
    }
    const t = themes[theme]

    return (
        <div className="flex flex-col items-center w-full">
            {theme === 'gold' && (
                <div className="mb-3 animate-float">
                    <Crown size={32} className="text-yellow-400 drop-shadow-lg" />
                </div>
            )}
            <div
                className={`w-full rounded-t-2xl ${t.bg} ${t.text} ${t.shadow} p-6 text-center
                           transition-all duration-500 hover:scale-[1.03]`}
                style={{ minHeight: height }}
            >
                <p className={`text-3xl font-black tracking-wider mb-2 ${theme === 'bronze' ? 'opacity-90' : 'opacity-80'}`}>
                    {t.label}
                </p>
                <h3 className={`${t.nameSize} font-black uppercase tracking-widest leading-tight mb-3`}>
                    {entry.team}
                </h3>
                <p className={`text-2xl font-black tabular-nums mb-3 ${theme === 'bronze' ? '' : 'opacity-90'}`}>
                    {entry.score.toLocaleString()}
                </p>
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

/* Mobile-only: compact gradient bar for top-3 entries */
function PodiumBar({ entry, theme }) {
    const themes = {
        gold: {
            bg: 'bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-500',
            text: 'text-black',
            shadow: 'shadow-lg shadow-yellow-600/25',
            label: '1ST',
            icon: <Crown size={18} className="shrink-0" />,
        },
        silver: {
            bg: 'bg-gradient-to-r from-neutral-500 via-neutral-400 to-neutral-350',
            text: 'text-black',
            shadow: 'shadow-lg shadow-neutral-400/20',
            label: '2ND',
            icon: <Medal size={18} className="shrink-0" />,
        },
        bronze: {
            bg: 'bg-gradient-to-r from-orange-800 via-orange-700 to-orange-600',
            text: 'text-white',
            shadow: 'shadow-lg shadow-orange-700/20',
            label: '3RD',
            icon: <Award size={18} className="shrink-0" />,
        },
    }
    const t = themes[theme]

    return (
        <div
            className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl
                        ${t.bg} ${t.text} ${t.shadow}
                        transition-all duration-300 hover:scale-[1.02]`}
        >
            {/* Left: rank + icon + team name */}
            <div className="flex items-center gap-3 min-w-0">
                {t.icon}
                <span className="text-xs font-black uppercase tracking-wider opacity-70 shrink-0">
                    {t.label}
                </span>
                <span className="text-sm font-bold uppercase tracking-wide truncate">
                    {entry.team}
                </span>
            </div>
            {/* Right: score + streak */}
            <div className="flex items-center gap-3 shrink-0 ml-3">
                {entry.streak > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold opacity-70">
                        <Flame size={13} />
                        {entry.streak}d
                    </span>
                )}
                <span className="text-base font-black tabular-nums">
                    {entry.score.toLocaleString()}
                </span>
            </div>
        </div>
    )
}

function TeamDetailsModal({ teamId, onClose }) {
    const { t } = useLang()
    const [team, setTeam] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function fetchTeam() {
            try {
                const res = await api.get(`/teams/${teamId}`)
                setTeam(res.team)
            } catch (err) {
                setError(err.message || t('team.loadFailed'))
            } finally {
                setLoading(false)
            }
        }
        if (teamId) fetchTeam()
    }, [teamId])

    if (!document.body) return null;

    return createPortal(
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
            onClick={onClose}
        >
            <div 
                className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl shadow-black/80"
                onClick={e => e.stopPropagation()}
                style={{ animation: 'fadeSlideIn 0.25s ease-out' }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                    <X size={20} />
                </button>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <Loader2 size={32} className="text-yellow-600 animate-spin mb-4" />
                    </div>
                ) : error ? (
                    <div className="py-10 text-center text-red-400 font-semibold">{error}</div>
                ) : team ? (
                    <>
                        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-white mb-2 text-center mt-2">
                            {team.name}
                        </h2>
                        <div className="flex justify-center items-center gap-4 mb-8">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-600/10 border border-yellow-600/25">
                                <Star size={14} className="text-yellow-600" />
                                <span className="text-sm font-bold text-yellow-600 tabular-nums">{team.totalScore.toLocaleString()} XP</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3 px-1">
                                {t('team.roster')} ({team.members.length}/6)
                            </p>
                            {team.members.map(member => {
                                const isCaptain = member.id === team.captainId
                                return (
                                    <div 
                                        key={member.id}
                                        className="flex items-center justify-between bg-neutral-950/50 border border-neutral-800/80 rounded-xl px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-700">
                                                {member.avatarUrl ? (
                                                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={16} className="text-neutral-500" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white tracking-wide">{member.name}</span>
                                                    {isCaptain && <Crown size={14} className="text-yellow-500" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-right">
                                            {member.currentStreak > 0 && (
                                                <div className="hidden sm:flex items-center gap-1 opacity-80">
                                                    <Flame size={14} className="text-orange-400" />
                                                    <span className="text-xs font-bold text-orange-400">{member.currentStreak}d</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <Star size={13} className="text-yellow-600/70" />
                                                <span className="text-sm font-semibold text-neutral-300 tabular-nums">
                                                    {member.xp.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                ) : null}
            </div>
        </div>,
        document.body
    )
}

function RankingTab({ onJoinClick, isRegistered }) {
    const { isAuthenticated } = useAuth()
    const { t } = useLang()

    return (
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-20 lg:py-32 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Glowing Icon Container */}
            <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-yellow-600/20 rounded-full blur-2xl group-hover:bg-yellow-600/30 transition-colors duration-700" />
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-neutral-900 border border-neutral-700/50 flex items-center justify-center shadow-2xl shadow-black/50 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-transparent opacity-50" />
                    <Activity size={48} className="text-yellow-600/50 animate-pulse" />
                </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-lg flex flex-col sm:flex-row items-center justify-center gap-3 break-words w-full">
                {t('ranking.system')}
            </h1>

            {/* Status Badge */}
            <div className="px-6 py-2 rounded-full bg-yellow-600/10 border border-yellow-600/20 inline-flex items-center gap-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                <span className="text-yellow-600 text-xs md:text-sm font-bold uppercase tracking-widest">{t('training.comingSoon')}</span>
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-14">
                {t('ranking.description')}
            </p>
        </div>
    )
}

function CompetitionJoinModal({ isOpen, onClose, onRegistered, onNavigateToTraining }) {
    const { user } = useAuth()
    const { t } = useLang()
    const [phase, setPhase] = useState('loading') // 'loading' | 'no_competition' | 'no_team' | 'not_captain' | 'ready' | 'success' | 'error'
    const [competition, setCompetition] = useState(null)
    const [registering, setRegistering] = useState(false)
    const [errMsg, setErrMsg] = useState('')

    useEffect(() => {
        if (!isOpen) return
        setPhase('loading')
        setErrMsg('')
        setCompetition(null)

        async function check() {
            try {
                const data = await api.get('/competitions/active')
                if (!data.competition) { setPhase('no_competition'); return }
                setCompetition(data.competition)

                if (data.competition.isIndividual) {
                    const isClosed = new Date() >= new Date(data.competition.regEnd)
                    if (isClosed) {
                        setPhase('closed')
                        return
                    }
                    setPhase('ready')
                    return
                }

                // Team requirements
                if (!user?.teamId) { setPhase('no_team'); return }
                if (user.id !== user.team?.captainId) { setPhase('not_captain'); return }

                const isClosed = new Date() >= new Date(data.competition.regEnd)
                if (isClosed) {
                    setPhase('closed')
                    return
                }

                setPhase('ready')
            } catch {
                setPhase('no_competition')
            }
        }
        check()
    }, [isOpen, user])

    async function handleRegister() {
        setRegistering(true)
        try {
            await api.post('/competition/register')
            setPhase('success')
            onRegistered()
        } catch (err) {
            setErrMsg(err.message || 'Registration failed.')
            setPhase('error')
        } finally {
            setRegistering(false)
        }
    }

    if (!isOpen) return null

    // ── content per phase ─────────────────────────────────────────
    function Content() {
        if (phase === 'loading') return (
            <div className="flex flex-col items-center gap-4 py-6">
                <Loader2 size={36} className="text-yellow-600 animate-spin" />
                <p className="text-sm text-neutral-400 uppercase tracking-widest">{t('comp.checkingStatus')}</p>
            </div>
        )

        if (phase === 'no_competition') return (
            <>
                <div className="w-20 h-20 rounded-full bg-neutral-800 border border-neutral-700
                                flex items-center justify-center mx-auto mb-7
                                shadow-[0_0_40px_rgba(0,0,0,0.4)]">
                    <Clock size={36} className="text-neutral-500" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-4">
                    {t('comp.noActive')}
                </h3>
                <p className="text-neutral-400 leading-relaxed mb-8 max-w-xs mx-auto">
                    {t('comp.noActiveDesc')}
                </p>
                <button onClick={onClose}
                    className="px-10 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 transition cursor-pointer mb-3">
                    {t('comp.understood')}
                </button>
                <button onClick={() => { onClose(); onNavigateToTraining(); }}
                    className="px-10 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest
                               bg-yellow-600 border border-yellow-500 text-white
                               hover:bg-yellow-500 transition cursor-pointer">
                    {t('comp.joinClub')}
                </button>
            </>
        )

        if (phase === 'closed') return (
            <>
                <div className="w-20 h-20 rounded-full bg-red-900/20 border border-red-500/30
                                flex items-center justify-center mx-auto mb-7
                                shadow-[0_0_40px_rgba(239,68,68,0.15)]">
                    <X size={36} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-4">
                    {t('comp.regClosed')}
                </h3>
                <p className="text-neutral-400 leading-relaxed mb-8 max-w-xs mx-auto">
                    {t('comp.regClosedDesc').replace('{competition}', competition?.title || '')}
                </p>
                <button onClick={onClose}
                    className="px-10 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 transition cursor-pointer">
                    {t('comp.close')}
                </button>
            </>
        )

        if (phase === 'no_team') return (
            <>
                <div className="w-20 h-20 rounded-full bg-neutral-800 border border-neutral-700
                                flex items-center justify-center mx-auto mb-7">
                    <Users size={36} className="text-neutral-500" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-4">
                    {t('comp.joinTeamFirst')}
                </h3>
                <p className="text-neutral-400 leading-relaxed mb-8 max-w-xs mx-auto">
                    {t('comp.joinTeamFirstDesc')}
                </p>
                <button onClick={onClose}
                    className="px-10 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 transition cursor-pointer">
                    {t('comp.gotIt')}
                </button>
            </>
        )

        if (phase === 'not_captain') return (
            <>
                <div className="w-20 h-20 rounded-full bg-yellow-600/10 border border-yellow-600/25
                                flex items-center justify-center mx-auto mb-7
                                shadow-[0_0_30px_rgba(202,138,4,0.1)]">
                    <Crown size={36} className="text-yellow-600" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-4">
                    {t('comp.captainOnly')}
                </h3>
                <p className="text-neutral-400 leading-relaxed mb-3 max-w-sm mx-auto">
                    {t('comp.captainOnlyDesc1')}<span className="text-yellow-500 font-bold">{t('comp.captainOnlyDesc2')}</span>{t('comp.captainOnlyDesc3')}
                </p>
                {competition && (
                    <div className="mb-8 px-5 py-3 rounded-xl bg-neutral-800/60 border border-neutral-700 text-sm text-neutral-300">
                        <p className="font-bold text-white mb-1">{competition.title}</p>
                        <p className="text-xs text-neutral-500">
                            {t('comp.closes')}{new Date(competition.regEnd).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </p>
                    </div>
                )}
                <p className="text-xs text-neutral-600 mb-6">{t('comp.askCaptain')}</p>
                <button onClick={onClose}
                    className="px-10 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 transition cursor-pointer">
                    {t('comp.close')}
                </button>
            </>
        )

        if (phase === 'ready') return (
            <>
                <div className="w-20 h-20 rounded-full bg-yellow-600/10 border border-yellow-600/30
                                flex items-center justify-center mx-auto mb-7
                                shadow-[0_0_40px_rgba(202,138,4,0.15)]">
                    <Trophy size={36} className="text-yellow-600" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-4">
                    {competition?.isIndividual ? t('comp.joinWorkshop') : t('comp.regTeam')}
                </h3>
                {competition && (
                    <div className="mb-6 px-5 py-4 rounded-xl bg-neutral-800/60 border border-yellow-600/15 text-left">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-600/60 mb-1">{competition.isIndividual ? t('comp.activeWorkshop') : t('comp.activeComp')}</p>
                        <p className="font-black text-white text-base uppercase tracking-wide">{competition.title}</p>
                        <p className="text-xs text-neutral-500 mt-2">
                            {t('comp.closes')}{new Date(competition.regEnd).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </p>
                        {competition.description && (
                            <p className="text-xs text-neutral-400 mt-3 leading-relaxed border-t border-neutral-700/60 pt-3 whitespace-pre-wrap">
                                {competition.description}
                            </p>
                        )}
                    </div>
                )}
                <p className="text-neutral-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                    {competition?.isIndividual ? (
                        <>{t('comp.workshopDesc')}</>
                    ) : (
                        <>{t('comp.teamDesc1')}<span className="text-yellow-500 font-bold">{t('comp.captainOnlyDesc2')}</span>{t('comp.teamDesc2')}</>
                    )}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={onClose} disabled={registering}
                        className="flex-1 py-4 rounded-xl text-sm font-bold uppercase tracking-widest
                                   bg-neutral-800 border border-neutral-700 text-white
                                   hover:bg-neutral-700 transition cursor-pointer
                                   disabled:opacity-50 disabled:cursor-not-allowed">
                        {t('comp.cancel')}
                    </button>
                    <button onClick={handleRegister} disabled={registering}
                        className="flex-1 py-4 rounded-xl text-sm font-bold uppercase tracking-widest text-black
                                   bg-gradient-to-r from-yellow-700 to-yellow-500
                                   shadow-lg shadow-yellow-600/20
                                   hover:scale-[1.02] transition cursor-pointer
                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                   flex items-center justify-center gap-2">
                        {registering
                            ? <><Loader2 size={15} className="animate-spin" />{t('comp.registering')}</>
                            : t('comp.confirmReg')}
                    </button>
                </div>
            </>
        )

        if (phase === 'success') return (
            <>
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30
                                flex items-center justify-center mx-auto mb-7
                                shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 size={36} className="text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-4">
                    {competition?.isIndividual ? t('comp.registeredIndiv') : t('comp.registeredTeam')}
                </h3>
                <p className="text-neutral-400 leading-relaxed mb-8 max-w-xs mx-auto">
                    {competition?.isIndividual 
                        ? t('comp.registeredIndivDesc')
                        : t('comp.registeredTeamDesc')}
                </p>
                <button onClick={onClose}
                    className="px-10 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest text-black
                               bg-gradient-to-r from-yellow-700 to-yellow-500
                               shadow-lg shadow-yellow-600/20
                               hover:scale-[1.02] transition cursor-pointer">
                    {t('comp.continue')}
                </button>
            </>
        )

        if (phase === 'error') return (
            <>
                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30
                                flex items-center justify-center mx-auto mb-7">
                    <AlertTriangle size={36} className="text-red-400" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-4">
                    {t('comp.regFailed')}
                </h3>
                <p className="text-red-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">{errMsg}</p>
                <button onClick={onClose}
                    className="px-10 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest
                               bg-neutral-800 border border-neutral-700 text-white
                               hover:bg-neutral-700 transition cursor-pointer">
                    {t('comp.close')}
                </button>
            </>
        )

        return null
    }

    return createPortal(
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[150] px-4"
            onClick={onClose}
        >
            <div
                className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-10 text-center
                           shadow-2xl shadow-black/60 relative"
                onClick={e => e.stopPropagation()}
                style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-600 hover:text-white transition-colors cursor-pointer"
                >
                    <X size={18} />
                </button>
                <Content />
            </div>
        </div>,
        document.body
    )
}

function AlreadyRegisteredModal({ isOpen, onClose }) {
    const { t } = useLang()
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[150] px-4" onClick={onClose}>
            <div 
                className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm md:max-w-md p-10 text-center shadow-2xl shadow-yellow-600/10"
                onClick={e => e.stopPropagation()}
                style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
            >
                <div className="w-20 h-20 rounded-full bg-yellow-600/10 border border-yellow-600/30 text-yellow-600 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(202,138,4,0.15)]">
                    <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white mb-4 leading-snug">
                    {t('modal.alreadyRegistered')}
                </h3>
                <p className="text-sm md:text-base text-neutral-400 mb-8 leading-relaxed max-w-sm mx-auto">
                    {t('modal.alreadyRegisteredDesc')}
                </p>
                <div className="flex justify-center">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-10 py-4 rounded-xl text-sm font-bold uppercase tracking-widest text-black
                                   bg-gradient-to-r from-yellow-700 to-yellow-500 shadow-lg shadow-yellow-600/20
                                   hover:scale-[1.02] transition cursor-pointer"
                    >
                        {t('generic.close')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

/* ── Footer ──────────────────────────────────────────────── */

function Footer() {
    const { t } = useLang()
    return (
        <footer className="mt-auto border-t border-neutral-800/40 py-10 bg-neutral-950/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto w-full px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img src="/logo_white.png" alt="ICARUS" className="h-5 w-auto opacity-70" />
                        <span className="text-sm font-bold uppercase tracking-[0.15em] text-neutral-400">ICARUS</span>
                        <span className="text-neutral-700 mx-1">|</span>
                        <span className="text-xs italic text-neutral-600">{t('footer.motto')}</span>
                    </div>
                    <p className="text-xs text-neutral-600">{t('footer.copyright')}</p>
                </div>
            </div>
        </footer>
    )
}


/* ── Full Pages (Profile, Team, Settings) ────────────────── */

function PageHeader({ title, onBack }) {
    return (
        <div className="mb-8 flex items-center gap-4 border-b border-neutral-800/60 pb-6">
            <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
            >
                <ArrowLeft size={18} />
            </button>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.15em] text-white">
                {title}
            </h1>
        </div>
    )
}

function ActivityHeatmap() {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);

    // Generate dummy data: 52 weeks * 7 days
    // Wrap in useMemo so it doesn't re-randomize on every re-render!
    const grid = useMemo(() => {
        const weeks = 52;
        const daysPerWeek = 7;
        const tempGrid = [];
        for (let w = 0; w < weeks; w++) {
            const week = [];
            for (let d = 0; d < daysPerWeek; d++) {
                let level = 0;
                if (user?.role === 'ADMIN') {
                    // Random chance of activity, higher chance in later weeks
                    const chance = (w / weeks) * 0.4 + 0.05; 
                    if (Math.random() < chance) {
                        level = Math.floor(Math.random() * 4) + 1; // 1 to 4
                    }
                }
                week.push(level);
            }
            tempGrid.push(week);
        }
        return tempGrid;
    }, [user?.role]);

    const getColor = (level) => {
        if (level === 0) return 'bg-neutral-800/40';
        if (level === 1) return 'bg-yellow-900/40';
        if (level === 2) return 'bg-yellow-700/60';
        if (level === 3) return 'bg-yellow-600';
        return 'bg-yellow-500';
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className={isExpanded ? "fixed inset-0 z-[100] bg-neutral-950 flex flex-col items-center justify-center p-4 md:p-12 animate-in fade-in duration-300 overflow-auto" : "relative w-full"}>
            <div className={`relative ${isExpanded ? 'w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center' : 'w-full'}`}>
                
                <div className="flex justify-between items-start mb-4">
                    {isExpanded ? (
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-widest text-white flex items-center gap-3">
                                <Activity className="text-yellow-600" />
                                Activity Heatmap
                            </h2>
                            <p className="text-neutral-500 text-sm mt-1">Detailed view of your learning and mission progress.</p>
                        </div>
                    ) : (
                        <div />
                    )}
                    
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors z-10 ${!isExpanded ? 'absolute -top-10 right-0' : ''}`}
                        title={isExpanded ? "Minimize" : "Full Screen"}
                    >
                        {isExpanded ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>

                <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                    <div className="min-w-[800px]">
                {/* Months Row */}
                <div className="flex text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2 pl-8">
                    {months.map((m) => (
                        <div key={m} className="flex-1 text-left">{m}</div>
                    ))}
                </div>
                
                {/* Grid */}
                <div className="flex gap-1">
                    {/* Days column */}
                    <div className="flex flex-col gap-1 text-[9px] text-neutral-500 font-bold uppercase tracking-widest pr-2 justify-between py-1">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                    </div>
                    
                    {/* Heatmap Squares */}
                    <div className="flex gap-1 flex-1">
                        {grid.map((week, wIndex) => (
                            <div key={wIndex} className="flex flex-col gap-1 flex-1">
                                {week.map((level, dIndex) => (
                                    <div 
                                        key={dIndex} 
                                        className={`w-full aspect-square rounded-[3px] ${getColor(level)} transition-colors duration-300 hover:ring-1 hover:ring-white/30 cursor-pointer`}
                                        title={level > 0 ? `Activity level: ${level}` : 'No activity'}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                    <span>Less</span>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map(l => (
                            <div key={l} className={`w-3 h-3 rounded-[2px] ${getColor(l)}`} />
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
            </div>
        </div>
    )
}

function ProfilePage({ onBack }) {
    const { user } = useAuth()
    
    return (
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader title="Your Profile" onBack={onBack} />
            
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 md:p-10 mb-8 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center shadow-2xl shadow-yellow-600/20 overflow-hidden shrink-0 border-2 border-yellow-600/20">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={50} className="text-black" />
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <h2 className="text-3xl font-bold text-white">{user?.name}</h2>
                            <span className="px-3 py-1 rounded-full bg-yellow-600/10 border border-yellow-600/30 text-yellow-600 text-xs font-bold uppercase tracking-wider">
                                {user?.role || 'Member'}
                            </span>
                        </div>
                        <p className="text-neutral-400 mb-6">{user?.email}</p>
                        
                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto md:mx-0">
                            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
                                <div className="text-2xl font-black text-yellow-600 tabular-nums">
                                    {(user?.xp || 0).toLocaleString()}
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">Total XP</div>
                            </div>
                            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
                                <div className="text-2xl font-black text-white tabular-nums">
                                    {user?.currentStreak || 0}
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">Day Streak</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 md:p-10">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500 mb-6">Recent Activity</h3>
                <div className="py-2">
                    <ActivityHeatmap />
                </div>
            </div>
        </div>
    )
}

function TeamDashboardPage({ onBack }) {
    const { user, updateUser } = useAuth()
    const { t } = useLang()
    const [team, setTeam] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
    const [leaving, setLeaving] = useState(false)

    // Form states for creating / joining when no team
    const [actionPhase, setActionPhase] = useState('choice') // 'choice' | 'create' | 'join'
    const [teamName, setTeamName] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [actionLoading, setActionLoading] = useState(false)
    const [actionError, setActionError] = useState('')
    const [actionSuccess, setActionSuccess] = useState('')

    const inputClass = `w-full px-4 py-3 rounded-xl text-sm text-white placeholder-neutral-500
        bg-neutral-950 border border-neutral-700
        focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 focus:outline-none
        transition-all duration-300`

    const handleCreateTeam = async (e) => {
        e.preventDefault()
        setActionError('')
        if (!teamName.trim()) { setActionError('Team name is required.'); return }
        setActionLoading(true)
        try {
            const data = await api.post('/teams/create', { name: teamName })
            if (data.user) updateUser(data.user)
            window.location.reload() // Force reload to ensure fresh global state
        } catch (err) {
            setActionError(err.message || 'Failed to create team.')
            setActionLoading(false)
        }
    }

    const handleJoinTeam = async (e) => {
        e.preventDefault()
        setActionError('')
        if (!inviteCode.trim()) { setActionError('Invite code is required.'); return }
        setActionLoading(true)
        try {
            const data = await api.post('/teams/join', { inviteCode, userId: user.id })
            if (data.user) updateUser(data.user)
            window.location.reload() // Force reload to ensure fresh global state
        } catch (err) {
            setActionError(err.message || 'Failed to join team.')
            setActionLoading(false)
        }
    }

    useEffect(() => {
        async function fetchTeam() {
            try {
                const res = await api.get('/user/team')
                setTeam(res.team)
                setError('') // Clear any stale errors
            } catch (err) {
                // Ignore 404 errors as they just mean "no team yet"
                if (err.status !== 404) {
                    setError(err.message || 'Failed to load team data.')
                }
            } finally {
                setLoading(false)
            }
        }
        fetchTeam()
    }, [])

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader title={t('team.dashboardTitle')} onBack={onBack} />
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={32} className="text-yellow-600 animate-spin mb-4" />
                    <p className="text-neutral-500 font-mono tracking-widest uppercase text-xs">{t('team.loading')}</p>
                </div>
            ) : error || !team ? (
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 md:p-12 max-w-2xl mx-auto backdrop-blur-sm text-center">
                    <div className="w-20 h-20 bg-neutral-900 border border-neutral-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/50">
                        <Users size={32} className="text-neutral-500" />
                    </div>
                    
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">{t('team.joinFirst')}</h2>
                    <p className="text-sm text-neutral-400 mb-8 max-w-md mx-auto leading-relaxed">
                        {t('team.joinFirstDesc')}
                    </p>

                    {actionPhase === 'choice' && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => { setActionPhase('create'); setActionError(''); }}
                                className="px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer
                                           bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                                           shadow-lg shadow-yellow-600/20 hover:scale-[1.02] transition-transform"
                            >
                                {t('team.createNew')}
                            </button>
                            <button
                                onClick={() => { setActionPhase('join'); setActionError(''); }}
                                className="px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer
                                           bg-neutral-800 border border-neutral-700 text-white
                                           hover:bg-neutral-700 transition-colors"
                            >
                                {t('team.joinWithCode')}
                            </button>
                        </div>
                    )}

                    {actionPhase === 'create' && (
                        <form onSubmit={handleCreateTeam} className="text-left max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-300">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('team.nameLabel')}</label>
                            <input
                                autoFocus
                                type="text"
                                placeholder={t('team.namePlaceholder')}
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                className={inputClass}
                                required
                            />
                            {actionError && <p className="text-red-400 text-xs mt-2 font-semibold">{actionError}</p>}
                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setActionPhase('choice')} className="px-4 py-3 rounded-xl border border-neutral-800 text-neutral-400 text-xs font-bold uppercase hover:bg-neutral-800 transition">{t('team.back')}</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-3 rounded-xl bg-yellow-600 text-black text-xs font-bold uppercase tracking-wider hover:bg-yellow-500 transition disabled:opacity-50">
                                    {actionLoading ? t('team.creating') : t('team.createBtn')}
                                </button>
                            </div>
                        </form>
                    )}

                    {actionPhase === 'join' && (
                        <form onSubmit={handleJoinTeam} className="text-left max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-300">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('team.inviteCode')}</label>
                            <input
                                autoFocus
                                type="text"
                                placeholder={t('team.codePlaceholder')}
                                maxLength={6}
                                value={inviteCode}
                                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                className={`${inputClass} font-mono tracking-widest uppercase text-center text-lg`}
                                required
                            />
                            {actionError && <p className="text-red-400 text-xs mt-2 font-semibold">{actionError}</p>}
                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setActionPhase('choice')} className="px-4 py-3 rounded-xl border border-neutral-800 text-neutral-400 text-xs font-bold uppercase hover:bg-neutral-800 transition">{t('team.back')}</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-3 rounded-xl bg-yellow-600 text-black text-xs font-bold uppercase tracking-wider hover:bg-yellow-500 transition disabled:opacity-50">
                                    {actionLoading ? t('team.joining') : t('team.joinBtn')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="md:col-span-2 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 md:p-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wider mb-2">
                                    {team.name}
                                </h2>
                                <p className="text-neutral-500 text-sm tracking-wide mb-1">
                                    {t('team.statusLabel')}<span className="text-emerald-400 font-semibold">{t('team.active')}</span>
                                </p>
                                <p className="text-neutral-500 text-sm tracking-wide mb-4">
                                    {t('team.captain')}<span className="text-yellow-600 font-semibold">{team.members.find(m => m.id === team.captainId)?.name || '—'}</span>
                                </p>
                                
                                {team.isRegisteredForCompetition ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-emerald-500/50 bg-emerald-500/10 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.15)] mt-1 mb-2">
                                        <CheckCircle2 size={16} className="text-emerald-400" />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">{t('team.regForComp')}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-start gap-1.5 mt-1 mb-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-yellow-500/50 bg-yellow-500/10 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.05)]">
                                            <AlertTriangle size={15} className="text-yellow-400" />
                                            <span className="text-[11px] font-black uppercase tracking-widest text-yellow-400">{t('team.pendingReg')}</span>
                                        </div>
                                        {user?.id === team.captainId && (
                                            <p className="text-[10px] text-yellow-600/80 font-bold uppercase tracking-wider mt-0.5">
                                                {t('team.dontForgetReg')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-neutral-900 border-2 border-yellow-600/30 flex items-center justify-center shadow-lg shadow-yellow-600/10">
                                <Users size={32} className="text-yellow-600" />
                            </div>
                        </div>
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 md:p-8 flex flex-col justify-center">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">{t('team.inviteCode')}</p>
                            <div className="text-3xl font-mono text-yellow-600 tracking-[0.3em] font-bold">
                                {team.inviteCode}
                            </div>
                            <p className="text-xs text-neutral-500 mt-3">{t('team.shareCode')}</p>
                        </div>
                    </div>
                    
                    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">{t('team.membersTitle')}</h3>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{team.members.length}{t('team.membersCount')}</span>
                        </div>

                        {/* ── Desktop layout (md+) ── */}
                        <div className="hidden md:block divide-y divide-neutral-800/60">
                            {team.members.map((member, index) => (
                                <div key={member.id} className="flex items-center gap-5 px-8 py-6 hover:bg-neutral-800/20 transition-colors group">
                                    {/* Rank */}
                                    <div className="w-11 h-11 rounded-xl bg-neutral-800 border border-neutral-700/60 flex items-center justify-center font-black text-base text-neutral-300 shrink-0 group-hover:border-neutral-600 transition-colors">
                                        {index + 1}
                                    </div>
                                    {/* Avatar */}
                                    <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-700 shrink-0 shadow-lg group-hover:shadow-yellow-600/5 transition-shadow">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={22} className="text-neutral-500" />
                                        )}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-black text-white text-xl tracking-tight">{member.name}</h4>
                                            {member.id === team.captainId && (
                                                <span className="px-2.5 py-1 rounded-lg bg-yellow-600/15 border border-yellow-600/30 text-yellow-600 text-[10px] font-bold uppercase flex items-center gap-1 shrink-0">
                                                    <Crown size={10} /> Captain
                                                </span>
                                            )}
                                            {member.id === user?.id && (
                                                <span className="px-2.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 text-[10px] font-bold uppercase shrink-0">{t('team.you')}</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-neutral-500">{member.email}</p>
                                    </div>
                                    {/* Streak */}
                                    <div className="text-center px-6 border-l border-neutral-800">
                                        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">{t('team.streak')}</p>
                                        <p className="font-mono text-yellow-600 font-black text-xl">{member.currentStreak ?? 0}<span className="text-sm">d</span></p>
                                    </div>
                                    {/* XP */}
                                    <div className="text-center px-6 border-l border-neutral-800">
                                        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">{t('team.xp')}</p>
                                        <p className="font-mono text-white font-black text-xl">{(member.xp || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Mobile layout (<md) ── */}
                        <div className="md:hidden divide-y divide-neutral-800/60">
                            {team.members.map((member, index) => (
                                <div key={member.id} className="p-4 hover:bg-neutral-800/20 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {/* Rank */}
                                        <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-xs text-neutral-400 shrink-0">
                                            {index + 1}
                                        </div>
                                        {/* Avatar */}
                                        <div className="w-11 h-11 rounded-xl bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-700 shrink-0">
                                            {member.avatarUrl ? (
                                                <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={18} className="text-neutral-500" />
                                            )}
                                        </div>
                                        {/* Name + email */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h4 className="font-bold text-white text-base leading-tight">{member.name}</h4>
                                                {member.id === team.captainId && (
                                                    <span className="px-1.5 py-0.5 rounded bg-yellow-600/15 border border-yellow-600/30 text-yellow-600 text-[9px] font-bold uppercase flex items-center gap-0.5">
                                                        <Crown size={8} /> Captain
                                                    </span>
                                                )}
                                                {member.id === user?.id && (
                                                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 text-[9px] font-bold uppercase">{t('team.you')}</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{member.email}</p>
                                        </div>
                                        {/* XP — right side */}
                                        <div className="text-right shrink-0 ml-2">
                                            <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-0.5">{t('team.xp')}</p>
                                            <p className="font-mono text-white font-black text-base">{(member.xp || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Leave Team Button */}
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={() => setShowLeaveConfirm(true)}
                            className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest
                                       bg-red-500/10 border border-red-500/30 text-red-400
                                       hover:bg-red-500/20 hover:border-red-500/50 transition-all cursor-pointer"
                        >
                            {t('team.leaveBtn')}
                        </button>
                    </div>
                </>
            )}

            {/* Leave Confirmation Modal */}
            {showLeaveConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[80] px-4" onClick={() => setShowLeaveConfirm(false)}>
                    <div
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-7 text-center shadow-2xl shadow-black/60"
                        onClick={e => e.stopPropagation()}
                        style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
                    >
                        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-5">
                            <LogOut size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{t('team.leaveConfirm')}</h3>
                        <p className="text-sm text-neutral-400 mb-6">
                            {t('team.leaveSure')}<span className="text-white font-semibold">{team?.name}</span>?
                            {user?.id === team?.captainId && (
                                <span className="block mt-2 text-yellow-600">{t('team.leaveCaptain')}</span>
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLeaveConfirm(false)}
                                className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-widest
                                           bg-neutral-800 border border-neutral-700 text-white
                                           hover:bg-neutral-700 transition cursor-pointer"
                            >
                                {t('team.cancel')}
                            </button>
                            <button
                                onClick={async () => {
                                    setLeaving(true)
                                    try {
                                        const data = await api.post('/teams/leave')
                                        if (data.user) updateUser(data.user)
                                        onBack()
                                    } catch (err) {
                                        setError(err.message || t('team.leaveFailed'))
                                        setShowLeaveConfirm(false)
                                    } finally {
                                        setLeaving(false)
                                    }
                                }}
                                disabled={leaving}
                                className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-widest
                                           bg-red-500/20 border border-red-500/40 text-red-400
                                           hover:bg-red-500/30 transition cursor-pointer
                                           disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {leaving ? t('team.leaving') : t('team.leaveSubmit')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function SettingsPage({ onBack }) {
    const { user, logout, updateUser } = useAuth()
    const { lang: language, setLang: setLanguage, t } = useLang()
    const [name, setName] = useState(user?.name || '')
    const [avatarFile, setAvatarFile] = useState(null)
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState(null) // { type: 'success' | 'error', msg: string }
    
    const dropzoneRef = useRef(null)

    // Delete Account states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // Language preference
    const LANGUAGES = [
        { code: 'kk', label: 'Қазақша', flag: '🇰🇿' },
        { code: 'ru', label: 'Русский', flag: '🇷🇺' },
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'ro', label: 'Română', flag: '🇷🇴' },
    ]
    const handleLanguageChange = (code) => {
        setLanguage(code)
    }

    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    setAvatarFile(file);
                    break;
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        setStatus(null)
        try {
            // First update name if needed
            let updatedUser = user;
            if (name !== user?.name) {
                const res = await api.put('/user/me', { name });
                updatedUser = res.user;
            }

            // Then upload avatar if selected
            if (avatarFile) {
                const formData = new FormData()
                formData.append('avatar', avatarFile)
                const res = await api.post('/user/avatar', formData)
                updatedUser = res.user;
            }

            setStatus({ type: 'success', msg: 'Profile updated successfully.' })
            
            // Crucial step: update the global auth context AND localStorage 
            // so the avatar shows up everywhere immediately!
            if (updateUser && updatedUser) {
                updateUser(updatedUser);
            }
        } catch (err) {
            setStatus({ type: 'error', msg: err.message || 'Failed to update settings.' })
        } finally {
            setSaving(false)
        }
    }

    const handleRemovePhoto = async () => {
        // If there is only a local preview (not yet saved), just clear it
        if (avatarFile) {
            setAvatarFile(null)
            return
        }

        // If there is a saved avatar on the server, delete it
        if (user?.avatarUrl) {
            setSaving(true)
            setStatus(null)
            try {
                const res = await api.delete('/user/avatar')
                setStatus({ type: 'success', msg: 'Photo removed.' })
                if (updateUser && res.user) {
                    updateUser(res.user)
                }
            } catch (err) {
                setStatus({ type: 'error', msg: err.message || 'Failed to remove photo.' })
            } finally {
                setSaving(false)
            }
        }
    }

    return (
        <div className="max-w-2xl md:max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader title={t('settings.title')} onBack={onBack} />

            <form onSubmit={handleSave} className="space-y-6">

                {/* ── Profile Section ─────────────────────────── */}
                <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-900/60 backdrop-blur-xl border border-neutral-800/50 rounded-3xl overflow-hidden shadow-2xl shadow-black/30">
                    <div className="px-6 py-5 border-b border-neutral-800/50 bg-gradient-to-r from-yellow-600/5 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-yellow-600/15 border border-yellow-600/30 flex items-center justify-center">
                                <User size={18} className="text-yellow-500" />
                            </div>
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">{t('settings.profile')}</h2>
                        </div>
                    </div>
                    <div className="p-6 md:p-8 space-y-6">

                        {/* Avatar section — large, centered */}
                        <div className="flex flex-col items-center gap-6 py-4">
                            {/* Big avatar with enhanced design */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/30 to-green-600/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                                <div className="relative w-28 h-28 md:w-40 md:h-40 rounded-full bg-neutral-800 border-4 border-neutral-700 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-yellow-600/20 group-hover:ring-yellow-600/40 transition-all duration-300">
                                    {avatarFile ? (
                                        <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                                    ) : user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-neutral-500 md:w-20 md:h-20" />
                                    )}
                                </div>
                                {/* Enhanced edit badge */}
                                <button
                                    type="button"
                                    onClick={() => dropzoneRef.current?.click()}
                                    className="absolute bottom-2 right-2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 border-4 border-neutral-900 flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                            </div>

                            {/* Enhanced dropzone */}
                            <div
                                className="w-full border-2 border-dashed border-neutral-700/50 hover:border-yellow-600/50 bg-gradient-to-br from-neutral-950/50 to-neutral-900/30 hover:from-yellow-600/5 hover:to-green-600/5 rounded-2xl p-6 md:p-8 flex flex-col items-center gap-3 md:gap-4 cursor-pointer transition-all duration-300 group"
                                onClick={() => dropzoneRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={dropzoneRef}
                                    onChange={(e) => { if (e.target.files?.[0]) setAvatarFile(e.target.files[0]) }}
                                />
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 group-hover:border-yellow-600/30 group-hover:from-yellow-600/10 group-hover:to-green-600/10 flex items-center justify-center transition-all duration-300">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400 group-hover:text-yellow-500 transition-colors">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <p className="text-base md:text-lg font-semibold text-neutral-300 group-hover:text-white transition-colors">
                                        {avatarFile ? avatarFile.name : t('settings.uploadPhoto')}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1" dangerouslySetInnerHTML={{ __html: t('settings.uploadDesc') }}></p>
                                </div>
                            </div>

                            {/* Enhanced remove link */}
                            {(avatarFile || user?.avatarUrl) && (
                                <button
                                    type="button"
                                    onClick={handleRemovePhoto}
                                    disabled={saving}
                                    className="text-xs font-bold uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-2"
                                >
                                    <X size={14} />
                                    {t('settings.removePhoto')}
                                </button>
                            )}
                        </div>


                        {/* Enhanced Display Name */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3 flex items-center gap-2">
                                <User size={12} className="text-yellow-600" />
                                {t('settings.displayName')}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-neutral-950/60 border border-neutral-800/50 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-yellow-600/50 focus:ring-2 focus:ring-yellow-600/20 font-medium transition-all duration-300 placeholder:text-neutral-600"
                                placeholder={t('settings.displayNamePlaceholder')}
                            />
                        </div>

                        {/* Enhanced Email (read-only) */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3 flex items-center gap-2">
                                <Mail size={12} className="text-yellow-600" />
                                Email <span className="text-neutral-600 normal-case tracking-normal font-normal ml-1">— {t('settings.emailReadOnly')}</span>
                            </label>
                            <input
                                type="text"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-neutral-950/30 border border-neutral-800/30 rounded-xl px-5 py-4 text-neutral-500 text-sm focus:outline-none cursor-not-allowed"
                            />
                        </div>

                    </div>
                </div>

                {/* ── Enhanced Status message ───────────────────────────── */}
                {status && (
                    <div className={`px-5 py-4 rounded-2xl text-sm font-semibold border flex items-center gap-3 ${
                        status.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                            : 'bg-red-500/10 text-red-400 border-red-500/30 shadow-lg shadow-red-500/10'
                    }`}>
                        {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                        {status.msg}
                    </div>
                )}

                {/* ── Enhanced Save button ──────────────────────────────── */}
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-[0.15em] cursor-pointer
                               bg-gradient-to-r from-yellow-700 via-yellow-600 to-green-600 text-black
                               shadow-lg shadow-yellow-600/20 hover:shadow-xl hover:shadow-yellow-600/30 hover:scale-[1.02] active:scale-100 transition-all duration-300
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    {saving ? t('settings.saving') : t('settings.saveChanges')}
                </button>

            </form>

            {/* ── Enhanced Language Section ─────────────────────────────── */}
            <div className="mt-6 bg-gradient-to-br from-neutral-900/80 to-neutral-900/60 backdrop-blur-xl border border-neutral-800/50 rounded-3xl overflow-hidden shadow-2xl shadow-black/30">
                <div className="px-6 py-5 border-b border-neutral-800/50 bg-gradient-to-r from-blue-600/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-600/30 flex items-center justify-center">
                            <Globe size={18} className="text-blue-500" />
                        </div>
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">{t('settings.language')}</h2>
                    </div>
                </div>
                <div className="p-6 md:p-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                type="button"
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`flex flex-col items-center gap-3 py-5 px-4 rounded-2xl border text-center transition-all duration-300 cursor-pointer ${
                                    language === lang.code
                                        ? 'bg-gradient-to-br from-blue-600/10 to-blue-600/5 border-blue-600/50 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.15)] scale-105'
                                        : 'bg-neutral-950/40 border-neutral-800/50 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300 hover:bg-neutral-900/60'
                                }`}
                            >
                                <span className="text-3xl filter drop-shadow-lg">{lang.flag}</span>
                                <span className="text-xs font-bold uppercase tracking-wider">{lang.label}</span>
                                {language === lang.code && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                    <p className="mt-4 text-[10px] text-neutral-600 uppercase tracking-wider text-center">{t('settings.languageDesc')}</p>
                </div>
            </div>

            {/* ── Enhanced Danger Zone ──────────────────────────────────── */}
            <div className="mt-6 bg-gradient-to-br from-red-950/30 to-red-950/10 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6 md:p-8 flex items-center justify-between gap-6 shadow-2xl shadow-red-500/10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-red-400 uppercase tracking-[0.1em] mb-1">{t('settings.dangerZone')}</h3>
                        <p className="text-xs text-neutral-500">{t('settings.dangerZoneHint')}</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="shrink-0 px-6 py-3 rounded-xl border border-red-500/30 text-red-400/80 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 transition-all cursor-pointer"
                >
                    {t('settings.deleteAccount')}
                </button>
            </div>

            {/* Enhanced Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[80] px-4" onClick={() => setShowDeleteConfirm(false)}>
                    <div
                        className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-red-500/40 rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl shadow-red-500/20"
                        onClick={e => e.stopPropagation()}
                        style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
                    >
                        <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 text-red-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
                            <LogOut size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3 uppercase tracking-widest">{t('settings.deleteTitle')}</h3>
                        <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
                            {t('settings.deleteWarning')}
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-4 rounded-xl text-sm font-bold uppercase tracking-widest
                                           bg-neutral-800 border border-neutral-700 text-white
                                           hover:bg-neutral-700 transition cursor-pointer"
                            >
                                {t('settings.cancel')}
                            </button>
                            <button
                                onClick={async () => {
                                    setDeleting(true)
                                    try {
                                        await api.delete('/user/me')
                                        logout()
                                        window.location.reload()
                                    } catch (err) {
                                        setStatus({ type: 'error', msg: err.message || 'Failed to delete account.' })
                                        setShowDeleteConfirm(false)
                                    } finally {
                                        setDeleting(false)
                                    }
                                }}
                                disabled={deleting}
                                className="flex-1 py-4 rounded-xl text-sm font-bold uppercase tracking-widest
                                           bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {deleting ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                                {deleting ? t('settings.deleting') : t('settings.deleteAccount')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ── Main App ────────────────────────────────────────────── */

export default function App() {
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
    const [activeTab, setActiveTab] = useState('journey')
    const [activePage, setActivePage] = useState('home')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
    const [isRegistered, setIsRegistered] = useState(false)
    const [isAlreadyRegisteredModalOpen, setIsAlreadyRegisteredModalOpen] = useState(false)
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
    const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false)
    const [selectedGuideLanguage, setSelectedGuideLanguage] = useState(null)
    const videoRef = useRef(null)

    // Synchronize global registration status on page load or user change
    useEffect(() => {
        setIsRegistered(!!user?.team?.isRegisteredForCompetition)
    }, [user])

    // Reset guide language when video modal closes
    useEffect(() => {
        if (!isVideoModalOpen) {
            setSelectedGuideLanguage(null)
        }
    }, [isVideoModalOpen])

    const handleGlobalJoinClick = () => {
        if (isRegistered) {
            setIsAlreadyRegisteredModalOpen(true)
            return
        }
        setIsJoinModalOpen(true)
    }

    const handleNavigateToTraining = () => {
        setActivePage('home')
        setActiveTab('training')
    }

    const handleRegistered = () => {
        setIsRegistered(true)
    }

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2500)
        return () => clearTimeout(timer)
    }, [])

    // Keep preloader visible until BOTH the animation AND auth hydration are done.
    // This prevents a flash of "Sign In" state on mobile while localStorage is being read.
    const showPreloader = isLoading || isAuthLoading

    // ── Route intercept for Reset Password Page ──
    if (window.location.pathname === '/reset-password') {
        return <ResetPasswordPage />
    }

    // Synchronize activeTab with URL for deep-linking News
    useEffect(() => {
        const path = window.location.pathname;
        if (path === '/news') {
            setActiveTab('news');
            setActivePage('home');
        } else if (path.startsWith('/news/')) {
            setActiveTab('newsPost');
            setActivePage('home');
        }
    }, []);

    // Listen for popstate to handle back/forward navigation
    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.pathname;
            if (path === '/news') {
                setActiveTab('news');
                setActivePage('home');
            } else if (path.startsWith('/news/')) {
                setActiveTab('newsPost');
                setActivePage('home');
            } else if (path === '/') {
                 if(activeTab === 'news' || activeTab === 'newsPost') {
                     setActiveTab('journey');
                 }
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [activeTab]);

    return (
        <>
            {/* ── Cinematic Preloader Overlay ── */}
            <Preloader isVisible={showPreloader} />

            {/* ── Main Shell ── */}
            <div
                className="min-h-screen w-full text-white bg-neutral-950 flex flex-col"
                style={{
                    backgroundImage: "linear-gradient(to bottom, rgba(18,18,18,0.85), rgba(18,18,18,1)), url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048&auto=format&fit=crop')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'scroll',
                    willChange: 'transform',
                }}
            >
                <Header
                    onSignInClick={() => setIsModalOpen(true)}
                    onJoinClick={handleGlobalJoinClick}
                    isRegistered={isRegistered}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onNavigatePage={setActivePage}
                />
                
                {activePage === 'home' ? (
                    <>
                        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} onNavigatePage={setActivePage} />
                        <main className="flex-1">
                            <div key={activeTab} className="tab-animate">
                                {activeTab === 'journey' && <JourneyTab onPostClick={(slug) => { setActiveTab('newsPost'); window.history.pushState({}, '', `/news/${slug}`); }} />}
                                {activeTab === 'news' && <NewsPage onPostClick={(slug) => { setActiveTab('newsPost'); window.history.pushState({}, '', `/news/${slug}`); }} />}
                                {activeTab === 'newsPost' && <NewsPostPage onBack={() => { setActiveTab('news'); window.history.pushState({}, '', '/news'); }} />}
                                {activeTab === 'training' && <TrainingTab />}
                                {activeTab === 'ranking' && <RankingTab onJoinClick={handleGlobalJoinClick} isRegistered={isRegistered} />}
                                {activeTab === 'contact' && <ContactUs />}
                            </div>
                        </main>
                        <Footer />
                    </>
                ) : (
                    <main className="flex-1 bg-neutral-950/90 backdrop-blur-md">
                        {activePage === 'profile' && <ProfilePage onBack={() => setActivePage('home')} />}
                        {activePage === 'team' && <TeamDashboardPage onBack={() => setActivePage('home')} />}
                        {activePage === 'settings' && <SettingsPage onBack={() => setActivePage('home')} />}
                        {activePage === 'admin' && <AdminPage onBack={() => setActivePage('home')} />}
                    </main>
                )}
                
                <CompetitionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
                <CompetitionJoinModal
                    isOpen={isJoinModalOpen}
                    onClose={() => setIsJoinModalOpen(false)}
                    onRegistered={handleRegistered}
                    onNavigateToTraining={handleNavigateToTraining}
                />
                <AlreadyRegisteredModal
                    isOpen={isAlreadyRegisteredModalOpen}
                    onClose={() => setIsAlreadyRegisteredModalOpen(false)}
                />

                {/* ── Guide Button ── */}
                <button
                    onClick={() => {
                        console.log('Guide button clicked');
                        setIsLanguageModalOpen(true);
                    }}
                    className="fixed z-[999] right-4 bottom-4 md:right-6 md:bottom-6 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center shadow-2xl shadow-yellow-600/30 border border-yellow-500/30 text-black hover:scale-110 transition-transform cursor-pointer"
                    title="Platform Guide"
                >
                    <BookOpen size={24} />
                </button>

                {/* ── Language Selection Modal ── */}
                {isLanguageModalOpen && createPortal(
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8">
                        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md cursor-pointer" onClick={() => setIsLanguageModalOpen(false)} />
                        <div className="relative w-full max-w-md rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl border border-neutral-800 animate-in zoom-in-95 duration-200 p-8">
                            <button
                                onClick={() => setIsLanguageModalOpen(false)}
                                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-neutral-950/50 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-950/80 cursor-pointer transition-all"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-16 h-16 rounded-full bg-yellow-600/20 border border-yellow-600/30 flex items-center justify-center">
                                    <BookOpen size={32} className="text-yellow-600" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-widest text-white text-center">
                                    {t('guide.selectLanguage')}
                                </h3>
                                <div className="flex flex-col gap-3 w-full">
                                    <button
                                        onClick={() => {
                                            setSelectedGuideLanguage('rus');
                                            setIsLanguageModalOpen(false);
                                            setIsVideoModalOpen(true);
                                        }}
                                        className="px-6 py-4 rounded-xl text-base font-bold uppercase tracking-widest
                                                   bg-gradient-to-r from-yellow-600 to-yellow-800 text-white
                                                   hover:from-yellow-500 hover:to-yellow-700 transition cursor-pointer
                                                   shadow-lg shadow-yellow-600/20"
                                    >
                                        {t('guide.russian')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedGuideLanguage('eng');
                                            setIsLanguageModalOpen(false);
                                            setIsVideoModalOpen(true);
                                        }}
                                        className="px-6 py-4 rounded-xl text-base font-bold uppercase tracking-widest
                                                   bg-gradient-to-r from-yellow-600 to-yellow-800 text-white
                                                   hover:from-yellow-500 hover:to-yellow-700 transition cursor-pointer
                                                   shadow-lg shadow-yellow-600/20"
                                    >
                                        {t('guide.english')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* ── Video Modal ── */}
                {isVideoModalOpen && createPortal(
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-8">
                        <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md cursor-pointer" onClick={() => { setIsVideoModalOpen(false); setSelectedGuideLanguage(null); }} />
                        <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl border border-neutral-800 animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => { setIsVideoModalOpen(false); setSelectedGuideLanguage(null); }}
                                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-neutral-950/50 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-950/80 cursor-pointer transition-all"
                            >
                                <X size={20} />
                            </button>
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <video
                                    ref={videoRef}
                                    playsInline
                                    controls
                                    autoPlay
                                    disablePictureInPicture
                                    className="absolute inset-0 w-full h-full object-contain bg-black"
                                    src={selectedGuideLanguage === 'rus' ? '/rus.mp4' : '/eng.mp4'}
                                />
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </>
    )
}
