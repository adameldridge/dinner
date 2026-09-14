import { collection, doc, getDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'

export interface AppUser {
  email: string
  name: string
}

const usersCollection = collection(db, 'users')

// A document existing at users/{email} is what firestore.rules checks to
// decide access — this collection *is* the allowlist. Manage membership by
// adding/removing documents directly in the Firebase console; there's no
// in-app admin UI for it by design.
export async function isAllowedEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  const snap = await getDoc(doc(usersCollection, email))
  return snap.exists()
}

export function subscribeToUsers(onChange: (users: AppUser[]) => void): Unsubscribe {
  return onSnapshot(usersCollection, (snapshot) => {
    onChange(
      snapshot.docs.map((userDoc) => ({
        email: userDoc.id,
        name: (userDoc.data().name as string | undefined) ?? userDoc.id,
      })),
    )
  })
}
