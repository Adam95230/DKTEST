import React, { useState } from 'react';
import type { TrackInfo } from '../types';
import './PlaylistSearch.css';

interface PlaylistSearchProps {
  tracks: TrackInfo[];
  onFilteredTracks: (tracks: TrackInfo[]) => void;
}

export const PlaylistSearch: React.FC<PlaylistSearchProps> = ({ tracks, onFilteredTracks }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'duration'>('title');

  React.useEffect(() => {
    let filtered = [...tracks];

    // Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        track =>
          track.title.toLowerCase().includes(query) ||
          track.author.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.author.localeCompare(b.author);
        case 'duration':
          return a.duration - b.duration;
        default:
          return 0;
      }
    });

    onFilteredTracks(filtered);
  }, [searchQuery, sortBy, tracks, onFilteredTracks]);

  return (
    <div className="playlist-search">
      <div className="search-input-container">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher dans la playlist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            ×
          </button>
        )}
      </div>
      <div className="sort-controls">
        <span className="sort-label">Trier par:</span>
        <button
          className={`sort-button ${sortBy === 'title' ? 'active' : ''}`}
          onClick={() => setSortBy('title')}
        >
          Titre
        </button>
        <button
          className={`sort-button ${sortBy === 'artist' ? 'active' : ''}`}
          onClick={() => setSortBy('artist')}
        >
          Artiste
        </button>
        <button
          className={`sort-button ${sortBy === 'duration' ? 'active' : ''}`}
          onClick={() => setSortBy('duration')}
        >
          Durée
        </button>
      </div>
    </div>
  );
};

