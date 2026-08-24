import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => api.getToken())
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    api.setToken(null)
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!api.getToken()) {
      setLoading(false)
      return
    }
    try {
      const data = await api.members.me()
      setUser(data.member)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (credentials) => {
    const data = await api.auth.login(credentials)
    api.setToken(data.token)
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role_name === 'Admin',
    isLeader: user?.role_name === 'Leader',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}