import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/auth-context'
import { actorName } from '../lib/actor'
import { formatFullDayLabel } from '../lib/dates'
import { getDay } from '../lib/days'
import { acceptProposalItem, rejectProposalItem, subscribeToProposalItems, type ProposalItem } from '../lib/proposals'

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
  const [items, setItems] = useState<ProposalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [respondingItemId, setRespondingItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () =>
      subscribeToProposalItems((loadedItems) => {
        setItems(loadedItems)
        setLoading(false)
      }),
    [],
  )

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
      <p className="mt-1 text-sm text-slate-500">
        Propose a meal for a day from the Calendar — it lands here for the other person to accept or reject.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

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
