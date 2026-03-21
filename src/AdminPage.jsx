// ═══════════════════════════════════════════════════════════════════════
// ICARUS — Admin Panel
// Protected: ADMIN role only. Manage competitions without touching code.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
    ShieldCheck, Plus, Square, Users, Trophy, Calendar,
    ArrowLeft, Loader2, AlertTriangle, CheckCircle2,
    ChevronRight, X, Clock, Ban, Activity, Trash2
} from 'lucide-react'
import { api } from './api'
import { useAuth } from './AuthContext'

// ─── Shared style tokens ──────────────────────────────────────────────

const inputClass =
    'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-neutral-500 ' +
    'bg-neutral-950 border border-neutral-700 ' +
    'focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 focus:outline-none ' +
    'transition-all duration-300'

const labelClass =
    'block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2'

// ─── formatDate helper ───────────────────────────────────────────────

function fmt(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

// ─── StatusBadge ─────────────────────────────────────────────────────

function StatusBadge({ active }) {
    return active ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                         text-[10px] font-bold uppercase tracking-wider
                         bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Activity size={9} />
            Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                         text-[10px] font-bold uppercase tracking-wider
                         bg-neutral-800 text-neutral-500 border border-neutral-700">
            <Ban size={9} />
            Closed
        </span>
    )
}

// ─── Toast ───────────────────────────────────────────────────────────

function Toast({ msg, type, onDismiss }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 4000)
        return () => clearTimeout(t)
    }, [onDismiss])

    const isErr = type === 'error'
    return (
        <div
            className={`fixed bottom-6 right-6 z-[200] flex items-start gap-3 px-5 py-4
                        rounded-2xl shadow-2xl border max-w-sm
                        ${isErr
                            ? 'bg-red-950/90 border-red-500/30 text-red-300'
                            : 'bg-neutral-900/95 border-emerald-500/30 text-emerald-300'}`}
            style={{ animation: 'fadeSlideIn 0.25s ease-out' }}
        >
            {isErr
                ? <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-400" />
                : <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400" />}
            <p className="text-sm font-medium flex-1">{msg}</p>
            <button onClick={onDismiss} className="shrink-0 text-neutral-600 hover:text-white transition-colors cursor-pointer">
                <X size={14} />
            </button>
        </div>
    )
}

// ─── CreateCompetitionForm ────────────────────────────────────────────

function CreateCompetitionForm({ onCreated }) {
    const [title, setTitle]       = useState('')
    const [regStart, setRegStart] = useState('')
    const [regEnd, setRegEnd]     = useState('')
    const [loading, setLoading]   = useState(false)
    const [error, setError]       = useState('')

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        if (!title.trim()) { setError('Title is required.'); return }
        if (!regStart)      { setError('Start date is required.'); return }
        if (!regEnd)        { setError('End date is required.'); return }
        if (new Date(regEnd) <= new Date(regStart)) {
            setError('End date must be after start date.')
            return
        }
        setLoading(true)
        try {
            const data = await api.post('/admin/competitions', {
                title: title.trim(),
                regStart: new Date(regStart).toISOString(),
                regEnd:   new Date(regEnd).toISOString(),
            })
            setTitle(''); setRegStart(''); setRegEnd('')
            onCreated(data.competition)
        } catch (err) {
            setError(err.message || 'Failed to create competition.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-yellow-600/15 border border-yellow-600/30
                                flex items-center justify-center">
                    <Plus size={18} className="text-yellow-500" />
                </div>
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">
                        New Competition
                    </h2>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">
                        Create a tournament &amp; open registration
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-5 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30
                                text-red-400 text-xs font-semibold tracking-wide">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={labelClass}>Competition Title</label>
                    <input
                        type="text"
                        placeholder="e.g. ICARUS Spring Olympiad 2026"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className={inputClass}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Registration Opens</label>
                        <input
                            type="datetime-local"
                            value={regStart}
                            onChange={e => setRegStart(e.target.value)}
                            className={`${inputClass} [color-scheme:dark]`}
                            required
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Registration Closes</label>
                        <input
                            type="datetime-local"
                            value={regEnd}
                            onChange={e => setRegEnd(e.target.value)}
                            className={`${inputClass} [color-scheme:dark]`}
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-[0.15em]
                               bg-gradient-to-r from-yellow-700 to-yellow-600 text-black
                               shadow-lg shadow-yellow-600/20
                               transition-all duration-300 ease-out
                               hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-600/30
                               active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed
                               disabled:hover:scale-100 cursor-pointer flex items-center justify-center gap-2"
                >
                    {loading
                        ? <><Loader2 size={16} className="animate-spin" /> Creating…</>
                        : <><Plus size={16} /> Create Competition</>}
                </button>
            </form>
        </div>
    )
}

// ─── CompetitionCard ─────────────────────────────────────────────────

function CompetitionCard({ comp, isSelected, onSelect, onStop, onDelete }) {
    const [stopping, setStopping] = useState(false)

    async function handleStop(e) {
        e.stopPropagation()
        if (!comp.isSelectionActive) return
        setStopping(true)
        await onStop(comp.id)
        setStopping(false)
    }

    return (
        <div
            onClick={() => onSelect(comp)}
            className={`group relative rounded-2xl border p-5 cursor-pointer
                        transition-all duration-300
                        ${isSelected
                            ? 'bg-yellow-600/10 border-yellow-600/40 shadow-lg shadow-yellow-600/10'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'}`}
        >
            {/* Selection indicator */}
            {isSelected && (
                <div className="absolute top-4 right-4">
                    <ChevronRight size={16} className="text-yellow-500" />
                </div>
            )}

            <div className="flex items-start gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                                ${isSelected
                                    ? 'bg-yellow-600/20 border border-yellow-600/40'
                                    : 'bg-neutral-800 border border-neutral-700'}`}>
                    <Trophy size={15} className={isSelected ? 'text-yellow-500' : 'text-neutral-500'} />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                    <h3 className="text-sm font-bold text-white truncate leading-tight">
                        {comp.title}
                    </h3>
                    <div className="mt-1">
                        <StatusBadge active={comp.isSelectionActive} />
                    </div>
                </div>
            </div>

            {/* Dates */}
            <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <Clock size={11} className="text-neutral-600 shrink-0" />
                    <span className="text-neutral-600">Opens:</span>
                    <span className="text-neutral-400">{fmt(comp.regStart)}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <Clock size={11} className="text-neutral-600 shrink-0" />
                    <span className="text-neutral-600">Closes:</span>
                    <span className="text-neutral-400">{fmt(comp.regEnd)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <Users size={11} />
                    {comp._count?.teams ?? 0} team{comp._count?.teams !== 1 ? 's' : ''}
                </span>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(comp.id); }}
                        className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-colors cursor-pointer"
                        title="Delete Competition"
                    >
                        <Trash2 size={13} />
                    </button>
                    <button
                    onClick={handleStop}
                    disabled={!comp.isSelectionActive || stopping}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold
                               uppercase tracking-wider transition-all duration-200
                               ${comp.isSelectionActive
                                    ? 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 cursor-pointer'
                                    : 'bg-neutral-800 border border-neutral-700 text-neutral-600 cursor-not-allowed'}`}
                >
                    {stopping
                        ? <Loader2 size={10} className="animate-spin" />
                        : <Square size={10} />}
                    {comp.isSelectionActive ? 'Stop Selection' : 'Selection Stopped'}
                </button>
                </div>
            </div>
        </div>
    )
}

// ─── TeamDetailsModal ──────────────────────────────────────────────────

function TeamDetailsModal({ team, onClose }) {
    if (!team) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm cursor-pointer" onClick={onClose} />
            <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl
                            shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
                 style={{ maxHeight: '90vh', animation: 'zoomIn 0.25s ease-out' }}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-8 md:p-10 border-b border-neutral-800 bg-neutral-900/50">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-yellow-600/15 border border-yellow-600/30 flex items-center justify-center shadow-inner">
                            <Users size={32} className="text-yellow-500 md:w-10 md:h-10" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-white">{team.name}</h2>
                            <p className="text-sm md:text-base text-neutral-500 font-mono tracking-wider mt-2 bg-neutral-950 inline-block px-3 py-1 rounded-lg border border-neutral-800">CODE: <span className="text-yellow-600 font-bold">{team.inviteCode}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-neutral-500 hover:text-white bg-neutral-800/50 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer self-start border border-transparent hover:border-neutral-700">
                        <X size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6 mb-10">
                        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center shadow-inner">
                            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">Total Score</p>
                            <p className="text-4xl md:text-5xl font-mono text-yellow-500 font-black drop-shadow-md">{team.totalScore.toLocaleString()}</p>
                        </div>
                        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center shadow-inner">
                            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">Members</p>
                            <p className="text-4xl md:text-5xl font-mono text-white font-black drop-shadow-md">{team.members?.length || 0}</p>
                        </div>
                    </div>

                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-neutral-500 mb-6 px-2 flex items-center gap-3">
                        <span className="w-8 h-px bg-neutral-800"></span>
                        Roster
                        <span className="flex-1 h-px bg-neutral-800"></span>
                    </h3>
                    
                    <div className="space-y-4">
                        {team.members?.map((member, i) => (
                            <div key={member.id} className="flex items-center justify-between bg-neutral-950/50 border border-neutral-800/60 rounded-2xl p-6 hover:border-neutral-700 hover:bg-neutral-900/50 transition-all duration-300 group">
                                <div className="flex items-center gap-6">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-black text-xs md:text-sm text-neutral-500 shrink-0 shadow-inner group-hover:text-neutral-400 group-hover:border-neutral-700 transition-colors">
                                        {i + 1}
                                    </div>
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-neutral-800 overflow-hidden shrink-0 border-2 border-neutral-700 flex items-center justify-center shadow-lg">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-neutral-500 text-lg md:text-xl font-black uppercase">{member.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <h4 className="font-black text-white text-lg md:text-xl tracking-wide">{member.name}</h4>
                                            {member.id === team.captainId && (
                                                <span className="px-2 py-1 rounded shrink-0 text-[10px] md:text-xs font-black uppercase tracking-widest bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 text-yellow-500 border border-yellow-600/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                                                    Captain
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-neutral-400 font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">{member.email}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 bg-neutral-900 border border-neutral-800 px-5 py-3 rounded-xl shadow-inner">
                                    <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-neutral-500 mb-1.5">XP</p>
                                    <p className="font-mono text-yellow-500 font-black text-xl md:text-2xl">{(member.xp || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── TeamViewer ───────────────────────────────────────────────────────

function TeamViewer({ competition }) {
    const [teams, setTeams]   = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError]   = useState('')
    const [selectedTeam, setSelectedTeam] = useState(null)

    useEffect(() => {
        if (!competition) return
        setLoading(true)
        setError('')
        api.get(`/admin/competitions/${competition.id}/teams`)
            .then(data => setTeams(data.teams))
            .catch(err => setError(err.message || 'Failed to load teams.'))
            .finally(() => setLoading(false))
    }, [competition])

    if (!competition) return null

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-800">
                <div className="w-9 h-9 rounded-xl bg-yellow-600/15 border border-yellow-600/30
                                flex items-center justify-center">
                    <Users size={16} className="text-yellow-500" />
                </div>
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-white leading-tight">
                        Registered Teams
                    </h2>
                    <p className="text-[10px] text-neutral-500 mt-0.5 truncate max-w-xs">
                        {competition.title}
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="p-6">
                {loading && (
                    <div className="flex items-center justify-center gap-3 py-12 text-neutral-600">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm">Loading teams…</span>
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-2 py-8 px-4 rounded-xl bg-red-500/10
                                    border border-red-500/20 text-red-400 text-sm">
                        <AlertTriangle size={16} className="shrink-0" />
                        {error}
                    </div>
                )}
                {!loading && !error && teams.length === 0 && (
                    <div className="text-center py-12">
                        <Users size={32} className="text-neutral-700 mx-auto mb-3" />
                        <p className="text-sm text-neutral-500">No teams registered yet.</p>
                    </div>
                )}
                {!loading && !error && teams.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-800">
                                    <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">#</th>
                                    <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Team</th>
                                    <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">Captain</th>
                                    <th className="pb-3 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">Members</th>
                                    <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-widest text-neutral-500">Score</th>
                                    <th className="pb-3 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">Code</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/50">
                                {teams.map((team, i) => (
                                    <tr 
                                        key={team.id} 
                                        onClick={() => setSelectedTeam(team)}
                                        className="group hover:bg-neutral-800/60 hover:cursor-pointer transition-colors"
                                    >
                                        <td className="py-3.5 pr-4 text-neutral-600 font-mono text-xs">
                                            {String(i + 1).padStart(2, '0')}
                                        </td>
                                        <td className="py-3.5 pr-4">
                                            <span className="font-bold text-white">{team.name}</span>
                                        </td>
                                        <td className="py-3.5 pr-4 text-neutral-400 text-xs">
                                            {team.captain?.name ?? '—'}
                                            <div className="text-neutral-600 text-[10px]">
                                                {team.captain?.email ?? ''}
                                            </div>
                                        </td>
                                        <td className="py-3.5 pr-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {team.members.slice(0, 6).map(m => (
                                                    <div
                                                        key={m.id}
                                                        title={m.name}
                                                        className="w-6 h-6 rounded-full bg-neutral-700 border border-neutral-600
                                                                   flex items-center justify-center overflow-hidden text-[9px]
                                                                   font-bold text-neutral-300 shrink-0"
                                                    >
                                                        {m.avatarUrl
                                                            ? <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                                                            : m.name.charAt(0).toUpperCase()}
                                                    </div>
                                                ))}
                                                <span className="text-xs text-neutral-500 ml-1">
                                                    {team.members.length}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 pr-4 text-right">
                                            <span className="text-yellow-500 font-bold font-mono text-xs">
                                                {team.totalScore.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-3.5 text-center">
                                            <span className="font-mono text-xs text-neutral-400 bg-neutral-800
                                                             px-2.5 py-1 rounded-lg border border-neutral-700 tracking-widest">
                                                {team.inviteCode}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedTeam && (
                <TeamDetailsModal 
                    team={selectedTeam} 
                    onClose={() => setSelectedTeam(null)} 
                />
            )}
        </div>
    )
}

// ─── AdminPage (root) ─────────────────────────────────────────────────

export default function AdminPage({ onBack }) {
    const { user } = useAuth()

    const [competitions, setCompetitions] = useState([])
    const [loading, setLoading]           = useState(true)
    const [selectedComp, setSelectedComp] = useState(null)
    const [toast, setToast]               = useState(null) // { msg, type }
    const [compToDelete, setCompToDelete] = useState(null)
    const [deleting, setDeleting]         = useState(false)

    // ── guard ────────────────────────────────────────────────────────
    if (user?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="text-center">
                    <ShieldCheck size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-black uppercase tracking-widest text-white mb-2">
                        Access Denied
                    </h1>
                    <p className="text-neutral-500 text-sm mb-6">You do not have admin privileges.</p>
                    <button onClick={onBack} className="text-yellow-500 hover:text-yellow-400 text-sm font-bold
                                                       uppercase tracking-wider transition-colors cursor-pointer">
                        ← Go Back
                    </button>
                </div>
            </div>
        )
    }

    // ── fetch competitions ───────────────────────────────────────────
    const fetchCompetitions = useCallback(async () => {
        try {
            const data = await api.get('/admin/competitions')
            setCompetitions(data.competitions)
            // keep selectedComp in sync
            if (selectedComp) {
                const fresh = data.competitions.find(c => c.id === selectedComp.id)
                if (fresh) setSelectedComp(fresh)
            }
        } catch (err) {
            showToast(err.message || 'Failed to load competitions.', 'error')
        } finally {
            setLoading(false)
        }
    }, [selectedComp])

    useEffect(() => { fetchCompetitions() }, []) // eslint-disable-line

    // ── helpers ──────────────────────────────────────────────────────
    function showToast(msg, type = 'success') {
        setToast({ msg, type })
    }

    async function handleStop(competitionId) {
        try {
            const data = await api.patch(`/admin/competitions/${competitionId}/stop`)
            setCompetitions(prev =>
                prev.map(c => c.id === competitionId ? { ...c, isSelectionActive: false } : c)
            )
            if (selectedComp?.id === competitionId) {
                setSelectedComp(prev => ({ ...prev, isSelectionActive: false }))
            }
            showToast(data.message || 'Selection stopped.', 'success')
        } catch (err) {
            showToast(err.message || 'Failed to stop selection.', 'error')
        }
    }

    function handleCreated(newComp) {
        setCompetitions(prev => [{ ...newComp, _count: { teams: 0 } }, ...prev])
        showToast(`"${newComp.title}" created successfully.`, 'success')
    }

    async function handleDeleteConfirm() {
        if (!compToDelete) return
        setDeleting(true)
        try {
            await api.delete(`/admin/competitions/${compToDelete.id}`)
            setCompetitions(prev => prev.filter(c => c.id !== compToDelete.id))
            if (selectedComp?.id === compToDelete.id) setSelectedComp(null)
            showToast('Competition deleted successfully.', 'success')
            setCompToDelete(null)
        } catch (err) {
            showToast(err.message || 'Failed to delete competition.', 'error')
        } finally {
            setDeleting(false)
        }
    }

    function handleDeleteClick(competitionId) {
        const comp = competitions.find(c => c.id === competitionId)
        if (comp) setCompToDelete(comp)
    }

    // ─────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            {/* Toast */}
            {toast && (
                <Toast
                    msg={toast.msg}
                    type={toast.type}
                    onDismiss={() => setToast(null)}
                />
            )}

            {/* Top bar */}
            <div className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/60">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-neutral-500 hover:text-white
                                   transition-colors text-sm font-semibold cursor-pointer group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back
                    </button>

                    <div className="h-4 w-px bg-neutral-800" />

                    <div className="flex items-center gap-2.5">
                        <ShieldCheck size={18} className="text-yellow-500" />
                        <span className="text-sm font-black uppercase tracking-widest text-white">
                            Admin Panel
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Page header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2">
                        Competition Manager
                    </h1>
                    <p className="text-neutral-500 text-sm">
                        Create tournaments, manage registration windows, and inspect team rosters.
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8">

                    {/* ── Left column ──────────────────────────────── */}
                    <div className="space-y-6">

                        {/* Create form */}
                        <CreateCompetitionForm onCreated={handleCreated} />

                        {/* Competitions list */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                                    All Competitions
                                </h2>
                                <span className="text-[10px] text-neutral-600">
                                    {competitions.length} total
                                </span>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center gap-3 py-12 text-neutral-600">
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">Loading…</span>
                                </div>
                            ) : competitions.length === 0 ? (
                                <div className="text-center py-12 bg-neutral-900/50 border
                                                border-dashed border-neutral-800 rounded-2xl">
                                    <Trophy size={28} className="text-neutral-700 mx-auto mb-3" />
                                    <p className="text-sm text-neutral-500">No competitions yet.</p>
                                    <p className="text-xs text-neutral-600 mt-1">
                                        Create one above to get started.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {competitions.map(comp => (
                                        <CompetitionCard
                                            key={comp.id}
                                            comp={comp}
                                            isSelected={selectedComp?.id === comp.id}
                                            onSelect={setSelectedComp}
                                            onStop={handleStop}
                                            onDelete={handleDeleteClick}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right column ─────────────────────────────── */}
                    <div>
                        {selectedComp ? (
                            <TeamViewer competition={selectedComp} />
                        ) : (
                            <div className="h-full min-h-64 flex flex-col items-center justify-center
                                            text-center bg-neutral-900/40 border border-dashed
                                            border-neutral-800 rounded-2xl py-16 px-8">
                                <Calendar size={36} className="text-neutral-700 mb-4" />
                                <p className="text-sm font-semibold text-neutral-500">
                                    Select a competition
                                </p>
                                <p className="text-xs text-neutral-600 mt-1 max-w-xs">
                                    Click any competition card on the left to view its registered teams.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {/* Delete Confirmation Modal */}
            {compToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm cursor-pointer"
                         onClick={() => !deleting && setCompToDelete(null)} />
                    <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md
                                    shadow-2xl shadow-black p-8 md:p-10 flex flex-col items-center text-center"
                         style={{ animation: 'zoomIn 0.25s ease-out' }}>
                        
                        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6
                                        border border-red-500/20 text-red-500 shadow-inner">
                            <AlertTriangle size={36} />
                        </div>
                        
                        <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-3">
                            Delete Competition?
                        </h3>
                        
                        <p className="text-neutral-500 text-sm mb-8 leading-relaxed">
                            You are about to permanently delete <strong className="text-white">"{compToDelete.title}"</strong>. 
                            All associated teams will be completely unregistered from this competition.
                            <br/><br/>
                            <span className="text-red-400 font-bold uppercase tracking-widest text-[10px]">
                                This action cannot be undone.
                            </span>
                        </p>
                        
                        <div className="flex gap-4 w-full">
                            <button
                                onClick={() => setCompToDelete(null)}
                                disabled={deleting}
                                className="flex-1 py-4 rounded-xl text-sm font-bold uppercase tracking-widest
                                           bg-neutral-800 text-white hover:bg-neutral-700 transition-colors
                                           disabled:opacity-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                                className="flex-1 py-4 rounded-xl text-sm font-bold uppercase tracking-widest
                                           bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20
                                           active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer
                                           flex items-center justify-center gap-2"
                            >
                                {deleting ? <Loader2 size={18} className="animate-spin" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
