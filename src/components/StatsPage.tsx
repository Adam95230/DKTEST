import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fileStorage } from '../services/fileStorage';
import { api } from '../services/api';
import type { TrackInfo } from '../types';
import './StatsPage.css';

export const StatsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [topTracks, setTopTracks] = useState<Array<{ track: TrackInfo; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTracksPlayed: 0,
    totalPlaylists: 0,
    totalLiked: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        // Get recent tracks (most played)
        const recentTracks = await fileStorage.getRecentTracks(currentUser.id);
        const playlists = await fileStorage.getPlaylists(currentUser.id);
        const likedTracks = await fileStorage.getLikedTracks(currentUser.id);

        // Count track plays
        const trackCounts: Record<string, number> = {};
        recentTracks.forEach(trackId => {
          trackCounts[trackId] = (trackCounts[trackId] || 0) + 1;
        });

        // Get top tracks
        const sortedTracks = Object.entries(trackCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        const topTracksData = await Promise.all(
          sortedTracks.map(async ([trackId, count]) => {
            try {
              const track = await api.getTrack(trackId);
              return { track, count };
            } catch (error) {
              console.error(`Error loading track ${trackId} for stats:`, error);
              return null;
            }
          })
        );

        setTopTracks(topTracksData.filter((t): t is { track: TrackInfo; count: number } => t !== null));
        setStats({
          totalTracksPlayed: recentTracks.length,
          totalPlaylists: playlists.length,
          totalLiked: likedTracks.length,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="stats-page">
        <div className="loading">Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <h1 className="stats-title">Vos Statistiques</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎵</div>
          <div className="stat-value">{stats.totalTracksPlayed}</div>
          <div className="stat-label">Morceaux écoutés</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-value">{stats.totalLiked}</div>
          <div className="stat-label">Morceaux aimés</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats.totalPlaylists}</div>
          <div className="stat-label">Playlists</div>
        </div>
      </div>

      {topTracks.length > 0 && (
        <div className="top-tracks-section">
          <h2 className="section-title">Morceaux les plus écoutés</h2>
          <div className="top-tracks-list">
            {topTracks.map(({ track, count }, index) => (
              <div key={track.id} className="top-track-item">
                <div className="track-rank">#{index + 1}</div>
                <div className="track-cover-small">
                  <img src={api.getTrackCoverUrl(track.id, 60)} alt={track.title} />
                </div>
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-artist">{track.author}</div>
                </div>
                <div className="play-count">{count} {count > 1 ? 'écoutes' : 'écoute'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

