import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const useTheme = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const colorTheme = currentUser.preferences.colorTheme || 'default';
    const theme = currentUser.preferences.theme || 'dark';

    // Apply color theme
    const colorThemes: Record<string, string> = {
      default: '#007AFF',
      blue: '#007AFF',
      purple: '#AF52DE',
      green: '#34C759',
      red: '#FF3B30',
      orange: '#FF9500',
      pink: '#FF2D55',
      cyan: '#5AC8FA',
    };

    const primaryColor = colorThemes[colorTheme] || colorThemes.default;
    const rgb = hexToRgb(primaryColor);
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--primary-color-rgb', rgb);

    // Apply base theme (dark/light) using class like SimpMusic
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      // Legacy variables for compatibility
      document.documentElement.style.setProperty('--bg-primary', '#ffffff');
      document.documentElement.style.setProperty('--bg-primary-rgb', '255, 255, 255');
      document.documentElement.style.setProperty('--bg-secondary', '#f5f5f5');
      document.documentElement.style.setProperty('--text-primary', '#000000');
      document.documentElement.style.setProperty('--text-secondary', '#666666');
    } else if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // Legacy variables for compatibility
      if (prefersDark) {
        document.documentElement.style.setProperty('--bg-primary', '#000000');
        document.documentElement.style.setProperty('--bg-primary-rgb', '0, 0, 0');
        document.documentElement.style.setProperty('--bg-secondary', '#121212');
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
        document.documentElement.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.6)');
      } else {
        document.documentElement.style.setProperty('--bg-primary', '#ffffff');
        document.documentElement.style.setProperty('--bg-primary-rgb', '255, 255, 255');
        document.documentElement.style.setProperty('--bg-secondary', '#f5f5f5');
        document.documentElement.style.setProperty('--text-primary', '#000000');
        document.documentElement.style.setProperty('--text-secondary', '#666666');
      }
    } else {
      // dark (default)
      document.documentElement.classList.add('dark');
      // Legacy variables for compatibility
      document.documentElement.style.setProperty('--bg-primary', '#000000');
      document.documentElement.style.setProperty('--bg-primary-rgb', '0, 0, 0');
      document.documentElement.style.setProperty('--bg-secondary', '#121212');
      document.documentElement.style.setProperty('--text-primary', '#ffffff');
      document.documentElement.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.6)');
    }
  }, [currentUser]);

  // Listen for preference updates
  useEffect(() => {
    const handlePreferencesUpdate = (event: CustomEvent) => {
      const preferences = event.detail;
      const colorTheme = preferences.colorTheme || 'default';
      const theme = preferences.theme || 'dark';

      const colorThemes: Record<string, string> = {
        default: '#007AFF',
        blue: '#007AFF',
        purple: '#AF52DE',
        green: '#34C759',
        red: '#FF3B30',
        orange: '#FF9500',
        pink: '#FF2D55',
        cyan: '#5AC8FA',
      };

      const primaryColor = colorThemes[colorTheme] || colorThemes.default;
      const rgb = hexToRgb(primaryColor);
      document.documentElement.style.setProperty('--primary-color', primaryColor);
      document.documentElement.style.setProperty('--primary-color-rgb', rgb);

      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        // Legacy variables for compatibility
        document.documentElement.style.setProperty('--bg-primary', '#ffffff');
        document.documentElement.style.setProperty('--bg-primary-rgb', '255, 255, 255');
        document.documentElement.style.setProperty('--bg-secondary', '#f5f5f5');
        document.documentElement.style.setProperty('--text-primary', '#000000');
        document.documentElement.style.setProperty('--text-secondary', '#666666');
      } else if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        // Legacy variables for compatibility
        if (prefersDark) {
          document.documentElement.style.setProperty('--bg-primary', '#000000');
          document.documentElement.style.setProperty('--bg-primary-rgb', '0, 0, 0');
          document.documentElement.style.setProperty('--bg-secondary', '#121212');
          document.documentElement.style.setProperty('--text-primary', '#ffffff');
          document.documentElement.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.6)');
        } else {
          document.documentElement.style.setProperty('--bg-primary', '#ffffff');
          document.documentElement.style.setProperty('--bg-primary-rgb', '255, 255, 255');
          document.documentElement.style.setProperty('--bg-secondary', '#f5f5f5');
          document.documentElement.style.setProperty('--text-primary', '#000000');
          document.documentElement.style.setProperty('--text-secondary', '#666666');
        }
      } else {
        document.documentElement.classList.add('dark');
        // Legacy variables for compatibility
        document.documentElement.style.setProperty('--bg-primary', '#000000');
        document.documentElement.style.setProperty('--bg-primary-rgb', '0, 0, 0');
        document.documentElement.style.setProperty('--bg-secondary', '#121212');
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
        document.documentElement.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.6)');
      }
    };

    window.addEventListener('preferencesUpdated', handlePreferencesUpdate as EventListener);
    return () => {
      window.removeEventListener('preferencesUpdated', handlePreferencesUpdate as EventListener);
    };
  }, []);
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 122, 255';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

