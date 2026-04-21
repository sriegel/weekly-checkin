import { useState } from 'react'
import { supabase } from '../supabaseClient'
import styles from './CheckInForm.module.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const LABELS = {
  mood:     ['', 'Rough', 'Low', 'Okay', 'Good', 'Great'],
  sleep:    ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'],
  spending: ['', 'Way over', 'Over', 'On track', 'Under', 'Saved well'],
  stress:   ['', 'Overwhelmed', 'High', 'Moderate', 'Low', 'Calm'],
}

const COLORS = {
  mood: 'var(--blue)',
  sleep: 'var(--purple)',
  spending: 'var(--green)',
  stress: 'var(--orange)',
}

function getWeekOf() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

function DayPicker({ value, onChange }) {
  function toggle(day) {
    onChange(value.includes(day) ? value.filter(d => d !== day) : [...value, day])
  }
  return (
    <div className={styles.section}>
      <label className={styles.sectionLabel}>Exercise days this week</label>
      <div className={styles.dayGrid}>
        {DAYS.map(day => (
          <button
            key={day}
            type="button"
            className={value.includes(day) ? styles.dayBtnOn : styles.dayBtn}
            onClick={() => toggle(day)}
          >
            {day}
          </button>
        ))}
      </div>
      <span className={styles.dayCount}>{value.length} / 7 days</span>
    </div>
  )
}

function SliderInput({ metricKey, label, value, onChange }) {
  return (
    <div className={styles.sliderRow}>
      <div className={styles.sliderHeader}>
        <span className={styles.sectionLabel} style={{ margin: 0 }}>{label}</span>
        <span className={styles.sliderVal} style={{ color: COLORS[metricKey] }}>
          {LABELS[metricKey][value]}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <div className={styles.sliderTicks}>
        {[1,2,3,4,5].map(n => (
          <span key={n} style={{ color: n === value ? COLORS[metricKey] : 'var(--border)' }}>{n}</span>
        ))}
      </div>
    </div>
  )
}

export default function CheckInForm({ onSaved, userId }) {
  const [exerciseDays, setExerciseDays] = useState([])
  const [mood, setMood] = useState(3)
  const [sleep, setSleep] = useState(3)
  const [spending, setSpending] = useState(3)
  const [stress, setStress] = useState(3)
  const [wins, setWins] = useState('')
  const [intention, setIntention] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    setSaving(true)
    setError(null)

    const { error: dbError } = await supabase.from('checkins').insert({
      user_id: userId,          // attach to the logged-in user
      week_of: getWeekOf(),
      exercise_days: exerciseDays,
      exercise_count: exerciseDays.length,
      mood,
      sleep_quality: sleep,
      spending,
      work_stress: stress,
      wins: wins.trim() || null,
      intention: intention.trim() || null,
    })

    setSaving(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    onSaved()
  }

  return (
    <div>
      <DayPicker value={exerciseDays} onChange={setExerciseDays} />

      <hr className={styles.divider} />

      <SliderInput metricKey="mood"     label="Mood"          value={mood}     onChange={setMood} />
      <SliderInput metricKey="sleep"    label="Sleep quality" value={sleep}    onChange={setSleep} />
      <SliderInput metricKey="spending" label="Spending"       value={spending} onChange={setSpending} />
      <SliderInput metricKey="stress"   label="Work stress"   value={stress}   onChange={setStress} />

      <hr className={styles.divider} />

      <div className={styles.section}>
        <label className={styles.sectionLabel}>Wins this week</label>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder="What went well, even small things..."
          value={wins}
          onChange={e => setWins(e.target.value)}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.sectionLabel}>Intention for next week</label>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder="One thing to focus on..."
          value={intention}
          onChange={e => setIntention(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button
        className={styles.saveBtn}
        onClick={handleSubmit}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save this week'}
      </button>
    </div>
  )
}
