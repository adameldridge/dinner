import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/auth-context'
import { ALLOWED_EMAILS } from '../lib/allowlist'
import { addDays, formatDayLabel, toDateId } from '../lib/dates'
import { assignMeal, clearDay, setNotHome, subscribeToDaysInRange, type Day, type NotHomeEntry } from '../lib/days'
import { subscribeToMeals, type Meal } from '../lib/meals'

const ROLLING_WINDOW_DAYS = 21

function summarize(day: Day | undefined): { text: string; muted: boolean } {
  if (day?.meal) return { text: day.meal.mealName, muted: false }
  if (day?.notHome.length) {
    const names = day.notHome.map((entry) => entry.name).join(' & ')
    return { text: `${names} not home`, muted: false }
  }
  return { text: 'No plan yet', muted: true }
}

function actorName(user: { displayName: string | null; email: string | null }): string {
  return user.displayName || user.email || 'Someone'
}

function Spinner() {
  return (
    <div className="flex justify-center py-6">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
    </div>
  )
}

function DayEditor({
  dateId,
  day,
  meals,
  onDone,
}: {
  dateId: string
  day: Day
  meals: Meal[]
  onDone: () => void
}) {
  const { user } = useAuth()
  const [selectedMealId, setSelectedMealId] = useState(day.meal?.mealId ?? '')
  const [notHomeChecked, setNotHomeChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(ALLOWED_EMAILS.map((email) => [email, day.notHome.some((entry) => entry.email === email)])),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!user) return

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
      onDone()
    } catch {
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  if (saving) {
    return <Spinner />
  }

  return (
    <form
      onSubmit={(e) => void handleSave(e)}
      className="space-y-4 border-t border-slate-200 bg-slate-50 px-4 py-4"
    >
      <div>
        <h3 className="text-sm font-semibold text-slate-700">Assign a meal</h3>
        <select
          value={selectedMealId}
          onChange={(e) => selectMeal(e.target.value)}
          className="mt-2 w-full cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
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
        <h3 className="text-sm font-semibold text-slate-700">Or mark not home</h3>
        <div className="mt-2 space-y-2">
          {ALLOWED_EMAILS.map((email) => (
            <label
              key={email}
              htmlFor={`not-home-${dateId}-${email}`}
              className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                id={`not-home-${dateId}-${email}`}
                checked={notHomeChecked[email] ?? false}
                onChange={(e) => toggleNotHome(email, e.target.checked)}
                className="cursor-pointer"
              />
              {email === user?.email ? 'You' : email.split('@')[0]}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          className="cursor-pointer rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className="cursor-pointer rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export function CalendarPage() {
  const dateIds = useMemo(
    () => Array.from({ length: ROLLING_WINDOW_DAYS }, (_, i) => toDateId(addDays(new Date(), i))),
    [],
  )
  const [days, setDays] = useState<Record<string, Day>>({})
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDateId, setExpandedDateId] = useState<string | null>(null)
  const today = dateIds[0]

  useEffect(() => {
    return subscribeToDaysInRange(dateIds[0], dateIds[dateIds.length - 1], (loadedDays) => {
      setDays(Object.fromEntries(loadedDays.map((day) => [day.id, day])))
      setLoading(false)
    })
  }, [dateIds])

  useEffect(() => subscribeToMeals(setMeals), [])

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800">Calendar</h1>

      <div className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
        {loading && <p className="p-4 text-sm text-slate-500">Loading…</p>}

        {!loading &&
          dateIds.map((dateId) => {
            const day = days[dateId] ?? { id: dateId, meal: null, notHome: [] }
            const { text, muted } = summarize(day)
            const isExpanded = expandedDateId === dateId

            return (
              <div key={dateId}>
                <button
                  type="button"
                  onClick={() => setExpandedDateId(isExpanded ? null : dateId)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
                    isExpanded ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-sm font-medium ${dateId === today ? 'text-slate-800' : 'text-slate-600'}`}>
                    {formatDayLabel(dateId)}
                    {dateId === today && <span className="ml-2 text-xs text-slate-400">Today</span>}
                  </span>
                  <span className={`truncate text-sm ${muted ? 'text-slate-400' : 'text-slate-700'}`}>{text}</span>
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <DayEditor
                      key={isExpanded ? 'open' : 'closed'}
                      dateId={dateId}
                      day={day}
                      meals={meals}
                      onDone={() => setExpandedDateId(null)}
                    />
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
