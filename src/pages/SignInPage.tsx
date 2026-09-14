import { useAuth } from '../contexts/auth-context'

export function SignInPage() {
  const { signIn, error } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-800">Dinner Planner</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in with your Google account to continue.</p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={() => void signIn()}
          className="mt-6 w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
