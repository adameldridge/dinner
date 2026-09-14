import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium ${isActive ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}`

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOutUser } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-slate-800">Dinner Planner</span>
          <nav className="flex gap-4">
            <NavLink to="/" end className={navLinkClass}>
              Calendar
            </NavLink>
            <NavLink to="/meals" className={navLinkClass}>
              Meals
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>{user?.email}</span>
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="rounded-md border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
