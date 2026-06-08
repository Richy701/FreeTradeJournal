// Client-side encryption for localStorage data using the Web Crypto API (AES-GCM + PBKDF2 key derivation).

const SALT_STORAGE_KEY = 'ftj_device_salt';
const PBKDF2_ITERATIONS = 100_000;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

export function isCryptoAvailable(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      window.crypto !== undefined &&
      window.crypto.subtle !== undefined
    );
  } catch {
    return false;
  }
}

function getOrCreateSalt(): Uint8Array {
  const existing = localStorage.getItem(SALT_STORAGE_KEY);
  if (existing) {
    return Uint8Array.from(atob(existing), (c) => c.charCodeAt(0));
  }
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  localStorage.setItem(
    SALT_STORAGE_KEY,
    btoa(String.fromCharCode(...salt))
  );
  return salt;
}

export async function deriveEncryptionKey(userId: string): Promise<CryptoKey> {
  const salt = getOrCreateSalt();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  const cipherBytes = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(IV_LENGTH + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, IV_LENGTH);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(
  encrypted: string,
  key: CryptoKey
): Promise<string> {
  const raw = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
  const iv = raw.slice(0, IV_LENGTH);
  const ciphertext = raw.slice(IV_LENGTH);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plainBuffer);
}

export function isEncrypted(value: string): boolean {
  if (
    value === 'true' ||
    value === 'false' ||
    value === 'null' ||
    value === 'undefined' ||
    value === ''
  ) {
    return false;
  }
  if (!isNaN(Number(value))) {
    return false;
  }
  try {
    JSON.parse(value);
    return false;
  } catch {
    return true;
  }
}
