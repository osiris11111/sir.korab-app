import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { PlayCircle, CheckCircle2, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, query, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CategoryDetail() {
  const { categoryName } = useParams();
  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryName) return;
      try {
        const q = query(collection(db, 'videos'), where('category', '==', categoryName));
        const querySnapshot = await getDocs(q);
        const fetchedVideos: any[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVideos(fetchedVideos);

        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().completedVideos) {
            setCompletedVideos(userDoc.data().completedVideos || []);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        handleFirestoreError(error, OperationType.LIST, `videos`);
      } finally {
        setFetching(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser, categoryName]);

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
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </>
    );
  }

  const isLocked = !userData?.isPaid && !userData?.isAdmin;
  const totalInModule = videos.length;
  const completedInModule = videos.filter(v => completedVideos.includes(v.id)).length;
  const progressPercent = totalInModule > 0 ? Math.round((completedInModule / totalInModule) * 100) : 0;

  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-8 flex items-center gap-4">
            <Link to="/categories" className="text-on-surface-variant hover:text-on-surface transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold">{categoryName}</h1>
          </div>

          <div className="space-y-8">
            {progressPercent === 100 && !isLocked && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full p-6 bg-primary/10 border border-primary/50 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(var(--primary),0.15)]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary">Course Completed!</h3>
                    <p className="text-on-surface-variant text-sm">You have successfully mastered all lessons in this module.</p>
                  </div>
                </div>
                <div className="px-6 py-2 bg-primary text-on-primary-fixed font-bold rounded-full text-sm uppercase tracking-wider shrink-0">
                  Mastered
                </div>
              </motion.div>
            )}
            
            {videos.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant glass-panel rounded-3xl">
                No videos available in this category yet.
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-panel rounded-3xl overflow-hidden ${isLocked ? 'opacity-75' : ''}`}
              >
                <div className="p-6 md:p-8 border-b border-outline-variant/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Module</span>
                      {isLocked && <Lock className="w-4 h-4 text-outline" />}
                    </div>
                  </div>
                  {!isLocked && (
                    <div className="w-full md:w-64 shrink-0 flex flex-col items-end">
                      <div className="w-full">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-on-surface-variant font-medium">Progress</span>
                          <span className="font-bold text-primary">{progressPercent}%</span>
                        </div>
                        <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 md:p-6 grid grid-cols-1 gap-4 bg-surface-container-lowest/30">
                  {videos.map((video, lIdx) => (
                    <div 
                      key={video.id} 
                      className={`relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 md:p-6 transition-all duration-300 ${isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-primary/30 hover:bg-surface-container'}`}
                      onClick={() => {
                        if (!isLocked) navigate(`/lesson/${video.id}`);
                      }}
                    >
                      <div className="flex items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${isLocked ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-primary/10 text-primary'}`}>
                            {lIdx + 1}
                          </div>
                          <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 hidden sm:block border border-outline-variant/20 bg-surface-container-highest">
                            <img 
                              src={video.thumbnail || `https://picsum.photos/seed/${video.id}/300/200?blur=1`} 
                              alt={video.title} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayCircle className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <span className="font-bold text-lg text-on-surface block mb-1">
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
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${completedVideos.includes(video.id) ? 'bg-primary border-primary text-on-primary-fixed' : 'border-outline-variant/50 hover:border-primary text-transparent hover:text-primary/50'}`}
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                      {!isLocked && (
                        <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
                          <div className={`h-full bg-primary transition-all duration-500 ${completedVideos.includes(video.id) ? 'w-full' : 'w-0'}`}></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
