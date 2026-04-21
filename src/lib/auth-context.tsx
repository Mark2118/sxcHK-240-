'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface UserInfo {
  id: string
  openid: string
  nickname?: string
  avatar?: string
  freeUsesLeft?: number
  membershipType?: string
  membershipExpiresAt?: string
}

interface AuthContextType {
  user: UserInfo | null
  token: string | null
  loading: boolean
  login: (token: string, user: UserInfo) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 从 localStorage 恢复登录状态
  useEffect(() => {
    const savedToken = localStorage.getItem('xsc_token')
    if (savedToken) {
      setToken(savedToken)
      fetchUser(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch('/xsc/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const data = await res.json()
      if (data.success && data.user) {
        setUser(data.user)
      } else {
        // Token 失效，清除
        localStorage.removeItem('xsc_token')
        setToken(null)
      }
    } catch (e) {
      console.error('获取用户信息失败:', e)
    } finally {
      setLoading(false)
    }
  }

  const login = useCallback((newToken: string, newUser: UserInfo) => {
    localStorage.setItem('xsc_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('xsc_token')
    setToken(null)
    setUser(null)
    // 可选：调用后端登出接口
    fetch('/xsc/api/auth/logout', { method: 'POST' }).catch(() => {})
  }, [])

  const refreshUser = useCallback(async () => {
    if (token) {
      await fetchUser(token)
    }
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
