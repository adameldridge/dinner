import type { User } from 'firebase/auth'
import { createContext, useContext } from 'react'

interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
