import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabaseClient'

// Owner user_id — matches RLS policy that allows anon insert with this UUID
const OWNER_USER_ID = 'ca0169ae-f0ba-40ce-9ff2-b7dfacce6380'

// Direct insert with explicit timeout — uses supabase-js (leverages auth session if any)
// with Promise.race timeout to prevent hanging.
const insertTransaction = async (payload, timeoutMs = 10000) => {
  const insertPromise = supabase
    .from('transactions')
    .insert(payload)
    .select()
    .single()
    .then(({ data, error }) => {
      if (error) throw new Error(error.message || 'Insert failed')
      return data
    })

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out (10s)')), timeoutMs)
  )

  return Promise.race([insertPromise, timeoutPromise])
}

// Fallback lists if user_settings can't be fetched (RLS or offline)
const FALLBACK = {
  categories: ['Rent','Office Expense','Utilities','Food','Travel','Subscriptions','Salary','Shopping','Bills','Fuel','For Me','Savings','Cash','My Accounts','Mama','Loan','Others','Splitwise','Fun','Snacks'],
  accounts: ['Meezan','Alfalah','Allied','Cash','Easypaisa','JazzCash','Sadapay','Zindagi','Nayapay','Redotpay'],
  groups: ['Office','Personal'],
  types: ['Income','Expense','Transfer','Loan Given','Loan Taken','Loan Received Back','Loan Repaid','Savings Deposit','Savings Withdraw'],
  loan_people: ['Sheikh','Hamza','Papa','Abdullah','Ali','Abdul Office','Fakhar','Shahbaz Bhai','Mughees Editor'],
}

// Types where money LEAVES an account → show "From Account"
const EXPENSE_TYPES = ['Expense', 'Loan Given', 'Loan Repaid']
// Types where money ENTERS an account → show "To Account"
const INCOME_TYPES = ['Income', 'Loan Taken', 'Loan Received Back']
// Savings Deposit/Withdraw → no account field (tracked separately, user doesn't link to a regular account)

// Type color mapping (matches dashboard)
const typeColor = (t) =>
  t === 'Income' ? '#10b981'
  : t === 'Expense' ? '#ef4444'
  : t === 'Transfer' ? '#6366f1'
  : t?.includes('Loan') ? '#f59e0b'
  : t?.includes('Savings') ? '#8b5cf6'
  : '#94a3b8'

const QUEUE_KEY = 'quickadd_offline_queue_v1'

// IIFE-style helpers for queue
const queueGet = () => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') }
  catch { return [] }
}
const queueSet = (q) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
const queueAdd = (item) => { const q = queueGet(); q.push(item); queueSet(q); return q.length }
const queueClear = () => localStorage.removeItem(QUEUE_KEY)

export default function QuickAdd() {
  const today = new Date().toISOString().slice(0, 10)
  const [settings, setSettings] = useState(FALLBACK)
  const [type, setType] = useState('Expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [group, setGroup] = useState('Personal')
  const [fromAcct, setFromAcct] = useState('Alfalah')
  const [toAcct, setToAcct] = useState('')
  const [party, setParty] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null) // { kind: 'success'|'error'|'queued', text }
  const [recent, setRecent] = useState([])
  const [online, setOnline] = useState(navigator.onLine)
  const [queueLen, setQueueLen] = useState(queueGet().length)
  const [showMore, setShowMore] = useState(false)

  // Load settings (categories etc.) from Supabase if RLS allows
  useEffect(() => {
    let mounted = true
    supabase
      .from('user_settings')
      .select('categories,accounts,groups,types,loan_people')
      .eq('user_id', OWNER_USER_ID)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted && data) {
          setSettings({
            categories: data.categories || FALLBACK.categories,
            accounts: data.accounts || FALLBACK.accounts,
            groups: data.groups || FALLBACK.groups,
            types: data.types || FALLBACK.types,
            loan_people: data.loan_people || FALLBACK.loan_people,
          })
        }
      })
    return () => { mounted = false }
  }, [])

  // Robust sync: listens to online event, visibility change, focus, AND periodic check.
  // Mobile browsers don't reliably fire 'online' if app is backgrounded, so we use multiple signals.
  useEffect(() => {
    const tryFlush = () => {
      setOnline(navigator.onLine)
      if (navigator.onLine && queueGet().length > 0) {
        console.log('[QuickAdd] Attempting queue flush')
        flushQueue()
      }
    }
    const goOffline = () => setOnline(false)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tryFlush()
    }

    window.addEventListener('online', tryFlush)
    window.addEventListener('offline', goOffline)
    window.addEventListener('focus', tryFlush)
    window.addEventListener('pageshow', tryFlush)
    document.addEventListener('visibilitychange', onVisible)

    // Periodic check every 15s as a safety net
    const intervalId = setInterval(tryFlush, 15000)

    // Initial check on mount
    tryFlush()

    return () => {
      window.removeEventListener('online', tryFlush)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('focus', tryFlush)
      window.removeEventListener('pageshow', tryFlush)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(intervalId)
    }
  }, [])

  // Load recent transactions for confirmation feel
  useEffect(() => {
    supabase
      .from('transactions')
      .select('id,d,t,c,a,description,created_at')
      .eq('user_id', OWNER_USER_ID)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setRecent(data) })
  }, [])

  const flushQueue = async () => {
    const q = queueGet()
    if (q.length === 0) return
    console.log('[QuickAdd] Flushing', q.length, 'item(s)')
    const remaining = []
    let lastError = null
    for (const item of q) {
      try {
        await insertTransaction(item)
        console.log('[QuickAdd] Synced item ₨' + item.a)
      } catch (e) {
        console.error('[QuickAdd] Sync failed:', e.message, item)
        remaining.push(item)
        lastError = e.message
      }
    }
    queueSet(remaining)
    setQueueLen(remaining.length)
    const synced = q.length - remaining.length
    if (synced > 0 && remaining.length === 0) {
      showToast('success', `${synced} synced ✓`)
    } else if (synced > 0 && remaining.length > 0) {
      showToast('error', `${synced} synced, ${remaining.length} failed: ${lastError}`, 6000)
    } else if (remaining.length > 0) {
      showToast('error', `Sync failed: ${lastError}`, 6000)
    }
  }

  const clearQueue = () => {
    if (!confirm(`Clear ${queueLen} stuck item(s)? Yeh permanently delete kar dega.`)) return
    queueClear()
    setQueueLen(0)
    showToast('queued', 'Queue cleared')
  }

  const toastTimerRef = useRef(null)
  const showToast = (kind, text, ms = 3500) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ kind, text })
    toastTimerRef.current = setTimeout(() => setToast(null), ms)
  }

  const isTransfer = type === 'Transfer'
  const isIncome = INCOME_TYPES.includes(type)
  const isExpense = EXPENSE_TYPES.includes(type)
  const needsFromAcct = isExpense || isTransfer
  const needsToAcct = isIncome || isTransfer
  const needsParty = type?.includes('Loan')

  const reset = () => {
    setAmount('')
    setDescription('')
    setNotes('')
    setToAcct('')
    setParty('')
    setDate(today)
    // Keep type, category, group, fromAcct as-is for next quick entry
  }

  const submit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      showToast('error', 'Amount zaroori hai')
      return
    }
    setSaving(true)
    const payload = {
      user_id: OWNER_USER_ID,
      d: date,
      t: type,
      a: amt,
      c: category,
      g: group,
      fa: needsFromAcct ? (fromAcct || '') : '',
      ta: needsToAcct ? (toAcct || '') : '',
      p: needsParty ? party : '',
      description: description || '',
      n: notes || '',
    }

    // Optimistic UI: add to recent immediately
    const optimistic = { ...payload, id: 'tmp-' + Date.now(), created_at: new Date().toISOString() }
    setRecent((r) => [optimistic, ...r].slice(0, 3))

    if (!navigator.onLine) {
      const n = queueAdd(payload)
      setQueueLen(n)
      showToast('queued', `Saved offline. ${n} pending sync.`)
      reset()
      setSaving(false)
      return
    }

    try {
      const data = await insertTransaction(payload)
      // Replace optimistic entry with real one
      setRecent((r) => [data, ...r.filter((x) => x.id !== optimistic.id)].slice(0, 3))
      showToast('success', `Added ₨${amt.toLocaleString()}`)
      reset()
    } catch (err) {
      // On network/transient error, queue it
      console.error('[QuickAdd] Submit failed:', err.message)
      const n = queueAdd(payload)
      setQueueLen(n)
      showToast('queued', `Failed: ${err.message}. Queued (${n}).`, 5000)
      reset()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={S.root}>
      {/* Status bar */}
      <header style={S.header}>
        <button onClick={() => (window.location.href = '/')} style={S.backBtn} aria-label="Back to dashboard">
          ←
        </button>
        <div style={S.title}>Quick Add</div>
        <div style={S.statusGroup}>
          {queueLen > 0 && (
            <>
              <button
                onClick={() => {
                  showToast('queued', 'Syncing…')
                  flushQueue()
                }}
                style={S.queueBadge}
                title="Tap to sync"
              >
                ⏳ {queueLen} · sync
              </button>
              <button
                onClick={clearQueue}
                style={S.clearBadge}
                title="Clear stuck items"
                aria-label="Clear queue"
              >
                ✕
              </button>
            </>
          )}
          <span style={{ ...S.dot, background: online ? '#10b981' : '#f59e0b' }} />
          <span style={S.statusText}>{online ? 'Online' : 'Offline'}</span>
        </div>
      </header>

      {/* AMOUNT HERO */}
      <section style={S.amountSection}>
        <div style={{ ...S.amountStripe, background: typeColor(type) }} />
        <div style={S.rupeeBig}>₨</div>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={S.amountInput}
          autoFocus
        />
        <div style={S.amountHint}>{type}</div>
      </section>

      {/* TYPE PILLS */}
      <section style={S.section}>
        <label style={S.label}>Type</label>
        <div style={S.pillRow}>
          {(settings.types || FALLBACK.types).map((t) => {
            const active = t === type
            const c = typeColor(t)
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  ...S.pill,
                  background: active ? c : 'transparent',
                  borderColor: active ? c : '#2a2f3e',
                  color: active ? '#fff' : '#cbd5e1',
                  fontWeight: active ? 700 : 500,
                }}
              >
                {t}
              </button>
            )
          })}
        </div>
      </section>

      {/* CATEGORY */}
      <section style={S.section}>
        <label style={S.label}>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={S.select}>
          {(settings.categories || FALLBACK.categories).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </section>

      {/* GROUP — segmented */}
      <section style={S.section}>
        <label style={S.label}>Group</label>
        <div style={S.segmented}>
          {(settings.groups || FALLBACK.groups).map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              style={{
                ...S.segment,
                background: g === group ? '#a78bfa' : 'transparent',
                color: g === group ? '#0a0d14' : '#cbd5e1',
                fontWeight: g === group ? 700 : 500,
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* FROM ACCOUNT — for Expense, Transfer, Loan Given/Repaid, Savings Deposit */}
      {needsFromAcct && (
        <section style={S.section}>
          <label style={S.label}>From Account</label>
          <select value={fromAcct} onChange={(e) => setFromAcct(e.target.value)} style={S.select}>
            <option value="">— None —</option>
            {(settings.accounts || FALLBACK.accounts).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </section>
      )}

      {/* TO ACCOUNT — for Income, Transfer, Loan Taken/Received, Savings Withdraw */}
      {needsToAcct && (
        <section style={S.section}>
          <label style={S.label}>To Account</label>
          <select value={toAcct} onChange={(e) => setToAcct(e.target.value)} style={S.select}>
            <option value="">— Select —</option>
            {(settings.accounts || FALLBACK.accounts).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </section>
      )}

      {/* PARTY — only for Loan types */}
      {needsParty && (
        <section style={S.section}>
          <label style={S.label}>Party</label>
          <select value={party} onChange={(e) => setParty(e.target.value)} style={S.select}>
            <option value="">— Select —</option>
            {(settings.loan_people || FALLBACK.loan_people).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </section>
      )}

      {/* DESCRIPTION */}
      <section style={S.section}>
        <label style={S.label}>Description</label>
        <input
          type="text"
          placeholder="e.g. Lunch with friends"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={S.input}
        />
      </section>

      {/* MORE FIELDS — collapsed by default */}
      <button onClick={() => setShowMore((v) => !v)} style={S.moreBtn}>
        {showMore ? '− Hide' : '+ More'} (date, notes)
      </button>

      {showMore && (
        <>
          <section style={S.section}>
            <label style={S.label}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={S.input}
            />
          </section>
          <section style={S.section}>
            <label style={S.label}>Notes</label>
            <textarea
              placeholder="Any extra detail…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...S.input, minHeight: 70, resize: 'vertical' }}
            />
          </section>
        </>
      )}

      {/* SUBMIT */}
      <button
        onClick={submit}
        disabled={saving}
        style={{
          ...S.submit,
          background: `linear-gradient(135deg, ${typeColor(type)}, ${typeColor(type)}cc)`,
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Saving…' : `Save ${amount ? '₨' + Number(amount).toLocaleString() : ''}`}
      </button>

      {/* RECENT */}
      {recent.length > 0 && (
        <section style={S.recentSection}>
          <div style={S.recentTitle}>Recent</div>
          {recent.map((tx) => (
            <div key={tx.id} style={S.recentRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ ...S.recentDot, background: typeColor(tx.t) }} />
                <span style={S.recentMain}>{tx.description || tx.c}</span>
              </div>
              <span style={{ ...S.recentAmt, color: typeColor(tx.t) }}>
                ₨{Number(tx.a).toLocaleString()}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* TOAST */}
      {toast && (
        <div
          style={{
            ...S.toast,
            background:
              toast.kind === 'success' ? 'rgba(16,185,129,.95)'
              : toast.kind === 'queued' ? 'rgba(245,158,11,.95)'
              : 'rgba(239,68,68,.95)',
          }}
        >
          {toast.text}
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  )
}

// =========================================================
// Styles — inline so no extra CSS file required
// =========================================================
const S = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0d14 0%, #11141d 100%)',
    color: '#e2e8f0',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    maxWidth: 480,
    margin: '0 auto',
    padding: '16px 18px 24px',
    boxSizing: 'border-box',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  backBtn: {
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.08)',
    color: '#cbd5e1',
    width: 36,
    height: 36,
    borderRadius: 10,
    fontSize: 18,
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f1f5f9',
    flex: 1,
    letterSpacing: '-.01em',
  },
  statusGroup: { display: 'flex', alignItems: 'center', gap: 6 },
  queueBadge: {
    fontSize: 11,
    color: '#f59e0b',
    background: 'rgba(245,158,11,.12)',
    border: '1px solid rgba(245,158,11,.3)',
    padding: '3px 8px',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  clearBadge: {
    fontSize: 11,
    color: '#f87171',
    background: 'rgba(239,68,68,.12)',
    border: '1px solid rgba(239,68,68,.3)',
    padding: '3px 7px',
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  statusText: { fontSize: 11, color: '#64748b' },

  amountSection: {
    background: 'rgba(255,255,255,.025)',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 18,
    padding: '22px 18px 16px',
    marginBottom: 18,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
  },
  amountStripe: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
    transition: 'background .2s',
  },
  rupeeBig: {
    fontSize: 32,
    color: '#64748b',
    fontWeight: 300,
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  },
  amountInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#f1f5f9',
    fontSize: 56,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    letterSpacing: '-.02em',
    width: '100%',
    padding: 0,
    minWidth: 0,
  },
  amountHint: {
    position: 'absolute',
    right: 18,
    bottom: 12,
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    fontWeight: 600,
  },

  section: { marginBottom: 14 },
  label: {
    display: 'block',
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    fontWeight: 700,
    marginBottom: 7,
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 12,
    padding: '13px 14px',
    color: '#e2e8f0',
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 12,
    padding: '13px 14px',
    color: '#e2e8f0',
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    appearance: 'none',
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: 36,
  },

  pillRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 7,
  },
  pill: {
    border: '1px solid',
    borderRadius: 999,
    padding: '7px 14px',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all .15s',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },

  segmented: {
    display: 'flex',
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderRadius: 9,
    padding: '10px 8px',
    fontSize: 13,
    color: '#cbd5e1',
    cursor: 'pointer',
    transition: 'all .15s',
    fontFamily: 'inherit',
  },

  moreBtn: {
    background: 'transparent',
    border: '1px dashed rgba(255,255,255,.12)',
    color: '#64748b',
    width: '100%',
    padding: '10px',
    borderRadius: 10,
    fontSize: 12,
    cursor: 'pointer',
    marginBottom: 14,
    fontFamily: 'inherit',
  },

  submit: {
    width: '100%',
    border: 'none',
    color: '#fff',
    padding: '16px',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '-.01em',
    transition: 'all .15s',
    fontFamily: 'inherit',
    boxShadow: '0 8px 24px rgba(0,0,0,.25)',
  },

  recentSection: {
    marginTop: 24,
    padding: '14px 14px 6px',
    background: 'rgba(255,255,255,.02)',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,.04)',
  },
  recentTitle: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    fontWeight: 700,
    marginBottom: 8,
  },
  recentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,.03)',
    gap: 10,
  },
  recentDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  recentMain: {
    fontSize: 13,
    color: '#cbd5e1',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  recentAmt: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    flexShrink: 0,
  },

  toast: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 20px',
    borderRadius: 12,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    boxShadow: '0 12px 32px rgba(0,0,0,.4)',
    zIndex: 100,
    maxWidth: 'calc(100vw - 40px)',
    textAlign: 'center',
  },
}
