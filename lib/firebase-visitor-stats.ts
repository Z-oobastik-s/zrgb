import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  collection,
  query,
  where,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore'

/** Project: zgbminecraft — web config is public by design; protect data via Firestore Rules. */
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    'AIzaSyC_TS4slOoQyAjnwsK29n0o5Pq0EiURoN4',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'zgbminecraft.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'zgbminecraft',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    'zgbminecraft.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '429823486179',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    '1:429823486179:web:1140eafe78e88fbcfefdd6',
}

const STATS_COLLECTION = 'site'
const STATS_DOC_ID = 'stats'
const PRESENCE_COLLECTION = 'presence'
/** Consider a visitor online if heartbeat is newer than this. */
export const ONLINE_TTL_MS = 60_000
const HEARTBEAT_MS = 25_000
const VISIT_SESSION_KEY = 'zrgb-visit-counted'
const SESSION_ID_KEY = 'zrgb-presence-id'

let app: FirebaseApp | null = null
let db: Firestore | null = null

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.appId)
}

function getDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null
  if (typeof window === 'undefined') return null
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
    db = getFirestore(app)
  }
  return db
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY)
    if (existing) return existing
    const id = randomId()
    sessionStorage.setItem(SESSION_ID_KEY, id)
    return id
  } catch {
    return randomId()
  }
}

/** Increment total visits once per browser tab session. */
export async function recordVisitOnce(): Promise<number | null> {
  const firestore = getDb()
  if (!firestore) return null

  try {
    const already = sessionStorage.getItem(VISIT_SESSION_KEY)
    const ref = doc(firestore, STATS_COLLECTION, STATS_DOC_ID)
    if (!already) {
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        await setDoc(ref, { visits: 1 })
      } else {
        await updateDoc(ref, {
          visits: increment(1),
        })
      }
      sessionStorage.setItem(VISIT_SESSION_KEY, '1')
    }
    const after = await getDoc(ref)
    const visits = after.data()?.visits
    return typeof visits === 'number' ? visits : null
  } catch (err) {
    console.warn('[visitor-stats] recordVisitOnce failed', err)
    return null
  }
}

export async function readVisits(): Promise<number | null> {
  const firestore = getDb()
  if (!firestore) return null
  try {
    const snap = await getDoc(doc(firestore, STATS_COLLECTION, STATS_DOC_ID))
    const visits = snap.data()?.visits
    return typeof visits === 'number' ? visits : 0
  } catch {
    return null
  }
}

/** Heartbeat: mark this session as online. */
export async function heartbeatPresence(sessionId: string): Promise<void> {
  const firestore = getDb()
  if (!firestore) return
  try {
    await setDoc(
      doc(firestore, PRESENCE_COLLECTION, sessionId),
      {
        lastSeen: Date.now(),
      },
      { merge: true }
    )
  } catch (err) {
    console.warn('[visitor-stats] heartbeat failed', err)
  }
}

export async function leavePresence(sessionId: string): Promise<void> {
  const firestore = getDb()
  if (!firestore) return
  try {
    await deleteDoc(doc(firestore, PRESENCE_COLLECTION, sessionId))
  } catch {
    /* ignore */
  }
}

export type VisitorStatsSnapshot = {
  visits: number | null
  online: number | null
}

/**
 * Subscribe to visits + online count.
 * Online = presence docs with lastSeen within ONLINE_TTL_MS.
 */
export function subscribeVisitorStats(
  onChange: (stats: VisitorStatsSnapshot) => void
): () => void {
  const firestore = getDb()
  if (!firestore) {
    onChange({ visits: null, online: null })
    return () => {}
  }

  let visits: number | null = null
  let online: number | null = null

  const emit = () => onChange({ visits, online })

  const unsubStats = onSnapshot(
    doc(firestore, STATS_COLLECTION, STATS_DOC_ID),
    (snap) => {
      const v = snap.data()?.visits
      visits = typeof v === 'number' ? v : 0
      emit()
    },
    () => {
      visits = null
      emit()
    }
  )

  let unsubPresence: (() => void) | null = null
  const attachPresence = () => {
    unsubPresence?.()
    unsubPresence = onSnapshot(
      query(
        collection(firestore, PRESENCE_COLLECTION),
        where('lastSeen', '>', Date.now() - ONLINE_TTL_MS)
      ),
      (snap) => {
        online = snap.size
        emit()
      },
      () => {
        online = null
        emit()
      }
    )
  }

  attachPresence()
  const refreshPresence = window.setInterval(attachPresence, HEARTBEAT_MS)

  return () => {
    unsubStats()
    unsubPresence?.()
    window.clearInterval(refreshPresence)
  }
}

export const PRESENCE_HEARTBEAT_MS = HEARTBEAT_MS
