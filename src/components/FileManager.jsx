import { useRef, useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'

function AppearanceSettings({ settings, updateSettings }) {
  const [name, setName] = useState('')
  const [mode, setMode] = useState('light')
  const [accentColor, setAccentColor] = useState('#4f46e5')
  const [pageColor, setPageColor] = useState('#eff6ff')
  const [message, setMessage] = useState('')

  function createTheme(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setMessage('Enter a name for your theme.')
      return
    }
    if (settings.customThemes.length >= 20) {
      setMessage('You can save up to 20 custom themes. Delete one to make room.')
      return
    }
    const id = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const theme = { id, name: trimmedName, mode, accentColor, pageColor }
    updateSettings({
      customThemes: [...settings.customThemes, theme],
      theme: `custom:${id}`,
    })
    setName('')
    setMessage(`Theme "${trimmedName}" created and applied.`)
  }

  function deleteTheme(theme) {
    updateSettings({
      customThemes: settings.customThemes.filter(item => item.id !== theme.id),
      ...(settings.theme === `custom:${theme.id}` ? { theme: 'light' } : {}),
    })
    setMessage(`Theme "${theme.name}" deleted.`)
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="appearance-heading">
      <h2 id="appearance-heading" className="text-xl font-semibold text-gray-800">Appearance</h2>
      <p className="mt-1 text-sm text-gray-600">Choose a preset or create a theme. Custom themes are saved with this browser&apos;s data.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {[
          { value: 'light', label: 'Light mode', description: 'Bright surfaces and page colors' },
          { value: 'dark', label: 'Dark mode', description: 'Dark surfaces for low-light use' },
        ].map(preset => (
          <button key={preset.value} type="button" aria-pressed={settings.theme === preset.value}
            className={`rounded-lg border px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              settings.theme === preset.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => updateSettings({ theme: preset.value })}>
            <span className="block font-medium text-gray-800">{preset.label}</span>
            <span className="mt-1 block text-sm text-gray-600">{preset.description}</span>
          </button>
        ))}
      </div>

      <form onSubmit={createTheme} className="mt-5 grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2">
        <h3 className="font-medium text-gray-800 sm:col-span-2">Create a custom theme</h3>
        <label className="text-sm font-medium text-gray-700">Theme name
          <input className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" value={name} onChange={event => setName(event.target.value)} maxLength="40" required />
        </label>
        <label className="text-sm font-medium text-gray-700">Base appearance
          <select className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" value={mode} onChange={event => setMode(event.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">Accent color
          <input className="mt-1 block h-10 w-full rounded-lg border border-gray-300 bg-white p-1" type="color" value={accentColor} onChange={event => setAccentColor(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-gray-700">Page background color
          <input className="mt-1 block h-10 w-full rounded-lg border border-gray-300 bg-white p-1" type="color" value={pageColor} onChange={event => setPageColor(event.target.value)} />
        </label>
        <button type="submit" className="w-fit rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:col-span-2">
          Create and apply theme
        </button>
      </form>

      {settings.customThemes.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100" aria-label="Custom themes">
          {settings.customThemes.map(theme => (
            <li key={theme.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-8 w-8 shrink-0 rounded-full border border-gray-300" style={{ background: `linear-gradient(135deg, ${theme.pageColor} 50%, ${theme.accentColor} 50%)` }} aria-hidden="true" />
                <div>
                  <p className="font-medium text-gray-800">{theme.name}</p>
                  <p className="text-sm capitalize text-gray-500">{theme.mode} theme</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50" aria-pressed={settings.theme === `custom:${theme.id}`} onClick={() => updateSettings({ theme: `custom:${theme.id}` })}>
                  {settings.theme === `custom:${theme.id}` ? 'Applied' : 'Apply'}
                </button>
                <button type="button" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => deleteTheme(theme)} aria-label={`Delete ${theme.name} theme`}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="mt-3 text-sm text-gray-600" role="status">{message}</p>}
    </section>
  )
}

function downloadJson(json, filename) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function LocalEncryptionSettings({ isEncrypted, enableEncryption, disableEncryption, lock }) {
  const [passphrase, setPassphrase] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function lockData() {
    try {
      const success = await lock()
      setIsError(!success)
      setMessage(success ? 'Journal locked.' : 'Could not save your encrypted data before locking.')
    } catch (error) {
      setIsError(true)
      setMessage(error.message)
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (passphrase.length < 12 || passphrase !== confirmation) {
      setIsError(true)
      setMessage(passphrase.length < 12
        ? 'Use at least 12 characters.'
        : 'The passphrases do not match.')
      return
    }
    try {
      const success = await enableEncryption(passphrase)
      setIsError(!success)
      setMessage(success ? 'Encryption is on. The passphrase is not stored.' : 'The browser could not save encrypted data.')
      if (success) {
        setPassphrase('')
        setConfirmation('')
      }
    } catch (error) {
      setIsError(true)
      setMessage(error.message)
    }
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="encryption-heading">
      <h2 id="encryption-heading" className="text-xl font-semibold text-gray-800">Encrypt local data</h2>
      <p className="mt-1 text-sm text-gray-600">Optional passphrase encryption protects the browser copy and encrypted backups with AES-GCM. The passphrase is never stored. Losing it means the data cannot be recovered.</p>
      {isEncrypted ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-emerald-700" role="status">At-rest encryption is enabled.</p>
          <button type="button" className="rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50" onClick={lockData}>Lock now</button>
          <button type="button" className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => {
            if (window.confirm('Turn off encryption and store your data as readable text in this browser?')) {
              const success = disableEncryption()
              setIsError(!success)
              setMessage(success ? 'Encryption is off. Browser storage is now plaintext.' : 'Could not change the stored data.')
            }
          }}>Disable encryption</button>
        </div>
      ) : (
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
          <label className="text-sm font-medium text-gray-700">New passphrase
            <input className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" type="password" autoComplete="new-password" minLength="12" maxLength="1024" value={passphrase} onChange={event => setPassphrase(event.target.value)} required />
          </label>
          <label className="text-sm font-medium text-gray-700">Confirm passphrase
            <input className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" type="password" autoComplete="new-password" minLength="12" maxLength="1024" value={confirmation} onChange={event => setConfirmation(event.target.value)} required />
          </label>
          <button type="submit" className="w-fit rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Encrypt this browser&apos;s data</button>
        </form>
      )}
      {message && <p className={`mt-3 text-sm ${isError ? 'text-red-700' : 'text-emerald-700'}`} role={isError ? 'alert' : 'status'}>{message}</p>}
    </section>
  )
}

export default function FileManager() {
  const {
    exportData, exportEncryptedData, importData, importEncryptedData,
    settings, updateSettings,
    setupFileHandle, loadFromFile, fileHandle, fileStatus,
    isEncrypted, enableEncryption, disableEncryption, lock, clearLocalData,
    moodEntries, sleepEntries, waterEntries, exerciseEntries, mealEntries,
    medicationEntries, journalEntries,
  } = useHealthData()
  const [importText, setImportText] = useState('')
  const [backupPassphrase, setBackupPassphrase] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const fileInputRef = useRef(null)
  const totalEntries = moodEntries.length + sleepEntries.length + waterEntries.length +
    exerciseEntries.length + mealEntries.length + medicationEntries.length + journalEntries.length

  async function importJson(json) {
    if (!json.trim()) {
      setIsError(true)
      setMessage('Choose a JSON file or paste valid JSON first.')
      return
    }
    if (totalEntries && !window.confirm('Importing replaces all current entries and goals. Continue?')) return
    const success = importData(json) ||
      await importEncryptedData(json, backupPassphrase)
    if (success) {
      setImportText('')
      setBackupPassphrase('')
      setIsError(false)
      setMessage('Your wellness data was imported.')
    } else {
      setIsError(true)
      setMessage('The file is invalid or contains unsupported data. No changes were made.')
    }
  }

  async function handleFileSelect(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      if (file.size > 10 * 1024 * 1024) {
        setIsError(true)
        setMessage('Backup files must be smaller than 10 MB.')
      } else {
        setImportText(await file.text())
        setIsError(false)
        setMessage('Backup loaded. Select Import backup to restore it.')
      }
    } catch {
      setIsError(true)
      setMessage('The selected file could not be read.')
    } finally {
      event.target.value = ''
    }
  }

  function clearData() {
    if (!window.confirm('Permanently clear all trackers, notes, goals, and settings from this browser? Export a backup first if needed.')) return
    const success = clearLocalData()
    setMessage(success ? 'All app data has been cleared from this browser.' : 'The browser could not clear stored data.')
    setIsError(!success)
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className="text-2xl font-semibold text-gray-800">Data &amp; privacy</h2>
        <p className="mt-2 max-w-3xl text-gray-600">Your entries are stored in this browser&apos;s local storage. They are not uploaded or synchronized. Without passphrase encryption, anyone with access to this browser profile may be able to read them, so use a private device and keep exported backups secure.</p>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {isEncrypted ? 'Browser data is encrypted while stored. Downloaded plain JSON backups are not encrypted.' : 'Browser storage is not encrypted until you enable passphrase encryption below. This app is not a medical record system; avoid entering information you would not want saved on this device.'}
        </div>
        <p className="mt-3 text-sm text-gray-600" aria-live="polite">{totalEntries} entries currently stored.</p>
      </section>

      <AppearanceSettings settings={settings} updateSettings={updateSettings} />

      <LocalEncryptionSettings isEncrypted={isEncrypted} enableEncryption={enableEncryption} disableEncryption={disableEncryption} lock={lock} />

      <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="backup-heading">
        <h2 id="backup-heading" className="text-xl font-semibold text-gray-800">Back up or restore</h2>
        <p className="mt-1 text-sm text-gray-600">Plain JSON is readable by anyone who gets the file. Use an encrypted backup for sensitive information.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" onClick={() => downloadJson(exportData(), `wellness-journal-${new Date().toISOString().slice(0, 10)}.json`)}>
            Export plain JSON
          </button>
          <button type="button" className="rounded-lg border border-indigo-300 px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" onClick={() => fileInputRef.current?.click()}>
            Choose JSON backup
          </button>
          <input ref={fileInputRef} type="file" accept=".json,application/json" className="sr-only" onChange={handleFileSelect} aria-label="Choose a JSON backup file" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="text-sm font-medium text-gray-700">Encrypted backup passphrase (12+ characters)
            <input className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2" type="password" autoComplete="new-password" minLength="12" maxLength="1024" value={backupPassphrase} onChange={event => setBackupPassphrase(event.target.value)} />
          </label>
          <button type="button" className="self-end rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700" disabled={backupPassphrase.length < 12} onClick={async () => {
            try {
              const backup = await exportEncryptedData(backupPassphrase)
              downloadJson(backup, `wellness-journal-encrypted-${new Date().toISOString().slice(0, 10)}.json`)
              setMessage('Encrypted backup downloaded. Keep its passphrase separately.')
              setIsError(false)
            } catch (error) {
              setMessage(error.message)
              setIsError(true)
            }
          }}>Export encrypted backup</button>
        </div>
        <label htmlFor="import-data" className="mt-4 block text-sm font-medium text-gray-700">Or paste a JSON backup</label>
        <textarea id="import-data" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" rows="8" value={importText} onChange={event => setImportText(event.target.value)} placeholder='{"moodEntries": [], "sleepEntries": [], ...}' />
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600" onClick={() => importJson(importText)}>Import backup</button>
          <button type="button" className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500" onClick={clearData}>Clear all local data</button>
        </div>
        {message && <p className={`mt-3 text-sm ${isError ? 'text-red-700' : 'text-emerald-700'}`} role={isError ? 'alert' : 'status'}>{message}</p>}
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm" aria-labelledby="file-sync-heading">
        <h2 id="file-sync-heading" className="text-xl font-semibold text-gray-800">Optional JSON file auto-save</h2>
        <p className="mt-1 text-sm text-gray-600">{isEncrypted ? 'File auto-save is disabled while encryption is on to prevent writing plaintext backups.' : 'On supported browsers, choose a local JSON file to keep an additional backup updated while this app is open. The browser will ask you to select the file again after a reload.'}</p>
        {!isEncrypted && fileHandle && <p className="mt-2 text-sm text-gray-700" role="status">{fileHandle.name}: {fileStatus === 'saving' ? 'saving…' : fileStatus === 'error' ? 'save failed' : 'connected'}</p>}
        {!isEncrypted && <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="rounded-lg border border-indigo-300 px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" onClick={async () => {
            const success = await setupFileHandle()
            setIsError(!success)
            setMessage(success ? 'Auto-save file selected.' : 'File selection was cancelled or is not supported by this browser.')
          }}>
            {fileHandle ? 'Choose a different save file' : 'Choose auto-save file'}
          </button>
          <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" onClick={async () => {
            const success = await loadFromFile()
            setIsError(!success)
            setMessage(success ? 'Backup loaded from the selected file.' : 'File was cancelled, invalid, or is not supported.')
          }}>
            Load from JSON file
          </button>
        </div>}
      </section>
    </div>
  )
}
