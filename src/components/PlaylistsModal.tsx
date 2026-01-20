import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fileStorage, type Playlist } from '../services/fileStorage';
import { usePlayer } from '../context/PlayerContext';
import './PlaylistsModal.css';

interface PlaylistsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlaylistsModal: React.FC<PlaylistsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { currentTrack } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const loadPlaylists = async () => {
      if (isOpen && currentUser) {
        try {
          const userPlaylists = await fileStorage.getPlaylists(currentUser.id);
          setPlaylists(userPlaylists);
        } catch (error) {
          console.error('Error loading playlists:', error);
        }
      }
    };
    loadPlaylists();
  }, [isOpen, currentUser]);

  const createPlaylist = async () => {
    if (!currentUser || !newPlaylistName.trim()) return;
    try {
      const playlist = await fileStorage.createPlaylist(currentUser.id, newPlaylistName.trim());
      setPlaylists([...playlists, playlist]);
      setNewPlaylistName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const deletePlaylist = async (id: string) => {
    try {
      await fileStorage.deletePlaylist(id);
      setPlaylists(playlists.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const addCurrentTrackToPlaylist = async (playlistId: string) => {
    if (currentTrack) {
      try {
        await fileStorage.addTrackToPlaylist(playlistId, currentTrack.id);
        setPlaylists(playlists.map((p) => 
          p.id === playlistId 
            ? { ...p, trackIds: [...p.trackIds, currentTrack.id] }
            : p
        ));
      } catch (error) {
        console.error('Error adding track to playlist:', error);
      }
    }
  };

  const playPlaylist = (playlist: Playlist) => {
    // This would need to be implemented in PlayerContext
    // For now, just close the modal
    onClose();
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div className="playlists-modal-overlay" onClick={onClose}>
      <div className="playlists-modal" onClick={(e) => e.stopPropagation()}>
        <div className="playlists-modal-header">
          <h2>Mes Playlists</h2>
          <button className="playlists-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="playlists-modal-content">
          <button 
            className="create-playlist-button"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Créer une playlist
          </button>

          {showCreateForm && (
            <div className="create-playlist-form">
              <input
                type="text"
                placeholder="Nom de la playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createPlaylist()}
                autoFocus
              />
              <div className="form-actions">
                <button onClick={createPlaylist} className="save-button">Créer</button>
                <button onClick={() => { setShowCreateForm(false); setNewPlaylistName(''); }} className="cancel-button">Annuler</button>
              </div>
            </div>
          )}

          <div className="playlists-list">
            {playlists.length === 0 ? (
              <div className="empty-playlists">Aucune playlist créée</div>
            ) : (
              playlists.map((playlist) => (
                <div key={playlist.id} className="playlist-item">
                  <div className="playlist-info">
                    <h3>{playlist.name}</h3>
                    <p>{playlist.trackIds.length} morceau{playlist.trackIds.length > 1 ? 'x' : ''}</p>
                  </div>
                  <div className="playlist-actions">
                    {currentTrack && !playlist.trackIds.includes(currentTrack.id) && (
                      <button
                        className="action-button"
                        onClick={() => addCurrentTrackToPlaylist(playlist.id)}
                        title="Ajouter le morceau actuel"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    )}
                    <button
                      className="action-button"
                      onClick={() => playPlaylist(playlist)}
                      title="Lire la playlist"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                    <button
                      className="action-button delete"
                      onClick={() => deletePlaylist(playlist.id)}
                      title="Supprimer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

