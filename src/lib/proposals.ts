import {
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

export type ProposalStatus = 'pending' | 'accepted' | 'rejected'

export interface ProposalItem {
  id: string
  proposalId: string
  mealId: string
  mealName: string
  date: string
  status: ProposalStatus
  proposedBy: string
  proposedByName: string
  respondedBy?: string
  respondedByName?: string
  respondedAt?: Timestamp | null
}

export interface DraftItem {
  mealId: string
  mealName: string
  date: string
}

export function subscribeToProposalItems(onChange: (items: ProposalItem[]) => void): Unsubscribe {
  const itemsQuery = query(collectionGroup(db, 'items'), orderBy('date'))
  return onSnapshot(itemsQuery, (snapshot) => {
    onChange(
      snapshot.docs.map((itemDoc) => ({
        id: itemDoc.id,
        proposalId: itemDoc.ref.parent.parent!.id,
        ...(itemDoc.data() as Omit<ProposalItem, 'id' | 'proposalId'>),
      })),
    )
  })
}

export async function createProposal(items: DraftItem[], actor: { uid: string; name: string }): Promise<void> {
  const proposalRef = doc(collection(db, 'proposals'))
  const batch = writeBatch(db)
  batch.set(proposalRef, {
    proposedBy: actor.uid,
    proposedByName: actor.name,
    createdAt: serverTimestamp(),
  })
  for (const item of items) {
    const itemRef = doc(collection(proposalRef, 'items'))
    batch.set(itemRef, {
      mealId: item.mealId,
      mealName: item.mealName,
      date: item.date,
      status: 'pending',
      proposedBy: actor.uid,
      proposedByName: actor.name,
    })
  }
  await batch.commit()
}

export async function acceptProposalItem(item: ProposalItem, actor: { uid: string; name: string }): Promise<void> {
  const batch = writeBatch(db)
  batch.update(doc(db, 'proposals', item.proposalId, 'items', item.id), {
    status: 'accepted',
    respondedBy: actor.uid,
    respondedByName: actor.name,
    respondedAt: serverTimestamp(),
  })
  batch.set(doc(db, 'days', item.date), {
    meal: {
      mealId: item.mealId,
      mealName: item.mealName,
      assignedBy: actor.uid,
      assignedByName: actor.name,
      assignedAt: serverTimestamp(),
      source: 'proposal',
    },
    notHome: [],
  })
  await batch.commit()
}

export async function rejectProposalItem(item: ProposalItem, actor: { uid: string; name: string }): Promise<void> {
  await updateDoc(doc(db, 'proposals', item.proposalId, 'items', item.id), {
    status: 'rejected',
    respondedBy: actor.uid,
    respondedByName: actor.name,
    respondedAt: serverTimestamp(),
  })
}
