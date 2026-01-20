import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import './PipPlayer.css';

interface PipPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PipPlayer: React.FC<PipPlayerProps> = ({ isOpen, onClose }) => {
  const {
    currentTrack,
    isPlaying,
    audioRef,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
  } = usePlayer();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isInPip, setIsInPip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!isOpen || !currentTrack) return;

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
  }, [isOpen, currentTrack, audioRef]);

  // Create video element with album cover for PiP
  useEffect(() => {
    if (!isOpen || !currentTrack || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load album cover image
    let coverImage: HTMLImageElement | null = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      coverImage = img;
    };
    img.src = api.getTrackCoverUrl(currentTrack.id, 400);

    // Draw album cover and info on canvas
    const drawFrame = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (coverImage) {
        // Draw cover (centered, 200x200)
        const coverSize = 200;
        const x = (canvas.width - coverSize) / 2;
        const y = 20;
        ctx.drawImage(coverImage, x, y, coverSize, coverSize);
      }

      // Draw title and artist
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(currentTrack.title, canvas.width / 2, 240);
      
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(currentTrack.author, canvas.width / 2, 260);

      // Draw progress bar
      const progressWidth = canvas.width - 40;
      const progressX = 20;
      const progressY = 270;
      const progressHeight = 4;
      const progress = duration > 0 ? currentTime / duration : 0;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
      
      ctx.fillStyle = '#fff';
      ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight);

      // Draw play/pause indicator
      if (isPlaying) {
        ctx.fillStyle = '#1db954';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 120, 8, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    // Update canvas periodically
    const updateCanvas = () => {
      if (canvas && ctx) {
        drawFrame();
        animationFrameRef.current = requestAnimationFrame(updateCanvas);
      }
    };
    animationFrameRef.current = requestAnimationFrame(updateCanvas);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, currentTrack, currentTime, duration, isPlaying]);

  // Setup video stream from canvas
  useEffect(() => {
    if (!isOpen || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const stream = canvas.captureStream(30); // 30 FPS
    video.srcObject = stream;
    
    // Video must always play to keep PiP window open
    // Audio playback state is independent
    video.play().catch(err => {
      console.log('Video play error:', err);
    });
    
    // Ensure video keeps playing even if it tries to pause
    // Video MUST always play when in PiP to keep the window open
    const handleVideoPause = () => {
      // Always resume video when in PiP, regardless of audio state
      if (isInPip) {
        setTimeout(() => {
          if (video.paused) {
            video.play().catch(() => {});
          }
        }, 10);
      }
    };
    
    video.addEventListener('pause', handleVideoPause);
    
    // Also check periodically to ensure video is playing
    const playCheckInterval = setInterval(() => {
      if (isInPip && video.paused) {
        video.play().catch(() => {});
      }
    }, 200);

    return () => {
      video.removeEventListener('pause', handleVideoPause);
      if (video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
      }
    };
  }, [isOpen, isInPip]);

  // Setup Media Session API for PiP controls
  useEffect(() => {
    if (!isOpen || !currentTrack) return;

    if ('mediaSession' in navigator) {
      const mediaSession = navigator.mediaSession;

      // Set metadata
      mediaSession.metadata = new (window as any).MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.author,
        artwork: [
          {
            src: api.getTrackCoverUrl(currentTrack.id, 512),
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      // Set action handlers for PiP window controls
      mediaSession.setActionHandler('play', () => {
        togglePlayPause();
      });

      mediaSession.setActionHandler('pause', () => {
        togglePlayPause();
      });

      mediaSession.setActionHandler('previoustrack', () => {
        previousTrack();
      });

      mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });

      // Update playback state
      mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }

    return () => {
      if ('mediaSession' in navigator) {
        const mediaSession = navigator.mediaSession;
        mediaSession.metadata = null;
        mediaSession.setActionHandler('play', null);
        mediaSession.setActionHandler('pause', null);
        mediaSession.setActionHandler('previoustrack', null);
        mediaSession.setActionHandler('nexttrack', null);
      }
    };
  }, [isOpen, currentTrack, isPlaying, togglePlayPause, nextTrack, previousTrack]);

  // Handle Picture-in-Picture
  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    const video = videoRef.current;

    const enterPip = async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        }

        if (document.pictureInPictureEnabled && video.requestPictureInPicture) {
          await video.requestPictureInPicture();
          setIsInPip(true);
          console.log('✅ Picture-in-Picture activé');
        } else {
          console.warn('⚠️ Picture-in-Picture non supporté par ce navigateur');
          onClose();
        }
      } catch (error: any) {
        console.error('Erreur lors de l\'activation du PiP:', error);
        if (error.name !== 'NotAllowedError') {
          onClose();
        }
      }
    };

    // Small delay to ensure video is ready
    const timeoutId = setTimeout(() => {
      enterPip();
    }, 500);

    const handlePipChange = () => {
      if (!document.pictureInPictureElement) {
        setIsInPip(false);
        onClose();
      }
    };

    video.addEventListener('enterpictureinpicture', () => setIsInPip(true));
    video.addEventListener('leavepictureinpicture', handlePipChange);
    document.addEventListener('leavepictureinpicture', handlePipChange);

    return () => {
      clearTimeout(timeoutId);
      video.removeEventListener('enterpictureinpicture', handlePipEnter);
      video.removeEventListener('leavepictureinpicture', handlePipLeave);
      document.removeEventListener('leavepictureinpicture', handlePipLeave);
      
      // Exit PiP when component unmounts
      if (document.pictureInPictureElement === video) {
        document.exitPictureInPicture().catch(() => {});
      }
    };
  }, [isOpen, onClose]);

  // Keep video playing in PiP (video should always play to keep PiP window open)
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Video should always play when in PiP to keep the window open
    // The audio playback state is independent
    if (video.paused && isInPip) {
      video.play().catch(err => {
        console.log('Video play error (expected in some cases):', err);
      });
    }
  }, [isInPip]);

  if (!isOpen || !currentTrack) return null;

  return (
    <>
      {/* Hidden video element for PiP */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        playsInline
        muted
      />
      {/* Hidden canvas for rendering PiP content */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </>
  );
};
