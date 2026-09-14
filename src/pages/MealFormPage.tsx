import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'
import { archiveMeal, createMeal, getMeal, updateMeal } from '../lib/meals'

export function MealFormPage() {
  const { id: mealId } = useParams<{ id: string }>()
  const isEditing = Boolean(mealId)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([''])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(isEditing)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mealId) return
    getMeal(mealId).then((meal) => {
      if (!meal) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setName(meal.name)
      setIngredients(meal.ingredients.length > 0 ? meal.ingredients : [''])
      setNotes(meal.notes)
      setLoading(false)
    })
  }, [mealId])

  function updateIngredient(index: number, value: string) {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? value : ing)))
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, ''])
  }

  function removeIngredientRow(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Name is required.')
      return
    }

    const cleanIngredients = ingredients.map((ing) => ing.trim()).filter(Boolean)
    const input = { name: trimmedName, ingredients: cleanIngredients, notes: notes.trim() }

    setSaving(true)
    setError(null)
    try {
      if (mealId) {
        await updateMeal(mealId, input)
      } else {
        await createMeal(input, user.uid)
      }
      navigate('/meals')
    } catch {
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!mealId) return
    if (!window.confirm('Remove this meal from the repertoire?')) return

    setSaving(true)
    try {
      await archiveMeal(mealId)
      navigate('/meals')
    } catch {
      setError('Failed to remove. Please try again.')
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading…</p>
  }

  if (notFound) {
    return (
      <div>
        <p className="text-sm text-slate-500">This meal couldn't be found.</p>
        <Link to="/meals" className="mt-2 inline-block text-sm text-slate-700 underline">
          Back to meals
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800">{isEditing ? 'Edit meal' : 'Add meal'}</h1>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
        <div>
          <label htmlFor="meal-name" className="block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="meal-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700">Ingredients</span>
          <div className="mt-1 space-y-2">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => updateIngredient(index, e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeIngredientRow(index)}
                  className="cursor-pointer rounded-md border border-slate-300 px-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Remove ingredient"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredientRow}
            className="mt-2 cursor-pointer text-sm text-slate-600 underline"
          >
            + Add ingredient
          </button>
        </div>

        <div>
          <label htmlFor="meal-notes" className="block text-sm font-medium text-slate-700">
            Notes (optional)
          </label>
          <textarea
            id="meal-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <Link
              to="/meals"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Link>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={saving}
              className="cursor-pointer text-sm text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove meal
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
