import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import CheckInForm from './components/CheckInForm'
import History from './components/History'
import Dashboard from './components/Dashboard'
import styles from './App.module.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('checkin')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  function handleSaved() {
    setRefreshKey(k => k + 1)
    setView('history')
  }

  if (loading) return null
  if (!session) return <Auth />

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <h1>Weekly<br /><span className={styles.accent}>Check-in</span></h1>
        </div>
        <nav className={styles.nav}>
          {['checkin', 'dashboard', 'history'].map(v => (
            <button
              key={v}
              className={view === v ? styles.navBtnActive : styles.navBtn}
              onClick={() => setView(v)}
            >
              {v === 'checkin' ? 'Check-in' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            Sign out
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        {view === 'checkin'   && <CheckInForm onSaved={handleSaved} userId={session.user.id} />}
        {view === 'dashboard' && <Dashboard key={refreshKey} userId={session.user.id} />}
        {view === 'history'   && <History key={refreshKey} userId={session.user.id} />}
      </main>
    </div>
  )
}