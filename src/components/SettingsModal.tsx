import React from 'react';
import { useAuth } from '../context/AuthContext';
import { fileStorage } from '../services/fileStorage';
import './SettingsModal.css';

const getColorThemeValue = (color: string): string => {
  const colors: Record<string, string> = {
    default: '#007AFF',
    blue: '#007AFF',
    purple: '#AF52DE',
    green: '#34C759',
    red: '#FF3B30',
    orange: '#FF9500',
    pink: '#FF2D55',
    cyan: '#5AC8FA',
  };
  return colors[color] || colors.default;
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updatePreferences } = useAuth();
  const [isUpdating, setIsUpdating] = React.useState(false);
  // Local state for API URL to avoid re-renders on every keystroke
  const [localApiUrl, setLocalApiUrl] = React.useState('');
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Update local API URL when user preferences change
  React.useEffect(() => {
    if (currentUser?.preferences?.apiUrl !== undefined) {
      setLocalApiUrl(currentUser.preferences.apiUrl || '');
    }
  }, [currentUser?.preferences?.apiUrl]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  if (!currentUser) {
    console.warn('SettingsModal: No current user');
    return null;
  }

  const prefs = currentUser.preferences;

  const handleChange = async (key: keyof typeof prefs, value: any) => {
    if (isUpdating) return; // Prevent multiple simultaneous updates
    
    try {
      setIsUpdating(true);
      console.log(`Updating preference ${key}:`, value);
      await updatePreferences({ [key]: value });
      console.log(`Preference ${key} updated successfully`);
      
      // For API URL, verify it was saved
      if (key === 'apiUrl') {
        const updatedUser = await fileStorage.getUserById(currentUser.id);
        console.log('Updated user preferences:', updatedUser?.preferences);
        if (updatedUser?.preferences?.apiUrl) {
          console.log('✅ API URL saved:', updatedUser.preferences.apiUrl);
        } else {
          console.warn('⚠️ API URL not found in saved preferences');
        }
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApiUrlChange = (value: string) => {
    setLocalApiUrl(value);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Save after 1 second of no typing (debounce)
    saveTimeoutRef.current = setTimeout(async () => {
      const trimmedValue = value.trim();
      console.log('Saving API URL (debounced):', trimmedValue || 'empty (will use auto-detection)');
      await handleChange('apiUrl', trimmedValue || undefined);
      // Force cache reload after saving
      window.dispatchEvent(new CustomEvent('preferencesUpdated'));
    }, 1000);
  };

  const handleApiUrlBlur = async () => {
    // Save immediately when user leaves the field
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    const trimmedValue = localApiUrl.trim();
    console.log('Saving API URL:', trimmedValue || 'empty (will use auto-detection)');
    await handleChange('apiUrl', trimmedValue || undefined);
    // Force cache reload after saving
    window.dispatchEvent(new CustomEvent('preferencesUpdated'));
  };

  console.log('SettingsModal rendering:', { isOpen, hasUser: !!currentUser });

  // Detect theme for proper colors
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="settings-modal-overlay" onClick={onClose} style={{ display: 'flex', zIndex: 9999 }}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', zIndex: 10000 }}>
        <div className="settings-modal-header">
          <h2>Paramètres</h2>
          <button className="settings-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="settings-modal-content">
          <div className="settings-section">
            <h3>Apparence</h3>
            <div className="setting-item">
              <label>Thème</label>
              <select
                value={prefs.theme || 'dark'}
                onChange={(e) => {
                  e.stopPropagation();
                  handleChange('theme', e.target.value);
                }}
                disabled={isUpdating}
              >
                <option value="dark">Sombre</option>
                <option value="light">Clair</option>
                <option value="auto">Automatique</option>
              </select>
            </div>
            <div className="setting-item">
              <label>Thème de couleur</label>
              <div className="color-theme-grid">
                {(['default', 'blue', 'purple', 'green', 'red', 'orange', 'pink', 'cyan'] as const).map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-theme-button ${prefs.colorTheme === color ? 'active' : ''}`}
                    data-color={color}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChange('colorTheme', color);
                    }}
                    disabled={isUpdating}
                    title={color === 'default' ? 'Par défaut' : color.charAt(0).toUpperCase() + color.slice(1)}
                  >
                    <span className="color-theme-preview" style={{ backgroundColor: getColorThemeValue(color) }}></span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Lecture</h3>
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={prefs.autoplay}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleChange('autoplay', e.target.checked);
                  }}
                  disabled={isUpdating}
                />
                <span className="checkbox-container">
                  <span className="checkbox-slider"></span>
                </span>
                <span className="checkbox-label-text">Lecture automatique</span>
              </label>
            </div>
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={prefs.shuffle}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleChange('shuffle', e.target.checked);
                  }}
                  disabled={isUpdating}
                />
                <span className="checkbox-container">
                  <span className="checkbox-slider"></span>
                </span>
                <span className="checkbox-label-text">Mélange</span>
              </label>
            </div>
            <div className="setting-item">
              <label>Répétition</label>
              <select
                value={prefs.repeat || 'none'}
                onChange={(e) => {
                  e.stopPropagation();
                  handleChange('repeat', e.target.value);
                }}
                disabled={isUpdating}
              >
                <option value="none">Aucune</option>
                <option value="one">Une chanson</option>
                <option value="all">Toutes</option>
              </select>
            </div>
            <div className="setting-item">
              <label>
                Volume par défaut: {Math.round(prefs.volume * 100)}%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={prefs.volume}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleChange('volume', parseFloat(e.target.value));
                  }}
                  disabled={isUpdating}
                />
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h3>Langue</h3>
            <div className="setting-item">
              <label>Langue de l'interface</label>
              <select
                value={prefs.language || 'fr'}
                onChange={(e) => {
                  e.stopPropagation();
                  handleChange('language', e.target.value);
                }}
                disabled={isUpdating}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3>API</h3>
            <div className="setting-item">
              <label>
                URL de l'API Docker (pm-ytm)
                <span className="setting-hint">Laissez vide pour détection automatique</span>
              </label>
              <input
                type="text"
                placeholder="http://192.168.1.100:8631"
                value={localApiUrl}
                onChange={(e) => {
                  e.stopPropagation();
                  handleApiUrlChange(e.target.value);
                }}
                onBlur={handleApiUrlBlur}
                disabled={isUpdating}
                className="api-url-input"
              />
              <p className="setting-description">
                URL complète de votre API Docker (pm-ytm). Exemple : http://192.168.1.100:8631
                <br />
                Si vide, l'URL sera détectée automatiquement selon l'appareil utilisé.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

