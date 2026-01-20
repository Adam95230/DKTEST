import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fileStorage, type User } from '../services/fileStorage';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<User>;
  signup: (username: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
  toggleLikedTrack: (trackId: string) => Promise<void>;
  isTrackLiked: (trackId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await fileStorage.getCurrentUser();
        if (user && user.preferences && !user.preferences.colorTheme) {
          // Migration: add default colorTheme for existing users
          user.preferences.colorTheme = 'default';
          await fileStorage.updateUser(user);
        }
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };
    loadCurrentUser();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const user = await fileStorage.loginUser(username, password);
    await fileStorage.setCurrentUser(user.id);
    setCurrentUser(user);
    return user;
  };

  const signup = async (username: string, email: string, password: string): Promise<User> => {
    const user = await fileStorage.createUser(username, email, password);
    await fileStorage.setCurrentUser(user.id);
    setCurrentUser(user);
    return user;
  };

  const logout = async () => {
    await fileStorage.setCurrentUser(null);
    setCurrentUser(null);
  };

  const updatePreferences = async (preferences: Partial<User['preferences']>) => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        preferences: { ...currentUser.preferences, ...preferences },
      };
      const savedUser = await fileStorage.updateUser(updatedUser);
      setCurrentUser(savedUser);
      // Notify PlayerContext of preference changes
      window.dispatchEvent(new CustomEvent('preferencesUpdated', { detail: savedUser.preferences }));
    }
  };

  const toggleLikedTrack = async (trackId: string) => {
    if (!currentUser) return;
    
    const isLiked = currentUser.likedTracks?.includes(trackId);
    let updatedTracks: string[];
    
    if (isLiked) {
      updatedTracks = await fileStorage.removeLikedTrack(currentUser.id, trackId);
    } else {
      updatedTracks = await fileStorage.addLikedTrack(currentUser.id, trackId);
    }
    
    setCurrentUser({
      ...currentUser,
      likedTracks: updatedTracks,
    });
  };

  const isTrackLiked = (trackId: string): boolean => {
    return currentUser?.likedTracks?.includes(trackId) || false;
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, logout, updatePreferences, toggleLikedTrack, isTrackLiked }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

