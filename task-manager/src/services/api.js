// Firebase Firestore service layer
import { db, auth } from "../firebase"
import {
  collection, doc, getDoc, getDocs, addDoc,
  updateDoc, deleteDoc, serverTimestamp, query, orderBy
} from "firebase/firestore"
import { uid } from "../utils/helpers"

// ── BOARDS ──────────────────────────────────────────────
export async function fetchBoards() {
  const snap = await getDocs(query(collection(db, "boards"), orderBy("createdAt", "desc")))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createBoard(name, color) {
  const ref = await addDoc(collection(db, "boards"), {
    name,
    color,
    lists: [],
    createdAt: serverTimestamp(),
    uid: auth.currentUser?.uid || "guest"
  })
  return ref.id
}

export async function fetchBoard(id) {
  const snap = await getDoc(doc(db, "boards", id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function saveLists(boardId, lists) {
  await updateDoc(doc(db, "boards", boardId), { lists })
}

export async function deleteBoard(boardId) {
  await deleteDoc(doc(db, "boards", boardId))
}
