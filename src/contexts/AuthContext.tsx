import { FirebaseError } from 'firebase/app'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { useEffect, useState, type ReactNode } from 'react'
import { isAllowedEmail } from '../lib/allowlist'
import { auth, googleProvider } from '../lib/firebase'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && !isAllowedEmail(firebaseUser.email)) {
        setError('This app is private — that Google account is not authorized.')
        void firebaseSignOut(auth)
        setUser(null)
        setLoading(false)
        return
      }

      setUser(firebaseUser)
      setLoading(false)
    })
  }, [])

  async function signIn() {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      const dismissed =
        err instanceof FirebaseError &&
        (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request')
      if (!dismissed) {
        setError('Sign-in failed. Please try again.')
      }
    }
  }

  async function signOutUser() {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}
