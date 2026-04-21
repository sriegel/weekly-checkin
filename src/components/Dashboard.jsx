import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { supabase } from '../supabaseClient'
import styles from './Dashboard.module.css'

const RANGES = [
  { label: '4 weeks', value: 4 },
  { label: '8 weeks', value: 8 },
  { label: '12 weeks', value: 12 },
  { label: 'All time', value: 999 },
]

const MOOD_LABELS     = ['', 'Rough', 'Low', 'Okay', 'Good', 'Great']
const SLEEP_LABELS    = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent']
const SPENDING_LABELS = ['', 'Way over', 'Over', 'On track', 'Under', 'Saved well']
const STRESS_LABELS   = ['', 'Overwhelmed', 'High', 'Moderate', 'Low', 'Calm']

const METRICS = [
  { key: 'mood',           label: 'Mood',          color: '#7dd3fc', labs: MOOD_LABELS,     type: 'line' },
  { key: 'sleep_quality',  label: 'Sleep quality',  color: '#c084fc', labs: SLEEP_LABELS,    type: 'line' },
  { key: 'spending',       label: 'Spending',        color: '#34d399', labs: SPENDING_LABELS, type: 'line' },
  { key: 'work_stress',    label: 'Work stress',    color: '#fb923c', labs: STRESS_LABELS,   type: 'line' },
  { key: 'exercise_count', label: 'Exercise days',  color: '#c8f542', labs: null,            type: 'bar'  },
]

function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function trend(arr) {
  if (arr.length < 2) return 0
  const half = Math.floor(arr.length / 2)
  const first = avg(arr.slice(0, half))
  const second = avg(arr.slice(half))
  return second - first
}

function TrendArrow({ value }) {
  if (Math.abs(value) < 0.1) return <span className={styles.trendFlat}>→</span>
  return value > 0
    ? <span className={styles.trendUp}>↑</span>
    : <span className={styles.trendDown}>↓</span>
}

function StatCard({ label, value, sublabel, trend: trendVal, color }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={{ color }}>{value}</div>
      {sublabel && <div className={styles.statSub}>{sublabel}</div>}
      {trendVal !== undefined && (
        <div className={styles.statTrend}>
          <TrendArrow value={trendVal} />
          <span>{Math.abs(trendVal) < 0.1 ? 'Stable' : trendVal > 0 ? 'Improving' : 'Declining'}</span>
        </div>
      )}
    </div>
  )
}

function CustomTooltip({ active, payload, label, labs }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {labs ? labs[p.value] || p.value : p.value}
        </div>
      ))}
    </div>
  )
}

function MetricChart({ data, metric }) {
  const vals = data.map(d => d[metric.key]).filter(Boolean)
  const average = avg(vals)

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>{metric.label}</span>
        {vals.length > 0 && (
          <span className={styles.chartAvg} style={{ color: metric.color }}>
            avg {average.toFixed(1)}
            {metric.labs ? ` · ${metric.labs[Math.round(average)] || ''}` : 'd'}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        {metric.type === 'bar' ? (
          <BarChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="week" tick={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: '#444' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 7]} tick={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: '#333' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip labs={metric.labs} />} />
            <ReferenceLine y={average} stroke={metric.color} strokeDasharray="4 4" strokeOpacity={0.4} />
            <Bar dataKey={metric.key} name={metric.label} fill={metric.color} radius={[3, 3, 0, 0]} opacity={0.85} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="week" tick={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: '#444' }} axisLine={false} tickLine={false} />
            <YAxis domain={[1, 5]} tick={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: '#333' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip labs={metric.labs} />} />
            <ReferenceLine y={average} stroke={metric.color} strokeDasharray="4 4" strokeOpacity={0.4} />
            <Line
              type="monotone"
              dataKey={metric.key}
              name={metric.label}
              stroke={metric.color}
              strokeWidth={2}
              dot={{ fill: metric.color, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export default function Dashboard() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [weeks, setWeeks] = useState(12)

  useEffect(() => {
    async function fetch() {
      const { data, error: err } = await supabase
        .from('checkins')
        .select('*')
        .order('week_of', { ascending: false })
        .limit(52)

      setLoading(false)
      if (err) { setError(err.message); return }
      setEntries(data)
    }
    fetch()
  }, [])

  if (loading) return <div className={styles.state}>Loading...</div>
  if (error)   return <div className={styles.state} style={{ color: '#fb7185' }}>{error}</div>
  if (entries.length === 0) return (
    <div className={styles.state}>No entries yet. Complete a few check-ins first.</div>
  )

  // Apply range filter and reverse to chronological order for charts
  const filtered = entries.slice(0, weeks === 999 ? entries.length : weeks).reverse()

  const chartData = filtered.map(e => ({
    week: new Date(e.week_of).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    mood: e.mood,
    sleep_quality: e.sleep_quality,
    spending: e.spending,
    work_stress: e.work_stress,
    exercise_count: e.exercise_count,
  }))

  // Summary stats
  const moodVals     = filtered.map(e => e.mood).filter(Boolean)
  const sleepVals    = filtered.map(e => e.sleep_quality).filter(Boolean)
  const spendVals    = filtered.map(e => e.spending).filter(Boolean)
  const stressVals   = filtered.map(e => e.work_stress).filter(Boolean)
  const exerciseVals = filtered.map(e => e.exercise_count)

  const totalExercise = exerciseVals.reduce((s, v) => s + v, 0)

  return (
    <div>
      {/* Range selector */}
      <div className={styles.rangeRow}>
        {RANGES.map(r => (
          <button
            key={r.value}
            className={weeks === r.value ? styles.rangeBtnActive : styles.rangeBtn}
            onClick={() => setWeeks(r.value)}
          >
            {r.label}
          </button>
        ))}
        <span className={styles.rangeInfo}>{filtered.length} entries</span>
      </div>

      {/* Summary cards */}
      <div className={styles.statGrid}>
        <StatCard
          label="Avg mood"
          value={avg(moodVals).toFixed(1)}
          sublabel={MOOD_LABELS[Math.round(avg(moodVals))] || ''}
          trend={trend(moodVals)}
          color="#7dd3fc"
        />
        <StatCard
          label="Avg sleep"
          value={avg(sleepVals).toFixed(1)}
          sublabel={SLEEP_LABELS[Math.round(avg(sleepVals))] || ''}
          trend={trend(sleepVals)}
          color="#c084fc"
        />
        <StatCard
          label="Exercise days"
          value={totalExercise}
          sublabel={`${avg(exerciseVals).toFixed(1)} / week`}
          trend={trend(exerciseVals)}
          color="#c8f542"
        />
        <StatCard
          label="Avg spending"
          value={avg(spendVals).toFixed(1)}
          sublabel={SPENDING_LABELS[Math.round(avg(spendVals))] || ''}
          trend={trend(spendVals)}
          color="#34d399"
        />
        <StatCard
          label="Avg stress"
          value={avg(stressVals).toFixed(1)}
          sublabel={STRESS_LABELS[Math.round(avg(stressVals))] || ''}
          trend={trend(stressVals)}
          color="#fb923c"
        />
      </div>

      {/* Per-metric charts */}
      <div className={styles.chartGrid}>
        {METRICS.map(m => (
          <MetricChart key={m.key} data={chartData} metric={m} />
        ))}
      </div>
    </div>
  )
}
