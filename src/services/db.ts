const DB_NAME = 'readlingo';
const DB_VERSION = 3;
const STORE_AUDIO = 'audio';
const STORE_IMAGES = 'images';
const STORE_RECORDINGS = 'recordings';
const STORE_ALIGNMENTS = 'alignments';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_AUDIO)) db.createObjectStore(STORE_AUDIO);
      if (!db.objectStoreNames.contains(STORE_IMAGES)) db.createObjectStore(STORE_IMAGES);
      if (!db.objectStoreNames.contains(STORE_RECORDINGS)) db.createObjectStore(STORE_RECORDINGS);
      if (!db.objectStoreNames.contains(STORE_ALIGNMENTS)) db.createObjectStore(STORE_ALIGNMENTS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function get<T>(store: string, key: string): Promise<T | undefined> {
  return open().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  }));
}

function put(store: string, key: string, value: unknown): Promise<void> {
  return open().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

function del(store: string, key: string): Promise<void> {
  return open().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

function clear(store: string): Promise<void> {
  return open().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

function getAll<T>(store: string): Promise<Record<string, T>> {
  return open().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const os = tx.objectStore(store);
    const req = os.openCursor();
    const result: Record<string, T> = {};
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        result[cursor.key as string] = cursor.value as T;
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    req.onerror = () => reject(req.error);
  }));
}

// Audio: store as ArrayBuffer
export const getAudio = (key: string) => get<ArrayBuffer>(STORE_AUDIO, key);
export const putAudio = (key: string, data: ArrayBuffer) => put(STORE_AUDIO, key, data);
export const clearAudio = () => clear(STORE_AUDIO);

// Images: store as base64 string (kept as string since <img> needs data URL)
export const getImage = (key: string) => get<string>(STORE_IMAGES, key);
export const putImage = (key: string, data: string) => put(STORE_IMAGES, key, data);
export const clearImages = () => clear(STORE_IMAGES);
export const getAllImages = () => getAll<string>(STORE_IMAGES);

// Recordings: store as Blob keyed by segment index
export const getRecording = (key: string) => get<Blob>(STORE_RECORDINGS, key);
export const putRecording = (key: string, data: Blob) => put(STORE_RECORDINGS, key, data);
export const deleteRecording = (key: string) => del(STORE_RECORDINGS, key);
export const clearRecordings = () => clear(STORE_RECORDINGS);
export const getAllRecordings = () => getAll<Blob>(STORE_RECORDINGS);

// Alignments: store as WordAlignment[] keyed by paragraph text
import type { WordAlignment } from '../types';
export const getAlignment = (key: string) => get<WordAlignment[]>(STORE_ALIGNMENTS, key);
export const putAlignment = (key: string, data: WordAlignment[]) => put(STORE_ALIGNMENTS, key, data);
export const clearAlignments = () => clear(STORE_ALIGNMENTS);
