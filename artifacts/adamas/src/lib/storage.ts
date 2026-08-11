const storageAvailable = () => typeof window !== "undefined" && "localStorage" in window;

export function readStorage(key: string): string | null {
  if (!storageAvailable()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): boolean {
  if (!storageAvailable()) return false;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  if (!storageAvailable()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can be disabled by private browsing or browser policy.
  }
}