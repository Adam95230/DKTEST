import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import type { TrackInfo, PlayerState } from '../types';
import { api } from '../services/api';
import { fileStorage } from '../services/fileStorage';
import { useAuth } from './AuthContext';

interface PlayerContextType {
  playerState: PlayerState;
  audioRef: React.RefObject<HTMLAudioElement>;
  playTrack: (trackId: string) => Promise<void>;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  addToQueue: (trackId: string) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  currentTrack: TrackInfo | null;
  isPlaying: boolean;
  volume: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    volume: 1,
    queue: [],
    currentIndex: -1,
  });
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none');
  const [originalQueue, setOriginalQueue] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Load user preferences when user changes
  useEffect(() => {
    if (currentUser?.preferences) {
      const prefs = currentUser.preferences;
      setShuffle(prefs.shuffle || false);
      setRepeat(prefs.repeat || 'none');
      if (audioRef.current) {
        audioRef.current.volume = prefs.volume || 1;
      }
      setPlayerState((prev) => ({ ...prev, volume: prefs.volume || 1 }));
    }
  }, [currentUser]);

  // Listen for preference updates from SettingsModal
  useEffect(() => {
    const handlePreferencesUpdate = (event: CustomEvent) => {
      const prefs = event.detail;
      if (prefs.shuffle !== undefined) setShuffle(prefs.shuffle);
      if (prefs.repeat !== undefined) setRepeat(prefs.repeat);
      if (prefs.volume !== undefined) {
        if (audioRef.current) {
          audioRef.current.volume = prefs.volume;
        }
        setPlayerState((prev) => ({ ...prev, volume: prefs.volume }));
      }
    };

    window.addEventListener('preferencesUpdated', handlePreferencesUpdate as EventListener);
    return () => window.removeEventListener('preferencesUpdated', handlePreferencesUpdate as EventListener);
  }, []);

  const playTrack = useCallback(async (trackId: string) => {
    try {
      console.log('Playing track:', trackId);
      
      // Force API URL reload to ensure we have the latest configured URL
      const isMobile = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      if (isMobile) {
        // Clear cache on mobile to force reload of configured URL
        console.log('Mobile detected, forcing API URL reload');
        window.dispatchEvent(new CustomEvent('preferencesUpdated'));
        // Wait a bit for cache to clear
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Preload track info and prepare stream URL in parallel
      const [track, streamUrl] = await Promise.all([
        api.getTrack(trackId),
        api.getTrackStreamUrl(trackId)
      ]);
      
      console.log('Track loaded:', track.title);
      console.log('Stream URL:', streamUrl);
      
      setPlayerState((prev) => {
        const currentIndex = prev.queue.findIndex((id) => id === trackId);
        return {
          ...prev,
          currentTrack: track,
          isPlaying: true,
          currentTime: 0,
          currentIndex: currentIndex >= 0 ? currentIndex : prev.currentIndex,
        };
      });
      
      if (audioRef.current) {
        // Remove old error listeners
        const oldAudio = audioRef.current;
        const newErrorHandler = (e: Event) => {
          console.error('Audio error:', e);
          const audio = e.target as HTMLAudioElement;
          if (audio.error) {
            console.error('Audio error code:', audio.error.code);
            console.error('Audio error message:', audio.error.message);
            console.error('Audio networkState:', audio.networkState);
            console.error('Audio readyState:', audio.readyState);
          }
        };
        
        // Remove previous error handler if any
        oldAudio.removeEventListener('error', newErrorHandler);
        oldAudio.addEventListener('error', newErrorHandler);
        
        // Also listen for canplay event
        const handleCanPlay = () => {
          console.log('Audio can play, readyState:', oldAudio.readyState);
        };
        oldAudio.addEventListener('canplay', handleCanPlay);
        
        // Listen for pause events (to detect automatic pauses)
        const handlePause = () => {
          console.log('Audio paused, currentTime:', oldAudio.currentTime);
          console.log('Audio paused, networkState:', oldAudio.networkState);
          console.log('Audio paused, readyState:', oldAudio.readyState);
          const isMobile = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
          
          if (oldAudio.error) {
            console.error('Audio error on pause:', oldAudio.error);
            console.error('Audio error code:', oldAudio.error.code);
            // MEDIA_ERR_NETWORK = 2, MEDIA_ERR_SRC_NOT_SUPPORTED = 4
            if (oldAudio.error.code === 2 || oldAudio.error.code === 4) {
              if (isMobile && (streamUrl.includes('localhost') || streamUrl.includes('127.0.0.1'))) {
                console.error('Network error: localhost URL not accessible on mobile');
                setPlayerState((prev) => ({
                  ...prev,
                  isPlaying: false,
                }));
                return;
              }
            }
          }
          
          // Check if we're still supposed to be playing
          setPlayerState((prev) => {
            if (prev.isPlaying && prev.currentTrack?.id === trackId) {
              console.warn('Audio paused but should be playing');
              // Don't auto-resume on mobile if there's a network error
              if (!isMobile || (!oldAudio.error || oldAudio.error.code !== 2)) {
                // Try to resume after a short delay (only if no network error)
                setTimeout(() => {
                  if (audioRef.current && !audioRef.current.paused) {
                    // Already playing, ignore
                  } else if (audioRef.current && !audioRef.current.error) {
                    audioRef.current.play().catch(err => {
                      console.error('Failed to resume playback:', err);
                    });
                  }
                }, 100);
              } else {
                // On mobile with network error, update state to reflect pause
                return { ...prev, isPlaying: false };
              }
            }
            return prev;
          });
        };
        oldAudio.addEventListener('pause', handlePause);
        
        // Listen for stalled events (network issues)
        const handleStalled = () => {
          console.warn('Audio stalled, networkState:', oldAudio.networkState);
        };
        oldAudio.addEventListener('stalled', handleStalled);
        
        // Listen for waiting events (buffering)
        const handleWaiting = () => {
          console.log('Audio waiting (buffering)');
        };
        oldAudio.addEventListener('waiting', handleWaiting);
        
        // Check if URL is localhost on mobile (which won't work)
        const isMobile = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        if (streamUrl.includes('localhost') || streamUrl.includes('127.0.0.1')) {
          if (isMobile) {
            console.error('❌ ERROR: Using localhost URL on mobile device! This will not work.');
            console.error('Please configure the API URL in settings with your PC IP address.');
            console.error('Example: http://192.168.1.100:8631');
            alert('⚠️ Erreur: L\'URL de l\'API est configurée sur localhost, ce qui ne fonctionne pas sur mobile.\n\nVeuillez configurer l\'URL de l\'API Docker dans les paramètres avec l\'adresse IP de votre PC.\n\nExemple: http://192.168.1.100:8631');
            setPlayerState((prev) => ({
              ...prev,
              isPlaying: false,
            }));
            return;
          }
        }
        
        console.log('Setting audio source:', streamUrl);
        oldAudio.src = streamUrl;
        oldAudio.crossOrigin = 'anonymous';
        oldAudio.load();
        
        // Don't wait for play to complete - start async
        oldAudio.play().then(() => {
          console.log('Audio playback started successfully');
        }).catch(error => {
          console.error('Error playing audio:', error);
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Stream URL was:', streamUrl);
          // On mobile, sometimes we need user interaction
          if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
            console.warn('Audio playback requires user interaction on mobile');
            // Update state to show error
            setPlayerState((prev) => ({
              ...prev,
              isPlaying: false,
            }));
          }
        });
      } else {
        console.error('Audio ref is null');
      }
      
      // Save to recent tracks in user account (async, don't wait)
      if (currentUser) {
        fileStorage.addRecentTrack(currentUser.id, trackId).catch(error => {
          console.error('Error saving recent track:', error);
        });
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }, [currentUser]);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (playerState.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlayerState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  }, [playerState.isPlaying]);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setPlayerState((prev) => ({ ...prev, volume }));
      // Update user preferences
      if (currentUser) {
        fileStorage.updateUser({
          ...currentUser,
          preferences: { ...currentUser.preferences, volume },
        }).catch(console.error);
      }
    }
  }, [currentUser]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState((prev) => ({ ...prev, currentTime: time }));
    }
  }, []);

  const nextTrack = useCallback(async () => {
    setPlayerState((prev) => {
      if (prev.queue.length === 0) return prev;
      
      let nextIndex: number;
      let nextTrackId: string;
      
      if (shuffle) {
        // Random track from queue
        const availableTracks = prev.queue.filter((_, idx) => idx !== prev.currentIndex);
        if (availableTracks.length === 0) {
          // If only one track and repeat is all, play it again
          if (repeat === 'all') {
            nextTrackId = prev.queue[prev.currentIndex];
            nextIndex = prev.currentIndex;
          } else {
            return prev;
          }
        } else {
          nextTrackId = availableTracks[Math.floor(Math.random() * availableTracks.length)];
          nextIndex = prev.queue.indexOf(nextTrackId);
        }
      } else {
        if (prev.currentIndex < prev.queue.length - 1) {
          nextIndex = prev.currentIndex + 1;
          nextTrackId = prev.queue[nextIndex];
        } else if (repeat === 'all') {
          // Loop to beginning
          nextIndex = 0;
          nextTrackId = prev.queue[0];
        } else {
          return prev;
        }
      }
      
      playTrack(nextTrackId);
      return { ...prev, currentIndex: nextIndex };
    });
  }, [playTrack, shuffle, repeat]);

  const previousTrack = useCallback(async () => {
    setPlayerState((prev) => {
      if (prev.currentIndex > 0) {
        const prevIndex = prev.currentIndex - 1;
        const prevTrackId = prev.queue[prevIndex];
        playTrack(prevTrackId);
        return { ...prev, currentIndex: prevIndex };
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return prev;
    });
  }, [playTrack]);

  const addToQueue = useCallback((trackId: string) => {
    setPlayerState((prev) => {
      const newQueue = [...prev.queue, trackId];
      if (originalQueue.length === 0) {
        setOriginalQueue(newQueue);
      }
      return {
        ...prev,
        queue: newQueue,
      };
    });
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setPlayerState((prev) => {
      const newQueue = prev.queue.filter(id => id !== trackId);
      const trackIndex = prev.queue.indexOf(trackId);
      let newIndex = prev.currentIndex;
      
      if (trackIndex < prev.currentIndex) {
        newIndex = prev.currentIndex - 1;
      } else if (trackIndex === prev.currentIndex && newQueue.length > 0) {
        // If removing current track, play next one
        if (newIndex >= newQueue.length) {
          newIndex = newQueue.length - 1;
        }
        if (newIndex >= 0) {
          playTrack(newQueue[newIndex]);
        }
      }
      
      return {
        ...prev,
        queue: newQueue,
        currentIndex: newIndex,
      };
    });
  }, [playTrack]);

  const clearQueue = useCallback(() => {
    setPlayerState((prev) => ({
      ...prev,
      queue: [],
      currentIndex: -1,
    }));
    setOriginalQueue([]);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      const newShuffle = !prev;
      // Update user preferences
      if (currentUser) {
        fileStorage.updateUser({
          ...currentUser,
          preferences: { ...currentUser.preferences, shuffle: newShuffle },
        }).catch(console.error);
      }
      return newShuffle;
    });
  }, [currentUser]);

  const toggleRepeat = useCallback(() => {
    setRepeat(prev => {
      let newRepeat: 'none' | 'one' | 'all';
      if (prev === 'none') newRepeat = 'all';
      else if (prev === 'all') newRepeat = 'one';
      else newRepeat = 'none';
      
      // Update user preferences
      if (currentUser) {
        fileStorage.updateUser({
          ...currentUser,
          preferences: { ...currentUser.preferences, repeat: newRepeat },
        }).catch(console.error);
      }
      return newRepeat;
    });
  }, [currentUser]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setPlayerState((prev) => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleEnded = async () => {
      if (repeat === 'one') {
        // Repeat current track
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      } else {
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));
        await nextTrack();
      }
    };

    const handlePlay = () => {
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [playerState.currentTrack, nextTrack, repeat]);

  return (
    <PlayerContext.Provider
      value={{
        playerState,
        audioRef,
        playTrack,
        togglePlayPause,
        setVolume,
        seek,
        nextTrack,
        previousTrack,
        addToQueue,
        removeFromQueue,
        clearQueue,
        toggleShuffle,
        toggleRepeat,
        currentTrack: playerState.currentTrack,
        isPlaying: playerState.isPlaying,
        volume: playerState.volume,
        shuffle,
        repeat,
      }}
    >
      {children}
      <audio 
        ref={audioRef} 
        volume={playerState.volume}
        crossOrigin="anonymous"
        preload="metadata"
        playsInline
        {...({ 'webkit-playsinline': 'true' } as any)}
      />
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

