export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: number;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  volume: number;
  autoplay: boolean;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  language: string;
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

const STORAGE_KEY_USERS = 'music_app_users';
const STORAGE_KEY_PLAYLISTS = 'music_app_playlists';
const STORAGE_KEY_CURRENT_USER = 'music_app_current_user';

export const storage = {
  // Users
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  },

  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  getUserByUsername(username: string): User | null {
    const users = this.getUsers();
    return users.find((u) => u.username === username) || null;
  },

  createUser(username: string, email: string): User {
    const users = this.getUsers();
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username,
      email,
      createdAt: Date.now(),
      preferences: {
        theme: 'dark',
        volume: 1,
        autoplay: true,
        shuffle: false,
        repeat: 'none',
        language: 'fr',
      },
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  },

  updateUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
      this.saveUsers(users);
    }
  },

  // Current User
  getCurrentUser(): User | null {
    try {
      const userId = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (!userId) return null;
      return this.getUserById(userId);
    } catch {
      return null;
    }
  },

  setCurrentUser(userId: string | null): void {
    if (userId) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, userId);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  },

  // Playlists
  getPlaylists(userId?: string): Playlist[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
      const allPlaylists: Playlist[] = data ? JSON.parse(data) : [];
      if (userId) {
        return allPlaylists.filter((p) => p.userId === userId);
      }
      return allPlaylists;
    } catch {
      return [];
    }
  },

  savePlaylists(playlists: Playlist[]): void {
    localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists));
  },

  getPlaylistById(id: string): Playlist | null {
    const playlists = this.getPlaylists();
    return playlists.find((p) => p.id === id) || null;
  },

  createPlaylist(userId: string, name: string, description?: string): Playlist {
    const playlists = this.getPlaylists();
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      description,
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    playlists.push(newPlaylist);
    this.savePlaylists(playlists);
    return newPlaylist;
  },

  updatePlaylist(playlist: Playlist): void {
    const playlists = this.getPlaylists();
    const index = playlists.findIndex((p) => p.id === playlist.id);
    if (index >= 0) {
      playlists[index] = { ...playlist, updatedAt: Date.now() };
      this.savePlaylists(playlists);
    }
  },

  deletePlaylist(id: string): void {
    const playlists = this.getPlaylists();
    const filtered = playlists.filter((p) => p.id !== id);
    this.savePlaylists(filtered);
  },

  addTrackToPlaylist(playlistId: string, trackId: string): void {
    const playlist = this.getPlaylistById(playlistId);
    if (playlist && !playlist.trackIds.includes(trackId)) {
      playlist.trackIds.push(trackId);
      this.updatePlaylist(playlist);
    }
  },

  removeTrackFromPlaylist(playlistId: string, trackId: string): void {
    const playlist = this.getPlaylistById(playlistId);
    if (playlist) {
      playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
      this.updatePlaylist(playlist);
    }
  },
};

