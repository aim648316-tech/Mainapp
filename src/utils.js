import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase.js'

export { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp }

export function watchCollection(name, orderByField, callback) {
  const q = orderByField
    ? query(collection(db, name), orderBy(orderByField))
    : query(collection(db, name))
  return onSnapshot(
    q,
    (snap) => {
      const items = []
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }))
      callback(items, null)
    },
    (err) => callback(null, err)
  )
}

export async function fetchSettings() {
  const ref = doc(db, 'settings', 'app')
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : {}
}

export async function saveSettings(data) {
  const ref = doc(db, 'settings', 'app')
  await setDoc(ref, data, { merge: true })
}

export async function addRecord(name, data) {
  return addDoc(collection(db, name), { ...data, createdAt: serverTimestamp() })
}

export async function updateRecord(name, id, data) {
  return updateDoc(doc(db, name, id), data)
}

export async function deleteRecord(name, id) {
  return deleteDoc(doc(db, name, id))
}

export async function batchUpdateRecords(name, updates) {
  const batch = writeBatch(db)
  for (const { id, data } of updates) {
    batch.update(doc(db, name, id), data)
  }
  await batch.commit()
}

export function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function timeStr() {
  const d = new Date()
  let h = d.getHours()
  const min = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${String(h).padStart(2, '0')}:${min} ${ampm}`
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function guDate() {
  const d = new Date()
  const months = ['જાન્યુ', 'ફેબ્રુ', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટે', 'ઓક્ટો', 'નવે', 'ડિસે']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function num(val) {
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

export function sortByCreatedAt(items) {
  return [...items].sort((a, b) => {
    const ta = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0
    const tb = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0
    return ta - tb
  })
}

export function getOrder(c) {
  if (c.orderIndex !== undefined && c.orderIndex !== null) return c.orderIndex
  return c.createdAt instanceof Timestamp ? c.createdAt.toMillis() : 0
}

export function sortByOrder(items) {
  return [...items].sort((a, b) => getOrder(a) - getOrder(b))
}

export function sortRouteCustomers(customers, route) {
  const normalized = (route || '').trim().toLowerCase()
  return sortByOrder(
    customers.filter((c) => (c.route || '').trim().toLowerCase() === normalized)
  )
}
