import { useState } from 'react'
import CheckInForm from './components/CheckInForm'
import History from './components/History'
import styles from './App.module.css'

export default function App() {
  const [view, setView] = useState('checkin') // 'checkin' | 'history'
  const [refreshKey, setRefreshKey] = useState(0)

  function handleSaved() {
    // After saving, switch to history and force a re-fetch
    setRefreshKey(k => k + 1)
    setView('history')
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <h1>Weekly<br /><span className={styles.accent}>Check-in</span></h1>
        </div>
        <nav className={styles.nav}>
          <button
            className={view === 'checkin' ? styles.navBtnActive : styles.navBtn}
            onClick={() => setView('checkin')}
          >
            Check-in
          </button>
          <button
            className={view === 'history' ? styles.navBtnActive : styles.navBtn}
            onClick={() => setView('history')}
          >
            History
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        {view === 'checkin' && <CheckInForm onSaved={handleSaved} />}
        {view === 'history' && <History key={refreshKey} />}
      </main>
    </div>
  )
}
