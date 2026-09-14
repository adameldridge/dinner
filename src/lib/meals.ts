import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

export interface Meal {
  id: string
  name: string
  ingredients: string[]
  notes: string
  active: boolean
  createdBy: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export interface MealInput {
  name: string
  ingredients: string[]
  notes: string
}

const mealsCollection = collection(db, 'meals')

export function subscribeToMeals(onChange: (meals: Meal[]) => void): Unsubscribe {
  const activeMealsQuery = query(mealsCollection, where('active', '==', true), orderBy('name'))
  return onSnapshot(activeMealsQuery, (snapshot) => {
    onChange(snapshot.docs.map((mealDoc) => ({ id: mealDoc.id, ...(mealDoc.data() as Omit<Meal, 'id'>) })))
  })
}

export async function getMeal(mealId: string): Promise<Meal | null> {
  const snap = await getDoc(doc(db, 'meals', mealId))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Meal, 'id'>) }
}

export async function createMeal(input: MealInput, createdBy: string): Promise<string> {
  const docRef = await addDoc(mealsCollection, {
    ...input,
    active: true,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateMeal(mealId: string, input: MealInput): Promise<void> {
  await updateDoc(doc(db, 'meals', mealId), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function archiveMeal(mealId: string): Promise<void> {
  await updateDoc(doc(db, 'meals', mealId), {
    active: false,
    updatedAt: serverTimestamp(),
  })
}
