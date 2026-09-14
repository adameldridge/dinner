import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'
import { ALLOWED_EMAILS } from '../lib/allowlist'
import { formatFullDayLabel } from '../lib/dates'
import { assignMeal, clearDay, setNotHome, subscribeToDay, type Day, type NotHomeEntry } from '../lib/days'
import { subscribeToMeals, type Meal } from '../lib/meals'

function actorName(user: { displayName: string | null; email: string | null }): string {
  return user.displayName || user.email || 'Someone'
}

export function DayDetailPage() {
  const { date: dateId } = useParams<{ date: string }>()
  const { user } = useAuth()
  const [day, setDay] = useState<Day | null>(null)
  const [meals, setMeals] = useState<Meal[]>([])
  const [selectedMealId, setSelectedMealId] = useState('')
  const [notHomeDrafts, setNotHomeDrafts] = useState<Record<string, { checked: boolean; reason: string }>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!dateId) return
    return subscribeToDay(dateId, (loadedDay) => {
      setDay(loadedDay)
      setSelectedMealId(loadedDay.meal?.mealId ?? '')
      setNotHomeDrafts((prev) => {
        const next: Record<string, { checked: boolean; reason: string }> = {}
        for (const email of ALLOWED_EMAILS) {
          const existing = loadedDay.notHome.find((entry) => entry.email === email)
          next[email] = existing
            ? { checked: true, reason: existing.reason }
            : { checked: false, reason: prev[email]?.reason ?? '' }
        }
        return next
      })
    })
  }, [dateId])

  useEffect(() => subscribeToMeals(setMeals), [])

  const otherEmail = useMemo(() => ALLOWED_EMAILS.find((email) => email !== user?.email), [user])

  if (!dateId || !day || !user) {
    return <p className="text-sm text-slate-500">Loading…</p>
  }

  async function handleAssignMeal(e: FormEvent) {
    e.preventDefault()
    if (!user || !dateId) return
    const meal = meals.find((m) => m.id === selectedMealId)
    if (!meal) {
      setError('Choose a meal first.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await assignMeal(dateId, { mealId: meal.id, mealName: meal.name }, { uid: user.uid, name: actorName(user) })
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveNotHome() {
    if (!dateId) return
    const entries: NotHomeEntry[] = ALLOWED_EMAILS.filter((email) => notHomeDrafts[email]?.checked).map((email) => ({
      email,
      name: email === user?.email ? actorName(user) : email.split('@')[0],
      reason: notHomeDrafts[email]?.reason.trim() ?? '',
    }))

    setSaving(true)
    setError(null)
    try {
      await setNotHome(dateId, entries)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleClear() {
    if (!dateId) return
    if (!window.confirm('Clear this day back to unplanned?')) return
    setSaving(true)
    try {
      await clearDay(dateId)
    } catch {
      setError('Failed to clear. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="text-sm text-slate-500 hover:underline">
        ← Back to calendar
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-slate-800">{formatFullDayLabel(dateId)}</h1>

      {day.meal && (
        <p className="mt-2 text-sm text-slate-600">
          Currently: <span className="font-medium text-slate-800">{day.meal.mealName}</span> (assigned by{' '}
          {day.meal.assignedByName})
        </p>
      )}
      {day.notHome.length > 0 && (
        <ul className="mt-2 text-sm text-slate-600">
          {day.notHome.map((entry) => (
            <li key={entry.email}>
              {entry.name} not home{entry.reason ? ` — ${entry.reason}` : ''}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Assign a meal</h2>
        <form onSubmit={(e) => void handleAssignMeal(e)} className="mt-2 flex gap-2">
          <select
            value={selectedMealId}
            onChange={(e) => setSelectedMealId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">Choose a meal…</option>
            {meals.map((meal) => (
              <option key={meal.id} value={meal.id}>
                {meal.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="whitespace-nowrap rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Assign
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Mark not home</h2>
        <div className="mt-2 space-y-3">
          {ALLOWED_EMAILS.map((email) => (
            <div key={email} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`not-home-${email}`}
                checked={notHomeDrafts[email]?.checked ?? false}
                onChange={(e) =>
                  setNotHomeDrafts((prev) => ({
                    ...prev,
                    [email]: { ...prev[email], checked: e.target.checked, reason: prev[email]?.reason ?? '' },
                  }))
                }
              />
              <label htmlFor={`not-home-${email}`} className="w-40 text-sm text-slate-700">
                {email === user.email ? 'You' : otherEmail === email ? email.split('@')[0] : email}
              </label>
              <input
                type="text"
                placeholder="Reason"
                value={notHomeDrafts[email]?.reason ?? ''}
                onChange={(e) =>
                  setNotHomeDrafts((prev) => ({
                    ...prev,
                    [email]: { ...prev[email], checked: prev[email]?.checked ?? false, reason: e.target.value },
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void handleSaveNotHome()}
          disabled={saving}
          className="mt-3 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Save
        </button>
      </section>

      <button
        type="button"
        onClick={() => void handleClear()}
        disabled={saving}
        className="mt-4 text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        Clear day
      </button>
    </div>
  )
}
