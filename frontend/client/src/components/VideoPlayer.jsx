import { useCallback, useEffect, useRef, useState } from "react";

export default function VideoPlayer({ 
  videoUrl, 
  lessonTitle, 
  onVideoEnd, 
  onClose,
  autoPlay = false 
}) {
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  const isYouTube = videoUrl && (videoUrl.toLowerCase().includes('youtube.com') || videoUrl.toLowerCase().includes('youtu.be'));

  const getYouTubeEmbedUrl = (url) => {
    let videoId = null;
    try {
      let urlToParse = url;
      if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
        urlToParse = 'https://' + urlToParse;
      }
      const parsedUrl = new URL(urlToParse);
      const hostname = parsedUrl.hostname.toLowerCase();
      if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
        if (parsedUrl.pathname.includes("/embed/")) {
          videoId = parsedUrl.pathname.split('/embed/')[1].split(/[?&]/)[0];
        } else if (parsedUrl.pathname.includes("/shorts/")) {
          videoId = parsedUrl.pathname.split('/shorts/')[1].split(/[?&]/)[0];
        } else if (hostname.includes("youtu.be")) {
          videoId = parsedUrl.pathname.substring(1).split(/[?&]/)[0];
        } else {
          videoId = parsedUrl.searchParams.get("v");
        }
      }
    } catch {
      // Leave the original URL to the fallback parser below.
    }

    // Fallback regex to reliably catch edge cases and malformed strings
    if (!videoId && url) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
      }
    }

    if (videoId) {
      const origin = window.location.origin;
      return `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&enablejsapi=1&origin=${origin}`;
    }
    return url;
  };

  const getNativeVideoUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("/api/")) {
      const backendUrl = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api', '') 
        : "http://localhost:5000";
      return `${backendUrl}${url}`;
    }
    return url;
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (!isYouTube && videoRef.current) videoRef.current.play();
    if (isYouTube && iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (!isYouTube && videoRef.current) videoRef.current.pause();
    if (isYouTube && iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (autoPlay) {
        videoRef.current.play().catch(e => console.warn("Autoplay prevented by browser:", e));
      }
    }
  };

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (onVideoEnd) {
      onVideoEnd();
    }
  }, [onVideoEnd]);

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      videoRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isYouTube) return;
    const handleMessage = (e) => {
      if (e.origin !== "https://www.youtube.com") return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === "infoDelivery" && data.info) {
          if (data.info.playerState === 0) {
            handleEnded();
          }
          if (data.info.playerState === 1) {
            setIsPlaying(true);
          }
          if (data.info.playerState === 2) {
            setIsPlaying(false);
          }
        }
      } catch {
        // Ignore unrelated postMessage payloads.
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isYouTube, handleEnded]);

  useEffect(() => {
    if (!isYouTube || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const onLoad = () => iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, [isYouTube]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (isPlaying && autoPlay) {
      handleMouseMove();
    }

    return () => clearTimeout(controlsTimeoutRef.current);
  }, [isPlaying, autoPlay, handleMouseMove]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Video Container */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isYouTube ? (
          <iframe
            ref={iframeRef}
            src={getYouTubeEmbedUrl(videoUrl)}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ width: "100%", height: "100%", backgroundColor: "#000" }}
          ></iframe>
        ) : (
          <video
            ref={videoRef}
            src={getNativeVideoUrl(videoUrl)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              backgroundColor: "#000",
            }}
          />
        )}

        {/* Video Controls */}
        {!isYouTube && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: showControls
                ? "linear-gradient(transparent, rgba(0,0,0,0.7))"
                : "transparent",
              padding: showControls ? "40px 20px 20px 20px" : "0",
              transition: "all 0.3s ease",
            }}
          >
          {/* Progress Bar */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            style={{
              width: "100%",
              cursor: "pointer",
              height: "6px",
              borderRadius: "3px",
              background: `linear-gradient(to right, var(--primary, #3b82f6) 0%, var(--primary, #3b82f6) ${progressPercentage}%, var(--border-color, #e5e7eb) ${progressPercentage}%, var(--border-color, #e5e7eb) 100%)`,
              outline: "none",
              accentColor: "var(--primary, #3b82f6)",
            }}
          />

          {/* Control Buttons */}
          <div
            style={{
              display: showControls ? "flex" : "none",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "12px",
              gap: "12px",
            }}
          >
            {/* Play/Pause */}
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: "20px",
                padding: "8px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Time Display */}
            <div style={{ color: "#fff", fontSize: "12px", minWidth: "80px" }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Volume Control */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  width: "60px",
                  cursor: "pointer",
                  accentColor: "var(--primary, #3b82f6)",
                }}
              />
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: "16px",
                padding: "8px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {isFullscreen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,0,0,0.7)",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
        )}

        {isYouTube && onClose && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: "20px",
              display: "flex",
              justifyContent: "space-between",
              background: "linear-gradient(rgba(0,0,0,0.7), transparent)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                color: "#fff",
                fontSize: "18px",
                fontWeight: "bold",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                maxWidth: "80%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {lessonTitle}
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,0,0,0.7)", border: "none", color: "#fff", cursor: "pointer", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", pointerEvents: "auto" }}
            >
              Close
            </button>
          </div>
        )}

        {/* Lesson Title */}
        {!isYouTube && showControls && onClose && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              right: "20px",
              color: "#fff",
              fontSize: "18px",
              fontWeight: "bold",
              textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              maxWidth: "90%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lessonTitle}
          </div>
        )}

        {/* Play Button Overlay (when not playing) */}
        {!isYouTube && !isPlaying && (
          <button
            onClick={handlePlay}
            style={{
              position: "absolute",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.8)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
              zIndex: 100,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
