import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';

const EnhancedVideoPlayer = ({ src, poster, onTimeUpdate, onEnded, videoId, courseId, className = '' }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSkipAnimation, setShowSkipAnimation] = useState({ forward: false, backward: false });
  const [lastTap, setLastTap] = useState(0);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const controlsTimeoutRef = useRef(null);
  const previewVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastSavedTime = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      // Setup canvas for preview
      if (canvasRef.current) {
        canvasRef.current.width = 160;
        canvasRef.current.height = 90;
      }
    };
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
      
      // Auto-save progress every 5 seconds (reduced frequency)
      if (videoId && courseId && video.currentTime > 0 && Math.floor(video.currentTime) % 5 === 0) {
        const currentSecond = Math.floor(video.currentTime);
        if (currentSecond !== lastSavedTime.current) {
          lastSavedTime.current = currentSecond;
          saveVideoProgress(video.currentTime, video.duration);
        }
      }
    };
    const handlePlay = () => {
      setIsPlaying(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      // Save final progress when video ends
      if (videoId && courseId) {
        saveVideoProgress(video.duration, video.duration);
      }
      // Small delay before auto-advance
      setTimeout(() => {
        onEnded?.();
      }, 1000);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onEnded]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const video = videoRef.current;
      if (!video) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          video.muted = !video.muted;
          setIsMuted(video.muted);
          break;
        case 'KeyF':
          e.preventDefault();
          const container = containerRef.current;
          if (!container) return;
          if (!document.fullscreenElement) {
            container.requestFullscreen();
            setIsFullscreen(true);
          } else {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Listen for jump to time events
  useEffect(() => {
    const handleJumpToTime = (event) => {
      const { timestamp } = event.detail;
      const video = videoRef.current;
      if (video && timestamp !== undefined) {
        video.currentTime = timestamp;
        setShowControls(true);
      }
    };

    window.addEventListener('jumpToTime', handleJumpToTime);
    return () => window.removeEventListener('jumpToTime', handleJumpToTime);
  }, []);

  // Volume control
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
    setShowSkipAnimation(prev => ({ ...prev, forward: true }));
    setTimeout(() => setShowSkipAnimation(prev => ({ ...prev, forward: false })), 500);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.max(0, video.currentTime - 10);
    setShowSkipAnimation(prev => ({ ...prev, backward: true }));
    setTimeout(() => setShowSkipAnimation(prev => ({ ...prev, backward: false })), 500);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleProgressClick = (e) => {
    const video = videoRef.current;
    const progressBar = e.currentTarget;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    video.currentTime = newTime;
  };

  const handleProgressHover = async (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const hoverTimeValue = (hoverX / rect.width) * duration;
    
    setHoverTime(hoverTimeValue);
    setHoverPosition(hoverX);
    
    // Generate preview thumbnail
    if (canvasRef.current && previewVideoRef.current) {
      const previewVideo = previewVideoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      previewVideo.currentTime = hoverTimeValue;
      
      // Wait for the video to seek to the correct time
      previewVideo.onseeked = () => {
        try {
          ctx.drawImage(previewVideo, 0, 0, canvas.width, canvas.height);
          setPreviewImage(canvas.toDataURL());
        } catch (error) {
          console.warn('Could not generate preview:', error);
        }
      };
    }
  };

  const handleProgressLeave = () => {
    setHoverTime(null);
    setPreviewImage(null);
  };

  const handleVideoClick = (e) => {
    const now = Date.now();
    const timeDiff = now - lastTap;
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Double click - skip forward/backward
      const rect = videoRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const centerX = rect.width / 2;
      
      if (clickX < centerX) {
        skipBackward();
      } else {
        skipForward();
      }
    } else {
      // Single click - toggle play/pause
      setTimeout(() => {
        if (Date.now() - lastTap >= 300) {
          togglePlay();
        }
      }, 300);
    }
    setLastTap(now);
  };

  const saveVideoProgress = async (watchTime, duration) => {
    if (!videoId || !courseId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const percentage = duration > 0 ? (watchTime / duration) * 100 : 0;
      console.log(`Saving progress: ${percentage.toFixed(1)}% (${Math.floor(watchTime)}/${Math.floor(duration)}s)`);
      
      const response = await fetch('http://localhost:5000/api/enrollments/video-progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId,
          courseId,
          watchTime: Math.floor(watchTime),
          duration: Math.floor(duration)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.completed) {
          console.log('Video marked as completed!');
          window.dispatchEvent(new CustomEvent('videoCompleted', { detail: { videoId } }));
        }
      }
    } catch (error) {
      // Silent fail
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full cursor-pointer"
        onClick={handleVideoClick}
        onContextMenu={(e) => e.preventDefault()}
        preload="metadata"
        playsInline
        controlsList="nodownload"
      />
      
      {/* Hidden preview video and canvas for thumbnail generation */}
      <video
        ref={previewVideoRef}
        src={src}
        className="hidden"
        muted
        preload="none"
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Skip Animations */}
      {showSkipAnimation.backward && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 rounded-full p-3 animate-pulse">
          <SkipBack className="w-8 h-8 text-white" />
          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm">-10s</span>
        </div>
      )}
      
      {showSkipAnimation.forward && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 rounded-full p-3 animate-pulse">
          <SkipForward className="w-8 h-8 text-white" />
          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm">+10s</span>
        </div>
      )}

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Bar */}
        <div className="relative mb-4">
          {/* Timeline Preview Tooltip */}
          {hoverTime !== null && (
            <div 
              className="absolute bottom-4 transform -translate-x-1/2 bg-black bg-opacity-90 rounded p-2 pointer-events-none z-10"
              style={{ left: `${Math.max(80, Math.min(hoverPosition, window.innerWidth - 80))}px` }}
            >
              <div className="text-white text-xs mb-1 text-center">
                {formatTime(hoverTime)}
              </div>
              <div className="w-32 h-18 bg-gray-800 rounded overflow-hidden">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs">
                    Loading...
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div 
            className="w-full h-2 bg-gray-600 rounded-full cursor-pointer hover:h-3 transition-all duration-200"
            onClick={handleProgressClick}
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressLeave}
          >
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            
            <button onClick={skipBackward} className="text-white hover:text-blue-400 transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            
            <button onClick={skipForward} className="text-white hover:text-blue-400 transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black bg-opacity-70 text-white text-xs p-2 rounded">
          <div>Space: Play/Pause</div>
          <div>←/→: Skip 10s</div>
          <div>↑/↓: Volume</div>
          <div>M: Mute</div>
          <div>F: Fullscreen</div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoPlayer;