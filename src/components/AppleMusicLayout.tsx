import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import './AppleMusicLayout.css';
import './MiniPlayer.css';

interface AppleMusicLayoutProps {
  children: React.ReactNode;
  onNavigate?: (page: string) => void;
  currentPage?: string;
  onSearch?: (results: string[]) => void;
  onClearSearch?: () => void;
}

export const AppleMusicLayout: React.FC<AppleMusicLayoutProps> = ({ children, onNavigate, currentPage, onSearch, onClearSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      const timer = setTimeout(async () => {
        try {
          const results = await api.getSearchSuggestions(query);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSearch = async (searchQuery?: string) => {
    const searchTerm = searchQuery || query;
    if (searchTerm.trim()) {
      try {
        const results = await api.search(searchTerm);
        onSearch?.(results);
        setShowSuggestions(false);
        onNavigate?.('search');
      } catch (error) {
        console.error('Error searching:', error);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };
  return (
    <div className="apple-music-layout with-mini-player">
      {/* Top Header with Mini Player */}
      <header className="top-header">
        <div className="top-header-controls">
          <button className="mini-player-button">
            <svg height="20" viewBox="0 0 20 20" width="20">
              <path d="M4.75 7.75a1 1 0 0 1 1.508-.861l7.842 4.75a1 1 0 0 1 0 1.722l-7.842 4.75A1 1 0 0 1 4.75 17.25V7.75z"></path>
            </svg>
          </button>
          <button className="mini-player-button">
            <svg height="20" viewBox="0 0 20 20" width="20">
              <path d="M10 3.758l1.826 3.699a1 1 0 0 0 .754.547l4.082.593a1 1 0 0 1 .554 1.706l-2.954 2.88a1 1 0 0 0-.288.884l.697 4.067a1 1 0 0 1-1.451 1.054L9.566 17.44a1 1 0 0 0-.932 0l-3.654 1.922a1 1 0 0 1-1.45-1.054l.696-4.067a1 1 0 0 0-.288-.884l-2.954-2.88a1 1 0 0 1 .554-1.706l4.082-.593a1 1 0 0 0 .754-.547L10 3.758z"></path>
            </svg>
          </button>
          <button className="mini-player-button">
            <svg height="20" viewBox="0 0 20 20" width="20">
              <path d="M5 3.75A2.25 2.25 0 0 1 7.25 1.5h5.5A2.25 2.25 0 0 1 15 3.75v.5h.25a2 2 0 0 1 2 2v11.5a2 2 0 0 1-2 2H4.75a2 2 0 0 1-2-2V6.25a2 2 0 0 1 2-2H5v-.5z"></path>
            </svg>
          </button>
        </div>
        <div className="header-mini-player">
          <div className="mini-player-art">
            <img src="https://via.placeholder.com/48" alt="" />
          </div>
          <div className="mini-player-controls">
            <button className="mini-player-button">
              <svg height="16" viewBox="0 0 16 16" width="16">
                <path d="M15 7.5a.5.5 0 0 1-.5.5H3.207l4.147 4.146a.5.5 0 0 1-.708.708l-5-5a.5.5 0 0 1 0-.708l5-5a.5.5 0 1 1 .708.708L3.207 7H14.5a.5.5 0 0 1 .5.5z"></path>
              </svg>
            </button>
            <button className="mini-player-button play-pause">
              <svg height="20" viewBox="0 0 20 20" width="20">
                <path d="M4.75 7.75a1 1 0 0 1 1.508-.861l7.842 4.75a1 1 0 0 1 0 1.722l-7.842 4.75A1 1 0 0 1 4.75 17.25V7.75z"></path>
              </svg>
            </button>
            <button className="mini-player-button">
              <svg height="16" viewBox="0 0 16 16" width="16">
                <path d="M1 7.5a.5.5 0 0 0 .5.5h11.293l-4.147 4.146a.5.5 0 0 0 .708.708l5-5a.5.5 0 0 0 0-.708l-5-5a.5.5 0 0 0-.708.708L12.793 7H1.5a.5.5 0 0 0-.5.5z"></path>
              </svg>
            </button>
          </div>
          <div className="mini-player-info">
            <div className="mini-player-title">All Of Me</div>
            <div className="mini-player-artist">Niall • HIT ME</div>
          </div>
          <div className="mini-player-progress">
            <span className="mini-player-time">1:23</span>
            <input type="range" className="mini-player-progress-bar" min="0" max="100" defaultValue="30" />
            <span className="mini-player-time">-1:23</span>
          </div>
        </div>
        <div className="mini-player-actions">
          <button className="mini-player-button">
            <svg height="20" viewBox="0 0 20 20" width="20">
              <path d="M8 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3zm6 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V3z"></path>
            </svg>
          </button>
          <button className="mini-player-button">
            <svg height="20" viewBox="0 0 20 20" width="20">
              <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-.75-11.25a.75.75 0 0 1 1.5 0V9.5h1.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1-.75-.75v-3.5z"></path>
            </svg>
          </button>
          <button className="mini-player-button">
            <svg height="20" viewBox="0 0 20 20" width="20">
              <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM8.5 6.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75zm0 6.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75z"></path>
            </svg>
          </button>
        </div>
      </header>

      {/* Body with Sidebar + Content */}
      <div className="layout-body">
        {/* Sidebar Navigation */}
        <aside className="navigation-sidebar">
        <div className="navigation__header">
          <div className="logo" onClick={() => onNavigate?.('home')}>
            <svg height="20" viewBox="0 0 83 20" width="83" xmlns="http://www.w3.org/2000/svg" className="logo-svg" aria-hidden="true">
              <path d="M34.752 19.746V6.243h-.088l-5.433 13.503h-2.074L21.711 6.243h-.087v13.503h-2.548V1.399h3.235l5.833 14.621h.1l5.82-14.62h3.248v18.347h-2.56zm16.649 0h-2.586v-2.263h-.062c-.725 1.602-2.061 2.504-4.072 2.504-2.86 0-4.61-1.894-4.61-4.958V6.37h2.698v8.125c0 2.034.95 3.127 2.81 3.127 1.95 0 3.124-1.373 3.124-3.458V6.37H51.4v13.376zm7.394-13.618c3.06 0 5.046 1.73 5.134 4.196h-2.536c-.15-1.296-1.087-2.11-2.598-2.11-1.462 0-2.436.724-2.436 1.793 0 .839.6 1.41 2.023 1.741l2.136.496c2.686.636 3.71 1.704 3.71 3.636 0 2.442-2.236 4.12-5.333 4.12-3.285 0-5.26-1.64-5.509-4.183h2.673c.25 1.398 1.187 2.085 2.836 2.085 1.623 0 2.623-.687 2.623-1.78 0-.865-.487-1.373-1.924-1.704l-2.136-.508c-2.498-.585-3.735-1.806-3.735-3.75 0-2.391 2.049-4.032 5.072-4.032zM66.1 2.836c0-.878.7-1.577 1.561-1.577.862 0 1.55.7 1.55 1.577 0 .864-.688 1.576-1.55 1.576a1.573 1.573 0 0 1-1.56-1.576zm.212 3.534h2.698v13.376h-2.698zm14.089 4.603c-.275-1.424-1.324-2.556-3.085-2.556-2.086 0-3.46 1.767-3.46 4.64 0 2.938 1.386 4.642 3.485 4.642 1.66 0 2.748-.928 3.06-2.48H83C82.713 18.067 80.477 20 77.317 20c-3.76 0-6.208-2.62-6.208-6.942 0-4.247 2.448-6.93 6.183-6.93 3.385 0 5.446 2.213 5.683 4.845h-2.573zM10.824 3.189c-.698.834-1.805 1.496-2.913 1.398-.145-1.128.41-2.33 1.036-3.065C9.644.662 10.848.05 11.835 0c.121 1.178-.336 2.33-1.01 3.19zm.999 1.619c.624.049 2.425.244 3.578 1.98-.096.074-2.137 1.272-2.113 3.79.024 3.01 2.593 4.012 2.617 4.037-.024.074-.407 1.419-1.344 2.812-.817 1.224-1.657 2.422-3.002 2.447-1.297.024-1.73-.783-3.218-.783-1.489 0-1.97.758-3.194.807-1.297.048-2.28-1.297-3.097-2.52C.368 14.908-.904 10.408.825 7.375c.84-1.516 2.377-2.47 4.034-2.495 1.273-.023 2.45.857 3.218.857.769 0 2.137-1.027 3.746-.93z"></path>
            </svg>
          </div>
        </div>
        <nav className="navigation__content">
          <div className="navigation-items navigation-items--primary">
            <ul className="navigation-items__list">
              <li className={`navigation-item navigation-item__home ${currentPage === 'home' ? 'navigation-item--selected' : ''}`}>
                <a href="#" className="navigation-item__link" onClick={(e) => { e.preventDefault(); onNavigate?.('home'); }}>
                  <div className="navigation-item__content">
                    <span className="navigation-item__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M5.93 20.16a1.94 1.94 0 0 1-1.43-.502c-.334-.335-.502-.794-.502-1.393v-7.142c0-.362.062-.688.177-.953.123-.264.326-.529.6-.75l6.145-5.157c.176-.141.344-.247.52-.318.176-.07.362-.105.564-.105.194 0 .388.035.565.105.176.07.352.177.52.318l6.146 5.158c.273.23.467.476.59.75.124.264.177.59.177.96v7.134c0 .59-.159 1.058-.503 1.393-.335.335-.811.503-1.428.503H5.929Z"></path>
                      </svg>
                    </span>
                    <span className="navigation-item__label">Accueil</span>
                  </div>
                </a>
              </li>
              <li className={`navigation-item navigation-item__search ${currentPage === 'search' ? 'navigation-item--selected' : ''}`}>
                <a href="#" className="navigation-item__link" onClick={(e) => { e.preventDefault(); onNavigate?.('search'); }}>
                  <div className="navigation-item__content">
                    <span className="navigation-item__icon">
                      <svg height="24" viewBox="0 0 24 24" width="24" aria-hidden="true">
                        <path d="M17.979 18.553c.476 0 .813-.366.813-.835a.807.807 0 0 0-.235-.586l-3.45-3.457a5.61 5.61 0 0 0 1.158-3.413c0-3.098-2.535-5.633-5.633-5.633C7.542 4.63 5 7.156 5 10.262c0 3.098 2.534 5.632 5.632 5.632a5.614 5.614 0 0 0 3.274-1.055l3.472 3.472a.835.835 0 0 0 .6.242z" fillOpacity=".95"></path>
                      </svg>
                    </span>
                    <span className="navigation-item__label">Rechercher</span>
                  </div>
                </a>
              </li>
              <li className={`navigation-item navigation-item__library ${currentPage === 'library' ? 'navigation-item--selected' : ''}`}>
                <a href="#" className="navigation-item__link" onClick={(e) => { e.preventDefault(); onNavigate?.('library'); }}>
                  <div className="navigation-item__content">
                    <span className="navigation-item__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M5.93 20.16a1.94 1.94 0 0 1-1.43-.502c-.334-.335-.502-.794-.502-1.393v-7.142c0-.362.062-.688.177-.953.123-.264.326-.529.6-.75l6.145-5.157c.176-.141.344-.247.52-.318.176-.07.362-.105.564-.105.194 0 .388.035.565.105.176.07.352.177.52.318l6.146 5.158c.273.23.467.476.59.75.124.264.177.59.177.96v7.134c0 .59-.159 1.058-.503 1.393-.335.335-.811.503-1.428.503H5.929Z"></path>
                      </svg>
                    </span>
                    <span className="navigation-item__label">Bibliothèque</span>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

        {/* Main Content Area */}
        <div className="main-layout">
          {/* Content */}
          <main className="main-content-area">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
