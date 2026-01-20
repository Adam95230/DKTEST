import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { AppleMusicLayout } from './components/AppleMusicLayout';
import { TrackList } from './components/TrackList';
import { HomePage } from './components/HomePage';
import { PlaylistPage } from './components/PlaylistPage';
import { StatsPage } from './components/StatsPage';
import { Player } from './components/Player';
import { Notification } from './components/Notification';
import { AuthPage } from './components/AuthPage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';
import './App.css';

type Page = 'home' | 'search' | 'playlist' | 'stats' | 'library' | 'radio';

function AppContent() {
  const { currentUser } = useAuth();
  useKeyboardShortcuts();
  useTheme();
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);

  // Show auth page if not logged in
  if (!currentUser) {
    return <AuthPage />;
  }

  const handleSearch = (results: string[]) => {
    setSearchResults(results);
    setCurrentPage('search');
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setCurrentPage('home');
  };

  const handlePlaylistClick = (playlistId: string) => {
    setCurrentPlaylistId(playlistId);
    setCurrentPage('playlist');
  };

  const handleBack = () => {
    setCurrentPage('home');
    setCurrentPlaylistId(null);
  };

  return (
    <div className="app">
      <AppleMusicLayout 
        onNavigate={(page) => setCurrentPage(page as Page)}
        currentPage={currentPage}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
      >
        {currentPage === 'search' ? (
          <TrackList trackIds={searchResults} title="Résultats de recherche" />
        ) : currentPage === 'playlist' && currentPlaylistId ? (
          <PlaylistPage playlistId={currentPlaylistId} onBack={handleBack} />
        ) : currentPage === 'stats' ? (
          <StatsPage />
        ) : currentPage === 'library' ? (
          <HomePage onPlaylistClick={handlePlaylistClick} />
        ) : currentPage === 'radio' ? (
          <div className="page-placeholder">
            <h2>Radio</h2>
            <p>Stations de radio personnalisées</p>
          </div>
        ) : (
          <HomePage onPlaylistClick={handlePlaylistClick} />
        )}
      </AppleMusicLayout>
      <Player />
      <Notification />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </AuthProvider>
  );
}

export default App;
