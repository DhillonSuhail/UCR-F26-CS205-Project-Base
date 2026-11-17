import { useEffect, useMemo, useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import { createEntryId, formatDateKey, getEntryDateKey, getLocalDateKey } from '../utils/helpers'

const fieldClass = 'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'
const buttonClass = 'rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'

function Panel({ title, children }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm" aria-label={title}>
      <h2 className="mb-4 text-xl font-semibold text-gray-800">{title}</h2>
      {children}
    </section>
  )
}

function RecentEntries({ entries, onDelete, renderEntry, limit = 5 }) {
  const recent = [...entries]
    .sort((a, b) => getEntryDateKey(b).localeCompare(getEntryDateKey(a)) ||
      String(b.id).localeCompare(String(a.id)))
    .slice(0, limit)

  if (recent.length === 0) {
    return <p className="mt-4 text-sm text-gray-500">Nothing logged yet.</p>
  }

  return (
    <ul className="mt-4 divide-y divide-gray-100">
      {recent.map(entry => (
        <li key={entry.id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">{renderEntry(entry)}</div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this entry?')) onDelete(entry.id)
            }}
            className="shrink-0 rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Delete entry"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}

function dateLabel(entry) {
  return formatDateKey(getEntryDateKey(entry), { month: 'short', day: 'numeric', year: 'numeric' })
}

function SleepTracker() {
  const { sleepEntries, addEntry, deleteEntry, settings } = useHealthData()
  const [date, setDate] = useState(getLocalDateKey())
  const [hours, setHours] = useState(String(settings.goals.sleepHours))
  const [quality, setQuality] = useState('3')
  const [bedtime, setBedtime] = useState('')
  const [wakeTime, setWakeTime] = useState('')

  function submit(event) {
    event.preventDefault()
    addEntry('sleepEntries', {
      id: createEntryId(), date, hours: Number(hours), quality: Number(quality),
      bedtime: bedtime || null, wakeTime: wakeTime || null,
      timestamp: new Date().toISOString(),
    })
  }

  return (
    <Panel title="Sleep">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium text-gray-700">Date
          <input className={fieldClass} type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </label>
        <label className="text-sm font-medium text-gray-700">Hours slept
          <input className={fieldClass} type="number" min="0.25" max="24" step="0.25" value={hours} onChange={e => setHours(e.target.value)} required />
        </label>
        <label className="text-sm font-medium text-gray-700">Bedtime (optional)
          <input className={fieldClass} type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} />
        </label>
        <label className="text-sm font-medium text-gray-700">Wake time (optional)
          <input className={fieldClass} type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
        </label>
        <label className="col-span-2 text-sm font-medium text-gray-700">Sleep quality
          <select className={fieldClass} value={quality} onChange={e => setQuality(e.target.value)}>
            <option value="1">1 – Poor</option><option value="2">2 – Fair</option>
            <option value="3">3 – Okay</option><option value="4">4 – Good</option>
            <option value="5">5 – Excellent</option>
          </select>
        </label>
        <button className={`${buttonClass} col-span-2`} type="submit">Log sleep</button>
      </form>
      <RecentEntries entries={sleepEntries} onDelete={id => deleteEntry('sleepEntries', id)}
        renderEntry={entry => <p className="text-sm text-gray-700">{entry.hours} hours · quality {entry.quality}/5{entry.bedtime && entry.wakeTime ? ` · ${entry.bedtime}–${entry.wakeTime}` : ''} <span className="text-gray-500">· {dateLabel(entry)}</span></p>} />
    </Panel>
  )
}

function WaterTracker() {
  const { waterEntries, addEntry, deleteEntry, settings } = useHealthData()
  const [amount, setAmount] = useState('250')
  const todayTotal = useMemo(() => waterEntries
    .filter(entry => getEntryDateKey(entry) === getLocalDateKey())
    .reduce((sum, entry) => sum + entry.amountMl, 0), [waterEntries])
  const goal = settings.goals.waterMl

  function addWater(event) {
    event.preventDefault()
    addEntry('waterEntries', {
      id: createEntryId(), date: getLocalDateKey(), amountMl: Number(amount),
      timestamp: new Date().toISOString(),
    })
  }

  return (
    <Panel title="Water">
      <p className="mb-2 text-sm text-gray-600">Today: <strong>{todayTotal} ml</strong> of {goal} ml goal</p>
      <progress className="mb-4 h-3 w-full accent-indigo-600" value={Math.min(todayTotal, goal)} max={goal} aria-label={`Water goal progress: ${todayTotal} of ${goal} milliliters`} />
      <form onSubmit={addWater} className="flex gap-2">
        <label className="sr-only" htmlFor="water-amount">Water amount in milliliters</label>
        <input id="water-amount" className={fieldClass} type="number" min="1" max="10000" value={amount} onChange={e => setAmount(e.target.value)} required />
        <button className={buttonClass} type="submit">Add ml</button>
      </form>
      <div className="mt-2 flex gap-2">
        {[150, 250, 500].map(value => (
          <button key={value} type="button" className="rounded border border-indigo-200 px-3 py-1 text-sm text-indigo-700 hover:bg-indigo-50" onClick={() => setAmount(String(value))}>
            {value} ml
          </button>
        ))}
      </div>
      <RecentEntries entries={waterEntries} onDelete={id => deleteEntry('waterEntries', id)}
        renderEntry={entry => <p className="text-sm text-gray-700">{entry.amountMl} ml <span className="text-gray-500">· {dateLabel(entry)}</span></p>} />
    </Panel>
  )
}

function ExerciseTracker() {
  const { exerciseEntries, addEntry, deleteEntry } = useHealthData()
  const [date, setDate] = useState(getLocalDateKey())
  const [activity, setActivity] = useState('')
  const [duration, setDuration] = useState('')
  const [calories, setCalories] = useState('')

  function submit(event) {
    event.preventDefault()
    addEntry('exerciseEntries', {
      id: createEntryId(), date, activity: activity.trim(),
      durationMinutes: Number(duration),
      caloriesBurned: calories === '' ? null : Number(calories),
      timestamp: new Date().toISOString(),
    })
    setActivity('')
    setDuration('')
    setCalories('')
  }

  return (
    <Panel title="Exercise">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <label className="col-span-2 text-sm font-medium text-gray-700">Activity
          <input className={fieldClass} value={activity} maxLength="100" onChange={e => setActivity(e.target.value)} placeholder="e.g. Walking" required />
        </label>
        <label className="text-sm font-medium text-gray-700">Date
          <input className={fieldClass} type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </label>
        <label className="text-sm font-medium text-gray-700">Minutes
          <input className={fieldClass} type="number" min="1" max="1440" value={duration} onChange={e => setDuration(e.target.value)} required />
        </label>
        <label className="col-span-2 text-sm font-medium text-gray-700">Calories burned (optional)
          <input className={fieldClass} type="number" min="0" max="10000" value={calories} onChange={e => setCalories(e.target.value)} />
        </label>
        <button className={`${buttonClass} col-span-2`} type="submit">Log exercise</button>
      </form>
      <RecentEntries entries={exerciseEntries} onDelete={id => deleteEntry('exerciseEntries', id)}
        renderEntry={entry => <p className="text-sm text-gray-700">{entry.activity} · {entry.durationMinutes} min <span className="text-gray-500">· {dateLabel(entry)}</span></p>} />
    </Panel>
  )
}

function MealTracker() {
  const { mealEntries, addEntry, deleteEntry } = useHealthData()
  const [date, setDate] = useState(getLocalDateKey())
  const [mealType, setMealType] = useState('breakfast')
  const [description, setDescription] = useState('')
  const [calories, setCalories] = useState('')

  function submit(event) {
    event.preventDefault()
    addEntry('mealEntries', {
      id: createEntryId(), date, mealType, description: description.trim(),
      calories: calories === '' ? null : Number(calories),
      timestamp: new Date().toISOString(),
    })
    setDescription('')
    setCalories('')
  }

  return (
    <Panel title="Meals">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium text-gray-700">Meal
          <select className={fieldClass} value={mealType} onChange={e => setMealType(e.target.value)}>
            <option value="breakfast">Breakfast</option><option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option><option value="snack">Snack</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">Date
          <input className={fieldClass} type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </label>
        <label className="col-span-2 text-sm font-medium text-gray-700">Meal notes
          <input className={fieldClass} value={description} maxLength="200" onChange={e => setDescription(e.target.value)} placeholder="What did you eat?" required />
        </label>
        <label className="col-span-2 text-sm font-medium text-gray-700">Calories (optional)
          <input className={fieldClass} type="number" min="0" max="10000" value={calories} onChange={e => setCalories(e.target.value)} />
        </label>
        <button className={`${buttonClass} col-span-2`} type="submit">Log meal</button>
      </form>
      <RecentEntries entries={mealEntries} onDelete={id => deleteEntry('mealEntries', id)}
        renderEntry={entry => <p className="text-sm capitalize text-gray-700">{entry.mealType}: {entry.description} <span className="text-gray-500">· {dateLabel(entry)}</span></p>} />
    </Panel>
  )
}

function MedicationTracker() {
  const { medicationEntries, addEntry, deleteEntry, updateEntry, settings, updateSettings } = useHealthData()
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [permissionMessage, setPermissionMessage] = useState('')

  async function enableNotifications() {
    if (!('Notification' in window)) {
      setPermissionMessage('This browser does not support notifications.')
      return
    }
    try {
      const permission = await window.Notification.requestPermission()
      if (permission === 'granted') {
        updateSettings({ notificationsEnabled: true })
        setPermissionMessage('Reminders are enabled while this app is open.')
      } else {
        setPermissionMessage('Notifications were not allowed. You can change this in browser settings.')
      }
    } catch (error) {
      setPermissionMessage(`Could not enable notifications: ${error.message}`)
    }
  }

  function submit(event) {
    event.preventDefault()
    addEntry('medicationEntries', {
      id: createEntryId(), date: getLocalDateKey(), name: name.trim(), dose: dose.trim(),
      scheduledTime, taken: false, reminderEnabled,
      timestamp: new Date().toISOString(),
    })
    setName('')
    setDose('')
  }

  return (
    <Panel title="Medication reminders">
      <p className="mb-3 text-sm text-gray-600">Reminders are local browser notifications and require this app to stay open.</p>
      <button type="button" className="mb-3 rounded-lg border border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50" onClick={enableNotifications}>
        {settings.notificationsEnabled ? 'Notification permission enabled' : 'Enable browser notifications'}
      </button>
      {permissionMessage && <p className="mb-3 text-sm text-gray-600" role="status">{permissionMessage}</p>}
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium text-gray-700">Medication
          <input className={fieldClass} value={name} maxLength="100" onChange={e => setName(e.target.value)} required />
        </label>
        <label className="text-sm font-medium text-gray-700">Dose
          <input className={fieldClass} value={dose} maxLength="100" onChange={e => setDose(e.target.value)} placeholder="e.g. 10 mg" required />
        </label>
        <label className="text-sm font-medium text-gray-700">Reminder time
          <input className={fieldClass} type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} required />
        </label>
        <label className="flex items-center gap-2 self-end pb-3 text-sm text-gray-700">
          <input type="checkbox" checked={reminderEnabled} onChange={e => setReminderEnabled(e.target.checked)} />
          Remind me
        </label>
        <button className={`${buttonClass} col-span-2`} type="submit">Add today&apos;s dose</button>
      </form>
      <RecentEntries entries={medicationEntries} onDelete={id => deleteEntry('medicationEntries', id)}
        renderEntry={entry => (
          <div>
            <p className="text-sm font-medium text-gray-800">{entry.name} · {entry.dose} · {entry.scheduledTime}</p>
            <p className="text-xs text-gray-500">{dateLabel(entry)}{entry.reminderEnabled ? ' · reminder on' : ''}</p>
            <button type="button" className="mt-1 text-sm text-indigo-700 underline" onClick={() => updateEntry('medicationEntries', entry.id, { taken: !entry.taken })}>
              {entry.taken ? 'Mark as not taken' : 'Mark as taken'}
            </button>
          </div>
        )} />
    </Panel>
  )
}

function JournalTracker() {
  const { journalEntries, moodEntries, addEntry, deleteEntry } = useHealthData()
  const [text, setText] = useState('')
  const [moodEntryId, setMoodEntryId] = useState('')

  function submit(event) {
    event.preventDefault()
    addEntry('journalEntries', {
      id: createEntryId(), date: getLocalDateKey(), text: text.trim(),
      moodEntryId: moodEntryId || null, timestamp: new Date().toISOString(),
    })
    setText('')
    setMoodEntryId('')
  }

  const moods = [...moodEntries].sort((a, b) => b.id - a.id).slice(0, 20)
  return (
    <Panel title="Journal">
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-medium text-gray-700" htmlFor="journal-text">Private note</label>
        <textarea id="journal-text" className={fieldClass} rows="4" maxLength="3000" value={text} onChange={e => setText(e.target.value)} placeholder="Write a note about your day..." required />
        <div className="text-right text-xs text-gray-500">{text.length}/3000</div>
        <label className="block text-sm font-medium text-gray-700">Attach to a recent mood (optional)
          <select className={fieldClass} value={moodEntryId} onChange={e => setMoodEntryId(e.target.value)}>
            <option value="">No mood selected</option>
            {moods.map(entry => <option key={entry.id} value={entry.id}>{entry.mood}/5 · {entry.date} at {entry.time}</option>)}
          </select>
        </label>
        <button className={buttonClass} type="submit">Save journal note</button>
      </form>
      <RecentEntries entries={journalEntries} onDelete={id => deleteEntry('journalEntries', id)}
        renderEntry={entry => <p className="whitespace-pre-wrap break-words text-sm text-gray-700">{entry.text}<span className="mt-1 block text-xs text-gray-500">{dateLabel(entry)}</span></p>} />
    </Panel>
  )
}

function MedicationReminderAlerts() {
  const { medicationEntries, settings } = useHealthData()

  useEffect(() => {
    if (!settings.notificationsEnabled || !('Notification' in window) ||
        window.Notification.permission !== 'granted') return undefined

    const checkReminders = () => {
      const now = new Date()
      const today = getLocalDateKey(now)
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      medicationEntries.forEach(entry => {
        if (!entry.reminderEnabled || entry.taken || getEntryDateKey(entry) !== today ||
            entry.scheduledTime > currentTime) return
        const key = `health-reminder-${today}-${entry.id}`
        if (sessionStorage.getItem(key)) return
        new window.Notification('Medication reminder', {
          body: 'A scheduled dose is due. Open your journal to review it.',
        })
        sessionStorage.setItem(key, 'sent')
      })
    }

    checkReminders()
    const timer = window.setInterval(checkReminders, 30000)
    return () => window.clearInterval(timer)
  }, [medicationEntries, settings.notificationsEnabled])

  return null
}

export default function WellnessTrackers() {
  return (
    <>
      <MedicationReminderAlerts />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SleepTracker />
        <WaterTracker />
        <ExerciseTracker />
        <MealTracker />
        <MedicationTracker />
        <JournalTracker />
      </div>
    </>
  )
}
