import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/auth-context'
import { actorName } from '../lib/actor'
import { formatFullDayLabel } from '../lib/dates'
import { getDay } from '../lib/days'
import { subscribeToMeals, type Meal } from '../lib/meals'
import {
  acceptProposalItem,
  createProposal,
  rejectProposalItem,
  subscribeToProposalItems,
  type DraftItem,
  type ProposalItem,
} from '../lib/proposals'

function statusLabel(item: ProposalItem): string {
  if (item.status === 'accepted') return `Accepted by ${item.respondedByName ?? 'them'}`
  if (item.status === 'rejected') return `Rejected by ${item.respondedByName ?? 'them'}`
  return 'Pending'
}

function statusClass(item: ProposalItem): string {
  if (item.status === 'accepted') return 'text-green-700'
  if (item.status === 'rejected') return 'text-red-600'
  return 'text-slate-500'
}

export function ProposalsPage() {
  const { user } = useAuth()
  const [meals, setMeals] = useState<Meal[]>([])
  const [items, setItems] = useState<ProposalItem[]>([])
  const [loading, setLoading] = useState(true)

  const [draftMealId, setDraftMealId] = useState('')
  const [draftDate, setDraftDate] = useState('')
  const [draftItems, setDraftItems] = useState<DraftItem[]>([])
  const [sending, setSending] = useState(false)
  const [respondingItemId, setRespondingItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => subscribeToMeals(setMeals), [])
  useEffect(
    () =>
      subscribeToProposalItems((loadedItems) => {
        setItems(loadedItems)
        setLoading(false)
      }),
    [],
  )

  function addDraftItem() {
    const meal = meals.find((m) => m.id === draftMealId)
    if (!meal || !draftDate) {
      setError('Choose a meal and a date.')
      return
    }
    setDraftItems((prev) => [...prev, { mealId: meal.id, mealName: meal.name, date: draftDate }])
    setDraftMealId('')
    setDraftDate('')
    setError(null)
  }

  function removeDraftItem(index: number) {
    setDraftItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSend() {
    if (!user || draftItems.length === 0) return
    setSending(true)
    setError(null)
    try {
      await createProposal(draftItems, { uid: user.uid, name: actorName(user) })
      setDraftItems([])
    } catch {
      setError('Failed to send proposal. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function handleAccept(item: ProposalItem) {
    if (!user) return
    const day = await getDay(item.date)
    if (day.meal && day.meal.mealId !== item.mealId) {
      const confirmed = window.confirm(
        `${formatFullDayLabel(item.date)} already has "${day.meal.mealName}" planned. Overwrite it with "${item.mealName}"?`,
      )
      if (!confirmed) return
    }
    setRespondingItemId(item.id)
    setError(null)
    try {
      await acceptProposalItem(item, { uid: user.uid, name: actorName(user) })
    } catch {
      setError('Failed to accept. Please try again.')
    } finally {
      setRespondingItemId(null)
    }
  }

  async function handleReject(item: ProposalItem) {
    if (!user) return
    setRespondingItemId(item.id)
    setError(null)
    try {
      await rejectProposalItem(item, { uid: user.uid, name: actorName(user) })
    } catch {
      setError('Failed to reject. Please try again.')
    } finally {
      setRespondingItemId(null)
    }
  }

  const incoming = items.filter((item) => item.status === 'pending' && item.proposedBy !== user?.uid)
  const incomingIds = new Set(incoming.map((item) => item.id))
  const history = items.filter((item) => !incomingIds.has(item.id))

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800">Proposals</h1>

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Propose meals</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            value={draftMealId}
            onChange={(e) => setDraftMealId(e.target.value)}
            className="flex-1 cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">Choose a meal…</option>
            {meals.map((meal) => (
              <option key={meal.id} value={meal.id}>
                {meal.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            className="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={addDraftItem}
            className="cursor-pointer rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Add to batch
          </button>
        </div>

        {draftItems.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {draftItems.map((item, index) => (
              <li key={`${item.date}-${item.mealId}-${index}`} className="flex items-center justify-between text-sm text-slate-700">
                <span>
                  {item.mealName} — {formatFullDayLabel(item.date)}
                </span>
                <button
                  type="button"
                  onClick={() => removeDraftItem(index)}
                  className="cursor-pointer text-slate-400 hover:text-red-600"
                  aria-label="Remove from batch"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={draftItems.length === 0 || sending}
          className="mt-3 cursor-pointer rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send proposal
        </button>
      </section>

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Awaiting your response</h2>
        {loading && <p className="mt-2 text-sm text-slate-500">Loading…</p>}
        {!loading && incoming.length === 0 && <p className="mt-2 text-sm text-slate-400">Nothing pending.</p>}
        {!loading && incoming.length > 0 && (
          <ul className="mt-2 divide-y divide-slate-100">
            {incoming.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                <div className="text-sm text-slate-700">
                  <p>
                    {item.mealName} — {formatFullDayLabel(item.date)}
                  </p>
                  <p className="text-xs text-slate-400">Proposed by {item.proposedByName}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => void handleAccept(item)}
                    disabled={respondingItemId === item.id}
                    className="cursor-pointer rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReject(item)}
                    disabled={respondingItemId === item.id}
                    className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">History</h2>
        {!loading && history.length === 0 && <p className="mt-2 text-sm text-slate-400">No proposals yet.</p>}
        {!loading && history.length > 0 && (
          <ul className="mt-2 divide-y divide-slate-100">
            {history.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="text-slate-700">
                  <p>
                    {item.mealName} — {formatFullDayLabel(item.date)}
                  </p>
                  <p className="text-xs text-slate-400">Proposed by {item.proposedByName}</p>
                </div>
                <span className={`shrink-0 text-xs font-medium ${statusClass(item)}`}>{statusLabel(item)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
