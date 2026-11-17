import { createContext, useContext, useEffect, useState } from 'react'
import { createFile, openFile, readFile, writeFile } from '../utils/fileOperations'
import { createEncryptedData, decryptData, encryptWithKey, isEncryptedEnvelope } from '../utils/encryption'
import { DEFAULT_HEALTH_DATA, normalizeHealthData } from '../utils/healthData'
import { clearStoredData, loadData, saveData, saveEncryptedData } from '../utils/storage'

const HealthDataContext = createContext(null)

export function HealthDataProvider({ children }) {
  const [initialStorage] = useState(loadData)
  const [data, setData] = useState(() =>
    normalizeHealthData(initialStorage.data) || DEFAULT_HEALTH_DATA
  )
  const [fileHandle, setFileHandle] = useState(null)
  const [fileStatus, setFileStatus] = useState('none')
  const [encryptedEnvelope, setEncryptedEnvelope] = useState(initialStorage.envelope)
  const [encryptionKey, setEncryptionKey] = useState(null)
  const [encryptionSalt, setEncryptionSalt] = useState(initialStorage.envelope?.salt || null)
  const [isEncrypted, setIsEncrypted] = useState(Boolean(initialStorage.envelope))
  const [isLocked, setIsLocked] = useState(Boolean(initialStorage.envelope))
  const [storageError, setStorageError] = useState(() =>
    initialStorage.error || (!initialStorage.envelope && initialStorage.data != null &&
      !normalizeHealthData(initialStorage.data))
  )

  useEffect(() => {
    if (storageError || isLocked || (isEncrypted && !encryptionKey)) return undefined

    let active = true
    const persist = async () => {
      try {
        const envelope = isEncrypted
          ? await encryptWithKey(data, encryptionKey, encryptionSalt)
          : null
        if (!active) return
        const saved = isEncrypted ? saveEncryptedData(envelope) : saveData(data)
        if (saved && envelope) setEncryptedEnvelope(envelope)
        setStorageError(!saved)
      } catch (error) {
        console.error('Error encrypting local data:', error)
        if (active) setStorageError(true)
      }
    }
    persist()
    return () => {
      active = false
    }
  }, [data, encryptionKey, encryptionSalt, isEncrypted, isLocked, storageError])

  useEffect(() => {
    if (!fileHandle || isEncrypted) return

    let active = true
    setFileStatus('saving')
    writeFile(fileHandle, { ...data, lastSaved: new Date().toISOString() }).then(success => {
      if (active) setFileStatus(success ? 'saved' : 'error')
    })
    return () => {
      active = false
    }
  }, [data, fileHandle, isEncrypted])

  const addEntry = (type, entry) => {
    setData(current => ({ ...current, [type]: [...current[type], entry] }))
  }

  const deleteEntry = (type, id) => {
    setData(current => ({
      ...current,
      [type]: current[type].filter(entry => entry.id !== id),
    }))
  }

  const updateEntry = (type, id, updates) => {
    setData(current => ({
      ...current,
      [type]: current[type].map(entry =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    }))
  }

  const updateSettings = (settings) => {
    setData(current => ({
      ...current,
      settings: { ...current.settings, ...settings },
    }))
  }

  const exportData = () => JSON.stringify({
    ...data,
    exportedAt: new Date().toISOString(),
  }, null, 2)

  const exportEncryptedData = async (passphrase) => {
    const result = await createEncryptedData(data, passphrase)
    return JSON.stringify(result.envelope, null, 2)
  }

  const importData = (jsonString) => {
    try {
      const imported = normalizeHealthData(JSON.parse(jsonString))
      if (!imported) return false
      setData(imported)
      setStorageError(false)
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  const importEncryptedData = async (jsonString, passphrase) => {
    try {
      const envelope = JSON.parse(jsonString)
      if (!isEncryptedEnvelope(envelope)) return false
      const result = await decryptData(envelope, passphrase)
      const imported = result && normalizeHealthData(result.data)
      if (!imported) return false
      setData(imported)
      setStorageError(false)
      return true
    } catch (error) {
      console.error('Error importing encrypted backup:', error)
      return false
    }
  }

  const unlock = async (passphrase) => {
    const result = await decryptData(encryptedEnvelope, passphrase)
    const imported = result && normalizeHealthData(result.data)
    if (!result || !imported) return false
    setData(imported)
    setEncryptionKey(result.key)
    setEncryptionSalt(result.salt)
    setIsLocked(false)
    setStorageError(false)
    return true
  }

  const enableEncryption = async (passphrase) => {
    const result = await createEncryptedData(data, passphrase)
    if (!saveEncryptedData(result.envelope)) {
      setStorageError(true)
      return false
    }
    setEncryptedEnvelope(result.envelope)
    setEncryptionKey(result.key)
    setEncryptionSalt(result.salt)
    setIsEncrypted(true)
    setStorageError(false)
    return true
  }

  const disableEncryption = () => {
    if (!isEncrypted || isLocked || !saveData(data)) {
      setStorageError(true)
      return false
    }
    setIsEncrypted(false)
    setEncryptedEnvelope(null)
    setEncryptionKey(null)
    setEncryptionSalt(null)
    setStorageError(false)
    return true
  }

  const lock = async () => {
    if (!isEncrypted || isLocked) return false
    const envelope = await encryptWithKey(data, encryptionKey, encryptionSalt)
    if (!saveEncryptedData(envelope)) {
      setStorageError(true)
      return false
    }
    setEncryptedEnvelope(envelope)
    setData(DEFAULT_HEALTH_DATA)
    setEncryptionKey(null)
    setIsLocked(true)
    return true
  }

  const clearLocalData = () => {
    if (!clearStoredData()) return false
    setData(DEFAULT_HEALTH_DATA)
    setFileHandle(null)
    setFileStatus('none')
    setEncryptedEnvelope(null)
    setEncryptionKey(null)
    setEncryptionSalt(null)
    setIsEncrypted(false)
    setIsLocked(false)
    setStorageError(false)
    return true
  }

  const setupFileHandle = async () => {
    if (isEncrypted) return false
    const handle = await createFile()
    if (!handle) return false
    setFileHandle(handle)
    return true
  }

  const loadFromFile = async () => {
    if (isEncrypted) return false
    const handle = await openFile()
    if (!handle) return false
    const fileData = await readFile(handle)
    const imported = normalizeHealthData(fileData)
    if (!imported) return false
    setFileHandle(handle)
    setData(imported)
    return true
  }

  const value = {
    ...data,
    addMoodEntry: entry => addEntry('moodEntries', entry),
    deleteMoodEntry: id => deleteEntry('moodEntries', id),
    addEntry,
    deleteEntry,
    updateEntry,
    updateSettings,
    exportData,
    exportEncryptedData,
    importData,
    importEncryptedData,
    unlock,
    enableEncryption,
    disableEncryption,
    lock,
    clearLocalData,
    isEncrypted,
    isLocked,
    setupFileHandle,
    loadFromFile,
    fileHandle,
    fileStatus,
    storageError,
  }

  return (
    <HealthDataContext.Provider value={value}>
      {children}
    </HealthDataContext.Provider>
  )
}

export function useHealthData() {
  const context = useContext(HealthDataContext)
  if (!context) {
    throw new Error('useHealthData must be used within HealthDataProvider')
  }
  return context
}
