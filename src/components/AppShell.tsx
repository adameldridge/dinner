import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium ${isActive ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}`

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOutUser } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="whitespace-nowrap font-semibold text-slate-800">Dinner Planner</span>
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
            <span className="max-w-36 truncate sm:max-w-none">{user?.email}</span>
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="shrink-0 cursor-pointer rounded-md border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
