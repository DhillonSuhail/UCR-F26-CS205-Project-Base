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

const POMODORO_MODES = {
  focus: { label: 'Focus', seconds: 25 * 60 },
  shortBreak: { label: 'Short break', seconds: 5 * 60 },
  longBreak: { label: 'Long break', seconds: 15 * 60 },
}

function formatTimer(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function PomodoroTimer() {
  const [mode, setMode] = useState('focus')
  const [remaining, setRemaining] = useState(POMODORO_MODES.focus.seconds)
  const [endAt, setEndAt] = useState(null)
  const [message, setMessage] = useState('')
  const duration = POMODORO_MODES[mode].seconds

  useEffect(() => {
    if (endAt === null) return undefined

    const updateRemaining = () => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setRemaining(next)
      if (next === 0) {
        setEndAt(null)
        setMessage(`${POMODORO_MODES[mode].label} session complete.`)
      }
    }

    updateRemaining()
    const interval = window.setInterval(updateRemaining, 250)
    return () => window.clearInterval(interval)
  }, [endAt, mode])

  function changeMode(event) {
    const nextMode = event.target.value
    setMode(nextMode)
    setEndAt(null)
    setRemaining(POMODORO_MODES[nextMode].seconds)
    setMessage('')
  }

  function start() {
    if (remaining === 0) setRemaining(duration)
    setMessage('')
    setEndAt(Date.now() + (remaining || duration) * 1000)
  }

  function pause() {
    if (endAt !== null) setRemaining(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)))
    setEndAt(null)
    setMessage('Timer paused.')
  }

  function reset() {
    setEndAt(null)
    setRemaining(duration)
    setMessage('')
  }

  return (
    <Panel title="Pomodoro focus timer">
      <label className="block text-sm font-medium text-gray-700">Session
        <select className={fieldClass} value={mode} onChange={changeMode}>
          {Object.entries(POMODORO_MODES).map(([value, option]) => (
            <option key={value} value={value}>{option.label} · {option.seconds / 60} min</option>
          ))}
        </select>
      </label>
      <p className="my-5 text-center text-5xl font-semibold tabular-nums text-indigo-700" role="timer" aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`}>
        {formatTimer(remaining)}
      </p>
      <progress className="mb-4 h-3 w-full accent-indigo-600" value={duration - remaining} max={duration} aria-label="Pomodoro session progress" />
      <div className="flex flex-wrap justify-center gap-2">
        {endAt === null
          ? <button type="button" className={buttonClass} onClick={start}>{remaining === 0 ? 'Start again' : 'Start'}</button>
          : <button type="button" className={buttonClass} onClick={pause}>Pause</button>}
        <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50" onClick={reset}>Reset</button>
      </div>
      <p className="mt-3 min-h-5 text-center text-sm text-gray-600" role="status">{message}</p>
    </Panel>
  )
}

const BREATHING_PHASES = [
  { label: 'Breathe in', seconds: 4 },
  { label: 'Hold', seconds: 4 },
  { label: 'Breathe out', seconds: 6 },
]
const BREATHING_CYCLE_SECONDS = BREATHING_PHASES.reduce((total, phase) => total + phase.seconds, 0)

function BreathingTimer() {
  const [durationMinutes, setDurationMinutes] = useState(2)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')
  const durationMs = durationMinutes * 60 * 1000
  const isComplete = elapsedMs >= durationMs
  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const cycleSeconds = elapsedSeconds % BREATHING_CYCLE_SECONDS
  let phaseOffset = 0
  let phase = BREATHING_PHASES[0]
  for (const candidate of BREATHING_PHASES) {
    if (cycleSeconds < phaseOffset + candidate.seconds) {
      phase = candidate
      break
    }
    phaseOffset += candidate.seconds
  }
  const phaseRemaining = isComplete
    ? 0
    : Math.max(1, phase.seconds - (cycleSeconds - phaseOffset))
  const remainingSeconds = Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000))

  useEffect(() => {
    if (!running || startedAt === null) return undefined
    const updateElapsed = () => {
      const next = Math.min(Date.now() - startedAt, durationMs)
      setElapsedMs(next)
      if (next >= durationMs) {
        setRunning(false)
        setStartedAt(null)
        setMessage('Breathing session complete.')
      }
    }
    updateElapsed()
    const interval = window.setInterval(updateElapsed, 200)
    return () => window.clearInterval(interval)
  }, [running, startedAt, durationMs])

  function start() {
    const startingElapsed = isComplete ? 0 : elapsedMs
    setElapsedMs(startingElapsed)
    setStartedAt(Date.now() - startingElapsed)
    setRunning(true)
    setMessage('')
  }

  function pause() {
    if (startedAt !== null) setElapsedMs(Math.min(Date.now() - startedAt, durationMs))
    setRunning(false)
    setStartedAt(null)
    setMessage('Timer paused.')
  }

  function reset() {
    setElapsedMs(0)
    setStartedAt(null)
    setRunning(false)
    setMessage('')
  }

  function changeDuration(event) {
    setDurationMinutes(Number(event.target.value))
    setElapsedMs(0)
    setStartedAt(null)
    setRunning(false)
    setMessage('')
  }

  return (
    <Panel title="Focused breathing">
      <p className="text-sm text-gray-600">Follow the gentle 4–4–6 breathing rhythm: inhale, hold, then exhale.</p>
      <label className="mt-3 block text-sm font-medium text-gray-700">Session length
        <select className={fieldClass} value={durationMinutes} onChange={changeDuration} disabled={running}>
          {[1, 2, 3, 5].map(minutes => <option key={minutes} value={minutes}>{minutes} {minutes === 1 ? 'minute' : 'minutes'}</option>)}
        </select>
      </label>
      <div className="my-5 rounded-xl bg-indigo-50 p-5 text-center">
        <p className="text-sm font-medium text-gray-600" aria-live="polite" aria-atomic="true">{isComplete ? 'Session complete' : phase.label}</p>
        <p className="mt-1 text-4xl font-semibold tabular-nums text-indigo-700">{isComplete ? 'Done' : `${phaseRemaining}s`}</p>
        <p className="mt-2 text-sm text-gray-600">{formatTimer(remainingSeconds)} remaining</p>
      </div>
      <progress className="mb-4 h-3 w-full accent-indigo-600" value={elapsedMs} max={durationMs} aria-label="Breathing session progress" />
      <div className="flex flex-wrap justify-center gap-2">
        {running
          ? <button type="button" className={buttonClass} onClick={pause}>Pause</button>
          : <button type="button" className={buttonClass} onClick={start}>{isComplete ? 'Start again' : elapsedMs ? 'Resume' : 'Start breathing'}</button>}
        <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50" onClick={reset}>Reset</button>
      </div>
      <p className="mt-3 min-h-5 text-center text-sm text-gray-600" role="status">{message}</p>
    </Panel>
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
        <PomodoroTimer />
        <BreathingTimer />
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
