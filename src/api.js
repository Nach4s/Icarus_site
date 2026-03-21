// ═══════════════════════════════════════════════════════════════════════
// ICARUS — API Wrapper
// Centralised fetch helper with automatic JWT injection
// ═══════════════════════════════════════════════════════════════════════

const API_BASE = '/api'

/**
 * Core fetch wrapper.
 *
 * - Automatically sets `Content-Type: application/json`
 * - Reads JWT from localStorage and attaches `Authorization: Bearer <token>`
 * - Parses JSON response and throws on non-2xx status codes
 *
 * @param {string}  endpoint  — path relative to API_BASE, e.g. "/auth/login"
 * @param {object}  options   — standard fetch options (method, body, headers…)
 * @returns {Promise<any>}    — parsed JSON body
 */
export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('icarus_token')

    const headers = {
        ...options.headers,
    }

    // Only force JSON if the body is not FormData
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    })

    // Parse body (may be empty on 204, etc.)
    let data
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
        data = await res.json()
    }

    if (!res.ok) {
        const message = data?.error || `Request failed (${res.status})`
        const err = new Error(message)
        err.status = res.status
        err.data = data
        throw err
    }

    return data
}

// ─── Convenience helpers ─────────────────────────────────────────────

export const api = {
    get: (endpoint) => apiFetch(endpoint, { method: 'GET' }),

    post: (endpoint, body) =>
        apiFetch(endpoint, {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body),
        }),

    put: (endpoint, body) =>
        apiFetch(endpoint, {
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body),
        }),

    delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' }),

    patch: (endpoint, body) =>
        apiFetch(endpoint, {
            method: 'PATCH',
            body: body instanceof FormData ? body : JSON.stringify(body),
        }),
}

export const getLeaderboard = () => apiFetch('/leaderboard');
