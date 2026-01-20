import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fileStorage, type Playlist } from '../services/fileStorage';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import type { TrackInfo } from '../types';
import { ShelfGrid } from './ShelfGrid';
import { TrackLockup } from './TrackLockup';
import { EditorialCard } from './EditorialCard';
import { TopPickCard } from './TopPickCard';
import './HomePage.css';

interface HomePageProps {
  onPlaylistClick: (playlistId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onPlaylistClick }) => {
  const { currentUser } = useAuth();
  const { currentTrack, playTrack } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [recentTracks, setRecentTracks] = useState<TrackInfo[]>([]);
  const [likedTracks, setLikedTracks] = useState<TrackInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        setLoading(true);
        try {
          // Load playlists
          const userPlaylists = await fileStorage.getPlaylists(currentUser.id);
          setPlaylists(userPlaylists);

          // Load recent tracks from user account
          const recentTrackIds = await fileStorage.getRecentTracks(currentUser.id);
          console.log('Recent track IDs:', recentTrackIds);
          if (recentTrackIds.length > 0) {
            // Load track info for all recent tracks in parallel
            const trackPromises = recentTrackIds.map(async (id) => {
              try {
                const track = await api.getTrack(id);
                return track;
              } catch (error) {
                console.error(`Error loading track ${id}:`, error);
                return null;
              }
            });
            const tracks = await Promise.all(trackPromises);
            const validTracks = tracks.filter((t): t is TrackInfo => t !== null);
            console.log('Loaded recent tracks:', validTracks.length);
            setRecentTracks(validTracks);
          } else {
            setRecentTracks([]);
          }

          // Load liked tracks
          if (currentUser.likedTracks && currentUser.likedTracks.length > 0) {
            console.log('Liked track IDs:', currentUser.likedTracks);
            const likedTrackPromises = currentUser.likedTracks.map(async (id) => {
              try {
                const track = await api.getTrack(id);
                return track;
              } catch (error) {
                console.error(`Error loading liked track ${id}:`, error);
                return null;
              }
            });
            const likedTracksData = await Promise.all(likedTrackPromises);
            const validLikedTracks = likedTracksData.filter((t): t is TrackInfo => t !== null);
            console.log('Loaded liked tracks:', validLikedTracks.length);
            setLikedTracks(validLikedTracks);
          } else {
            setLikedTracks([]);
          }
        } catch (error) {
          console.error('Error loading home data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser, currentTrack]);

  if (!currentUser) {
    return (
      <div className="home-page">
        <div className="welcome-screen">
          <div className="welcome-content">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" className="welcome-icon">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <h1>Bienvenue dans Music</h1>
            <p>Connectez-vous pour accéder à vos playlists et favoris</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <h1 className="page-title">Accueil</h1>
      
      {/* Top Picks for You */}
      <div className="top-picks-section">
        <div className="section-header">
          <h2 className="section-title">Nos sélections pour vous</h2>
          <p className="section-subtitle">Tendances avec Vlocxel Actriz...</p>
        </div>
        <div className="top-picks-grid">
          <TopPickCard 
            title="It's A Beautiful Place" 
            subtitle="Vowell From Your Eyes" 
            color="blue"
          />
          <TopPickCard 
            title="Danny Rice's Station" 
            subtitle="Made for You" 
            color="orange"
          />
          <TopPickCard 
            title="Gracie Abrams & Similar Artists" 
            subtitle="Station" 
            color="dark-blue"
          />
          <TopPickCard 
            title="Get Up! Mix" 
            subtitle="Ariana Grande, Lady Gaga, BRONZE AVERY, Adam Lambert, MARINA, and more" 
            color="red"
          />
        </div>
      </div>

      {/* Recently Played */}
      {recentTracks.length > 0 && (
        <ShelfGrid title="Écoutés récemment" type="grid-type-TrackLockupsShelf" rows={1}>
          {recentTracks.slice(0, 10).map((track) => (
            <TrackLockup 
              key={track.id} 
              track={track} 
              onClick={() => playTrack(track.id)} 
            />
          ))}
        </ShelfGrid>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <ShelfGrid title="Vos playlists" type="grid-type-A" rows={1}>
          {playlists.map((playlist) => {
            const firstTrackId = playlist.trackIds[0];
            const coverUrl = firstTrackId ? api.getTrackCoverUrl(firstTrackId, 530) : '';
            return (
              <EditorialCard
                key={playlist.id}
                title={playlist.name}
                description={`${playlist.trackIds.length} morceau${playlist.trackIds.length > 1 ? 'x' : ''}`}
                imageUrl={coverUrl}
                onClick={() => onPlaylistClick(playlist.id)}
              />
            );
          })}
        </ShelfGrid>
      )}

      {/* Empty state */}
      {recentTracks.length === 0 && playlists.length === 0 && likedTracks.length === 0 && (
        <div className="home-empty-state">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" className="empty-icon">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <p>Commencez à écouter de la musique pour voir vos morceaux récents ici</p>
        </div>
      )}
    </div>
  );
};

// Components removed - now using ShelfGrid, TrackLockup, and EditorialCard

