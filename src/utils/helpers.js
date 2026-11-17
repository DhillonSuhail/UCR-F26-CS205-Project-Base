export function getTodayFormatted() {
  const today = new Date()
  return today.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getEntryDateKey(entry) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) return entry.date
  if (entry.timestamp && !Number.isNaN(Date.parse(entry.timestamp))) {
    return getLocalDateKey(new Date(entry.timestamp))
  }
  const parts = entry.date?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (parts) {
    return `${parts[3]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  }
  return ''
}

export function formatDateKey(dateKey, options = { month: 'short', day: 'numeric' }) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', options)
}

export function createEntryId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
