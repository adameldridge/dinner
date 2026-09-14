import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium ${isActive ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}`

function UserMenu() {
  const { user, signOutUser } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initial = (user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Account menu"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-white hover:bg-slate-700"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          <p className="truncate px-3 py-2 text-sm text-slate-500">{user?.email}</p>
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-baseline gap-6">
            <span className="whitespace-nowrap text-lg font-bold tracking-tight text-slate-900">Dinner Planner</span>
            <nav className="flex gap-4">
              <NavLink to="/" end className={navLinkClass}>
                Calendar
              </NavLink>
              <NavLink to="/meals" className={navLinkClass}>
                Meals
              </NavLink>
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
