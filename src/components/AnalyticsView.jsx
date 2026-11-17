import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useHealthData } from '../context/HealthDataContext'
import { formatDateKey, getEntryDateKey, getLocalDateKey } from '../utils/helpers'

const RANGE_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '12 months' },
]

function shiftDate(date, amount) {
  const shifted = new Date(date)
  shifted.setDate(shifted.getDate() + amount)
  return shifted
}

function pearsonCorrelation(pairs) {
  if (pairs.length < 3) return null
  const meanX = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length
  const meanY = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length
  const numerator = pairs.reduce((sum, pair) => sum + (pair[0] - meanX) * (pair[1] - meanY), 0)
  const denominator = Math.sqrt(
    pairs.reduce((sum, pair) => sum + (pair[0] - meanX) ** 2, 0) *
    pairs.reduce((sum, pair) => sum + (pair[1] - meanY) ** 2, 0)
  )
  return denominator === 0 ? null : numerator / denominator
}

function Correlation({ label, value, days }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <h3 className="font-medium text-gray-800">{label}</h3>
      <p className="mt-1 text-2xl font-semibold text-indigo-700">{value == null ? 'Not enough data' : `${value > 0 ? '+' : ''}${value.toFixed(2)}`}</p>
      <p className="text-xs text-gray-500">{days} matching days · correlation does not imply causation</p>
    </div>
  )
}

function MoodCalendar({ entries }) {
  const today = new Date()
  const days = Array.from({ length: 91 }, (_, index) => {
    const date = shiftDate(today, index - 90)
    const key = getLocalDateKey(date)
    const moods = entries.filter(entry => getEntryDateKey(entry) === key)
    const average = moods.length
      ? moods.reduce((sum, entry) => sum + entry.mood, 0) / moods.length
      : null
    return { key, average, count: moods.length }
  })

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="mood-calendar-heading">
      <h2 id="mood-calendar-heading" className="text-xl font-semibold text-gray-800">Mood calendar · last 13 weeks</h2>
      <p className="mb-4 mt-1 text-sm text-gray-500">Each square represents one day; darker green indicates a higher average mood.</p>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2" role="list" aria-label="Daily mood calendar">
        {days.map(day => {
          const shade = day.average == null ? 'bg-gray-100' :
            day.average < 2 ? 'bg-rose-300' :
              day.average < 3 ? 'bg-amber-300' :
                day.average < 4 ? 'bg-emerald-300' : 'bg-emerald-600'
          return (
            <div key={day.key} role="listitem" title={`${formatDateKey(day.key, { month: 'long', day: 'numeric', year: 'numeric' })}: ${day.count ? `${day.average.toFixed(1)} average mood` : 'no mood logged'}`} aria-label={`${day.key}, ${day.count ? `average mood ${day.average.toFixed(1)}` : 'no mood logged'}`} className={`h-3.5 w-3.5 rounded-sm ${shade}`} />
          )
        })}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500" aria-hidden="true">
        <span>Lower</span><span className="h-3 w-3 rounded-sm bg-rose-300" /><span className="h-3 w-3 rounded-sm bg-amber-300" /><span className="h-3 w-3 rounded-sm bg-emerald-300" /><span className="h-3 w-3 rounded-sm bg-emerald-600" /><span>Higher</span>
      </div>
    </section>
  )
}

function GoalSettings() {
  const { settings, updateSettings } = useHealthData()
  const [goals, setGoals] = useState(settings.goals)
  const [saved, setSaved] = useState(false)

  function submit(event) {
    event.preventDefault()
    updateSettings({ goals: {
      waterMl: Number(goals.waterMl),
      sleepHours: Number(goals.sleepHours),
      exerciseMinutes: Number(goals.exerciseMinutes),
    } })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="goals-heading">
      <h2 id="goals-heading" className="text-xl font-semibold text-gray-800">Personal daily goals</h2>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium text-gray-700">Water (ml)
          <input className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" type="number" min="1" max="10000" value={goals.waterMl} onChange={event => setGoals({ ...goals, waterMl: event.target.value })} required />
        </label>
        <label className="text-sm font-medium text-gray-700">Sleep (hours)
          <input className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" type="number" min="0.25" max="24" step="0.25" value={goals.sleepHours} onChange={event => setGoals({ ...goals, sleepHours: event.target.value })} required />
        </label>
        <label className="text-sm font-medium text-gray-700">Exercise (minutes)
          <input className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" type="number" min="1" max="1440" value={goals.exerciseMinutes} onChange={event => setGoals({ ...goals, exerciseMinutes: event.target.value })} required />
        </label>
        <div className="flex items-center gap-3 sm:col-span-3">
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Save goals</button>
          {saved && <span role="status" className="text-sm text-emerald-700">Goals saved.</span>}
        </div>
      </form>
    </section>
  )
}

function AppearanceSettings() {
  const { settings, updateSettings } = useHealthData()
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="appearance-heading">
      <h2 id="appearance-heading" className="text-xl font-semibold text-gray-800">Appearance</h2>
      <label className="mt-3 block max-w-sm text-sm font-medium text-gray-700">Color theme
        <select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" value={settings.theme} onChange={event => updateSettings({ theme: event.target.value })}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="forest">Forest</option>
          <option value="sunset">Sunset</option>
        </select>
      </label>
    </section>
  )
}

export default function AnalyticsView() {
  const { moodEntries, sleepEntries, waterEntries } = useHealthData()
  const [range, setRange] = useState(30)
  const [shareMessage, setShareMessage] = useState('')
  const todayKey = getLocalDateKey()
  const startKey = getLocalDateKey(shiftDate(new Date(), -(range - 1)))

  const filteredMoods = useMemo(() => moodEntries.filter(entry => {
    const dateKey = getEntryDateKey(entry)
    return dateKey >= startKey && dateKey <= todayKey
  }), [moodEntries, startKey, todayKey])

  const dailyData = useMemo(() => {
    const dayData = new Map()
    filteredMoods.forEach(entry => {
      const key = getEntryDateKey(entry)
      const day = dayData.get(key) || { sum: 0, count: 0 }
      day.sum += entry.mood
      day.count += 1
      dayData.set(key, day)
    })
    const sortedDays = [...dayData.entries()].sort(([a], [b]) => a.localeCompare(b))
    if (range <= 90) {
      return sortedDays.map(([date, day]) => ({
        date: formatDateKey(date),
        averageMood: Number((day.sum / day.count).toFixed(2)),
      }))
    }
    const months = new Map()
    sortedDays.forEach(([date, day]) => {
      const month = date.slice(0, 7)
      const values = months.get(month) || { sum: 0, count: 0 }
      values.sum += day.sum
      values.count += day.count
      months.set(month, values)
    })
    return [...months.entries()].map(([month, values]) => ({
      date: formatDateKey(`${month}-01`, { month: 'short', year: '2-digit' }),
      averageMood: Number((values.sum / values.count).toFixed(2)),
    }))
  }, [filteredMoods, range])

  const summary = useMemo(() => {
    const byDate = new Map()
    filteredMoods.forEach(entry => {
      const key = getEntryDateKey(entry)
      const current = byDate.get(key) || { sum: 0, count: 0 }
      current.sum += entry.mood
      current.count += 1
      byDate.set(key, current)
    })
    const daily = [...byDate.entries()]
      .map(([date, values]) => ({ date, average: values.sum / values.count }))
      .sort((a, b) => a.date.localeCompare(b.date))
    const total = filteredMoods.reduce((sum, entry) => sum + entry.mood, 0)
    const dates = new Set(moodEntries.map(getEntryDateKey))
    let cursor = new Date(`${todayKey}T00:00:00`)
    if (!dates.has(todayKey)) cursor = shiftDate(cursor, -1)
    let streak = 0
    while (dates.has(getLocalDateKey(cursor))) {
      streak += 1
      cursor = shiftDate(cursor, -1)
    }

    let longestStreak = 0
    let activeStreak = 0
    let previousDate = null
    daily.forEach(day => {
      const isConsecutive = previousDate &&
        getLocalDateKey(shiftDate(new Date(`${previousDate}T00:00:00`), 1)) === day.date
      activeStreak = isConsecutive ? activeStreak + 1 : 1
      longestStreak = Math.max(longestStreak, activeStreak)
      previousDate = day.date
    })

    return {
      average: filteredMoods.length ? total / filteredMoods.length : null,
      best: daily.length ? daily.reduce((best, day) => day.average > best.average ? day : best) : null,
      worst: daily.length ? daily.reduce((worst, day) => day.average < worst.average ? day : worst) : null,
      streak,
      longestStreak,
    }
  }, [filteredMoods, moodEntries, todayKey])

  const correlations = useMemo(() => {
    const moodByDay = new Map()
    filteredMoods.forEach(entry => {
      const current = moodByDay.get(getEntryDateKey(entry)) || { total: 0, count: 0 }
      current.total += entry.mood
      current.count += 1
      moodByDay.set(getEntryDateKey(entry), current)
    })
    const sleepByDay = new Map()
    sleepEntries.forEach(entry => {
      const key = getEntryDateKey(entry)
      if (key < startKey || key > todayKey) return
      sleepByDay.set(key, (sleepByDay.get(key) || 0) + entry.hours)
    })
    const waterByDay = new Map()
    waterEntries.forEach(entry => {
      const key = getEntryDateKey(entry)
      if (key < startKey || key > todayKey) return
      waterByDay.set(key, (waterByDay.get(key) || 0) + entry.amountMl)
    })
    const pairsFor = values => [...moodByDay.entries()]
      .filter(([date]) => values.has(date))
      .map(([date, mood]) => [mood.total / mood.count, values.get(date)])
    const sleepPairs = pairsFor(sleepByDay)
    const waterPairs = pairsFor(waterByDay)
    return {
      sleep: { value: pearsonCorrelation(sleepPairs), days: sleepPairs.length },
      water: { value: pearsonCorrelation(waterPairs), days: waterPairs.length },
    }
  }, [filteredMoods, sleepEntries, waterEntries, startKey, todayKey])

  async function shareSummary() {
    const text = `My wellness snapshot for the last ${range} days: average mood ${
      summary.average == null ? 'not enough data' : `${summary.average.toFixed(1)} out of 5`
    }; current mood logging streak: ${summary.streak} days.`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My wellness snapshot', text })
        setShareMessage('Summary shared.')
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        setShareMessage('Summary copied. Share it wherever you choose.')
      } else {
        setShareMessage('Sharing is not supported in this browser.')
      }
    } catch (error) {
      if (error.name !== 'AbortError') setShareMessage('Could not share the summary. Check browser permissions.')
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="analytics-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="analytics-heading" className="text-2xl font-semibold text-gray-800">Insights</h2>
            <p className="text-sm text-gray-500">Explore your entries; these summaries are not medical advice.</p>
          </div>
          <label className="text-sm font-medium text-gray-700">Date range
            <select className="ml-2 rounded-lg border border-gray-300 bg-white px-3 py-2" value={range} onChange={event => setRange(Number(event.target.value))}>
              {RANGE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-indigo-50 p-4"><p className="text-sm text-gray-600">Average mood</p><p className="text-2xl font-semibold text-indigo-700">{summary.average == null ? '—' : `${summary.average.toFixed(2)} / 5`}</p></div>
          <div className="rounded-lg bg-emerald-50 p-4"><p className="text-sm text-gray-600">Current logging streak</p><p className="text-2xl font-semibold text-emerald-700">{summary.streak} {summary.streak === 1 ? 'day' : 'days'}</p></div>
          <div className="rounded-lg bg-emerald-50 p-4"><p className="text-sm text-gray-600">Longest streak in range</p><p className="text-2xl font-semibold text-emerald-700">{summary.longestStreak} {summary.longestStreak === 1 ? 'day' : 'days'}</p></div>
          <div className="rounded-lg bg-amber-50 p-4"><p className="text-sm text-gray-600">Best average day</p><p className="text-2xl font-semibold text-amber-700">{summary.best ? `${formatDateKey(summary.best.date)} · ${summary.best.average.toFixed(1)}` : '—'}</p></div>
          <div className="rounded-lg bg-rose-50 p-4"><p className="text-sm text-gray-600">Lowest average day</p><p className="text-2xl font-semibold text-rose-700">{summary.worst ? `${formatDateKey(summary.worst.date)} · ${summary.worst.average.toFixed(1)}` : '—'}</p></div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" onClick={shareSummary}>Share summary</button>
          <p className="text-sm text-gray-500" role="status">{shareMessage}</p>
        </div>
        <div className="mt-5">
          <h3 className="mb-2 font-medium text-gray-800">Mood trend by {range > 90 ? 'month' : 'day'}</h3>
          {dailyData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" minTickGap={18} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                <Tooltip />
                <Bar dataKey="averageMood" fill="#6366f1" name="Average mood" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="rounded-lg bg-gray-50 p-6 text-center text-gray-500">No mood entries in this date range.</p>}
        </div>
      </section>

      <MoodCalendar entries={moodEntries} />

      <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="correlation-heading">
        <h2 id="correlation-heading" className="text-xl font-semibold text-gray-800">Patterns to explore</h2>
        <p className="mb-4 text-sm text-gray-500">Daily averages for mood and same-day tracker totals in the selected range.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Correlation label="Mood and sleep duration" {...correlations.sleep} />
          <Correlation label="Mood and water intake" {...correlations.water} />
        </div>
      </section>

      <GoalSettings />
      <AppearanceSettings />
    </div>
  )
}
