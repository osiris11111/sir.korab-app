import { useEffect, useRef, useState } from 'react';

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // If the video is already loaded enough to play, fade it in immediately.
    // This fixes the issue where 'canplay' fires before React attaches the listener.
    if (video.readyState >= 3) {
      setOpacity(1);
    }

    const handleTimeUpdate = () => {
      if (video.currentTime >= 7.5) {
        setOpacity(0);
        setTimeout(() => {
          if (video) {
            video.currentTime = 0;
            video.play().catch(() => {});
            setOpacity(1);
          }
        }, 500); // 500ms fade out
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity }}
        autoPlay
        muted
        playsInline
        onCanPlay={() => setOpacity(1)}
      />
    </div>
  );
}
