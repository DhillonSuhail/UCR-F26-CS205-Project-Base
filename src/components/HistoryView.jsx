import { useMemo, useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import { formatDateKey, getEntryDateKey } from '../utils/helpers'

const TYPES = [
  ['moodEntries', 'Mood'],
  ['sleepEntries', 'Sleep'],
  ['waterEntries', 'Water'],
  ['exerciseEntries', 'Exercise'],
  ['mealEntries', 'Meal'],
  ['medicationEntries', 'Medication'],
  ['journalEntries', 'Journal'],
]

function description(entry) {
  if (entry.mood != null) return `Mood ${entry.mood}/5`
  if (entry.hours != null) return `${entry.hours} hours of sleep · quality ${entry.quality}/5${
    entry.bedtime && entry.wakeTime ? ` · ${entry.bedtime}–${entry.wakeTime}` : ''
  }`
  if (entry.amountMl != null) return `${entry.amountMl} ml water`
  if (entry.activity) return `${entry.activity} · ${entry.durationMinutes} min`
  if (entry.mealType) return `${entry.mealType}: ${entry.description}`
  if (entry.name) return `${entry.name} · ${entry.dose} · ${entry.taken ? 'taken' : 'not marked taken'}`
  return entry.text
}

export default function HistoryView() {
  const {
    moodEntries, sleepEntries, waterEntries, exerciseEntries, mealEntries,
    medicationEntries, journalEntries, deleteEntry,
  } = useHealthData()
  const [typeFilter, setTypeFilter] = useState('all')
  const [query, setQuery] = useState('')

  const entries = useMemo(() => {
    const records = {
      moodEntries, sleepEntries, waterEntries, exerciseEntries,
      mealEntries, medicationEntries, journalEntries,
    }
    return TYPES.flatMap(([type, label]) =>
    records[type].map(entry => ({ ...entry, type, label, dateKey: getEntryDateKey(entry) }))
  ).filter(entry => {
    const matchesType = typeFilter === 'all' || entry.type === typeFilter
    const matchesQuery = `${entry.label} ${entry.dateKey} ${description(entry)}`
      .toLowerCase().includes(query.trim().toLowerCase())
    return matchesType && matchesQuery
  }).sort((a, b) => b.dateKey.localeCompare(a.dateKey) ||
    String(b.timestamp || b.id).localeCompare(String(a.timestamp || a.id)))
  }, [moodEntries, sleepEntries, waterEntries, exerciseEntries, mealEntries, medicationEntries, journalEntries, typeFilter, query])

  const grouped = useMemo(() => entries.reduce((days, entry) => {
    days[entry.dateKey] ??= []
    days[entry.dateKey].push(entry)
    return days
  }, {}), [entries])

  function remove(entry) {
    if (window.confirm(`Delete this ${entry.label.toLowerCase()} entry?`)) {
      deleteEntry(entry.type, entry.id)
    }
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="history-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="history-heading" className="text-2xl font-semibold text-gray-800">Health history</h2>
          <p className="text-sm text-gray-500">Search and review all your locally stored entries.</p>
        </div>
        <p className="text-sm text-gray-500" aria-live="polite">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-gray-700">Filter by tracker
          <select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
            <option value="all">All trackers</option>
            {TYPES.map(([type, label]) => <option key={type} value={type}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">Search
          <input className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search notes or entries" />
        </label>
      </div>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No matching entries. Log an activity or adjust your filters.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayEntries]) => (
            <section key={date} aria-label={formatDateKey(date, { month: 'long', day: 'numeric', year: 'numeric' })}>
              <h3 className="mb-2 border-b border-gray-200 pb-2 font-semibold text-gray-700">
                {formatDateKey(date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <ul className="divide-y divide-gray-100">
                {dayEntries.map(entry => (
                  <li key={`${entry.type}-${entry.id}`} className="flex items-start gap-3 py-3">
                    <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-indigo-700">{entry.label}</span>
                    <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm text-gray-800">{description(entry)}</p>
                    <button type="button" onClick={() => remove(entry)} className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={`Delete ${entry.label.toLowerCase()} entry`}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
