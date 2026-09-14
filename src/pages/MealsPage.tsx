import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { type Meal, subscribeToMeals } from '../lib/meals'

export function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    return subscribeToMeals((loadedMeals) => {
      setMeals(loadedMeals)
      setLoading(false)
    })
  }, [])

  const filteredMeals = useMemo(() => {
    const trimmed = search.trim().toLowerCase()
    if (!trimmed) return meals
    return meals.filter((meal) => meal.name.toLowerCase().includes(trimmed))
  }, [meals, search])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-slate-800">Meals</h1>
        <Link
          to="/meals/new"
          className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Add meal
        </Link>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search meals…"
        className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />

      <div className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
        {loading && <p className="p-4 text-sm text-slate-500">Loading…</p>}

        {!loading && filteredMeals.length === 0 && (
          <p className="p-4 text-sm text-slate-500">
            {meals.length === 0 ? 'No meals yet — add your first one.' : 'No meals match your search.'}
          </p>
        )}

        {filteredMeals.map((meal) => (
          <Link
            key={meal.id}
            to={`/meals/${meal.id}/edit`}
            className="block px-4 py-3 hover:bg-slate-50"
          >
            <p className="font-medium text-slate-800">{meal.name}</p>
            {meal.ingredients.length > 0 && (
              <p className="mt-0.5 truncate text-sm text-slate-500">{meal.ingredients.join(', ')}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
