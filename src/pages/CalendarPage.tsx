import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, formatDayLabel, toDateId } from '../lib/dates'
import { type Day, subscribeToDaysInRange } from '../lib/days'

const ROLLING_WINDOW_DAYS = 21

function summarize(day: Day | undefined): { text: string; muted: boolean } {
  if (day?.meal) return { text: day.meal.mealName, muted: false }
  if (day?.notHome.length) {
    const names = day.notHome.map((entry) => entry.name).join(' & ')
    return { text: `${names} not home`, muted: false }
  }
  return { text: 'No plan yet', muted: true }
}

export function CalendarPage() {
  const dateIds = useMemo(
    () => Array.from({ length: ROLLING_WINDOW_DAYS }, (_, i) => toDateId(addDays(new Date(), i))),
    [],
  )
  const [days, setDays] = useState<Record<string, Day>>({})
  const [loading, setLoading] = useState(true)
  const today = dateIds[0]

  useEffect(() => {
    return subscribeToDaysInRange(dateIds[0], dateIds[dateIds.length - 1], (loadedDays) => {
      setDays(Object.fromEntries(loadedDays.map((day) => [day.id, day])))
      setLoading(false)
    })
  }, [dateIds])

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800">Calendar</h1>

      <div className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
        {loading && <p className="p-4 text-sm text-slate-500">Loading…</p>}

        {!loading &&
          dateIds.map((dateId) => {
            const { text, muted } = summarize(days[dateId])
            return (
              <Link
                key={dateId}
                to={`/day/${dateId}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
              >
                <span className={`text-sm font-medium ${dateId === today ? 'text-slate-800' : 'text-slate-600'}`}>
                  {formatDayLabel(dateId)}
                  {dateId === today && <span className="ml-2 text-xs text-slate-400">Today</span>}
                </span>
                <span className={`truncate text-sm ${muted ? 'text-slate-400' : 'text-slate-700'}`}>{text}</span>
              </Link>
            )
          })}
      </div>
    </div>
  )
}
