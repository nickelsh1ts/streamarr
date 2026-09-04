export const AUDIOBOOKSHELF_TOKEN_STORAGE_KEY = 'token';

export const storeAudiobookshelfToken = (accessToken: string): void => {
  try {
    window.localStorage.setItem(AUDIOBOOKSHELF_TOKEN_STORAGE_KEY, accessToken);
  } catch {
    // The embedded client falls back to its own login form.
  }
};

export const clearAudiobookshelfToken = (): void => {
  try {
    window.localStorage.removeItem(AUDIOBOOKSHELF_TOKEN_STORAGE_KEY);
  } catch {
    // fail silently
  }
};
