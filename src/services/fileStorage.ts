import { getApiBaseUrl } from '../utils/getApiUrl';

function getFileStorageUrl() {
  return `${getApiBaseUrl(8632)}/api`;
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  preferences: UserPreferences;
  likedTracks: string[];
  recentTracks: string[];
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  colorTheme: 'default' | 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'pink' | 'cyan';
  volume: number;
  autoplay: boolean;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  language: string;
  apiUrl?: string; // URL personnalisée de l'API Docker (pm-ytm)
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
  coverUrl?: string;
}

export const fileStorage = {
  // Users
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${getFileStorageUrl()}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await fetch(`${getFileStorageUrl()}/users/${id}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    } catch {
      return null;
    }
  },

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const response = await fetch(`${getFileStorageUrl()}/users/username/${username}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    } catch {
      return null;
    }
  },

  async createUser(username: string, email: string, password: string): Promise<User> {
    const response = await fetch(`${getFileStorageUrl()}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return response.json();
  },

  async loginUser(username: string, password: string): Promise<User> {
    const response = await fetch(`${getFileStorageUrl()}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },

  async updateUser(user: User): Promise<User> {
    const response = await fetch(`${getFileStorageUrl()}/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  // Current User - Stored in localStorage for security (each browser/device has its own session)
  async getCurrentUser(): Promise<User | null> {
    try {
      // Get userId from localStorage (browser-specific, not shared between devices)
      const userId = localStorage.getItem('music_app_current_user_id');
      if (!userId) return null;
      
      // Fetch user data from server
      return await this.getUserById(userId);
    } catch {
      return null;
    }
  },

  async setCurrentUser(userId: string | null): Promise<void> {
    // Store in localStorage only (browser-specific session)
    if (userId) {
      localStorage.setItem('music_app_current_user_id', userId);
    } else {
      localStorage.removeItem('music_app_current_user_id');
    }
  },

  // Playlists
  async getPlaylists(userId?: string): Promise<Playlist[]> {
    const url = userId 
      ? `${getFileStorageUrl()}/playlists?userId=${userId}`
      : `${getFileStorageUrl()}/playlists`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch playlists');
    return response.json();
  },

  async getPlaylistById(id: string): Promise<Playlist | null> {
    try {
      const response = await fetch(`${getFileStorageUrl()}/playlists/${id}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch playlist');
      return response.json();
    } catch {
      return null;
    }
  },

  async createPlaylist(userId: string, name: string, description?: string): Promise<Playlist> {
    const response = await fetch(`${getFileStorageUrl()}/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name, description }),
    });
    if (!response.ok) throw new Error('Failed to create playlist');
    return response.json();
  },

  async updatePlaylist(playlist: Playlist): Promise<Playlist> {
    const response = await fetch(`${getFileStorageUrl()}/playlists/${playlist.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playlist),
    });
    if (!response.ok) throw new Error('Failed to update playlist');
    return response.json();
  },

  async deletePlaylist(id: string): Promise<void> {
    const response = await fetch(`${getFileStorageUrl()}/playlists/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete playlist');
  },

  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    const playlist = await this.getPlaylistById(playlistId);
    if (playlist && !playlist.trackIds.includes(trackId)) {
      playlist.trackIds.push(trackId);
      await this.updatePlaylist(playlist);
    }
  },

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const playlist = await this.getPlaylistById(playlistId);
    if (playlist) {
      playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
      await this.updatePlaylist(playlist);
    }
  },

  // Liked Tracks
  async getLikedTracks(userId: string): Promise<string[]> {
    const response = await fetch(`${getFileStorageUrl()}/users/${userId}/liked`);
    if (!response.ok) throw new Error('Failed to fetch liked tracks');
    return response.json();
  },

  async addLikedTrack(userId: string, trackId: string): Promise<string[]> {
    const response = await fetch(`${getFileStorageUrl()}/users/${userId}/liked`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId }),
    });
    if (!response.ok) throw new Error('Failed to add liked track');
    return response.json();
  },

  async removeLikedTrack(userId: string, trackId: string): Promise<string[]> {
    const response = await fetch(`${getFileStorageUrl()}/users/${userId}/liked/${trackId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove liked track');
    return response.json();
  },

  // Recent Tracks
  async addRecentTrack(userId: string, trackId: string): Promise<string[]> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');
    
    let recentTracks = user.recentTracks || [];
    // Remove if already exists
    recentTracks = recentTracks.filter(id => id !== trackId);
    // Add to beginning
    recentTracks = [trackId, ...recentTracks];
    // Keep only last 10
    recentTracks = recentTracks.slice(0, 10);
    
    user.recentTracks = recentTracks;
    await this.updateUser(user);
    return recentTracks;
  },

  async getRecentTracks(userId: string): Promise<string[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];
    return user.recentTracks || [];
  },
};
