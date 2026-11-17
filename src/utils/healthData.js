export const DEFAULT_GOALS = {
  waterMl: 2000,
  sleepHours: 8,
  exerciseMinutes: 30,
}

export const DEFAULT_HEALTH_DATA = {
  moodEntries: [],
  sleepEntries: [],
  waterEntries: [],
  exerciseEntries: [],
  mealEntries: [],
  medicationEntries: [],
  journalEntries: [],
  settings: {
    theme: 'light',
    customThemes: [],
    onboardingComplete: false,
    notificationsEnabled: false,
    goals: DEFAULT_GOALS,
  },
}

const ENTRY_TYPES = [
  'moodEntries',
  'sleepEntries',
  'waterEntries',
  'exerciseEntries',
  'mealEntries',
  'medicationEntries',
  'journalEntries',
]

function isValidDate(value) {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
}

function isValidMoodEntry(entry) {
  return entry && (typeof entry.id === 'number' || typeof entry.id === 'string') &&
    Number.isInteger(entry.mood) && entry.mood >= 1 && entry.mood <= 5 &&
    typeof entry.timestamp === 'string' && !Number.isNaN(Date.parse(entry.timestamp)) &&
    typeof entry.date === 'string' && typeof entry.time === 'string'
}

function isValidEntry(type, entry) {
  if (!entry || (typeof entry.id !== 'number' && typeof entry.id !== 'string')) return false
  if (type === 'moodEntries') return isValidMoodEntry(entry)
  if (!isValidDate(entry.date)) return false

  if (type === 'sleepEntries') {
    return Number.isFinite(entry.hours) && entry.hours > 0 && entry.hours <= 24 &&
      Number.isInteger(entry.quality) && entry.quality >= 1 && entry.quality <= 5 &&
      [entry.bedtime, entry.wakeTime].every(time => time == null ||
        /^([01]\d|2[0-3]):[0-5]\d$/.test(time))
  }
  if (type === 'waterEntries') {
    return Number.isInteger(entry.amountMl) && entry.amountMl > 0 && entry.amountMl <= 10000
  }
  if (type === 'exerciseEntries') {
    return typeof entry.activity === 'string' && entry.activity.trim().length > 0 &&
      entry.activity.length <= 100 && Number.isInteger(entry.durationMinutes) &&
      entry.durationMinutes > 0 && entry.durationMinutes <= 1440 &&
      (entry.caloriesBurned == null || (Number.isInteger(entry.caloriesBurned) &&
        entry.caloriesBurned >= 0 && entry.caloriesBurned <= 10000))
  }
  if (type === 'mealEntries') {
    return ['breakfast', 'lunch', 'dinner', 'snack'].includes(entry.mealType) &&
      typeof entry.description === 'string' && entry.description.trim().length > 0 &&
      entry.description.length <= 200 &&
      (entry.calories == null || (Number.isInteger(entry.calories) &&
        entry.calories >= 0 && entry.calories <= 10000))
  }
  if (type === 'medicationEntries') {
    return typeof entry.name === 'string' && entry.name.trim().length > 0 &&
      entry.name.length <= 100 && typeof entry.dose === 'string' &&
      entry.dose.trim().length > 0 && entry.dose.length <= 100 &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(entry.scheduledTime) &&
      typeof entry.taken === 'boolean' && typeof entry.reminderEnabled === 'boolean'
  }
  if (type === 'journalEntries') {
    return typeof entry.text === 'string' && entry.text.trim().length > 0 &&
      entry.text.length <= 3000 &&
      (entry.moodEntryId == null || typeof entry.moodEntryId === 'number' ||
        typeof entry.moodEntryId === 'string')
  }
  return false
}

export function normalizeHealthData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  if (!ENTRY_TYPES.some(type => Object.hasOwn(value, type)) && value.settings === undefined) {
    return null
  }

  const data = { ...DEFAULT_HEALTH_DATA }
  for (const type of ENTRY_TYPES) {
    if (value[type] !== undefined) {
      if (!Array.isArray(value[type]) || !value[type].every(entry => isValidEntry(type, entry)) ||
          new Set(value[type].map(entry => String(entry.id))).size !== value[type].length) {
        return null
      }
      data[type] = value[type]
    }
  }

  const importedSettings = value.settings ?? {}
  if (!importedSettings || typeof importedSettings !== 'object' || Array.isArray(importedSettings)) {
    return null
  }
  const goals = importedSettings.goals ?? {}
  if (typeof goals !== 'object' || Array.isArray(goals)) return null
  const validGoal = (goal, maximum) => goal === undefined ||
    (Number.isFinite(goal) && goal > 0 && goal <= maximum)
  if (!validGoal(goals.waterMl, 10000) || !validGoal(goals.sleepHours, 24) ||
      !validGoal(goals.exerciseMinutes, 1440)) {
    return null
  }
  const customThemes = importedSettings.customThemes ?? []
  if (!Array.isArray(customThemes) || customThemes.length > 20 ||
      !customThemes.every(theme => theme && typeof theme === 'object' &&
        typeof theme.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(theme.id) &&
        typeof theme.name === 'string' && theme.name.trim().length > 0 &&
        theme.name.length <= 40 && ['light', 'dark'].includes(theme.mode) &&
        /^#[0-9a-fA-F]{6}$/.test(theme.accentColor) &&
        /^#[0-9a-fA-F]{6}$/.test(theme.pageColor)) ||
      new Set(customThemes.map(theme => theme.id)).size !== customThemes.length) {
    return null
  }
  const selectedTheme = importedSettings.theme
  if (selectedTheme !== undefined &&
      !['light', 'dark', 'forest', 'sunset'].includes(selectedTheme) &&
      !(typeof selectedTheme === 'string' && selectedTheme.startsWith('custom:') &&
        customThemes.some(theme => selectedTheme === `custom:${theme.id}`))) return null
  if (importedSettings.onboardingComplete !== undefined &&
      typeof importedSettings.onboardingComplete !== 'boolean') return null
  if (importedSettings.notificationsEnabled !== undefined &&
      typeof importedSettings.notificationsEnabled !== 'boolean') return null

  data.settings = {
    ...DEFAULT_HEALTH_DATA.settings,
    ...importedSettings,
    theme: ['forest', 'sunset'].includes(selectedTheme) ? 'light' : selectedTheme || 'light',
    customThemes,
    goals: { ...DEFAULT_GOALS, ...goals },
  }
  return data
}
