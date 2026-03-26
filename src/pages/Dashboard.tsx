import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { PlayCircle, Clock, CheckCircle2, Lock, TrendingUp, Award, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Dashboard() {
  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [videosByCategory, setVideosByCategory] = useState<Record<string, Record<string, any[]>>>({});
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'videos'));
        const videos: any[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const grouped = videos.reduce((acc, video) => {
          const cat = video.category || 'Uncategorized';
          const mod = video.module || 'General';
          if (!acc[cat]) acc[cat] = {};
          if (!acc[cat][mod]) acc[cat][mod] = [];
          acc[cat][mod].push(video);
          return acc;
        }, {} as Record<string, Record<string, any[]>>);
        
        setVideosByCategory(grouped);

        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().completedVideos) {
            setCompletedVideos(userDoc.data().completedVideos || []);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        handleFirestoreError(error, OperationType.LIST, 'videos');
      } finally {
        setFetching(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const toggleCompletion = async (videoId: string) => {
    if (!currentUser) return;
    const isCompleted = completedVideos.includes(videoId);
    const newCompleted = isCompleted 
      ? completedVideos.filter(id => id !== videoId)
      : [...completedVideos, videoId];
    
    setCompletedVideos(newCompleted);
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        completedVideos: isCompleted ? arrayRemove(videoId) : arrayUnion(videoId)
      });
    } catch (error) {
      console.error("Error updating progress:", error);
      setCompletedVideos(completedVideos); // Revert on error
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  if (loading || fetching) {
    return (
      <>
        <Navbar />
        <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="space-y-4">
              <div className="h-12 w-64 bg-surface-container-high animate-pulse rounded-xl"></div>
              <div className="h-6 w-96 bg-surface-container-high animate-pulse rounded-xl"></div>
            </div>
            <div className="space-y-6">
              <div className="h-8 w-48 bg-surface-container-high animate-pulse rounded-xl"></div>
              <div className="glass-panel rounded-3xl p-6 space-y-6">
                <div className="flex justify-between">
                  <div className="h-8 w-48 bg-surface-container-high animate-pulse rounded-xl"></div>
                  <div className="h-8 w-24 bg-surface-container-high animate-pulse rounded-xl"></div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 w-full bg-surface-container-high animate-pulse rounded-2xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isLocked = !userData?.isPaid && !userData?.isAdmin;

  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">Welcome back, {userData?.email?.split('@')[0] || 'Creator'}</h1>
            <p className="text-on-surface-variant text-lg">Pick up where you left off and keep building.</p>
          </div>
          {isLocked ? (
            <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 border-primary/30">
              <div>
                <p className="text-sm text-on-surface-variant font-medium uppercase tracking-wider mb-2">Account Status</p>
                <Link to="/pricing">
                  <button className="bg-primary text-on-primary-fixed px-4 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
                    Upgrade to Access Content
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="glass-panel px-6 py-4 rounded-2xl flex flex-col items-center justify-center border-outline-variant/20 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-bold text-xl">{completedVideos.length}</span>
                </div>
                <span className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">Lessons Done</span>
              </div>
              <div className="glass-panel px-6 py-4 rounded-2xl flex flex-col items-center justify-center border-outline-variant/20 hover:border-secondary/30 transition-colors">
                <div className="flex items-center gap-2 text-secondary mb-1">
                  <Award className="w-5 h-5" />
                  <span className="font-bold text-xl">
                    {Object.values(videosByCategory).reduce((total, modules) => {
                      return total + Object.values(modules).filter(videos => videos.length > 0 && videos.every(v => completedVideos.includes(v.id))).length;
                    }, 0)}
                  </span>
                </div>
                <span className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">Modules Mastered</span>
              </div>
            </div>
          )}
        </div>

        {/* Curriculum */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
          
          {Object.entries(videosByCategory).length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant glass-panel rounded-3xl">
              No videos available yet. Check back later!
            </div>
          ) : (
            Object.entries(videosByCategory).map(([category, modules], catIndex) => (
              <div key={category} className="mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-primary">{category}</h2>
                <div className="space-y-8">
                  {Object.entries(modules).map(([moduleName, videos], moduleIndex) => {
                    const totalInModule = videos.length;
                    const completedInModule = videos.filter(v => completedVideos.includes(v.id)).length;
                    const progressPercent = totalInModule > 0 ? Math.round((completedInModule / totalInModule) * 100) : 0;

                    return (
                      <motion.div 
                        key={moduleName}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: moduleIndex * 0.1 }}
                        className={`glass-panel rounded-3xl overflow-hidden ${isLocked ? 'opacity-75' : ''}`}
                      >
                        <div className="p-6 md:p-8 border-b border-outline-variant/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Module {moduleIndex + 1}</span>
                              {isLocked && <Lock className="w-4 h-4 text-outline" />}
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold">{moduleName}</h3>
                          </div>
                          {!isLocked && (
                            <div className="w-full md:w-48 shrink-0">
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-on-surface-variant font-medium">Progress</span>
                                <span className="font-bold text-primary">{progressPercent}%</span>
                              </div>
                              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4 md:p-6 grid grid-cols-1 gap-4 bg-surface-container-lowest/30">
                          {(videos as any[]).map((video, lessonIndex) => (
                            <div 
                              key={video.id} 
                              className={`relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 md:p-6 transition-all duration-300 group ${isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:border-primary/30 hover:bg-surface-container'}`}
                              onClick={() => {
                                if (!isLocked) navigate(`/lesson/${video.id}`);
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="flex items-center justify-between gap-4 relative z-10">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-colors duration-300 ${isLocked ? 'bg-surface-container-highest text-on-surface-variant' : completedVideos.includes(video.id) ? 'bg-primary text-on-primary-fixed shadow-[0_0_15px_rgba(var(--color-primary),0.4)]' : 'bg-primary/10 text-primary group-hover:bg-primary/20'}`}>
                                    {completedVideos.includes(video.id) ? <CheckCircle2 className="w-6 h-6" /> : lessonIndex + 1}
                                  </div>
                                  <div>
                                    <span className="font-bold text-lg text-on-surface block mb-1 group-hover:text-primary transition-colors">
                                      {video.title}
                                    </span>
                                    <span className="text-sm text-on-surface-variant flex items-center gap-1">
                                      <PlayCircle className="w-4 h-4" /> Video Lesson
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                  {isLocked ? (
                                    <Lock className="w-5 h-5 text-outline-variant" />
                                  ) : (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCompletion(video.id);
                                      }}
                                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${completedVideos.includes(video.id) ? 'bg-primary border-primary text-on-primary-fixed shadow-[0_0_10px_rgba(var(--color-primary),0.3)]' : 'border-outline-variant/30 hover:border-primary text-transparent hover:text-primary/50 hover:bg-primary/5'}`}
                                    >
                                      <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {/* Subtle progress bar at the bottom */}
                              {!isLocked && (
                                <div className="absolute bottom-0 left-0 h-1 bg-primary/10 w-full">
                                  <div className={`h-full bg-primary transition-all duration-700 ease-out ${completedVideos.includes(video.id) ? 'w-full' : 'w-0'}`}></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
      </div>
      <Footer />
    </>
  );
}
