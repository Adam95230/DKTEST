import React from 'react';
import { useAuth } from '../context/AuthContext';
import './LikedButton.css';

interface LikedButtonProps {
  trackId: string;
}

export const LikedButton: React.FC<LikedButtonProps> = ({ trackId }) => {
  const { currentUser, toggleLikedTrack, isTrackLiked } = useAuth();

  if (!currentUser) return null;

  const liked = isTrackLiked(trackId);

  return (
    <button
      className={`liked-button ${liked ? 'liked' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleLikedTrack(trackId);
      }}
      title={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
};

