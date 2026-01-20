import React, { useState, useEffect } from 'react';
import { fileStorage, type Playlist } from '../services/fileStorage';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { TrackList } from './TrackList';
import { PlaylistSearch } from './PlaylistSearch';
import { api } from '../services/api';
import type { TrackInfo } from '../types';
import './PlaylistPage.css';

interface PlaylistPageProps {
  playlistId: string;
  onBack: () => void;
}

export const PlaylistPage: React.FC<PlaylistPageProps> = ({ playlistId, onBack }) => {
  const { currentUser } = useAuth();
  const { playTrack, addToQueue, clearQueue } = usePlayer();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<TrackInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    const loadPlaylist = async () => {
      if (!playlistId || !currentUser) return;
      setLoading(true);
      try {
        const playlistData = await fileStorage.getPlaylistById(playlistId);
        if (!playlistData) {
          setLoading(false);
          return;
        }
        setPlaylist(playlistData);
        setEditName(playlistData.name);
        setEditDescription(playlistData.description || '');

        // Load track info
        if (playlistData.trackIds.length > 0) {
          const trackPromises = playlistData.trackIds.map(id => 
            api.getTrack(id).catch(() => null)
          );
          const loadedTracks = await Promise.all(trackPromises);
          const validTracks = loadedTracks.filter((t): t is TrackInfo => t !== null);
          setTracks(validTracks);
          setFilteredTracks(validTracks);
        } else {
          setTracks([]);
          setFilteredTracks([]);
        }
      } catch (error) {
        console.error('Error loading playlist:', error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    loadPlaylist();
  }, [playlistId, currentUser]);

  const handleSave = async () => {
    if (!playlist) return;
    try {
      const updated = await fileStorage.updatePlaylist({
        ...playlist,
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setPlaylist(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating playlist:', error);
    }
  };

  const handleCancel = () => {
    if (playlist) {
      setEditName(playlist.name);
      setEditDescription(playlist.description || '');
    }
    setIsEditing(false);
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    clearQueue();
    tracks.forEach(track => addToQueue(track.id));
    playTrack(tracks[0].id);
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist) return;
    try {
      await fileStorage.removeTrackFromPlaylist(playlist.id, trackId);
      setTracks(tracks.filter(t => t.id !== trackId));
      const updated = await fileStorage.getPlaylistById(playlist.id);
      if (updated) setPlaylist(updated);
    } catch (error) {
      console.error('Error removing track:', error);
    }
  };

  if (loading) {
    return (
      <div className="playlist-page">
        <div className="playlist-loading">
          <div className="loading-spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="playlist-page">
        <button className="back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <div className="playlist-error">Playlist introuvable</div>
      </div>
    );
  }

  const coverUrl = tracks.length > 0 ? api.getTrackCoverUrl(tracks[0].id, 500) : null;

  return (
    <div className="playlist-page">
      <div className="playlist-header">
        <button className="back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        
        <div className="playlist-header-content">
          <div className="playlist-cover-container">
            {coverUrl ? (
              <img src={coverUrl} alt={playlist.name} className="playlist-cover" />
            ) : (
              <div className="playlist-cover-placeholder">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11H5M19 11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2M19 11V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 7h10" />
                </svg>
              </div>
            )}
          </div>

          <div className="playlist-info">
            {isEditing ? (
              <div className="playlist-edit-form">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="playlist-name-input"
                  placeholder="Nom de la playlist"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="playlist-description-input"
                  placeholder="Description (optionnel)"
                  rows={3}
                />
                <div className="edit-actions">
                  <button className="save-button" onClick={handleSave}>
                    Enregistrer
                  </button>
                  <button className="cancel-button" onClick={handleCancel}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="playlist-type">Playlist</div>
                <h1 className="playlist-title">{playlist.name}</h1>
                {playlist.description && (
                  <p className="playlist-description">{playlist.description}</p>
                )}
                <div className="playlist-meta">
                  <span>{currentUser?.username}</span>
                  <span>•</span>
                  <span>{tracks.length} morceau{tracks.length > 1 ? 'x' : ''}</span>
                </div>
                <div className="playlist-actions">
                  <button className="play-button" onClick={handlePlayAll}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Lire
                  </button>
                  <button className="edit-button" onClick={() => setIsEditing(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Modifier
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="playlist-tracks">
        {tracks.length > 0 && (
          <PlaylistSearch tracks={tracks} onFilteredTracks={setFilteredTracks} />
        )}
        {filteredTracks.length > 0 ? (
          <TrackList 
            trackIds={filteredTracks.map(t => t.id)} 
            onRemoveTrack={handleRemoveTrack}
            showRemoveButton={true}
          />
        ) : tracks.length === 0 ? (
          <div className="empty-playlist">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <p>Cette playlist est vide</p>
            <p className="empty-hint">Ajoutez des morceaux depuis les résultats de recherche</p>
          </div>
        ) : (
          <div className="empty-playlist">
            <p>Aucun résultat trouvé</p>
            <p className="empty-hint">Essayez avec d'autres mots-clés</p>
          </div>
        )}
      </div>
    </div>
  );
};

