import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, PlayCircle, CheckCircle2, FileText, Download, RotateCcw, RotateCw, ChevronLeft, ChevronRight, Settings, Gauge, MessageSquareWarning, X, Eye, EyeOff, List, Volume2, VolumeX, Maximize, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MOCK_TRANSCRIPT, VIDEO_CHAPTERS, APP_CONFIG } from '../config/constants';

export default function Lesson() {
  const { id } = useParams();
  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<any>(null);
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);
  const [prevLesson, setPrevLesson] = useState<any>(null);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [quality, setQuality] = useState('1080p');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [savedPosition, setSavedPosition] = useState(0);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && (!currentUser || (!userData?.isPaid && !userData?.isAdmin))) {
      navigate('/pricing');
    }
  }, [currentUser, userData, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !currentUser) return;
      try {
        const docRef = doc(db, 'videos', id);
        const docSnap = await getDoc(docRef);
        let currentVideoData = null;
        if (docSnap.exists()) {
          currentVideoData = { id: docSnap.id, ...docSnap.data() };
          setVideo(currentVideoData);
        } else {
          console.log("No such video!");
        }

        if (currentVideoData) {
          const q = query(collection(db, 'videos'), where('category', '==', currentVideoData.category));
          const catSnap = await getDocs(q);
          const catVideos = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          const currentIndex = catVideos.findIndex(v => v.id === id);
          if (currentIndex > 0) {
            setPrevLesson(catVideos[currentIndex - 1]);
          } else {
            setPrevLesson(null);
          }
          if (currentIndex < catVideos.length - 1) {
            setNextLesson(catVideos[currentIndex + 1]);
          } else {
            setNextLesson(null);
          }
        } else {
          setError("Video not found or you don't have access.");
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.completedVideos) {
            setCompletedVideos(data.completedVideos || []);
          }
          if (data.videoProgress && data.videoProgress[id]) {
            setSavedPosition(data.videoProgress[id]);
          }
          if (data.videoMaxProgress && data.videoMaxProgress[id]) {
            setMaxWatchedTime(data.videoMaxProgress[id]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load lesson data. Please try again later.");
        handleFirestoreError(error, OperationType.GET, `videos/${id}`);
      } finally {
        setFetching(false);
      }
    };

    if (currentUser && (userData?.isPaid || userData?.isAdmin)) {
      fetchData();
    }
  }, [id, currentUser, userData]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.completedVideos) {
          setCompletedVideos(data.completedVideos);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        saveProgress();
      }
    }, APP_CONFIG.progressSaveIntervalMs);
    return () => clearInterval(interval);
  }, [id, currentUser, maxWatchedTime]);

  useEffect(() => {
    let animationFrameId: number;
    const updateTime = () => {
      if (videoRef.current && !videoRef.current.paused) {
        const current = videoRef.current.currentTime;
        setCurrentTime(current);
        setMaxWatchedTime(prev => Math.max(prev, current));
      }
      animationFrameId = requestAnimationFrame(updateTime);
    };
    updateTime();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    const index = MOCK_TRANSCRIPT.findIndex((line, i) => {
      return currentTime >= line.time && (i === MOCK_TRANSCRIPT.length - 1 || currentTime < MOCK_TRANSCRIPT[i + 1].time);
    });
    if (index !== -1 && index !== activeIndex) {
      setActiveIndex(index);
      const element = document.getElementById(`transcript-line-${index}`);
      if (element && transcriptContainerRef.current && showTranscript) {
        const container = transcriptContainerRef.current;
        const elementTop = element.offsetTop;
        const containerHalfHeight = container.clientHeight / 2;
        container.scrollTo({
          top: elementTop - containerHalfHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [currentTime, activeIndex, showTranscript]);

  const toggleCompletion = async () => {
    if (!currentUser || !id) return;
    const isCompleted = completedVideos.includes(id);
    const newCompleted = isCompleted 
      ? completedVideos.filter(vidId => vidId !== id)
      : [...completedVideos, id];
    
    setCompletedVideos(newCompleted);
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        completedVideos: isCompleted ? arrayRemove(id) : arrayUnion(id)
      });
    } catch (error) {
      console.error("Error updating progress:", error);
      setCompletedVideos(completedVideos); // Revert on error
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleSeek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (savedPosition > 0) {
        videoRef.current.currentTime = savedPosition;
      }
      setIsVideoLoaded(true);
      setError(null);
    }
  };

  const handleVideoError = () => {
    setError("Failed to load the video. Please check your connection or try again later.");
    setIsVideoLoaded(true); // Stop skeleton loader
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.paused) {
      setCurrentTime(videoRef.current.currentTime);
      setMaxWatchedTime(prev => Math.max(prev, videoRef.current!.currentTime));
    }
  };

  const saveProgress = async () => {
    if (!currentUser || !id || !videoRef.current) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        [`videoProgress.${id}`]: videoRef.current.currentTime,
        [`videoMaxProgress.${id}`]: Math.max(videoRef.current.currentTime, maxWatchedTime)
      });
    } catch (error) {
      console.error("Error saving progress:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim() || !currentUser || !id) return;
    setIsSubmittingFeedback(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: currentUser.uid,
        videoId: id,
        text: feedbackText,
        timestamp: serverTimestamp(),
        currentTime: videoRef.current?.currentTime || 0
      });
      setIsFeedbackModalOpen(false);
      setFeedbackText('');
    } catch (e) {
      console.error("Error submitting feedback:", e);
      handleFirestoreError(e, OperationType.CREATE, 'feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const speed = parseFloat(e.target.value);
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleTranscript = () => {
    setShowTranscript(prev => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          transcriptContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
      return next;
    });
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      } else if (newVolume === 0 && !isMuted) {
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    }
  };

  if (loading || fetching) {
    return (
      <>
        <Navbar />
        <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-surface-container-lowest">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <div className="h-6 w-32 bg-surface-container-high animate-pulse rounded-xl"></div>
              <div className="h-6 w-24 bg-surface-container-high animate-pulse rounded-xl"></div>
            </div>
            <div className="w-full aspect-video bg-surface-container-high animate-pulse rounded-3xl"></div>
            <div className="flex justify-between items-center">
              <div className="h-10 w-48 bg-surface-container-high animate-pulse rounded-full"></div>
              <div className="h-10 w-64 bg-surface-container-high animate-pulse rounded-full"></div>
            </div>
            <div className="h-32 w-full bg-surface-container-high animate-pulse rounded-3xl"></div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
          <p className="text-on-surface-variant max-w-md mb-8">{error}</p>
          <Link to="/dashboard">
            <button className="bg-primary text-on-primary-fixed px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
              Return to Dashboard
            </button>
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  if (!video) {
    return <div className="min-h-screen flex items-center justify-center">Video not found.</div>;
  }

  const isCompleted = completedVideos.includes(video.id);

  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-surface-container-lowest">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
            {video.category} {video.module ? `• ${video.module}` : ''}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Video Player */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full aspect-video bg-black rounded-3xl overflow-hidden relative shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-outline-variant/20"
            >
              {!isVideoLoaded && (
                <div className="absolute inset-0 z-10 bg-surface-container-highest animate-pulse"></div>
              )}
              <video 
                ref={videoRef}
                src={video.url} 
                autoPlay
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPause={saveProgress}
                onEnded={saveProgress}
                onError={handleVideoError}
                className={`w-full h-full object-contain transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
                controlsList="nodownload"
              >
                Your browser does not support the video tag.
              </video>
            </motion.div>

            {/* Custom Progress Bar with Chapters */}
            {duration > 0 && isVideoLoaded ? (
              <div 
                className="w-full h-3 bg-surface-container-high rounded-full relative cursor-pointer overflow-hidden group/progress"
                onClick={(e) => {
                  if (!videoRef.current || !duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  videoRef.current.currentTime = pos * duration;
                  setCurrentTime(pos * duration);
                  setMaxWatchedTime(prev => Math.max(prev, pos * duration));
                }}
              >
                {/* Max Watched Overlay */}
                <div 
                  className="absolute top-0 left-0 h-full bg-primary/30 pointer-events-none" 
                  style={{ width: `${(maxWatchedTime / duration) * 100}%` }}
                ></div>
                {/* Current Time Overlay */}
                <div 
                  className="absolute top-0 left-0 h-full bg-primary pointer-events-none" 
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                ></div>
                {VIDEO_CHAPTERS.map(chapter => (
                  <div 
                    key={chapter.time} 
                    className="absolute top-0 h-full w-1 bg-surface group/chapter" 
                    style={{ left: `${(chapter.time / duration) * 100}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface text-xs px-2 py-1 rounded opacity-0 group-hover/chapter:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {chapter.title}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-3 bg-surface-container-high animate-pulse rounded-full"></div>
            )}

            {/* Video Controls & Navigation */}
            {!isVideoLoaded ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-24 h-10 bg-surface-container-high rounded-full"></div>
                  <div className="w-24 h-10 bg-surface-container-high rounded-full"></div>
                  <div className="w-24 h-10 bg-surface-container-high rounded-full"></div>
                  <div className="w-24 h-10 bg-surface-container-high rounded-full"></div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-40 h-10 bg-surface-container-high rounded-full"></div>
                  <div className="w-32 h-10 bg-surface-container-high rounded-full"></div>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSeek(-10)}
                    title="Rewind 10 seconds"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-medium"
                  >
                    <RotateCcw className="w-4 h-4" /> 10s
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSeek(10)}
                    title="Forward 10 seconds"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-medium"
                  >
                    10s <RotateCw className="w-4 h-4" />
                  </motion.button>
                  
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container text-sm font-medium" title="Video Quality">
                    <Settings className="w-4 h-4 text-on-surface-variant" />
                    <select 
                      value={quality} 
                      onChange={(e) => setQuality(e.target.value)}
                      className="bg-transparent border-none focus:outline-none cursor-pointer text-on-surface"
                    >
                      <option value="1080p" className="bg-zinc-900 text-white">1080p</option>
                      <option value="720p" className="bg-zinc-900 text-white">720p</option>
                      <option value="480p" className="bg-zinc-900 text-white">480p</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container text-sm font-medium" title="Playback Speed">
                    <Gauge className="w-4 h-4 text-on-surface-variant" />
                    <select 
                      value={playbackRate} 
                      onChange={handleSpeedChange}
                      className="bg-transparent border-none focus:outline-none cursor-pointer text-on-surface"
                    >
                      <option value={0.5} className="bg-zinc-900 text-white">0.5x</option>
                      <option value={1} className="bg-zinc-900 text-white">1x</option>
                      <option value={1.5} className="bg-zinc-900 text-white">1.5x</option>
                      <option value={2} className="bg-zinc-900 text-white">2x</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container text-sm font-medium group/volume" title="Volume">
                    <button onClick={toggleMute} className="text-on-surface-variant hover:text-primary transition-colors">
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={isMuted ? 0 : volume} 
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-outline-variant/30 rounded-full appearance-none cursor-pointer accent-primary opacity-70 group-hover/volume:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleFullscreen}
                    title="Fullscreen"
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/30 hover:bg-surface-container transition-colors text-sm font-medium text-on-surface-variant"
                  >
                    <Maximize className="w-4 h-4" /> <span className="hidden sm:inline">Fullscreen</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTranscript}
                    title={showTranscript ? "Hide Transcript" : "Show Transcript"}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors text-sm font-medium ${showTranscript ? 'bg-surface-container-high border-outline-variant/50 text-on-surface' : 'border-outline-variant/30 hover:bg-surface-container text-on-surface-variant'}`}
                  >
                    {showTranscript ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span className="hidden sm:inline">{showTranscript ? 'Hide Transcript' : 'Show Transcript'}</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsFeedbackModalOpen(true)}
                    title="Report an issue with this video"
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/30 hover:bg-surface-container transition-colors text-sm font-medium text-on-surface-variant"
                  >
                    <MessageSquareWarning className="w-4 h-4" /> <span className="hidden sm:inline">Report Issue</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Lesson Details */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-8 rounded-3xl"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl md:text-4xl font-bold">{video.title}</h1>
                <button 
                  onClick={toggleCompletion}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors text-sm font-medium shrink-0 ${isCompleted ? 'bg-primary border-primary text-on-primary-fixed' : 'border-primary/30 text-primary hover:bg-primary/10'}`}
                >
                  <CheckCircle2 className="w-4 h-4" /> {isCompleted ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            </motion.div>

            {/* Transcript */}
            {showTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-8 rounded-3xl"
              >
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Transcript
                </h3>
                <div ref={transcriptContainerRef} className="h-64 overflow-y-auto space-y-4 pr-4 custom-scrollbar relative">
                  {MOCK_TRANSCRIPT.map((line, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <p 
                        key={index} 
                        id={`transcript-line-${index}`}
                        onClick={() => seekToTime(line.time)}
                        className={`transition-all duration-300 cursor-pointer hover:text-primary/80 ${isActive ? 'text-primary font-medium text-lg scale-[1.02] origin-left' : 'text-on-surface-variant'}`}
                      >
                        {line.text}
                      </p>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Chapters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-panel p-8 rounded-3xl"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <List className="w-5 h-5 text-primary" /> Chapters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {VIDEO_CHAPTERS.map((chapter, index) => {
                  const isCurrentChapter = currentTime >= chapter.time && (index === VIDEO_CHAPTERS.length - 1 || currentTime < VIDEO_CHAPTERS[index + 1].time);
                  
                  const formatTime = (seconds: number) => {
                    const m = Math.floor(seconds / 60);
                    const s = Math.floor(seconds % 60);
                    return `${m}:${s.toString().padStart(2, '0')}`;
                  };

                  return (
                    <div 
                      key={index}
                      onClick={() => seekToTime(chapter.time)}
                      className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${isCurrentChapter ? 'bg-primary/10 border-primary/30 text-primary scale-[1.02]' : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/10 text-on-surface'}`}
                    >
                      <span className="font-medium">{chapter.title}</span>
                      <span className={`text-sm font-mono ${isCurrentChapter ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {formatTime(chapter.time)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 w-full">
              {prevLesson ? (
                <Link to={`/lesson/${prevLesson.id}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-medium">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                </Link>
              ) : (
                <div className="flex-1"></div>
              )}
              {nextLesson ? (
                <Link to={`/lesson/${nextLesson.id}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-medium">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              ) : (
                <div className="flex-1"></div>
              )}
            </div>

            {/* Resources */}
            {video.resourceUrl && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-panel p-6 rounded-3xl"
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" /> Resources
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href={video.resourceUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors text-left group border border-transparent hover:border-outline-variant/20">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-on-surface-variant" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-on-surface truncate">{video.resourceTitle || 'Lesson Resource'}</p>
                          <p className="text-xs text-on-surface-variant font-mono">Download</p>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-on-surface-variant group-hover:text-primary shrink-0 transition-colors" />
                    </a>
                  </li>
                </ul>
              </motion.div>
            )}

          </div>

        </div>
      </div>
    </div>
    <Footer />

    {/* Feedback Modal */}
    {isFeedbackModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-surface-container rounded-3xl p-6 w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Report Issue / Feedback</h3>
            <button onClick={() => setIsFeedbackModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
              <X className="w-5 h-5" />
            </button>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Describe the issue or suggest an improvement..."
            className="w-full h-32 bg-surface-container-high border border-outline-variant/30 rounded-xl p-3 text-on-surface focus:outline-none focus:border-primary resize-none mb-4"
          ></textarea>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsFeedbackModalOpen(false)}
              className="px-4 py-2 rounded-full hover:bg-surface-container-high transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={submitFeedback}
              disabled={isSubmittingFeedback || !feedbackText.trim()}
              className="px-4 py-2 rounded-full bg-primary text-on-primary-fixed hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isSubmittingFeedback ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
