import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AnimatedBackground } from './AnimatedBackground';
import './AuthPage.css';

export const AuthPage: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentEmails, setRecentEmails] = useState<string[]>([]);
  const { login, signup } = useAuth();

  useEffect(() => {
    // Load recent emails from localStorage
    const stored = localStorage.getItem('recentEmails');
    if (stored) {
      try {
        setRecentEmails(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading recent emails:', e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        if (!password || password.length < 4) {
          setError('Le mot de passe doit contenir au moins 4 caractères');
          setLoading(false);
          return;
        }
        if (!email || !email.includes('@')) {
          setError('Veuillez entrer une adresse e-mail valide');
          setLoading(false);
          return;
        }
        await signup(username.trim() || email.split('@')[0], email.trim(), password);
      } else {
        if (!email || !email.includes('@')) {
          setError('Veuillez entrer une adresse e-mail valide');
          setLoading(false);
          return;
        }
        // Try to login - the server will check both username and email
        await login(email.trim(), password);
      }
      
      // Save email to recent emails
      if (email && email.includes('@')) {
        const updated = [email, ...recentEmails.filter(e => e !== email)].slice(0, 5);
        setRecentEmails(updated);
        localStorage.setItem('recentEmails', JSON.stringify(updated));
      }
    } catch (err: any) {
      setError(err.message || (isSignup ? 'Erreur lors de l\'inscription' : 'Erreur lors de la connexion'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'github' | 'apple') => {
    // For now, just show a message - in production, implement OAuth
    setError(`Connexion avec ${provider} sera disponible prochainement`);
  };

  const handleRecentEmailClick = (recentEmail: string) => {
    setEmail(recentEmail);
  };

  return (
    <div className="auth-page">
      <AnimatedBackground />
      <div className="auth-container">
        <div className="auth-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <span>adk's music</span>
        </div>

        <div className="auth-content">
          <h1 className="auth-title">Bienvenue dans adk's music</h1>
          <p className="auth-subtitle">Votre musique, votre façon</p>

          <div className="auth-social-buttons">
            <button
              type="button"
              className="social-button google-button"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continuer avec Google</span>
            </button>

            <button
              type="button"
              className="social-button github-button"
              onClick={() => handleSocialLogin('github')}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Continuer avec GitHub</span>
            </button>

            <button
              type="button"
              className="social-button apple-button"
              onClick={() => handleSocialLogin('apple')}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span>Continuer avec Apple</span>
            </button>
          </div>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-email-section">
              <label htmlFor="email" className="auth-label">E-mail</label>
              <div className="auth-input-wrapper">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse e-mail"
                  required
                  disabled={loading}
                  className="auth-input"
                />
                {recentEmails.length > 0 && (
                  <button
                    type="button"
                    className="auth-recent-button"
                    onClick={() => {
                      // Show recent emails dropdown (simplified - just use first one)
                      if (recentEmails[0]) {
                        handleRecentEmailClick(recentEmails[0]);
                      }
                    }}
                    title="E-mails récents"
                  >
                    Récent
                  </button>
                )}
              </div>
            </div>

            {isSignup && (
              <div className="auth-input-group">
                <label htmlFor="username" className="auth-label">Nom d'utilisateur</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre nom d'utilisateur"
                  disabled={loading}
                  className="auth-input"
                />
              </div>
            )}

            <div className="auth-input-group">
              <label htmlFor="password" className="auth-label">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "Créez un mot de passe" : "Votre mot de passe"}
                required
                disabled={loading}
                className="auth-input"
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button
              type="submit"
              className="auth-continue-button"
              disabled={loading}
            >
              {loading ? 'Chargement...' : 'Continuer'}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              {isSignup ? "Vous avez déjà un compte?" : "Vous n'avez pas de compte?"}
            </span>
            <button
              type="button"
              className="auth-link-button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
                setPassword('');
              }}
            >
              {isSignup ? 'Se connecter' : "S'inscrire"}
            </button>
          </div>

          <div className="auth-footer">
            <a href="#" className="auth-footer-link">
              Conditions d'utilisation et Politique de confidentialité
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

