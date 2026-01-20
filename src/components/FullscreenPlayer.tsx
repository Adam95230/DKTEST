import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import { parseLRC, getCurrentLyricIndex, type LyricLine } from '../utils/lrcParser';
import './FullscreenPlayer.css';

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Gap {
  start: number;
  end: number;
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({ isOpen, onClose }) => {
  const { currentTrack, isPlaying, audioRef, togglePlayPause, seek, nextTrack, previousTrack } = usePlayer();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const currentLyricRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && currentTrack) {
      loadLyrics();
    }
  }, [isOpen, currentTrack]);

  // Handle fullscreen API
  useEffect(() => {
    if (!isOpen) return;

    let isRequestingFullscreen = false;
    let fullscreenRequestTimeout: NodeJS.Timeout | null = null;
    let activationStartTime = 0;
    let lastFullscreenState = false;
    let ignoreNextChange = false;

    // Handle fullscreen change events
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      const timeSinceActivation = Date.now() - activationStartTime;
      
      console.log('Fullscreen state changed:', isFullscreen, 'isRequesting:', isRequestingFullscreen, 'timeSinceActivation:', timeSinceActivation, 'lastState:', lastFullscreenState);
      
      // If we're ignoring the next change (during activation), just update state and return
      if (ignoreNextChange) {
        console.log('⏭️ Ignoring fullscreen change (during activation)');
        lastFullscreenState = isFullscreen;
        ignoreNextChange = false;
        if (isFullscreen) {
          // Fullscreen activated successfully
          console.log('✅ Fullscreen activated successfully');
          isRequestingFullscreen = false;
          activationStartTime = 0;
          if (fullscreenRequestTimeout) {
            clearTimeout(fullscreenRequestTimeout);
            fullscreenRequestTimeout = null;
          }
        }
        return;
      }
      
      // If we're requesting fullscreen or just activated (within 5 seconds), ignore exit events
      if (isRequestingFullscreen || (activationStartTime > 0 && timeSinceActivation < 5000)) {
        if (isFullscreen) {
          // Fullscreen activated successfully
          console.log('✅ Fullscreen activated successfully');
          isRequestingFullscreen = false;
          activationStartTime = 0;
          if (fullscreenRequestTimeout) {
            clearTimeout(fullscreenRequestTimeout);
            fullscreenRequestTimeout = null;
          }
        }
        lastFullscreenState = isFullscreen;
        return; // Don't close during activation or immediately after
      }
      
      // Only close if user explicitly exited fullscreen AND we were previously in fullscreen
      // This prevents closing when fullscreen fails to activate
      if (!isFullscreen && isOpen && lastFullscreenState === true) {
        console.log('User exited fullscreen, closing player');
        onClose();
      }
      
      lastFullscreenState = isFullscreen;
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Wait for ref to be attached and DOM to be ready, then wait 2 seconds before activating fullscreen
    const timeoutId = setTimeout(() => {
      const element = fullscreenRef.current;
      if (!element) {
        console.warn('⚠️ Fullscreen element not found - player will work in overlay mode');
        return;
      }

      // Wait 2 seconds after opening before requesting fullscreen to avoid conflicts
      console.log('⏳ Waiting 2 seconds before activating fullscreen API...');
      setTimeout(() => {
        // Request fullscreen
        const requestFullscreen = async () => {
          isRequestingFullscreen = true;
          activationStartTime = Date.now();
          ignoreNextChange = true; // Ignore the first change event (transition)
          
          console.log('🚀 Requesting fullscreen API...');
          
          // Set a timeout to clear the flag if fullscreen doesn't activate within 5 seconds
          fullscreenRequestTimeout = setTimeout(() => {
            console.warn('⚠️ Fullscreen activation timeout');
            isRequestingFullscreen = false;
            activationStartTime = 0;
            ignoreNextChange = false;
          }, 5000);
          
          try {
            // Check if fullscreen is allowed (might require user interaction)
            const isFullscreenAllowed = !document.fullscreenElement && 
                                       !(document as any).webkitFullscreenElement &&
                                       !(document as any).mozFullScreenElement &&
                                       !(document as any).msFullscreenElement;
            
            if (!isFullscreenAllowed) {
              console.log('ℹ️ Already in fullscreen or fullscreen not available');
              isRequestingFullscreen = false;
              activationStartTime = 0;
              ignoreNextChange = false;
              if (fullscreenRequestTimeout) {
                clearTimeout(fullscreenRequestTimeout);
                fullscreenRequestTimeout = null;
              }
              return;
            }
            
            if (element.requestFullscreen) {
              await element.requestFullscreen();
              console.log('✅ Fullscreen request sent (standard)');
            } else if ((element as any).webkitRequestFullscreen) {
              // Safari
              await (element as any).webkitRequestFullscreen();
              console.log('✅ Fullscreen request sent (webkit)');
            } else if ((element as any).webkitEnterFullscreen) {
              // iOS Safari
              await (element as any).webkitEnterFullscreen();
              console.log('✅ Fullscreen request sent (iOS webkit)');
            } else if ((element as any).mozRequestFullScreen) {
              // Firefox
              await (element as any).mozRequestFullScreen();
              console.log('✅ Fullscreen request sent (moz)');
            } else if ((element as any).msRequestFullscreen) {
              // IE/Edge
              await (element as any).msRequestFullscreen();
              console.log('✅ Fullscreen request sent (ms)');
            } else {
              console.warn('⚠️ Fullscreen API not supported - player will work in overlay mode');
              isRequestingFullscreen = false;
              activationStartTime = 0;
              ignoreNextChange = false;
              if (fullscreenRequestTimeout) {
                clearTimeout(fullscreenRequestTimeout);
                fullscreenRequestTimeout = null;
              }
            }
          } catch (error: any) {
            // Fullscreen might require user interaction on some browsers
            // This is not a critical error - the player will still work in overlay mode
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            
            // Don't log "Permissions check failed" as a warning, it's expected
            if (errorMessage.includes('Permissions check failed') || 
                errorMessage.includes('not allowed') ||
                errorMessage.includes('user gesture')) {
              console.log('ℹ️ Fullscreen requires user interaction - player will work in overlay mode');
            } else {
              console.warn('⚠️ Fullscreen request failed:', errorMessage);
              console.log('ℹ️ Player will work in overlay mode instead');
            }
            
            isRequestingFullscreen = false;
            activationStartTime = 0;
            ignoreNextChange = false;
            if (fullscreenRequestTimeout) {
              clearTimeout(fullscreenRequestTimeout);
              fullscreenRequestTimeout = null;
            }
          }
        };

        requestFullscreen();
      }, 2000); // Wait 2 seconds before activating fullscreen
    }, 200); // Wait 200ms for DOM to be ready

    return () => {
      clearTimeout(timeoutId);
      if (fullscreenRequestTimeout) {
        clearTimeout(fullscreenRequestTimeout);
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

      // Exit fullscreen when component unmounts
      const exitFullscreen = async () => {
        try {
          // Check if document is active and if we're actually in fullscreen
          const isFullscreen = !!(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement
          );
          
          if (!isFullscreen) {
            // Not in fullscreen, nothing to exit
            return;
          }
          
          // Check if document is active
          if (document.hidden || !document.hasFocus()) {
            // Document is not active, don't try to exit fullscreen
            return;
          }
          
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen();
          } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
          }
        } catch (error: any) {
          // Silently ignore errors when document is not active
          if (error?.name !== 'InvalidStateError' && error?.message !== 'Document not active') {
            console.log('Error exiting fullscreen:', error);
          }
        }
      };
      exitFullscreen();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const audio = audioRef.current;
    if (!audio) return;

    let animationFrameId: number;
    let lastUpdateTime = 0;
    const throttleMs = 16; // ~60fps

    const updateTime = () => {
      const now = performance.now();
      if (now - lastUpdateTime < throttleMs) {
        animationFrameId = requestAnimationFrame(updateTime);
        return;
      }
      lastUpdateTime = now;

      const time = audio.currentTime;
      setCurrentTime(time);
      
      if (lyrics.length > 0) {
        // Check if lyrics are synchronized (have time > 0)
        const isSynchronized = lyrics.some((l) => l.time > 0);
        if (isSynchronized) {
          const index = getCurrentLyricIndex(lyrics, time);
          setCurrentLyricIndex(index);
          
          // Update gaps when duration is available
          if (audio.duration > 0 && gaps.length === 0) {
            setGaps(detectGaps(lyrics, audio.duration));
          }
        } else {
          // Non-synchronized lyrics - show all
          setCurrentLyricIndex(-1);
        }
      }

      animationFrameId = requestAnimationFrame(updateTime);
    };

    // Start the animation loop
    animationFrameId = requestAnimationFrame(updateTime);

    const handleLoadedMetadata = () => {
      if (lyrics.length > 0 && audio.duration > 0) {
        setGaps(detectGaps(lyrics, audio.duration));
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isOpen, audioRef, lyrics, gaps.length]);

  // No auto-scroll needed - lyrics are centered

  // Detect gaps of 5+ seconds in lyrics based on LRC timestamps
  // A gap is detected when there's 5+ seconds between two consecutive lyrics
  const detectGaps = (lyrics: LyricLine[], duration: number): Gap[] => {
    const gaps: Gap[] = [];
    const synchronizedLyrics = lyrics.filter(l => l.time > 0).sort((a, b) => a.time - b.time);
    
    if (synchronizedLyrics.length === 0) return gaps;
    
    // Check gap at the beginning (before first lyric)
    const firstLyric = synchronizedLyrics[0];
    if (firstLyric.time >= 5) {
      gaps.push({ start: 0, end: firstLyric.time });
    }
    
    // Check gaps between lyrics
    // If there's 5+ seconds between two lyrics, create a gap
    for (let i = 1; i < synchronizedLyrics.length; i++) {
      const prevLyric = synchronizedLyrics[i - 1];
      const currentLyric = synchronizedLyrics[i];
      const gapDuration = currentLyric.time - prevLyric.time;
      
      // If there's a gap of 5+ seconds between timestamps, create a gap
      if (gapDuration >= 5) {
        // Gap starts at the previous lyric's timestamp and ends at the current lyric's timestamp
        gaps.push({ start: prevLyric.time, end: currentLyric.time });
      }
    }
    
    // Check gap at the end (after last lyric)
    const lastLyric = synchronizedLyrics[synchronizedLyrics.length - 1];
    if (duration > 0 && (duration - lastLyric.time) >= 5) {
      gaps.push({ start: lastLyric.time, end: duration });
    }
    
    return gaps;
  };

  const loadLyrics = async () => {
    if (!currentTrack) return;
    
    setLoadingLyrics(true);
    setLyrics([]);
    setCurrentLyricIndex(-1);
    setGaps([]);
    
    try {
      const lyricsData = await api.getTrackLyrics(currentTrack.id);
      if (lyricsData) {
        const parsed = parseLRC(lyricsData);
        setLyrics(parsed);
        
        // Detect gaps after lyrics are loaded
        // We'll update gaps when duration is available
        if (audioRef.current) {
          audioRef.current.addEventListener('loadedmetadata', () => {
            const duration = audioRef.current?.duration || 0;
            if (duration > 0) {
              setGaps(detectGaps(parsed, duration));
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading lyrics:', error);
    } finally {
      setLoadingLyrics(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    seek(newTime);
  };

  if (!isOpen || !currentTrack) return null;

  const duration = audioRef.current?.duration || 0;

  const handleClose = async () => {
    // Exit fullscreen first
    try {
      // Check if we're actually in fullscreen
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      if (isFullscreen) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error: any) {
      // Silently ignore errors when document is not active
      if (error?.name !== 'InvalidStateError' && error?.message !== 'Document not active') {
        console.log('Error exiting fullscreen:', error);
      }
    }
    onClose();
  };

  return (
    <div className="fullscreen-player" ref={fullscreenRef}>
      {/* Blurred background album cover */}
      <div className="fullscreen-background-cover">
        <img
          src={api.getTrackCoverUrl(currentTrack.id, 1200)}
          alt={currentTrack.title}
          className="background-cover-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><rect fill="%23333" width="1200" height="1200"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23999" font-size="200">♪</text></svg>';
          }}
        />
        <div className="background-cover-overlay"></div>
      </div>
      
      <div className="fullscreen-header">
        <button className="close-button" onClick={handleClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="fullscreen-content">
        {/* Left side - Album cover and metadata */}
        <div className="fullscreen-left">
          <div className="album-cover-container">
            <div className="album-cover-wrapper">
              <img
                src={api.getTrackCoverUrl(currentTrack.id, 800)}
                alt={currentTrack.title}
                className="album-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect fill="%23333" width="800" height="800"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23999" font-size="120">♪</text></svg>';
                }}
              />
            </div>
          </div>
          
          <div className="track-metadata">
            <h1 className="track-title">{currentTrack.title}</h1>
            <p className="track-artist">{currentTrack.author}</p>
          </div>

          <div className="progress-container-fullscreen">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar-fullscreen"
            />
            <div className="progress-time-labels">
              <span className="progress-time-current">{formatDuration(Math.floor(currentTime))}</span>
              <span className="progress-time-total">{formatDuration(Math.floor(duration))}</span>
            </div>
          </div>

          <div className="fullscreen-controls">
            <button className="control-btn" onClick={previousTrack}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button className="play-pause-btn-large" onClick={togglePlayPause}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                {isPlaying ? (
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
            </button>
            <button className="control-btn" onClick={nextTrack}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right side - Lyrics */}
        <div className="fullscreen-right">
          <div className="lyrics-container" ref={lyricsContainerRef}>
            {loadingLyrics ? (
              <div className="lyrics-loading-fullscreen">Chargement des paroles...</div>
            ) : lyrics.length === 0 ? (
              <div className="lyrics-empty-fullscreen">Aucune parole disponible pour ce morceau</div>
            ) : (
              <div className={`lyrics-list ${lyrics.length > 0 && lyrics.every((l) => l.time === 0) ? 'non-synced' : ''}`}>
                {(() => {
                  const isSynchronized = lyrics.some((l) => l.time > 0);
                  
                  // Get synchronized lyrics sorted by time
                  const synchronizedLyrics = lyrics.filter(l => l.time > 0).sort((a, b) => a.time - b.time);
                  
                  // Check if we have an active lyric
                  const hasActiveLyric = currentLyricIndex >= 0;
                  
                  // Find the next lyric time after the current active one
                  const getNextLyricTime = () => {
                    if (!hasActiveLyric || synchronizedLyrics.length === 0) return null;
                    const currentLyric = lyrics[currentLyricIndex];
                    if (!currentLyric || currentLyric.time === 0) return null;
                    const currentIndex = synchronizedLyrics.findIndex(l => l.time === currentLyric.time);
                    if (currentIndex >= 0 && currentIndex < synchronizedLyrics.length - 1) {
                      return synchronizedLyrics[currentIndex + 1].time;
                    }
                    return null;
                  };
                  
                  const nextLyricTime = getNextLyricTime();
                  
                  // A lyric is active from its start time until the next lyric starts
                  const activeLyric = hasActiveLyric ? lyrics[currentLyricIndex] : null;
                  const isLyricStillActive = activeLyric && 
                    (nextLyricTime === null || currentTime < nextLyricTime);
                  
                  // Determine which 3 lyrics to show: past, current, future
                  let pastLyric: LyricLine | null = null;
                  let currentLyricDisplay: LyricLine | null = null;
                  let futureLyric: LyricLine | null = null;
                  
                  if (!isSynchronized) {
                    // Non-synchronized lyrics: show first 3
                    if (lyrics.length > 0) {
                      currentLyricDisplay = lyrics[0];
                    }
                    if (lyrics.length > 1) {
                      futureLyric = lyrics[1];
                    }
                  } else if (hasActiveLyric && currentLyricIndex >= 0) {
                    // We have an active lyric - it stays active until the next one starts
                    currentLyricDisplay = lyrics[currentLyricIndex];
                    
                    // Get previous lyric (always show it if it exists)
                    if (currentLyricIndex > 0) {
                      pastLyric = lyrics[currentLyricIndex - 1];
                    }
                    
                    // Get next lyric
                    if (currentLyricIndex < lyrics.length - 1) {
                      futureLyric = lyrics[currentLyricIndex + 1];
                    }
                  } else if (synchronizedLyrics.length > 0) {
                    // No active lyric yet, show first one as future
                    if (currentTime < synchronizedLyrics[0].time) {
                      futureLyric = lyrics.find(l => l.time === synchronizedLyrics[0].time) || null;
                    } else {
                      // Find the last lyric that has passed
                      for (let i = synchronizedLyrics.length - 1; i >= 0; i--) {
                        if (currentTime >= synchronizedLyrics[i].time) {
                          const foundIndex = lyrics.findIndex(l => l.time === synchronizedLyrics[i].time);
                          if (foundIndex >= 0) {
                            pastLyric = lyrics[foundIndex];
                            if (foundIndex < lyrics.length - 1) {
                              currentLyricDisplay = lyrics[foundIndex + 1];
                            }
                            if (foundIndex + 2 < lyrics.length) {
                              futureLyric = lyrics[foundIndex + 2];
                            }
                          }
                          break;
                        }
                      }
                    }
                  }
                  
                  // Check if we're in a gap
                  // IMPORTANT: A lyric is active from its timestamp until the next lyric starts
                  // We're in a gap only if we're between two lyrics with 5+ seconds between them
                  // AND we're past the current lyric's display period
                  let currentGap: Gap | undefined = undefined;
                  let isInGap = false;
                  
                  if (hasActiveLyric && currentLyricDisplay && futureLyric) {
                    const currentLyricTime = currentLyricDisplay.time;
                    const nextLyricTime = futureLyric.time;
                    
                    // A lyric is typically displayed for about 3-4 seconds, then if there's still time
                    // before the next lyric and there's a gap, we show dots
                    const timeSinceCurrent = currentTime - currentLyricTime;
                    const timeUntilNext = nextLyricTime - currentTime;
                    
                    // Check if there's a gap between current and next lyric
                    for (const gap of gaps) {
                      // Gap should be between current and next lyric
                      if (gap.start >= currentLyricTime && gap.end <= nextLyricTime) {
                        // We're in a gap if:
                        // 1. We're past the current lyric's display period (at least 3 seconds)
                        // 2. We're before the next lyric starts
                        // 3. We're actually in the gap period
                        // 4. We're not too close to the next lyric (0.5s buffer)
                        if (timeSinceCurrent >= 3 && timeUntilNext >= 0.5 && 
                            currentTime >= gap.start && currentTime < gap.end) {
                          // We're in a gap - show dots instead of current lyric
                          currentGap = gap;
                          isInGap = true;
                          // Hide current lyric when in gap
                          currentLyricDisplay = null;
                          break;
                        }
                      }
                    }
                  } else if (!hasActiveLyric) {
                    // No active lyric - check if we're in any gap
                    for (const gap of gaps) {
                      if (currentTime >= gap.start && currentTime < gap.end) {
                        // Check if we're very close to any lyric timestamp (within 0.5s)
                        const isNearLyricTimestamp = synchronizedLyrics.some(lyric => 
                          Math.abs(currentTime - lyric.time) < 0.5
                        );
                        
                        if (!isNearLyricTimestamp) {
                          currentGap = gap;
                          isInGap = true;
                          break;
                        }
                      }
                    }
                  }
                  
                  return (
                    <>
                      {/* Show only 3 lines: past, current, future */}
                      {/* Always show past lyric if it exists */}
                      {pastLyric && (
                        <div
                          key={`past-${pastLyric.time}`}
                          className="lyric-line past"
                          onClick={() => isSynchronized && pastLyric && pastLyric.time > 0 && seek(pastLyric.time)}
                        >
                          {pastLyric.text}
                        </div>
                      )}
                      
                      {/* Show gap dots in the middle position if we're in a gap */}
                      {isInGap && currentGap && (
                        <div 
                          key={`gap-${currentGap.start}-${currentGap.end}`}
                          className={`lyric-gap-dots ${currentGap.end && synchronizedLyrics.length > 0 && synchronizedLyrics.some(l => Math.abs(currentTime - l.time) < 0.5) ? 'exiting' : ''}`}
                        >
                          <span className="gap-dot"></span>
                          <span className="gap-dot"></span>
                          <span className="gap-dot"></span>
                        </div>
                      )}
                      
                      {/* Show current lyric if not in gap */}
                      {currentLyricDisplay && !isInGap && (
                        <div
                          key={`active-${currentLyricDisplay.time}`}
                          ref={currentLyricRef}
                          className="lyric-line active"
                          onClick={() => isSynchronized && currentLyricDisplay && currentLyricDisplay.time > 0 && seek(currentLyricDisplay.time)}
                        >
                          {currentLyricDisplay.text}
                        </div>
                      )}
                      
                      {futureLyric && (
                        <div
                          key={`future-${futureLyric.time}`}
                          className="lyric-line"
                          onClick={() => isSynchronized && futureLyric && futureLyric.time > 0 && seek(futureLyric.time)}
                        >
                          {futureLyric.text}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

