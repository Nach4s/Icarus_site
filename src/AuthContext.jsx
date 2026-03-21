// ═══════════════════════════════════════════════════════════════════════
// ICARUS — Authentication Context
// Global auth state: user, token, login, register, logout
// ═══════════════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'icarus_token'
const USER_KEY = 'icarus_user'

/**
 * AuthProvider
 * ─────────────
 * Wraps the entire app. Exposes:
 *   • user           – the authenticated user object (or null)
 *   • token          – the raw JWT string (or null)
 *   • isAuthenticated – boolean shorthand
 *   • login(email, password)   – authenticates and persists session
 *   • register(email, password, name) – creates account and persists session
 *   • logout()       – clears everything
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [isLoading, setIsLoading] = useState(true) // true while we check localStorage

    // ── Hydrate from localStorage and API on mount ───────────────────
    useEffect(() => {
        async function hydrate() {
            try {
                const savedToken = localStorage.getItem(TOKEN_KEY)
                const savedUserStr = localStorage.getItem(USER_KEY)

                if (savedToken) {
                    // Set token immediately so authenticated routes don't bounce
                    setToken(savedToken)
                    
                    // Optimistic UI: use local user data first to avoid flicker
                    if (savedUserStr) {
                        setUser(JSON.parse(savedUserStr))
                    }

                    // Background fetch to sync with DB
                    try {
                        const res = await api.get('/user/me')
                        // Update local storage and context with fresh DB data (including avatarUrl)
                        localStorage.setItem(USER_KEY, JSON.stringify(res.user))
                        setUser(res.user)
                    } catch (apiErr) {
                        console.error("Failed to sync user data with server:", apiErr)
                        // If token is invalid/expired, api layer usually logs them out
                        // but we handle basic hydration errors here gracefully
                    }
                }
            } catch (err) {
                // Corrupted storage — wipe it
                localStorage.removeItem(TOKEN_KEY)
                localStorage.removeItem(USER_KEY)
            } finally {
                setIsLoading(false)
            }
        }
        hydrate()
    }, [])

    // ── Persist helper ────────────────────────────────────────────────
    const persistSession = useCallback((userData, jwtToken) => {
        localStorage.setItem(TOKEN_KEY, jwtToken)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
        setToken(jwtToken)
        setUser(userData)
    }, [])

    const updateUser = useCallback((userData) => {
        const currentToken = localStorage.getItem(TOKEN_KEY)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
        setUser(userData)
    }, [])

    // ── Login ─────────────────────────────────────────────────────────
    const login = useCallback(async (email, password) => {
        const data = await api.post('/auth/login', { email, password })
        persistSession(data.user, data.token)
        return data
    }, [persistSession])

    // ── Register ──────────────────────────────────────────────────────
    const register = useCallback(async (email, password, name) => {
        const data = await api.post('/auth/register', { email, password, name })
        // Does NOT persist session yet, because they need to verify
        return data
    }, [])

    // ── Verify Email ──────────────────────────────────────────────────
    const verifyEmail = useCallback(async (email, code) => {
        const data = await api.post('/auth/verify-email', { email, code })
        persistSession(data.user, data.token)
        return data
    }, [persistSession])

    // ── Logout ────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
    }, [])

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        verifyEmail,
        logout,
        updateUser,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

/**
 * useAuth() — convenience hook
 * Throws if used outside of <AuthProvider>.
 */
export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error('useAuth() must be used within an <AuthProvider>')
    }
    return ctx
}
