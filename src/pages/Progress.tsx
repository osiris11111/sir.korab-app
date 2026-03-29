import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PlayCircle, CheckCircle2, BarChart2, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Progress() {
  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!currentUser || (!userData?.isPaid && !userData?.isAdmin))) {
      navigate('/pricing');
    }
  }, [currentUser, userData, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        const videosSnap = await getDocs(collection(db, 'videos'));
        const allVideos = videosSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        setVideos(allVideos);

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCompletedVideos(data.completedVideos || []);
          setVideoProgress(data.videoProgress || {});
        }
      } catch (error) {
        console.error("Error fetching progress data:", error);
      } finally {
        setFetching(false);
      }
    };

    if (currentUser && (userData?.isPaid || userData?.isAdmin)) {
      fetchData();
    }
  }, [currentUser, userData]);

  if (loading || fetching) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </>
    );
  }

  const totalVideos = videos.length;
  const completedCount = completedVideos.length;
  const overallProgress = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  // Group by category
  const categories = Array.from(new Set(videos.map(v => v.category)));
  const categoryProgress = categories.map(cat => {
    const catVideos = videos.filter(v => v.category === cat);
    const catCompleted = catVideos.filter(v => completedVideos.includes(v.id)).length;
    return {
      name: cat,
      total: catVideos.length,
      completed: catCompleted,
      percentage: catVideos.length > 0 ? Math.round((catCompleted / catVideos.length) * 100) : 0
    };
  });

  // Find last watched video
  let lastWatchedVideo = null;
  let maxProgressTime = -1;

  videos.forEach(video => {
    if (videoProgress[video.id] && videoProgress[video.id] > maxProgressTime) {
      // Just picking the one with the highest saved time for now, or we could store a timestamp of last watched
      // Since we don't have a lastWatchedTimestamp, we'll just show the first one that has progress but isn't completed
      if (!completedVideos.includes(video.id)) {
        lastWatchedVideo = video;
        maxProgressTime = videoProgress[video.id];
      }
    }
  });

  // Fallback if no in-progress video found
  if (!lastWatchedVideo && videos.length > 0) {
    lastWatchedVideo = videos.find(v => !completedVideos.includes(v.id)) || videos[0];
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface-container-lowest py-8 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl md:text-4xl font-headline font-bold flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-primary" /> My Progress
          </h1>

          {/* Overall Progress */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-high p-6 md:p-8 rounded-3xl"
          >
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Overall Completion</h2>
                <p className="text-on-surface-variant text-sm mt-1">{completedCount} of {totalVideos} lessons completed</p>
              </div>
              <div className="text-3xl font-black text-primary">{overallProgress}%</div>
            </div>
            <div className="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-primary"
              ></motion.div>
            </div>
          </motion.div>

          {/* Quick Resume */}
          {lastWatchedVideo && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface-container p-6 rounded-3xl border border-primary/20 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Continue Learning
              </h2>
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {lastWatchedVideo.thumbnail ? (
                  <img src={lastWatchedVideo.thumbnail} alt="" className="w-full sm:w-48 aspect-video object-cover rounded-xl shadow-lg" />
                ) : (
                  <div className="w-full sm:w-48 aspect-video bg-surface-container-highest rounded-xl flex items-center justify-center">
                    <PlayCircle className="w-8 h-8 text-on-surface-variant" />
                  </div>
                )}
                <div className="flex-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1 block">
                    {lastWatchedVideo.category}
                  </span>
                  <h3 className="text-xl font-bold mb-2">{lastWatchedVideo.title}</h3>
                  <Link to={`/lesson/${lastWatchedVideo.id}`}>
                    <button className="mt-2 bg-primary text-on-primary-fixed px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" /> Resume Lesson
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Category Breakdown */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {categoryProgress.map((cat, index) => (
              <div key={cat.name} className="bg-surface-container p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-on-surface">{cat.name}</h3>
                  <span className="text-sm font-medium text-on-surface-variant">{cat.completed}/{cat.total}</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percentage}%` }}
                    transition={{ duration: 1, delay: 0.1 * index, ease: "easeOut" }}
                    className="h-full bg-secondary"
                  ></motion.div>
                </div>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </>
  );
}
