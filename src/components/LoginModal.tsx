import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSignup?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, isSignup = false }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signup } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        await signup(username.trim(), email.trim() || `${username}@local`, password);
      } else {
        if (!password) {
          setError('Veuillez entrer votre mot de passe');
          setLoading(false);
          return;
        }
        await login(username.trim(), password);
      }
      onClose();
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || (isSignup ? 'Erreur lors de l\'inscription' : 'Erreur lors de la connexion'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal-close" onClick={onClose}>×</button>
        <div className="login-modal-content">
          <h2>{isSignup ? 'Inscription' : 'Connexion'}</h2>
          <p>{isSignup ? 'Créez un nouveau compte' : 'Connectez-vous à votre compte'}</p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre nom d'utilisateur"
                required
                autoFocus
                disabled={loading}
              />
            </div>
            {isSignup && (
              <div className="form-group">
                <label htmlFor="email">Email (optionnel)</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  disabled={loading}
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "Mot de passe (min. 4 caractères)" : "Votre mot de passe"}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Chargement...' : (isSignup ? "S'inscrire" : 'Se connecter')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
