import React, { useEffect, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import './Notification.css';

export const Notification: React.FC = () => {
  const { currentTrack } = usePlayer();
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (currentTrack) {
      setShow(true);
      setIsExiting(false);
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => setShow(false), 300); // Wait for exit animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentTrack]);

  if (!show || !currentTrack) return null;

  return (
    <div className={`notification ${isExiting ? 'exiting' : ''}`}>
      <div className="notification-content">
        <img
          src={api.getTrackCoverUrl(currentTrack.id, 60)}
          alt={currentTrack.title}
          className="notification-cover"
        />
        <div className="notification-info">
          <div className="notification-title">Lecture en cours</div>
          <div className="notification-track">{currentTrack.title}</div>
          <div className="notification-artist">{currentTrack.author}</div>
        </div>
      </div>
    </div>
  );
};

