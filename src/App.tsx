import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/auth-context'
import { HomePage } from './pages/HomePage'
import { MealFormPage } from './pages/MealFormPage'
import { MealsPage } from './pages/MealsPage'
import { SignInPage } from './pages/SignInPage'

function AuthGate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <SignInPage />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/meals" element={<MealsPage />} />
        <Route path="/meals/new" element={<MealFormPage />} />
        <Route path="/meals/:id/edit" element={<MealFormPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
