import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authAPI } from '../api/services'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('riva_token') || null)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('riva_user')
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  })
  const [storeCode, setStoreCode] = useState(() => localStorage.getItem('riva_store_code') || 'DEFAULT')
  const [tenantSchema, setTenantSchema] = useState(() => localStorage.getItem('riva_tenant_schema') || 'store_default')

  // Real login function integrating with Spring Boot backend multi-schema API
  const login = useCallback(async (username, password, selectedStoreCode = '') => {
    try {
      const res = await authAPI.login({
        username,
        password,
        storeCode: selectedStoreCode ? selectedStoreCode.trim() : undefined
      })

      const data = res.data?.data || res.data
      const accessToken = data.accessToken
      const activeStoreCode = data.storeCode || selectedStoreCode || 'DEFAULT'
      const activeSchema = data.tenantSchema || `store_${activeStoreCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`

      const userInfo = {
        id: data.userId,
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        counterName: data.counterName,
        storeCode: activeStoreCode,
        tenantSchema: activeSchema
      }

      localStorage.setItem('riva_token', accessToken)
      localStorage.setItem('riva_user', JSON.stringify(userInfo))
      localStorage.setItem('riva_store_code', activeStoreCode)
      localStorage.setItem('riva_tenant_schema', activeSchema)

      setToken(accessToken)
      setUser(userInfo)
      setStoreCode(activeStoreCode)
      setTenantSchema(activeSchema)

      toast.success(`Welcome, ${userInfo.fullName}! (${activeStoreCode})`)
      return userInfo
    } catch (err) {
      // Fallback for offline UI demo if server is offline
      if (err.code === 'ERR_NETWORK' || !err.response) {
        console.warn('Backend server unreachable. Using fallback dev session.')
        const mockUser = {
          id: 1,
          username: username || 'admin',
          fullName: 'Dev Admin (Offline)',
          role: 'ADMIN',
          storeCode: selectedStoreCode || 'DEFAULT',
          tenantSchema: selectedStoreCode ? `store_${selectedStoreCode.toLowerCase()}` : 'store_default'
        }
        localStorage.setItem('riva_token', 'mock-dev-token-12345')
        localStorage.setItem('riva_user', JSON.stringify(mockUser))
        localStorage.setItem('riva_store_code', mockUser.storeCode)
        localStorage.setItem('riva_tenant_schema', mockUser.tenantSchema)

        setToken('mock-dev-token-12345')
        setUser(mockUser)
        setStoreCode(mockUser.storeCode)
        setTenantSchema(mockUser.tenantSchema)

        toast.success(`Offline Mode: Signed in as ${mockUser.fullName}`)
        return mockUser
      }

      const msg = err.response?.data?.message || 'Invalid username or password'
      toast.error(msg)
      throw err
    }
  }, [])

  // Switch active store context for multi-store queries
  const switchStore = useCallback((newStoreCode, newTenantSchema) => {
    localStorage.setItem('riva_store_code', newStoreCode)
    localStorage.setItem('riva_tenant_schema', newTenantSchema)
    setStoreCode(newStoreCode)
    setTenantSchema(newTenantSchema)

    setUser(prev => {
      if (!prev) return null
      const updated = { ...prev, storeCode: newStoreCode, tenantSchema: newTenantSchema }
      localStorage.setItem('riva_user', JSON.stringify(updated))
      return updated
    })
    toast.success(`Switched active store schema to: ${newStoreCode} (${newTenantSchema})`)
  }, [])

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('riva_token')
    localStorage.removeItem('riva_user')
    localStorage.removeItem('riva_store_code')
    localStorage.removeItem('riva_tenant_schema')

    setToken(null)
    setUser(null)
    setStoreCode('DEFAULT')
    setTenantSchema('store_default')
    toast.success('Logged out successfully')
  }, [])

  // Check role
  const hasRole = useCallback((...roles) => {
    return user ? roles.includes(user.role) : false
  }, [user])

  return (
    <AuthContext.Provider value={{ token, user, storeCode, tenantSchema, login, logout, switchStore, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)