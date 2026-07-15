// IndexedDB-backed store for journal screenshots.
//
// Screenshots are large binary blobs. Keeping them inline (as base64) inside the
// `journalEntries` JSON broke two ceilings at once: the ~5MB localStorage cap and
// the 1MB-per-key Firestore sync cap (functions enforce MAX_SYNC_SIZE). So images
// live here instead, keyed by a generated id, and journal entries only store a
// lightweight `idb:<id>` reference. The synced/stored JSON stays tiny.
//
// References use the scheme:
//   `idb:<id>`  -> bytes live in this IndexedDB store
//   `data:...`  -> legacy inline base64 (still rendered; migrated out on load)

const DB_NAME = 'ftj-images';
const STORE = 'images';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export function newImageId(): string {
  return 'img_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

// Wipe every stored screenshot blob. Used by delete-account / delete-all-data
// flows — journal entries are removed there, so leaving the images behind
// would strand user content on the device after a "delete everything".
export async function clearAllImages(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB unavailable — nothing stored there to clear
  }
}

export function isImageRef(value: string): boolean {
  return typeof value === 'string' && value.startsWith('idb:');
}

export async function putImage(id: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(dataUrl, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getImage(id: string): Promise<string | null> {
  try {
    const db = await openDB();
    return await new Promise<string | null>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteImage(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* best-effort cleanup */
  }
}

export function isCloudRef(value: string): boolean {
  return typeof value === 'string' && value.startsWith('fb:');
}

// Cache resolved Storage download URLs so we don't re-request them per render.
const cloudUrlCache = new Map<string, string>();

/**
 * Upload a compressed image to Firebase Storage for cross-device (Pro) sync and
 * return an `fb:<path>` reference. Throws if Storage is unavailable so callers
 * can fall back to local IndexedDB.
 */
export async function uploadCloudImage(uid: string, dataUrl: string): Promise<string> {
  const { getFirebaseStorage } = await import('@/lib/firebase-lazy');
  const { ref, uploadString } = await import('firebase/storage');
  const storage = await getFirebaseStorage();
  const path = `users/${uid}/journal/${newImageId()}.jpg`;
  await uploadString(ref(storage, path), dataUrl, 'data_url');
  return `fb:${path}`;
}

export async function deleteCloudImage(refOrPath: string): Promise<void> {
  const path = isCloudRef(refOrPath) ? refOrPath.slice(3) : refOrPath;
  try {
    const { getFirebaseStorage } = await import('@/lib/firebase-lazy');
    const { ref, deleteObject } = await import('firebase/storage');
    const storage = await getFirebaseStorage();
    await deleteObject(ref(storage, path));
    cloudUrlCache.delete(`fb:${path}`);
  } catch {
    /* best-effort cleanup */
  }
}

/**
 * Resolve a screenshot reference to a displayable URL/data URL. Handles
 * `idb:<id>` (IndexedDB), `fb:<path>` (Firebase Storage), and legacy inline
 * `data:` URLs.
 */
export async function resolveImageRef(refStr: string): Promise<string | null> {
  if (isImageRef(refStr)) {
    return getImage(refStr.slice(4));
  }
  if (isCloudRef(refStr)) {
    const cached = cloudUrlCache.get(refStr);
    if (cached) return cached;
    try {
      const { getFirebaseStorage } = await import('@/lib/firebase-lazy');
      const { ref, getDownloadURL } = await import('firebase/storage');
      const storage = await getFirebaseStorage();
      const url = await getDownloadURL(ref(storage, refStr.slice(3)));
      cloudUrlCache.set(refStr, url);
      return url;
    } catch {
      return null;
    }
  }
  return refStr || null;
}

/**
 * Downscale + compress an image file to a JPEG data URL. Trading screenshots
 * compress dramatically (a 4MB PNG typically lands well under 400KB) while
 * staying legible, which is what makes multi-screenshot entries viable.
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<string> {
  const sourceDataUrl = await readFileAsDataURL(file);
  try {
    const img = await loadImage(sourceDataUrl);
    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return sourceDataUrl;
    // Flatten onto white so transparent PNGs don't go black in JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    // If anything in the canvas pipeline fails, fall back to the original.
    return sourceDataUrl;
  }
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image decode failed'));
    img.src = src;
  });
}
