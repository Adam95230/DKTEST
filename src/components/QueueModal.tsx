import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import type { TrackInfo } from '../types';
import './QueueModal.css';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueueModal: React.FC<QueueModalProps> = ({ isOpen, onClose }) => {
  const { playerState, playTrack, removeFromQueue } = usePlayer();
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const loadTracks = async () => {
      if (playerState.queue.length > 0) {
        setLoading(true);
        try {
          const trackPromises = playerState.queue.map(id => api.getTrack(id).catch(() => null));
          const loadedTracks = await Promise.all(trackPromises);
          setTracks(loadedTracks.filter((t): t is TrackInfo => t !== null));
        } catch (error) {
          console.error('Error loading queue tracks:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setTracks([]);
      }
    };
    if (isOpen) {
      loadTracks();
    }
  }, [playerState.queue, isOpen]);

  const handleRemove = (trackId: string) => {
    removeFromQueue(trackId);
  };

  const handlePlay = (trackId: string) => {
    playTrack(trackId);
  };

  if (!isOpen) return null;

  return (
    <div className="queue-modal-overlay" onClick={onClose}>
      <div className="queue-modal" onClick={(e) => e.stopPropagation()}>
        <div className="queue-modal-header">
          <h2>File d'attente</h2>
          <button className="queue-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="queue-content">
          {loading ? (
            <div className="queue-loading">Chargement...</div>
          ) : tracks.length === 0 ? (
            <div className="queue-empty">La file d'attente est vide</div>
          ) : (
            <div className="queue-list">
              {tracks.map((track, index) => {
                const actualIndex = playerState.queue.indexOf(track.id);
                const isCurrent = playerState.currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className={`queue-item ${isCurrent ? 'current' : ''}`}
                    onClick={() => handlePlay(track.id)}
                  >
                    <div className="queue-item-number">{actualIndex + 1}</div>
                    <div className="queue-item-cover">
                      <img src={api.getTrackCoverUrl(track.id, 60)} alt={track.title} />
                    </div>
                    <div className="queue-item-info">
                      <div className="queue-item-title">{track.title}</div>
                      <div className="queue-item-artist">{track.author}</div>
                    </div>
                    <div className="queue-item-duration">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </div>
                    <button
                      className="queue-item-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(track.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

