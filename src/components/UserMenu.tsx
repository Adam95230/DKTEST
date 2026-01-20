import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';
import { SettingsModal } from './SettingsModal';
import './UserMenu.css';

interface UserMenuProps {
  onNavigate?: (page: string) => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!currentUser) {
    return (
      <>
        <div className="auth-buttons">
          <button className="user-menu-button" onClick={() => setShowLogin(true)}>
            <span>Connexion</span>
          </button>
          <button className="user-menu-button signup-button" onClick={() => setShowSignup(true)}>
            <span>Inscription</span>
          </button>
        </div>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} isSignup={false} />
        <LoginModal isOpen={showSignup} onClose={() => setShowSignup(false)} isSignup={true} />
      </>
    );
  }

  return (
    <>
      <div className="user-menu">
        <button className="user-menu-button" onClick={() => onNavigate?.('stats')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>Statistiques</span>
        </button>
        <button className="user-menu-button" onClick={() => setShowSettings(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
          </svg>
          <span>Paramètres</span>
        </button>
        <div className="user-info">
          <span className="username">{currentUser.username}</span>
          <button className="logout-button" onClick={logout} title="Déconnexion">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};

