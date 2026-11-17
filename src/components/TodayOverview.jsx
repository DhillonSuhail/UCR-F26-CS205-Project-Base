import { useMemo } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import { getEntryDateKey, getLocalDateKey } from '../utils/helpers'

function Goal({ label, value, goal, unit }) {
  const percent = Math.min(100, Math.round((value / goal) * 100))
  return (
    <div>
      <div className="mb-1 flex justify-between gap-2 text-sm text-gray-700">
        <span>{label}</span><span>{value} / {goal} {unit}</span>
      </div>
      <progress className="h-2 w-full accent-indigo-600" value={percent} max="100" aria-label={`${label}: ${percent}% of daily goal`} />
    </div>
  )
}

export default function TodayOverview() {
  const { moodEntries, sleepEntries, waterEntries, exerciseEntries, settings } = useHealthData()
  const today = getLocalDateKey()
  const summary = useMemo(() => ({
    moods: moodEntries.filter(entry => getEntryDateKey(entry) === today),
    sleep: sleepEntries.filter(entry => getEntryDateKey(entry) === today)
      .reduce((sum, entry) => sum + entry.hours, 0),
    water: waterEntries.filter(entry => getEntryDateKey(entry) === today)
      .reduce((sum, entry) => sum + entry.amountMl, 0),
    exercise: exerciseEntries.filter(entry => getEntryDateKey(entry) === today)
      .reduce((sum, entry) => sum + entry.durationMinutes, 0),
  }), [moodEntries, sleepEntries, waterEntries, exerciseEntries, today])

  const averageMood = summary.moods.length
    ? (summary.moods.reduce((sum, entry) => sum + entry.mood, 0) / summary.moods.length).toFixed(1)
    : '—'

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="today-overview-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="today-overview-heading" className="text-xl font-semibold text-gray-800">Today at a glance</h2>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-indigo-50 p-4">
          <p className="text-sm text-gray-600">Average mood</p>
          <p className="mt-1 text-2xl font-semibold text-indigo-700">{averageMood}<span className="ml-1 text-sm font-normal">/ 5</span></p>
          <p className="text-xs text-gray-500">{summary.moods.length} {summary.moods.length === 1 ? 'check-in' : 'check-ins'}</p>
        </div>
        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <Goal label="Water" value={summary.water} goal={settings.goals.waterMl} unit="ml" />
          <Goal label="Sleep" value={Number(summary.sleep.toFixed(1))} goal={settings.goals.sleepHours} unit="hr" />
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <Goal label="Exercise" value={summary.exercise} goal={settings.goals.exerciseMinutes} unit="min" />
          <p className="mt-3 text-xs text-gray-500">Goals are personal targets, not medical advice.</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-4">
          <p className="text-sm text-gray-600">Gentle reminder</p>
          <p className="mt-1 text-sm text-emerald-800">Small, consistent check-ins can help you notice patterns over time.</p>
        </div>
      </div>
    </section>
  )
}
