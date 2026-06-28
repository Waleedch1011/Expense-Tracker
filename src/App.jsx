import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Dashboard from './Dashboard'
import QuickAdd from './QuickAdd'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [path, setPath] = useState(window.location.pathname)

  // Quick-add route: no auth needed — uses anon RLS policy with hardcoded user_id
  const isQuickRoute = path === '/quick' || path === '/quick/'

  useEffect(() => {
    if (isQuickRoute) {
      setLoading(false)
      return
    }
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [isQuickRoute])

  // Listen for back/forward navigation
  useEffect(() => {
    const handler = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (isQuickRoute) {
    return <QuickAdd />
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg,#0c0f1a 0%,#111827 50%,#0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e2e8f0',
        fontFamily: "'Inter',sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>💰</div>
          <div style={{ color: '#94a3b8' }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return <Dashboard user={session.user} onLogout={handleLogout} />
}
