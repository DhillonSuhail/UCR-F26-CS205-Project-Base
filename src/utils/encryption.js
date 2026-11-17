const FORMAT = 'wellness-journal-encrypted'
const ITERATIONS = 600000

function bytesToBase64(bytes) {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary)
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0))
}

async function deriveKey(passphrase, salt, iterations = ITERATIONS) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export function isEncryptedEnvelope(value) {
  return value?.format === FORMAT && value.version === 1 &&
    typeof value.salt === 'string' && typeof value.iv === 'string' &&
    typeof value.ciphertext === 'string' && Number.isInteger(value.iterations) &&
    value.iterations >= 100000 && value.iterations <= 1000000
}

export async function createEncryptedData(data, passphrase) {
  if (typeof passphrase !== 'string' || passphrase.length < 12 || passphrase.length > 1024) {
    throw new Error('Use a passphrase between 12 and 1024 characters.')
  }
  if (!globalThis.crypto?.subtle) {
    throw new Error('Encryption is unavailable in this browser. Use localhost or a secure HTTPS connection.')
  }
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(passphrase, salt)
  const envelope = await encryptWithKey(data, key, salt)
  return { envelope, key, salt: bytesToBase64(salt) }
}

export async function encryptWithKey(data, key, salt) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(data))
  )
  return {
    format: FORMAT,
    version: 1,
    iterations: ITERATIONS,
    salt: typeof salt === 'string' ? salt : bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  }
}

export async function decryptData(envelope, passphrase) {
  if (!globalThis.crypto?.subtle || !isEncryptedEnvelope(envelope) ||
      typeof passphrase !== 'string' || passphrase.length > 1024) return null
  try {
    const salt = base64ToBytes(envelope.salt)
    const key = await deriveKey(passphrase, salt, envelope.iterations)
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(envelope.iv) },
      key,
      base64ToBytes(envelope.ciphertext)
    )
    return {
      data: JSON.parse(new TextDecoder().decode(plaintext)),
      key,
      salt: envelope.salt,
    }
  } catch {
    return null
  }
}
