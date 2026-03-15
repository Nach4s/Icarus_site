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

    // ── Hydrate from localStorage on mount ────────────────────────────
    useEffect(() => {
        try {
            const savedToken = localStorage.getItem(TOKEN_KEY)
            const savedUser = localStorage.getItem(USER_KEY)

            if (savedToken && savedUser) {
                setToken(savedToken)
                setUser(JSON.parse(savedUser))
            }
        } catch {
            // Corrupted storage — wipe it
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // ── Persist helper ────────────────────────────────────────────────
    const persistSession = useCallback((userData, jwtToken) => {
        localStorage.setItem(TOKEN_KEY, jwtToken)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
        setToken(jwtToken)
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
        logout,
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
