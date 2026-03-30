import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, PlayCircle, PauseCircle, CheckCircle2, FileText, Download, RotateCcw, RotateCw, ChevronLeft, ChevronRight, Settings, Gauge, MessageSquareWarning, X, Eye, EyeOff, List, Volume2, VolumeX, Maximize, AlertCircle, PictureInPicture, ThumbsUp, MessageCircle, Bookmark, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc } from 'firebase/firestore';
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
  const [bookmarkedVideos, setBookmarkedVideos] = useState<string[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [prevLesson, setPrevLesson] = useState<any>(null);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [quality, setQuality] = useState('480p');
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [hasTakenQuiz, setHasTakenQuiz] = useState(false);

  // Comments State
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [commentSortBy, setCommentSortBy] = useState<'recent' | 'popular'>('recent');
  const [confirmDelete, setConfirmDelete] = useState<{type: 'comment' | 'reply', commentId: string, replyId?: string} | null>(null);

  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  const [parsedChapters, setParsedChapters] = useState<{time: number, title: string}[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasIncrementedView(false);
  }, [id]);

  useEffect(() => {
    if (!loading && (!currentUser || (!userData?.isPaid && !userData?.isAdmin))) {
      navigate('/pricing');
    }
  }, [currentUser, userData, loading, navigate]);

  useEffect(() => {
    const parseChapters = (description: string) => {
      if (!description) return [];
      const regex = /\[(\d{1,2}):(\d{2})\]\s*[-:]?\s*(.+)/g;
      const chapters = [];
      let match;
      while ((match = regex.exec(description)) !== null) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        chapters.push({
          time: minutes * 60 + seconds,
          title: match[3].trim()
        });
      }
      return chapters;
    };

    const fetchData = async () => {
      if (!id || !currentUser) return;
      try {
        const docRef = doc(db, 'videos', id);
        const docSnap = await getDoc(docRef);
        let currentVideoData = null;
        if (docSnap.exists()) {
          currentVideoData = { id: docSnap.id, ...docSnap.data() };
          setVideo(currentVideoData);
          if (currentVideoData.description) {
            setParsedChapters(parseChapters(currentVideoData.description));
          } else {
            setParsedChapters([]);
          }
        } else {
          console.log("No such video!");
        }

        if (currentVideoData) {
          const q = query(collection(db, 'videos'), where('category', '==', currentVideoData.category));
          const catSnap = await getDocs(q);
          const catVideos = catSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
          
          catVideos.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order;
            }
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
          
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
          if (data.bookmarkedVideos) {
            setBookmarkedVideos(data.bookmarkedVideos || []);
          }
          if (data.videoProgress && data.videoProgress[id]) {
            setSavedPosition(data.videoProgress[id]);
          }
          if (data.videoMaxProgress && data.videoMaxProgress[id]) {
            setMaxWatchedTime(data.videoMaxProgress[id]);
          }
          if (data.quizScores && data.quizScores[id] !== undefined) {
            setQuizScore(data.quizScores[id]);
            setHasTakenQuiz(true);
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
        if (data.bookmarkedVideos) {
          setBookmarkedVideos(data.bookmarkedVideos);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!id || !currentUser) return;
    const q = query(collection(db, 'notes'), where('videoId', '==', id), where('userId', '==', currentUser.uid), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotes(notesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notes');
    });
    return () => unsubscribe();
  }, [id, currentUser]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'comments'), where('videoId', '==', id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(fetchedComments);
    }, (error) => {
      console.error("Error fetching comments:", error);
      handleFirestoreError(error, OperationType.LIST, 'comments');
    });
    return () => unsubscribe();
  }, [id]);

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

  useEffect(() => {
    if (videoRef.current && isVideoLoaded) {
      const currentTime = videoRef.current.currentTime;
      const isPaused = videoRef.current.paused;
      
      // The src will update automatically via the React prop,
      // but we need to wait for it to load to restore the time.
      const handleCanPlay = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTime;
          if (!isPaused) {
            videoRef.current.play().catch(console.error);
          }
          videoRef.current.removeEventListener('canplay', handleCanPlay);
        }
      };
      
      videoRef.current.addEventListener('canplay', handleCanPlay);
    }
  }, [quality]);

  const toggleBookmark = async () => {
    if (!currentUser || !id) return;
    const isBookmarked = bookmarkedVideos.includes(id);
    const newBookmarked = isBookmarked 
      ? bookmarkedVideos.filter(vidId => vidId !== id)
      : [...bookmarkedVideos, id];
    
    setBookmarkedVideos(newBookmarked);
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        bookmarkedVideos: isBookmarked ? arrayRemove(id) : arrayUnion(id)
      });
    } catch (error) {
      console.error("Error updating bookmark status:", error);
      setBookmarkedVideos(bookmarkedVideos); // Revert on error
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !currentUser || !id) return;

    setIsSubmittingNote(true);
    try {
      await addDoc(collection(db, 'notes'), {
        videoId: id,
        userId: currentUser.uid,
        text: newNote,
        timestamp: currentTime,
        createdAt: serverTimestamp()
      });
      setNewNote('');
    } catch (error) {
      console.error("Error submitting note:", error);
      handleFirestoreError(error, OperationType.CREATE, 'notes');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
      handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  const deleteReply = async (commentId: string, replyId: string) => {
    try {
      const commentRef = doc(db, 'comments', commentId);
      const comment = comments.find(c => c.id === commentId);
      if (comment) {
        const updatedReplies = comment.replies.filter((r: any) => r.id !== replyId);
        await updateDoc(commentRef, { replies: updatedReplies });
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
      handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
    }
  };

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

  const handleVideoEnded = () => {
    saveProgress();
    if (video?.quiz && video.quiz.length > 0 && !hasTakenQuiz) {
      setShowQuiz(true);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || !id) return;
    setIsSubmittingComment(true);
    try {
      await addDoc(collection(db, 'comments'), {
        videoId: id,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        text: newComment,
        likes: [],
        replies: [],
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const submitReply = async (commentId: string) => {
    if (!replyText.trim() || !currentUser) return;
    setIsSubmittingReply(true);
    try {
      const commentRef = doc(db, 'comments', commentId);
      const newReply = {
        id: Date.now().toString(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        text: replyText,
        createdAt: new Date()
      };
      await updateDoc(commentRef, {
        replies: arrayUnion(newReply)
      });
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error("Error adding reply:", error);
      handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const toggleLikeComment = async (commentId: string, currentLikes: string[] = []) => {
    if (!currentUser) return;
    try {
      const commentRef = doc(db, 'comments', commentId);
      if (currentLikes.includes(currentUser.uid)) {
        await updateDoc(commentRef, {
          likes: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(commentRef, {
          likes: arrayUnion(currentUser.uid)
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
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

  const handleNextQuestion = async () => {
    if (selectedOption === null || !video?.quiz || !currentUser || !id) return;
    
    const newAnswers = [...userAnswers, selectedOption];
    setUserAnswers(newAnswers);
    setSelectedOption(null);

    if (currentQuestionIndex < video.quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      let score = 0;
      newAnswers.forEach((ans, idx) => {
        if (ans === video.quiz[idx].correctAnswer) {
          score += 1;
        }
      });
      
      const percentage = Math.round((score / video.quiz.length) * 100);
      setQuizScore(percentage);
      setHasTakenQuiz(true);
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          [`quizScores.${id}`]: percentage
        });
      } catch (error) {
        console.error("Error saving quiz score:", error);
        handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
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

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const togglePiP = async () => {
    if (videoRef.current) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture().catch(console.error);
      } else {
        await videoRef.current.requestPictureInPicture().catch(console.error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || fetching) {
    return (
      <>
        <Navbar />
        <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-surface-container-lowest">
          <div className="max-w-[1600px] w-[98%] mx-auto space-y-8">
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

  const chaptersToDisplay = parsedChapters.length > 0 ? parsedChapters : VIDEO_CHAPTERS;

  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-surface-container-lowest">
      <div className="max-w-[1600px] w-[98%] mx-auto">
        
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
              {isBuffering && !hasStartedPlaying && video.thumbnail && (
                <div className="absolute inset-0 z-[15] flex items-center justify-center bg-black">
                  <img src={video.thumbnail} alt="Buffering..." className="w-full h-full object-contain opacity-50" />
                  <div className="absolute w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div 
                className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
                onClick={togglePlay}
              >
                <div className={`bg-black/50 rounded-full p-4 backdrop-blur-sm transition-all duration-300 ${isPlaying ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
                  <PlayCircle className="w-16 h-16 text-white" />
                </div>
              </div>
              <video 
                ref={videoRef}
                src={video.urls?.[quality] || video.url} 
                autoPlay
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => {
                  setIsPlaying(true);
                  if (!hasIncrementedView && id) {
                    setHasIncrementedView(true);
                    const videoDocRef = doc(db, 'videos', id);
                    updateDoc(videoDocRef, {
                      views: (video.views || 0) + 1
                    }).catch(console.error);
                  }
                }}
                onPause={() => { setIsPlaying(false); saveProgress(); }}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => { setIsPlaying(true); setIsBuffering(false); setHasStartedPlaying(true); }}
                onEnded={handleVideoEnded}
                onError={handleVideoError}
                className={`w-full h-full object-contain transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
                controlsList="nodownload"
                poster={video.thumbnail}
              >
                Your browser does not support the video tag.
              </video>
            </motion.div>

            {/* Custom Progress Bar with Chapters */}
            {duration > 0 && isVideoLoaded ? (
              <div className="space-y-2">
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
                {chaptersToDisplay.map(chapter => (
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
              <div className="flex justify-between text-xs text-on-surface-variant font-mono px-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            ) : (
              <div className="w-full h-3 bg-surface-container-high animate-pulse rounded-full"></div>
            )}

            {/* Video Controls & Navigation */}
            {!isVideoLoaded ? (
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 animate-pulse">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 w-full lg:w-auto">
                  <div className="w-20 h-9 bg-surface-container-high rounded-full"></div>
                  <div className="w-20 h-9 bg-surface-container-high rounded-full"></div>
                  <div className="w-24 h-9 bg-surface-container-high rounded-full"></div>
                  <div className="w-20 h-9 bg-surface-container-high rounded-full"></div>
                </div>
                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 w-full lg:w-auto">
                  <div className="w-32 h-9 bg-surface-container-high rounded-full"></div>
                  <div className="w-32 h-9 bg-surface-container-high rounded-full"></div>
                  <div className="w-36 h-9 bg-surface-container-high rounded-full"></div>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col 2xl:flex-row items-center justify-between gap-4 bg-surface-container-low p-2 sm:p-4 rounded-2xl border border-outline-variant/20"
              >
                <div className="flex flex-wrap items-center justify-center 2xl:justify-start gap-2 w-full 2xl:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSeek(-10)}
                    title="Rewind 10 seconds"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-medium"
                  >
                    <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">10s</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSeek(10)}
                    title="Forward 10 seconds"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-medium"
                  >
                    <span className="hidden sm:inline">10s</span> <RotateCw className="w-4 h-4" />
                  </motion.button>
                  
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container text-sm font-medium" title="Video Quality">
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

                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container text-sm font-medium" title="Playback Speed">
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
                  
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container text-sm font-medium group/volume" title="Volume">
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
                      className="w-16 h-1 bg-outline-variant/30 rounded-full appearance-none cursor-pointer accent-primary opacity-70 group-hover/volume:opacity-100 transition-opacity hidden sm:block"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center 2xl:justify-end gap-2 w-full 2xl:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleFullscreen}
                    title="Fullscreen"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-outline-variant/30 hover:bg-surface-container transition-colors text-sm font-medium text-on-surface-variant"
                  >
                    <Maximize className="w-4 h-4" /> <span className="hidden md:inline">Fullscreen</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePiP}
                    title="Picture in Picture"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-outline-variant/30 hover:bg-surface-container transition-colors text-sm font-medium text-on-surface-variant"
                  >
                    <PictureInPicture className="w-4 h-4" /> <span className="hidden md:inline">Mini Player</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTranscript}
                    title={showTranscript ? "Hide Transcript" : "Show Transcript"}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full border transition-colors text-sm font-medium ${showTranscript ? 'bg-surface-container-high border-outline-variant/50 text-on-surface' : 'border-outline-variant/30 hover:bg-surface-container text-on-surface-variant'}`}
                  >
                    {showTranscript ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span className="hidden md:inline">{showTranscript ? 'Hide Transcript' : 'Show Transcript'}</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsFeedbackModalOpen(true)}
                    title="Report an issue with this video"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-outline-variant/30 hover:bg-surface-container transition-colors text-sm font-medium text-on-surface-variant"
                  >
                    <MessageSquareWarning className="w-4 h-4" /> <span className="hidden md:inline">Report Issue</span>
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
                <div className="flex flex-wrap items-center gap-3">
                  {video.quiz && video.quiz.length > 0 && (
                    <button 
                      onClick={() => setShowQuiz(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 text-purple-500 hover:bg-purple-500/10 transition-colors text-sm font-medium shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">quiz</span>
                      {hasTakenQuiz ? `Quiz Score: ${quizScore}%` : 'Take Quiz'}
                    </button>
                  )}
                  <button 
                    onClick={toggleBookmark}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors text-sm font-medium shrink-0 ${bookmarkedVideos.includes(video.id) ? 'bg-secondary border-secondary text-on-secondary-fixed' : 'border-secondary/30 text-secondary hover:bg-secondary/10'}`}
                  >
                    <Bookmark className="w-4 h-4" /> {bookmarkedVideos.includes(video.id) ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <button 
                    onClick={toggleCompletion}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors text-sm font-medium shrink-0 ${isCompleted ? 'bg-primary border-primary text-on-primary-fixed' : 'border-primary/30 text-primary hover:bg-primary/10'}`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> {isCompleted ? 'Completed' : 'Mark Complete'}
                  </button>
                </div>
              </div>
              {video.description && (
                <div className="mt-6 pt-6 border-t border-outline-variant/20">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> Description
                  </h3>
                  <div className="text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                    {video.description.split(/(\[\d{2}:\d{2}\])/g).map((part: string, index: number) => {
                      const match = part.match(/\[(\d{2}):(\d{2})\]/);
                      if (match) {
                        const minutes = parseInt(match[1], 10);
                        const seconds = parseInt(match[2], 10);
                        const time = minutes * 60 + seconds;
                        return (
                          <button
                            key={index}
                            onClick={() => seekToTime(time)}
                            className="text-primary hover:underline font-mono mx-1"
                          >
                            {part}
                          </button>
                        );
                      }
                      return <span key={index}>{part}</span>;
                    })}
                  </div>
                </div>
              )}
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

            {/* Notes Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-8 rounded-3xl"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary" /> My Notes
              </h3>
              <form onSubmit={submitNote} className="mb-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={`Add a note at ${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}...`}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-secondary resize-none min-h-[80px] mb-3"
                  required
                />
                <div className="flex justify-end">
                  <button 
                    type="submit"
                    disabled={isSubmittingNote || !newNote.trim()}
                    className="bg-white text-black px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isSubmittingNote ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
                      <div className="flex items-center justify-between mb-2">
                        <button 
                          onClick={() => seekToTime(note.timestamp)}
                          className="text-secondary font-mono text-sm hover:underline"
                        >
                          {Math.floor(note.timestamp / 60)}:{Math.floor(note.timestamp % 60).toString().padStart(2, '0')}
                        </button>
                        <span className="text-xs text-on-surface-variant">
                          {note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <p className="text-on-surface text-sm whitespace-pre-wrap">{note.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-on-surface-variant text-sm text-center py-4">No notes yet for this lesson.</p>
                )}
              </div>
            </motion.div>

            {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8 rounded-3xl mt-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5 text-primary" /> Discussion
            </h3>
            <div className="flex gap-2 bg-surface-container-high p-1 rounded-lg">
              <button
                onClick={() => setCommentSortBy('recent')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${commentSortBy === 'recent' ? 'bg-primary text-on-primary-fixed' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Recent
              </button>
              <button
                onClick={() => setCommentSortBy('popular')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${commentSortBy === 'popular' ? 'bg-primary text-on-primary-fixed' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Popular
              </button>
            </div>
          </div>
          
          <form onSubmit={submitComment} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ask a question or share your thoughts..."
              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary resize-none min-h-[100px] mb-3"
              required
            />
            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="kinetic-gradient-primary text-on-primary-fixed px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            {comments.length > 0 ? (
              [...comments].sort((a, b) => {
                if (commentSortBy === 'popular') {
                  const likesA = a.likes?.length || 0;
                  const likesB = b.likes?.length || 0;
                  if (likesA !== likesB) return likesB - likesA;
                }
                const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return dateB - dateA;
              }).map((comment) => (
                <div key={comment.id} className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {comment.userEmail ? comment.userEmail.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-on-surface">{comment.userEmail || 'User'}</div>
                      <div className="text-xs text-on-surface-variant">
                        {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                    </div>
                    {userData?.isAdmin && (
                      <button 
                        onClick={() => setConfirmDelete({ type: 'comment', commentId: comment.id })}
                        className="text-error hover:bg-error/10 p-2 rounded-full transition-colors"
                        title="Delete Comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-on-surface-variant text-sm whitespace-pre-wrap mb-4">{comment.text}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                    <button 
                      onClick={() => toggleLikeComment(comment.id, comment.likes)}
                      className={`flex items-center gap-1.5 transition-colors ${comment.likes?.includes(currentUser?.uid) ? 'text-primary' : 'hover:text-on-surface'}`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{comment.likes?.length || 0}</span>
                    </button>
                    <button 
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="flex items-center gap-1.5 hover:text-on-surface transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-outline-variant/20 space-y-4">
                      {comment.replies.map((reply: any) => (
                        <div key={reply.id} className="bg-surface-container-high/50 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">
                              {reply.userEmail ? reply.userEmail.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="text-xs font-bold text-on-surface flex-1">{reply.userEmail || 'User'}</div>
                            {userData?.isAdmin && (
                              <button 
                                onClick={() => setConfirmDelete({ type: 'reply', commentId: comment.id, replyId: reply.id })}
                                className="text-error hover:bg-error/10 p-1.5 rounded-full transition-colors"
                                title="Delete Reply"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-on-surface-variant text-sm">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 flex gap-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary resize-none min-h-[40px]"
                      />
                      <button 
                        onClick={() => submitReply(comment.id)}
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="bg-primary text-on-primary-fixed px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 self-end"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-on-surface-variant text-center py-8 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                No comments yet. Be the first to start the discussion!
              </p>
            )}
          </div>
        </motion.div>



          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 w-full">
              {prevLesson ? (
                <Link to={`/lesson/${prevLesson.id}`} className="flex-1">
                  <button className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-medium text-left">
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    {prevLesson.thumbnail && (
                      <img src={prevLesson.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="text-xs text-on-surface-variant">Previous</div>
                      <div className="truncate">{prevLesson.title}</div>
                    </div>
                  </button>
                </Link>
              ) : (
                <div className="flex-1"></div>
              )}
              {nextLesson ? (
                <Link to={`/lesson/${nextLesson.id}`} className="flex-1">
                  <button className="w-full flex items-center justify-end gap-3 px-4 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-medium text-right">
                    <div className="truncate">
                      <div className="text-xs text-on-surface-variant">Next</div>
                      <div className="truncate">{nextLesson.title}</div>
                    </div>
                    {nextLesson.thumbnail && (
                      <img src={nextLesson.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    )}
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                </Link>
              ) : (
                <div className="flex-1"></div>
              )}
            </div>

            {/* Chapters (Moved to Sidebar) */}
            {chaptersToDisplay.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-panel p-6 rounded-3xl"
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <List className="w-5 h-5 text-primary" /> Chapters
                </h3>
                <div className="flex flex-col gap-3">
                  {chaptersToDisplay.map((chapter, index) => {
                    const isCurrentChapter = currentTime >= chapter.time && (index === chaptersToDisplay.length - 1 || currentTime < chaptersToDisplay[index + 1].time);

                    return (
                      <div 
                        key={index}
                        onClick={() => seekToTime(chapter.time)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 border ${isCurrentChapter ? 'bg-primary/10 border-primary/30 text-primary scale-[1.02]' : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/10 text-on-surface'}`}
                      >
                        <span className="font-medium text-sm">{chapter.title}</span>
                        <span className={`text-xs font-mono ${isCurrentChapter ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {formatTime(chapter.time)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

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

    {/* Quiz Modal */}
    {showQuiz && video?.quiz && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-surface-container rounded-3xl p-6 md:p-8 w-full max-w-2xl relative shadow-2xl border border-outline-variant/20">
          <button 
            onClick={() => setShowQuiz(false)}
            className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-6 h-6" />
          </button>
          
          {!hasTakenQuiz ? (
            <>
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-primary">Knowledge Check</h2>
                  <span className="text-sm font-medium text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
                    Question {currentQuestionIndex + 1} of {video.quiz.length}
                  </span>
                </div>
                <p className="text-lg font-medium text-on-surface">
                  {video.quiz[currentQuestionIndex].text}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {video.quiz[currentQuestionIndex].options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(index)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selectedOption === index 
                        ? 'border-primary bg-primary/10 text-primary scale-[1.01]' 
                        : 'border-outline-variant/30 bg-surface-container-high hover:border-primary/50 text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        selectedOption === index ? 'border-primary' : 'border-outline-variant'
                      }`}>
                        {selectedOption === index && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleNextQuestion}
                  disabled={selectedOption === null}
                  className="kinetic-gradient-primary text-on-primary-fixed px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  {currentQuestionIndex < video.quiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl font-bold text-primary">{quizScore}%</span>
              </div>
              <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
              <p className="text-on-surface-variant mb-8">
                You scored {quizScore}% on this knowledge check.
              </p>
              <button 
                onClick={() => setShowQuiz(false)}
                className="bg-surface-container-high text-on-surface px-8 py-3 rounded-xl font-bold hover:bg-surface-container-highest transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Confirm Delete Modal */}
    {confirmDelete && (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-surface-container rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-outline-variant/20">
          <h2 className="text-2xl font-bold mb-4 text-on-surface">Confirm Deletion</h2>
          <p className="text-on-surface-variant mb-8">
            Are you sure you want to delete this {confirmDelete.type}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setConfirmDelete(null)}
              className="px-6 py-2.5 rounded-xl font-bold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (confirmDelete.type === 'comment') {
                  deleteComment(confirmDelete.commentId);
                } else if (confirmDelete.type === 'reply' && confirmDelete.replyId) {
                  deleteReply(confirmDelete.commentId, confirmDelete.replyId);
                }
                setConfirmDelete(null);
              }}
              className="px-6 py-2.5 rounded-xl font-bold bg-error text-on-error hover:bg-error/90 transition-colors shadow-lg"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
