import type { TrackInfo, InstanceInfo } from '../types';
import { getApiBaseUrl } from '../utils/getApiUrl';

// Cache for API URL to avoid repeated fetches
let cachedApiUrl: string | null = null;
let lastUserId: string | null = null;
let urlLoadPromise: Promise<string> | null = null;

// Get API URL from user preferences or use auto-detection (async)
async function getApiUrl(): Promise<string> {
  // Check if we have a cached URL for the current user
  const currentUserId = localStorage.getItem('music_app_current_user_id');
  
  // Always reload if user changed (don't use stale cache)
  if (currentUserId && currentUserId === lastUserId && cachedApiUrl) {
    // But verify it's not localhost on mobile
    const isMobile = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isMobile && (cachedApiUrl.includes('localhost') || cachedApiUrl.includes('127.0.0.1'))) {
      console.warn('Cached URL is localhost on mobile, forcing reload');
      cachedApiUrl = null;
      lastUserId = null;
    } else {
      return cachedApiUrl;
    }
  }

  // If already loading, wait for that promise
  if (urlLoadPromise) {
    return urlLoadPromise;
  }

  // Start loading URL
  urlLoadPromise = (async () => {
    // Try to get from user preferences via server
    if (currentUserId) {
      try {
        const { fileStorage } = await import('./fileStorage');
        const user = await fileStorage.getUserById(currentUserId);
        console.log('User preferences:', user?.preferences);
        if (user?.preferences?.apiUrl && user.preferences.apiUrl.trim()) {
          const apiUrl = user.preferences.apiUrl.trim().replace(/\/$/, '');
          console.log('Using configured API URL:', apiUrl);
          cachedApiUrl = apiUrl;
          lastUserId = currentUserId;
          urlLoadPromise = null;
          return apiUrl;
        } else {
          console.log('No API URL configured in preferences, using auto-detection');
        }
      } catch (error) {
        console.error('Error fetching API URL from preferences:', error);
      }
    }

    // Fallback to auto-detection
    const autoUrl = getApiBaseUrl(8631);
    console.log('Using auto-detected API URL:', autoUrl);
    cachedApiUrl = autoUrl;
    lastUserId = currentUserId;
    urlLoadPromise = null;
    return autoUrl;
  })();

  return urlLoadPromise;
}

// Synchronous version that uses cache or auto-detection
function getApiUrlSync(): string {
  if (cachedApiUrl) {
    return cachedApiUrl;
  }
  // Fallback to auto-detection if not cached yet
  return getApiBaseUrl(8631);
}

// Initialize URL cache on load
if (typeof window !== 'undefined') {
  // Load URL immediately to ensure cache is ready
  getApiUrl().then((url) => {
    console.log('API URL initialized:', url);
  }).catch((error) => {
    console.warn('Failed to initialize API URL, using auto-detection:', error);
  });

  // Listen for preference updates to clear cache
  window.addEventListener('preferencesUpdated', (async () => {
    console.log('Preferences updated, clearing API URL cache');
    cachedApiUrl = null;
    lastUserId = null;
    urlLoadPromise = null;
    // Reload URL immediately
    try {
      const url = await getApiUrl();
      console.log('✅ API URL reloaded after preferences update:', url);
    } catch (error) {
      console.error('Failed to reload API URL:', error);
    }
  }) as EventListener);
}

export const api = {
  async getInfo(): Promise<InstanceInfo> {
    const url = await getApiUrl();
    const response = await fetch(`${url}/`);
    return response.json();
  },

  async getTrack(id: string): Promise<TrackInfo> {
    const url = await getApiUrl();
    const response = await fetch(`${url}/track/${id}`);
    if (!response.ok) throw new Error('Track not found');
    return response.json();
  },

  async getTrackStreamUrl(id: string): Promise<string> {
    const url = await getApiUrl();
    return `${url}/track/${id}/stream`;
  },

  getTrackCoverUrl(id: string, size: number = 500): string {
    const url = getApiUrlSync();
    return `${url}/track/${id}/cover/${size}`;
  },

  getTrackDownloadUrl(id: string): string {
    const url = getApiUrlSync();
    return `${url}/track/${id}/download`;
  },

  async getTrackLyrics(id: string): Promise<string | null> {
    const url = await getApiUrl();
    const response = await fetch(`${url}/track/${id}/lyrics`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to fetch lyrics');
    return response.text();
  },

  async search(query: string): Promise<string[]> {
    const url = await getApiUrl();
    const response = await fetch(`${url}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  },

  async getSearchSuggestions(query: string): Promise<string[]> {
    const url = await getApiUrl();
    const response = await fetch(`${url}/search/suggestions?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to get suggestions');
    return response.json();
  },
};

