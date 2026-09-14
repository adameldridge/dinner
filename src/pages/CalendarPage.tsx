import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/auth-context'
import { addDays, formatDayLabel, toDateId } from '../lib/dates'
import { assignMeal, clearDay, setNotHome, subscribeToDaysInRange, type Day, type NotHomeEntry } from '../lib/days'
import { subscribeToMeals, type Meal } from '../lib/meals'
import { subscribeToUsers, type AppUser } from '../lib/users'

const ROLLING_WINDOW_DAYS = 21

type DayStatus = 'meal' | 'notHome' | 'empty'

function summarize(day: Day | undefined): { text: string; status: DayStatus } {
  if (day?.meal) return { text: day.meal.mealName, status: 'meal' }
  if (day?.notHome.length) {
    const names = day.notHome.map((entry) => entry.name).join(' & ')
    return { text: `${names} not home`, status: 'notHome' }
  }
  return { text: 'No plan yet', status: 'empty' }
}

function weekLabelForIndex(weekIndex: number): string {
  if (weekIndex === 0) return 'This week'
  if (weekIndex === 1) return 'Next week'
  return `In ${weekIndex} weeks`
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
  users,
  onDone,
}: {
  dateId: string
  day: Day
  meals: Meal[]
  users: AppUser[]
  onDone: () => void
}) {
  const { user } = useAuth()
  const [selectedMealId, setSelectedMealId] = useState(day.meal?.mealId ?? '')
  const [notHomeChecked, setNotHomeChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(users.map((u) => [u.email, day.notHome.some((entry) => entry.email === u.email)])),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const anyNotHomeChecked = users.some((u) => notHomeChecked[u.email])

  function selectMeal(mealId: string) {
    setSelectedMealId(mealId)
    if (mealId) {
      setNotHomeChecked(Object.fromEntries(users.map((u) => [u.email, false])))
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
        const actorAppUser = users.find((u) => u.email === user.email)
        await assignMeal(
          dateId,
          { mealId: meal.id, mealName: meal.name },
          { uid: user.uid, name: actorAppUser?.name ?? user.email ?? 'Someone' },
        )
      } else if (users.some((u) => notHomeChecked[u.email])) {
        const entries: NotHomeEntry[] = users
          .filter((u) => notHomeChecked[u.email])
          .map((u) => ({ email: u.email, name: u.name, reason: '' }))
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
      {!anyNotHomeChecked && (
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
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-700">Mark not home</h3>
        <div className="mt-2 space-y-2">
          {users.map((u) => (
            <label
              key={u.email}
              htmlFor={`not-home-${dateId}-${u.email}`}
              className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                id={`not-home-${dateId}-${u.email}`}
                checked={notHomeChecked[u.email] ?? false}
                onChange={(e) => toggleNotHome(u.email, e.target.checked)}
                className="cursor-pointer"
              />
              {u.email === user?.email ? 'You' : u.name}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          className="cursor-pointer rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
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

function DayRow({
  dateId,
  day,
  meals,
  users,
  isToday,
  isExpanded,
  onToggle,
}: {
  dateId: string
  day: Day
  meals: Meal[]
  users: AppUser[]
  isToday: boolean
  isExpanded: boolean
  onToggle: () => void
}) {
  const { text, status } = summarize(day)
  const isNotHome = status === 'notHome'
  const hasMeal = status === 'meal'

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
          isExpanded
            ? 'bg-slate-100'
            : isNotHome
              ? 'bg-slate-50 hover:bg-slate-100'
              : hasMeal
                ? 'bg-green-50 hover:bg-green-100'
                : 'hover:bg-slate-50'
        }`}
      >
        <span className={`text-sm font-medium ${isNotHome ? 'text-slate-400' : isToday ? 'text-slate-800' : 'text-slate-600'}`}>
          {formatDayLabel(dateId)}
          {isToday && <span className="ml-2 text-xs text-slate-400">Today</span>}
        </span>
        <span className={`truncate text-sm ${status === 'empty' ? 'text-slate-400' : 'text-slate-700'}`}>{text}</span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <DayEditor key={isExpanded ? 'open' : 'closed'} dateId={dateId} day={day} meals={meals} users={users} onDone={onToggle} />
        </div>
      </div>
    </div>
  )
}

export function CalendarPage() {
  const dateIds = useMemo(
    () => Array.from({ length: ROLLING_WINDOW_DAYS }, (_, i) => toDateId(addDays(new Date(), i))),
    [],
  )
  const weeks = useMemo(() => {
    const chunks: string[][] = []
    for (let i = 0; i < dateIds.length; i += 7) {
      chunks.push(dateIds.slice(i, i + 7))
    }
    return chunks
  }, [dateIds])
  const [days, setDays] = useState<Record<string, Day>>({})
  const [meals, setMeals] = useState<Meal[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
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
  useEffect(() => subscribeToUsers(setUsers), [])

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800">Calendar</h1>

      {loading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}

      {!loading && (
        <div className="mt-4 space-y-6">
          {weeks.map((weekDateIds, weekIndex) => (
            <div key={weekDateIds[0]}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {weekLabelForIndex(weekIndex)}
              </h2>
              <div className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
                {weekDateIds.map((dateId) => (
                  <DayRow
                    key={dateId}
                    dateId={dateId}
                    day={days[dateId] ?? { id: dateId, meal: null, notHome: [] }}
                    meals={meals}
                    users={users}
                    isToday={dateId === today}
                    isExpanded={expandedDateId === dateId}
                    onToggle={() => setExpandedDateId((prev) => (prev === dateId ? null : dateId))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
