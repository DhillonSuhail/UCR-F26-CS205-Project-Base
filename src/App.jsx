import { useEffect, useState } from 'react'
import { HealthDataProvider, useHealthData } from './context/HealthDataContext'
import MoodTracker from './modules/MoodTracker'
import DailyGraph from './components/DailyGraph'
import WeeklyGraph from './components/WeeklyGraph'
import HistoryView from './components/HistoryView'
import FileManager from './components/FileManager'
import WellnessTrackers from './components/WellnessTrackers'
import AnalyticsView from './components/AnalyticsView'
import TodayOverview from './components/TodayOverview'

const TABS = [
  ['dashboard', 'Overview'],
  ['trackers', 'Trackers'],
  ['insights', 'Insights'],
  ['history', 'History'],
  ['data', 'Data & privacy'],
]

function Onboarding() {
  const { settings, updateSettings } = useHealthData()
  if (settings.onboardingComplete) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="welcome-heading" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Welcome</p>
        <h2 id="welcome-heading" className="mt-2 text-2xl font-bold text-gray-900">A calmer way to notice your patterns</h2>
        <p className="mt-3 text-gray-600">Track mood and daily wellness, then review your own trends over time. You choose what to log.</p>
        <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-gray-600">
          <li>Your entries are stored in this browser on this device.</li>
          <li>Use Data &amp; privacy to export or import a backup.</li>
          <li>Insights are informational and are not medical advice.</li>
        </ul>
        <button type="button" className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onClick={() => updateSettings({ onboardingComplete: true })}>
          Get started
        </button>
      </section>
    </div>
  )
}

function LockedApp() {
  const { unlock, clearLocalData } = useHealthData()
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setIsUnlocking(true)
    const success = await unlock(passphrase)
    setIsUnlocking(false)
    setError(success ? '' : 'That passphrase did not unlock the data. Check it and try again.')
    if (success) setPassphrase('')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Encrypted local data</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Unlock your journal</h1>
        <p className="mt-2 text-sm text-gray-600">Your entries are encrypted in this browser. Enter your passphrase to decrypt them.</p>
        <form className="mt-5 space-y-3" onSubmit={submit}>
          <label htmlFor="unlock-passphrase" className="block text-sm font-medium text-gray-700">Passphrase</label>
          <input id="unlock-passphrase" className="w-full rounded-lg border border-gray-300 px-3 py-2" type="password" autoComplete="current-password" maxLength="1024" value={passphrase} onChange={event => setPassphrase(event.target.value)} required autoFocus />
          <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60" disabled={isUnlocking}>
            {isUnlocking ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
        <p className="mt-4 text-xs text-gray-500">The passphrase is not stored. If you forget it, the encrypted data cannot be recovered; restore an encrypted backup or clear this browser&apos;s site data.</p>
        <button type="button" className="mt-4 text-sm text-red-700 underline" onClick={() => {
          if (window.confirm('Permanently delete the encrypted data in this browser? This cannot be undone.')) {
            const cleared = clearLocalData()
            if (!cleared) setError('The browser could not clear its stored data.')
          }
        }}>Forgot passphrase? Clear encrypted data</button>
      </section>
    </main>
  )
}

function WellnessApp() {
  const { settings, updateSettings, storageError, isEncrypted, isLocked, lock } = useHealthData()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [lockError, setLockError] = useState('')

  async function lockJournal() {
    try {
      const success = await lock()
      setLockError(success ? '' : 'Could not save your encrypted data before locking.')
    } catch (error) {
      setLockError(error.message)
    }
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
    document.documentElement.style.colorScheme = settings.theme === 'dark' ? 'dark' : 'light'
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  if (isLocked) return <LockedApp />

  return (
    <div className="app-shell min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900 transition-colors dark:from-gray-950 dark:to-slate-900 dark:text-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Personal wellness journal</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Wellbeing, one day at a time</h1>
            <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-300">Track how you feel and the habits that matter to you. Your data stays in this browser unless you export it.</p>
          </div>
          <button type="button" onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700" aria-label={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}>
            {settings.theme === 'dark' ? '☀ Light mode' : '☾ Dark mode'}
          </button>
          {isEncrypted && <button type="button" onClick={lockJournal} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">Lock</button>}
        </header>

        {lockError && <p role="alert" className="mb-4 text-sm text-red-700">{lockError}</p>}
        {storageError && (
          <div role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            Your browser could not save changes to local storage. Export a backup and check your browser storage settings.
          </div>
        )}

        <nav className="mb-6 overflow-x-auto border-b border-gray-300 dark:border-slate-700" aria-label="Main navigation">
          <div className="flex min-w-max gap-2 sm:gap-6">
            {TABS.map(([id, label]) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined}
                className={`border-b-2 px-2 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  activeTab === id
                    ? 'border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border-transparent text-gray-600 hover:border-gray-400 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </nav>

        <main>
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              <TodayOverview />
              <div className="grid gap-5 lg:grid-cols-2">
                <MoodTracker />
                <DailyGraph />
                <WeeklyGraph />
              </div>
            </div>
          )}
          {activeTab === 'trackers' && <WellnessTrackers />}
          {activeTab === 'insights' && <AnalyticsView />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'data' && <FileManager />}
        </main>
        <footer className="mt-8 border-t border-gray-300 py-4 text-center text-xs text-gray-500 dark:border-slate-700 dark:text-gray-400">
          Your health information is private to this browser. Keep a backup if you clear browser data.
        </footer>
      </div>
      <Onboarding />
    </div>
  )
}

function App() {
  return (
    <HealthDataProvider>
      <WellnessApp />
    </HealthDataProvider>
  )
}

export default App
