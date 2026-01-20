import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { LikedButton } from './LikedButton';
import { AddToPlaylistButton } from './AddToPlaylistButton';
import type { TrackInfo } from '../types';
import './TrackList.css';

interface TrackListProps {
  trackIds: string[];
  title?: string;
  onRemoveTrack?: (trackId: string) => void;
  showRemoveButton?: boolean;
}

export const TrackList: React.FC<TrackListProps> = ({ trackIds, title, onRemoveTrack, showRemoveButton = false }) => {
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, currentTrack, addToQueue, clearQueue } = usePlayer();

  useEffect(() => {
    if (trackIds.length > 0) {
      clearQueue();
      trackIds.forEach((id) => addToQueue(id));
    }
  }, [trackIds, addToQueue, clearQueue]);

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const trackPromises = trackIds.map((id) => api.getTrack(id));
        const trackResults = await Promise.all(trackPromises);
        setTracks(trackResults);
      } catch (error) {
        console.error('Error fetching tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (trackIds.length > 0) {
      fetchTracks();
    } else {
      setTracks([]);
      setLoading(false);
    }
  }, [trackIds]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="track-list-container">
        {title && <h2 className="track-list-title">{title}</h2>}
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="track-list-container">
        {title && <h2 className="track-list-title">{title}</h2>}
        <div className="empty-state">Aucun morceau trouvé</div>
      </div>
    );
  }

  return (
    <div className="track-list-container">
      {title && <h2 className="track-list-title">{title}</h2>}
      <div className="track-list">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
            onClick={() => playTrack(track.id)}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="track-number">
              <span className="track-number-text">{index + 1}</span>
              <button
                className="track-play-button-inline"
                onClick={(e) => {
                  e.stopPropagation();
                  playTrack(track.id);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  {currentTrack?.id === track.id ? (
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  ) : (
                    <path d="M8 5v14l11-7z" />
                  )}
                </svg>
              </button>
            </div>
            <div className="track-cover">
              <img
                src={api.getTrackCoverUrl(track.id, 80)}
                alt={track.title}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="%23333" width="80" height="80"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23999" font-size="24">♪</text></svg>';
                }}
              />
            </div>
            <div className="track-info">
              <div className="track-title">{track.title}</div>
              <div className="track-artist">{track.author}</div>
            </div>
            <div className="track-duration">{formatDuration(track.duration)}</div>
            <div className="track-actions">
              <LikedButton trackId={track.id} />
              <AddToPlaylistButton trackId={track.id} />
              {showRemoveButton && onRemoveTrack && (
                <button
                  className="track-remove-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTrack(track.id);
                  }}
                  title="Retirer de la playlist"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

