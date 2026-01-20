import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fileStorage, type Playlist } from '../services/fileStorage';
import './AddToPlaylistButton.css';

interface AddToPlaylistButtonProps {
  trackId: string;
}

export const AddToPlaylistButton: React.FC<AddToPlaylistButtonProps> = ({ trackId }) => {
  const { currentUser } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const loadPlaylists = async () => {
      if (currentUser) {
        try {
          const userPlaylists = await fileStorage.getPlaylists(currentUser.id);
          setPlaylists(userPlaylists);
        } catch (error) {
          console.error('Error loading playlists:', error);
        }
      }
    };
    loadPlaylists();
  }, [currentUser]);

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      await fileStorage.addTrackToPlaylist(playlistId, trackId);
      setPlaylists(playlists.map((p) => 
        p.id === playlistId 
          ? { ...p, trackIds: [...p.trackIds, trackId] }
          : p
      ));
      setShowMenu(false);
    } catch (error) {
      console.error('Error adding track to playlist:', error);
    }
  };

  if (!currentUser) return null;

  const availablePlaylists = playlists.filter(p => !p.trackIds.includes(trackId));

  return (
    <div className="add-to-playlist-container">
      <button
        className="add-to-playlist-button"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        title="Ajouter à une playlist"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      {showMenu && (
        <>
          <div className="playlist-menu-overlay" onClick={() => setShowMenu(false)} />
          <div className="playlist-menu">
            <div className="playlist-menu-header">
              <span>Ajouter à une playlist</span>
              <button className="close-menu" onClick={() => setShowMenu(false)}>×</button>
            </div>
            <div className="playlist-menu-list">
              {availablePlaylists.length === 0 ? (
                <div className="playlist-menu-empty">Aucune playlist disponible</div>
              ) : (
                availablePlaylists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="playlist-menu-item"
                    onClick={() => handleAddToPlaylist(playlist.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 11H5M19 11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2M19 11V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 7h10" />
                    </svg>
                    <span>{playlist.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

