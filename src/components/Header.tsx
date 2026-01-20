import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { UserMenu } from './UserMenu';
import './Header.css';

interface HeaderProps {
  onSearch: (results: string[]) => void;
  onClearSearch?: () => void;
  onNavigate?: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, onClearSearch, onNavigate }) => {
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
        onSearch(results);
        setShowSuggestions(false);
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
    <header className="header">
      <div className="header-content">
        <div className="logo" onClick={() => onNavigate?.('home')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <span>adk's music</span>
        </div>
        <nav className="header-nav">
          <button 
            className="nav-button" 
            onClick={() => onNavigate?.('library')}
            title="Bibliothèque"
          >
            Bibliothèque
          </button>
          <button 
            className="nav-button" 
            onClick={() => onNavigate?.('radio')}
            title="Radio"
          >
            Radio
          </button>
        </nav>
        <div className="search-container" ref={searchRef}>
          <div className="search-box">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher dans la musique"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => query.length > 2 && setShowSuggestions(true)}
            />
            {query && (
              <button className="clear-search" onClick={() => {
                setQuery('');
                if (onClearSearch) onClearSearch();
              }}>
                ×
              </button>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.slice(0, 8).map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <UserMenu onNavigate={onNavigate} />
      </div>
    </header>
  );
};

