import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';

const VideoThumbnail = ({ 
  videoUrl, 
  thumbnailUrl, 
  alt = 'Video thumbnail',
  className = '',
  showPlayIcon = true,
  onClick
}) => {
  const [generatedThumbnail, setGeneratedThumbnail] = useState(null);
  const [error, setError] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const generateThumbnailFromVideo = () => {
    if (!videoRef.current || !canvasRef.current || !videoUrl) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const handleLoadedData = () => {
      video.currentTime = Math.min(2, video.duration * 0.1); // 2 seconds or 10% of video
    };

    const handleSeeked = () => {
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setGeneratedThumbnail(thumbnailDataUrl);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.load();
  };

  useEffect(() => {
    if (!thumbnailUrl && videoUrl && !generatedThumbnail && !error) {
      generateThumbnailFromVideo();
    }
  }, [videoUrl, thumbnailUrl, generatedThumbnail, error]);

  const handleImageError = () => {
    setError(true);
    if (!generatedThumbnail && videoUrl) {
      generateThumbnailFromVideo();
    }
  };

  const displayThumbnail = thumbnailUrl && !error 
    ? `http://localhost:5000${thumbnailUrl}` 
    : generatedThumbnail;

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {/* Custom or generated thumbnail */}
      {displayThumbnail ? (
        <img
          src={displayThumbnail}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          <Play className="w-8 h-8 text-gray-400" />
        </div>
      )}

      {/* Hidden video for thumbnail generation */}
      {!thumbnailUrl && videoUrl && !generatedThumbnail && (
        <>
          <video
            ref={videoRef}
            src={`http://localhost:5000${videoUrl}`}
            className="hidden"
            muted
            preload="metadata"
            crossOrigin="anonymous"
            onError={() => setError(true)}
          />
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}

      {/* Play icon overlay */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all">
          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 hover:scale-110 transition-all">
            <Play className="w-6 h-6 text-gray-800 ml-1" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoThumbnail;