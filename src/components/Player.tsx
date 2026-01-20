import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import { FullscreenPlayer } from './FullscreenPlayer';
import { QueueModal } from './QueueModal';
import { PipPlayer } from './PipPlayer';
import './Player.css';

export const Player: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const {
    currentTrack,
    isPlaying,
    audioRef,
    togglePlayPause,
    setVolume,
    seek,
    nextTrack,
    previousTrack,
    volume,
    toggleShuffle,
    toggleRepeat,
    shuffle,
    repeat,
    playerState,
  } = usePlayer();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [currentTrack, audioRef]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    seek(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  if (!currentTrack) return null;

  return (
    <>
      <FullscreenPlayer isOpen={isFullscreen} onClose={() => setIsFullscreen(false)} />
      <QueueModal isOpen={showQueue} onClose={() => setShowQueue(false)} />
      <PipPlayer isOpen={isPip} onClose={() => setIsPip(false)} />
      <div className="player">
        <div className="player-left">
          <div className="player-track-cover">
            <img
              src={api.getTrackCoverUrl(currentTrack.id, 56)}
              alt={currentTrack.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect fill="%23333" width="56" height="56"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23999" font-size="20">♪</text></svg>';
              }}
            />
          </div>
          <div className="player-track-info">
            <div className="player-track-title">{currentTrack.title}</div>
            <div className="player-track-artist">{currentTrack.author}</div>
          </div>
        </div>

        <div className="player-center">
          <div className="player-controls">
            <button
              className={`control-button ${shuffle ? 'active' : ''}`}
              onClick={toggleShuffle}
              title="Mélanger"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
              </svg>
            </button>
            <button className="control-button" onClick={previousTrack} title="Précédent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button className="play-pause-button" onClick={togglePlayPause} title={isPlaying ? 'Pause' : 'Lecture'}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                {isPlaying ? (
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
            </button>
            <button className="control-button" onClick={nextTrack} title="Suivant">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
            <button
              className={`control-button ${repeat !== 'none' ? 'active' : ''}`}
              onClick={toggleRepeat}
              title={repeat === 'all' ? 'Répéter tout' : repeat === 'one' ? 'Répéter un' : 'Répéter'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                {repeat === 'one' ? (
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v6z" />
                ) : (
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v6z" />
                )}
              </svg>
              {repeat === 'one' && <span className="repeat-indicator">1</span>}
            </button>
          </div>
          <div className="player-progress">
            <span className="time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
            />
            <span className="time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-right">
          <button
            className="control-button"
            onClick={() => setShowQueue(true)}
            title="File d'attente"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {playerState.queue.length > 0 && (
              <span className="queue-badge">{playerState.queue.length}</span>
            )}
          </button>
          <button
            className={`control-button ${isPip ? 'active' : ''}`}
            onClick={() => setIsPip(!isPip)}
            title={isPip ? 'Fermer le mini lecteur' : 'Mini lecteur'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </button>
          <button
            className="control-button"
            onClick={() => setIsFullscreen(true)}
            title="Mode pleine écran"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
          <div className="volume-control-container">
            <button
              className="control-button"
              onClick={() => setShowVolumeControl(!showVolumeControl)}
              title="Volume"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                {volume === 0 ? (
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                ) : volume < 0.5 ? (
                  <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                ) : (
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                )}
              </svg>
            </button>
            {showVolumeControl && (
              <div className="volume-slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="volume-slider"
                />
              </div>
            )}
          </div>
          <a
            href={api.getTrackDownloadUrl(currentTrack.id)}
            download
            className="control-button"
            title="Télécharger"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
        </div>
      </div>

    </>
  );
};

