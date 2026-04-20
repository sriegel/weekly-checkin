import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer
} from 'recharts'
import { supabase } from '../supabaseClient'
import styles from './History.module.css'

const MOOD_LABELS     = ['', 'Rough', 'Low', 'Okay', 'Good', 'Great']
const SLEEP_LABELS    = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent']
const SPENDING_LABELS = ['', 'Way over', 'Over', 'On track', 'Under', 'Saved well']
const STRESS_LABELS   = ['', 'Overwhelmed', 'High', 'Moderate', 'Low', 'Calm']

const METRICS = [
  { key: 'mood',           label: 'Mood',          color: '#7dd3fc', labs: MOOD_LABELS },
  { key: 'sleep_quality',  label: 'Sleep quality',  color: '#c084fc', labs: SLEEP_LABELS },
  { key: 'spending',       label: 'Spending',        color: '#34d399', labs: SPENDING_LABELS },
  { key: 'work_stress',    label: 'Work stress',    color: '#fb923c', labs: STRESS_LABELS },
  { key: 'exercise_count', label: 'Exercise days',  color: '#c8f542', labs: null },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

function TrendChart({ data, metricKey, label, color }) {
  return (
    <div className={styles.chartWrap}>
      <span className={styles.chartLabel}>{label}</span>
      <ResponsiveContainer width="100%" height={90}>
        <LineChart data={data} margin={{ top: 10, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: '#444' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[1, metricKey === 'exercise_count' ? 7 : 5]}
            tick={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: '#333' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={metricKey}
            name={label}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function EntryCard({ entry }) {
  const date = new Date(entry.week_of).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
  })

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Week of {date}</span>
      </div>
      <div className={styles.pillRow}>
        <span className={styles.pill}>Exercise: {entry.exercise_count}d</span>
        <span className={styles.pill}>Mood: {MOOD_LABELS[entry.mood]}</span>
        <span className={styles.pill}>Sleep: {SLEEP_LABELS[entry.sleep_quality]}</span>
        <span className={styles.pill}>Spending: {SPENDING_LABELS[entry.spending]}</span>
        <span className={styles.pill}>Stress: {STRESS_LABELS[entry.work_stress]}</span>
      </div>
      {entry.wins && (
        <p className={styles.note}><span className={styles.noteLabel}>Wins →</span> {entry.wins}</p>
      )}
      {entry.intention && (
        <p className={styles.note}><span className={styles.noteLabel}>Next week →</span> {entry.intention}</p>
      )}
    </div>
  )
}

export default function History() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchEntries() {
      // Fetch the 20 most recent entries, newest first
      const { data, error: dbError } = await supabase
        .from('checkins')
        .select('*')
        .order('week_of', { ascending: false })
        .limit(20)

      setLoading(false)

      if (dbError) {
        setError(dbError.message)
        return
      }

      setEntries(data)
    }

    fetchEntries()
  }, []) // empty array = runs once when the component mounts

  if (loading) return <div className={styles.state}>Loading...</div>
  if (error)   return <div className={styles.state} style={{ color: '#fb7185' }}>{error}</div>
  if (entries.length === 0) return (
    <div className={styles.state}>
      No entries yet. Complete your first check-in to see trends here.
    </div>
  )

  // Chart needs chronological order (oldest → newest)
  const chartData = [...entries].reverse().map(e => ({
    week: new Date(e.week_of).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    mood: e.mood,
    sleep_quality: e.sleep_quality,
    spending: e.spending,
    work_stress: e.work_stress,
    exercise_count: e.exercise_count,
  }))

  return (
    <div>
      <section className={styles.charts}>
        {METRICS.map(m => (
          <TrendChart
            key={m.key}
            data={chartData}
            metricKey={m.key}
            label={m.label}
            color={m.color}
          />
        ))}
      </section>

      <hr className={styles.divider} />

      <span className={styles.logLabel}>Entry log</span>

      {entries.map(entry => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  )
}
