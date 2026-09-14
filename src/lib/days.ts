import {
  collection,
  doc,
  documentId,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

export interface DayMeal {
  mealId: string
  mealName: string
  assignedBy: string
  assignedByName: string
  assignedAt: Timestamp | null
  source: 'manual' | 'proposal'
}

export interface NotHomeEntry {
  email: string
  name: string
  reason: string
}

export interface Day {
  id: string
  meal: DayMeal | null
  notHome: NotHomeEntry[]
}

function emptyDay(dateId: string): Day {
  return { id: dateId, meal: null, notHome: [] }
}

const daysCollection = collection(db, 'days')

export function subscribeToDay(dateId: string, onChange: (day: Day) => void): Unsubscribe {
  return onSnapshot(doc(daysCollection, dateId), (snap) => {
    onChange(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Day, 'id'>) }) : emptyDay(dateId))
  })
}

export async function getDay(dateId: string): Promise<Day> {
  const snap = await getDoc(doc(daysCollection, dateId))
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Day, 'id'>) } : emptyDay(dateId)
}

export function subscribeToDaysInRange(
  startDateId: string,
  endDateId: string,
  onChange: (days: Day[]) => void,
): Unsubscribe {
  const rangeQuery = query(
    daysCollection,
    where(documentId(), '>=', startDateId),
    where(documentId(), '<=', endDateId),
  )
  return onSnapshot(rangeQuery, (snapshot) => {
    onChange(snapshot.docs.map((dayDoc) => ({ id: dayDoc.id, ...(dayDoc.data() as Omit<Day, 'id'>) })))
  })
}

export async function assignMeal(
  dateId: string,
  meal: { mealId: string; mealName: string },
  actor: { uid: string; name: string },
): Promise<void> {
  await setDoc(doc(daysCollection, dateId), {
    meal: {
      mealId: meal.mealId,
      mealName: meal.mealName,
      assignedBy: actor.uid,
      assignedByName: actor.name,
      assignedAt: serverTimestamp(),
      source: 'manual',
    },
    notHome: [],
  })
}

export async function setNotHome(dateId: string, notHome: NotHomeEntry[]): Promise<void> {
  await setDoc(doc(daysCollection, dateId), { meal: null, notHome })
}

export async function clearDay(dateId: string): Promise<void> {
  await setDoc(doc(daysCollection, dateId), { meal: null, notHome: [] })
}
