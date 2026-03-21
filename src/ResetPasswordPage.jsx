import { useState, useEffect } from 'react'
import { Shield, Lock, Loader2, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { api } from './api'

export default function ResetPasswordPage() {
    const [token, setToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        // Extract token from URL search params
        const params = new URLSearchParams(window.location.search)
        const t = params.get('token')
        if (t) setToken(t)
        else setError('Invalid or missing reset token. Please request a new password reset link.')
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        
        if (!token) {
            setError('Missing reset token.')
            return
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        try {
            await api.post('/auth/reset-password', { token, newPassword })
            setSuccess(true)
        } catch (err) {
            setError(err.message || 'Failed to reset password. The link might be expired.')
        } finally {
            setLoading(false)
        }
    }

    const inputClass = `w-full px-4 py-3 rounded-xl text-sm text-white placeholder-neutral-500
        bg-neutral-950 border border-neutral-700
        focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 focus:outline-none
        transition-all duration-300`

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans lowercase selection:bg-yellow-600/30">
            {/* Header branding */}
            <div className="fixed top-0 inset-x-0 h-16 md:h-24 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/60 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-4 select-none cursor-pointer" onClick={() => window.location.href = '/'}>
                        <img
                            src="/logo_white.png"
                            alt="ICARUS"
                            className="h-8 md:h-11 w-auto transition-transform duration-500 group-hover:scale-110"
                        />
                        <span className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-white">
                            ICARUS
                        </span>
                        <div className="hidden md:block h-8 w-px bg-neutral-700 ml-2" />
                        <span className="hidden md:block text-xs md:text-sm italic text-neutral-500 tracking-wide ml-2">
                            to be is to innovate
                        </span>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-600/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black relative z-10" style={{ animation: 'zoomIn 0.3s ease-out' }}>
                    <div className="w-16 h-16 bg-neutral-950 border border-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/50">
                        <Lock size={24} className="text-yellow-600" />
                    </div>

                    <h2 className="text-2xl font-black uppercase tracking-widest text-center mb-2">Reset Password</h2>
                    <p className="text-sm text-neutral-500 text-center uppercase tracking-wider mb-8">
                        Securely set a new password
                    </p>

                    {success ? (
                        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Password Updated!</h3>
                            <p className="text-sm text-neutral-400 mb-8">
                                Your account has been securely recovered out of orbit. You can now access ICARUS with your new credentials.
                            </p>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-[0.15em] cursor-pointer flex items-center justify-center gap-3
                                           bg-gradient-to-r from-yellow-700 to-yellow-600 text-black shadow-lg shadow-yellow-600/20
                                           hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-600/30 transition-all duration-300"
                            >
                                Return to Orbit <ArrowRight size={16} />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold tracking-wide flex items-center justify-center text-center leading-tight">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className={`${inputClass} pr-12`}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Repeat password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className={`${inputClass} pr-12`}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !token}
                                className="mt-4 w-full py-4 rounded-xl text-sm font-bold uppercase tracking-[0.15em] cursor-pointer
                                           bg-gradient-to-r from-yellow-700 to-yellow-600 text-black shadow-lg shadow-yellow-600/20
                                           hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-600/30 transition-all duration-300
                                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                {loading ? 'UPDATING...' : 'RESET PASSWORD'}
                            </button>
                            
                            <div className="text-center mt-6">
                                <button
                                    type="button"
                                    onClick={() => window.location.href = '/'}
                                    className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-white transition-colors cursor-pointer"
                                >
                                    Cancel & Return Home
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
