import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'
import { ALLOWED_EMAILS } from '../lib/allowlist'
import { formatFullDayLabel } from '../lib/dates'
import { assignMeal, clearDay, setNotHome, subscribeToDay, type Day, type NotHomeEntry } from '../lib/days'
import { subscribeToMeals, type Meal } from '../lib/meals'

function actorName(user: { displayName: string | null; email: string | null }): string {
  return user.displayName || user.email || 'Someone'
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
    </div>
  )
}

export function DayDetailPage() {
  const { date: dateId } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [day, setDay] = useState<Day | null>(null)
  const [meals, setMeals] = useState<Meal[]>([])
  const [selectedMealId, setSelectedMealId] = useState('')
  const [notHomeChecked, setNotHomeChecked] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!dateId) return
    return subscribeToDay(dateId, (loadedDay) => {
      setDay(loadedDay)
      setSelectedMealId(loadedDay.meal?.mealId ?? '')
      setNotHomeChecked(
        Object.fromEntries(ALLOWED_EMAILS.map((email) => [email, loadedDay.notHome.some((entry) => entry.email === email)])),
      )
    })
  }, [dateId])

  useEffect(() => subscribeToMeals(setMeals), [])

  if (!dateId || !day || !user) {
    return <p className="text-sm text-slate-500">Loading…</p>
  }

  function selectMeal(mealId: string) {
    setSelectedMealId(mealId)
    if (mealId) {
      setNotHomeChecked(Object.fromEntries(ALLOWED_EMAILS.map((email) => [email, false])))
    }
  }

  function toggleNotHome(email: string, checked: boolean) {
    setNotHomeChecked((prev) => ({ ...prev, [email]: checked }))
    if (checked) {
      setSelectedMealId('')
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!user || !dateId) return

    setSaving(true)
    setError(null)
    try {
      if (selectedMealId) {
        const meal = meals.find((m) => m.id === selectedMealId)
        if (!meal) {
          setError('Choose a meal first.')
          setSaving(false)
          return
        }
        await assignMeal(dateId, { mealId: meal.id, mealName: meal.name }, { uid: user.uid, name: actorName(user) })
      } else if (ALLOWED_EMAILS.some((email) => notHomeChecked[email])) {
        const entries: NotHomeEntry[] = ALLOWED_EMAILS.filter((email) => notHomeChecked[email]).map((email) => ({
          email,
          name: email === user.email ? actorName(user) : email.split('@')[0],
          reason: '',
        }))
        await setNotHome(dateId, entries)
      } else {
        await clearDay(dateId)
      }
      navigate('/')
    } catch {
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  async function handleClear() {
    if (!dateId) return
    if (!window.confirm('Clear this day back to unplanned?')) return
    setSaving(true)
    try {
      await clearDay(dateId)
      navigate('/')
    } catch {
      setError('Failed to clear. Please try again.')
      setSaving(false)
    }
  }

  if (saving) {
    return <Spinner />
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
            <li key={entry.email}>{entry.name} not home</li>
          ))}
        </ul>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={(e) => void handleSave(e)} className="mt-6 space-y-4 rounded-md border border-slate-200 bg-white p-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Assign a meal</h2>
          <select
            value={selectedMealId}
            onChange={(e) => selectMeal(e.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">Choose a meal…</option>
            {meals.map((meal) => (
              <option key={meal.id} value={meal.id}>
                {meal.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-700">Or mark not home</h2>
          <div className="mt-2 space-y-2">
            {ALLOWED_EMAILS.map((email) => (
              <label key={email} htmlFor={`not-home-${email}`} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  id={`not-home-${email}`}
                  checked={notHomeChecked[email] ?? false}
                  onChange={(e) => toggleNotHome(email, e.target.checked)}
                />
                {email === user.email ? 'You' : email.split('@')[0]}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Save
        </button>
      </form>

      <button type="button" onClick={() => void handleClear()} className="mt-4 text-sm text-red-600 hover:underline">
        Clear day
      </button>
    </div>
  )
}
