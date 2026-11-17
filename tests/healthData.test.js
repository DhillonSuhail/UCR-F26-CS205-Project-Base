import test from 'node:test'
import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import { getEntryDateKey, getLocalDateKey } from '../src/utils/helpers.js'
import { normalizeHealthData } from '../src/utils/healthData.js'
import { createEncryptedData, decryptData, isEncryptedEnvelope } from '../src/utils/encryption.js'

if (!globalThis.crypto) globalThis.crypto = webcrypto

test('legacy mood backups remain compatible and receive new empty trackers', () => {
  const legacy = {
    moodEntries: [{
      id: 1705320000000,
      mood: 4,
      timestamp: '2024-01-15T12:00:00.000Z',
      time: '12:00 PM',
      date: '1/15/2024',
    }],
  }

  const normalized = normalizeHealthData(legacy)
  assert.equal(normalized.moodEntries.length, 1)
  assert.deepEqual(normalized.sleepEntries, [])
  assert.equal(normalized.settings.goals.waterMl, 2000)
})

test('validates tracker boundaries and rejects duplicate entry IDs', () => {
  assert.equal(normalizeHealthData({
    waterEntries: [{ id: 'one', date: '2026-03-01', amountMl: 10000 }],
  }).waterEntries[0].amountMl, 10000)
  assert.equal(normalizeHealthData({
    waterEntries: [{ id: 'one', date: '2026-03-01', amountMl: 10001 }],
  }), null)
  assert.equal(normalizeHealthData({
    sleepEntries: [
      { id: 'same', date: '2026-03-01', hours: 8, quality: 4 },
      { id: 'same', date: '2026-03-02', hours: 7, quality: 3 },
    ],
  }), null)
})

test('rejects invalid calendar dates and out-of-range goals', () => {
  assert.equal(normalizeHealthData({
    waterEntries: [{ id: 'one', date: '2026-02-30', amountMl: 200 }],
  }), null)
  assert.equal(normalizeHealthData({ settings: { goals: { sleepHours: 25 } } }), null)
  assert.equal(normalizeHealthData({}), null)
  assert.equal(normalizeHealthData({ format: 'wellness-journal-encrypted', ciphertext: '...' }), null)
  assert.equal(normalizeHealthData({
    sleepEntries: [{ id: 'sleep', date: '2026-03-01', hours: 8, quality: 4, bedtime: '25:00' }],
  }), null)
  assert.equal(normalizeHealthData({ settings: { theme: 'forest' } }).settings.theme, 'forest')
  assert.equal(normalizeHealthData({
    sleepEntries: [{
      id: 'sleep-with-times', date: '2026-03-01', hours: 8, quality: 4,
      bedtime: '22:30', wakeTime: '06:30',
    }],
  }).sleepEntries[0].wakeTime, '06:30')
  assert.equal(normalizeHealthData({ settings: { theme: 'neon' } }), null)
})

test('uses the selected tracker date and supports legacy mood date formats', () => {
  assert.equal(getEntryDateKey({
    date: '2026-03-01',
    timestamp: '2026-03-02T03:00:00.000Z',
  }), '2026-03-01')
  const timestamp = new Date('2024-01-15T12:00:00.000Z')
  assert.equal(getEntryDateKey({ date: '1/15/2024', timestamp: timestamp.toISOString() }), getLocalDateKey(timestamp))
})

test('encrypts backups and rejects an incorrect passphrase', async () => {
  const data = { moodEntries: [{ id: 'mood', mood: 5, note: 'private note' }] }
  const { envelope } = await createEncryptedData(data, 'long-enough-test-passphrase')

  assert.equal(isEncryptedEnvelope(envelope), true)
  assert.equal(isEncryptedEnvelope({ ...envelope, iterations: 1 }), false)
  assert.equal(JSON.stringify(envelope).includes('private note'), false)
  assert.deepEqual((await decryptData(envelope, 'long-enough-test-passphrase')).data, data)
  assert.equal(await decryptData(envelope, 'incorrect-test-passphrase'), null)
})
