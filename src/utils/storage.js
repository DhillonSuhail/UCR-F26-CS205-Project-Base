import { isEncryptedEnvelope } from './encryption'

const STORAGE_KEY = 'healthTrackingData'

export function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const value = stored ? JSON.parse(stored) : null
    return isEncryptedEnvelope(value)
      ? { data: null, envelope: value, error: false }
      : { data: value, envelope: null, error: false }
  } catch (error) {
    console.error('Error loading from localStorage:', error)
    return { data: null, envelope: null, error: true }
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Error saving to localStorage:', error)
    return false
  }
}

export function saveEncryptedData(envelope) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
    return true
  } catch (error) {
    console.error('Error saving encrypted data:', error)
    return false
  }
}

export function clearStoredData() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Error clearing local data:', error)
    return false
  }
}
