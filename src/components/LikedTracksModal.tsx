import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fileStorage } from '../services/fileStorage';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { TrackList } from './TrackList';
import './LikedTracksModal.css';

interface LikedTracksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LikedTracksModal: React.FC<LikedTracksModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLikedTracks = async () => {
      if (isOpen && currentUser) {
        setLoading(true);
        try {
          const tracks = await fileStorage.getLikedTracks(currentUser.id);
          setLikedTrackIds(tracks);
        } catch (error) {
          console.error('Error loading liked tracks:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadLikedTracks();
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  return (
    <div className="liked-tracks-modal-overlay" onClick={onClose}>
      <div className="liked-tracks-modal" onClick={(e) => e.stopPropagation()}>
        <div className="liked-tracks-modal-header">
          <h2>Mes Favoris</h2>
          <button className="liked-tracks-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="liked-tracks-modal-content">
          {loading ? (
            <div className="liked-tracks-loading">Chargement...</div>
          ) : likedTrackIds.length === 0 ? (
            <div className="liked-tracks-empty">Aucun morceau favori</div>
          ) : (
            <TrackList trackIds={likedTrackIds} />
          )}
        </div>
      </div>
    </div>
  );
};

