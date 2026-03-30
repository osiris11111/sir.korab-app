import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { db } from '../firebase';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  GripVertical,
  HelpCircle,
  Edit,
  Trash2,
  Paperclip
} from 'lucide-react';

function SortableVideoItem({ video, onEdit, onDelete, onManageQuiz }: { video: any, onEdit: any, onDelete: any, onManageQuiz: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-surface-container-high p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 relative z-10">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:flex-1">
        <div {...attributes} {...listeners} className="cursor-grab hover:text-primary p-1 sm:p-2 -ml-1 sm:-ml-2 shrink-0">
          <GripVertical className="w-5 h-5 text-on-surface-variant" />
        </div>
        {video.thumbnail && (
          <img src={video.thumbnail} alt="" className="w-12 h-9 sm:w-16 sm:h-12 object-cover rounded-lg shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-sm sm:text-base break-words line-clamp-2">{video.title}</h4>
          <span className="text-[10px] sm:text-xs text-secondary uppercase tracking-widest block truncate">{video.category} {video.module ? `• ${video.module}` : ''}</span>
          {video.resourceUrl && (
            <div className="text-[10px] sm:text-xs text-primary mt-1 flex items-center gap-1 truncate">
              <Paperclip className="w-3 h-3 shrink-0" />
              <span className="truncate">{video.resourceTitle || 'Resource Attached'}</span>
            </div>
          )}
          {video.quiz && video.quiz.length > 0 && (
            <div className="text-[10px] sm:text-xs text-purple-400 mt-1 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 shrink-0" />
              {video.quiz.length} Question{video.quiz.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-1 sm:gap-2 self-end sm:self-auto shrink-0 mt-2 sm:mt-0 w-full sm:w-auto justify-end border-t border-outline-variant/10 sm:border-0 pt-2 sm:pt-0">
        <button 
          onClick={() => onManageQuiz(video)}
          className="text-purple-500 hover:text-purple-400 p-2 sm:p-2 rounded-lg hover:bg-purple-500/10 transition-colors"
          title="Manage Quiz"
        >
          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button 
          onClick={() => onEdit(video)}
          className="text-blue-500 hover:text-blue-400 p-2 sm:p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
          title="Edit Video"
        >
          <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button 
          onClick={() => onDelete(video.id)}
          className="text-red-500 hover:text-red-400 p-2 sm:p-2 rounded-lg hover:bg-red-500/10 transition-colors"
          title="Delete Video"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  const { userData, loading } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [preapprovedEmails, setPreapprovedEmails] = useState<any[]>([]);
  const [confirmDeleteVideo, setConfirmDeleteVideo] = useState<string | null>(null);
  const [checkoutRequests, setCheckoutRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'users' | 'analytics'>('videos');
  const [newVideo, setNewVideo] = useState({ title: '', category: '', module: '', url: 'https://res.cloudinary.com/demo/video/upload/v1604052322/elephants.mp4', resourceTitle: '', resourceUrl: '', thumbnail: '', description: '' });
  const [thumbnailType, setThumbnailType] = useState<'url' | 'file'>('url');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [resourceType, setResourceType] = useState<'url' | 'file'>('url');
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [freeAccessEmail, setFreeAccessEmail] = useState('');

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [currentQuizVideo, setCurrentQuizVideo] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!loading && (!userData || !userData.isAdmin)) {
      navigate('/dashboard');
    }
  }, [userData, loading, navigate]);

  useEffect(() => {
    if (userData?.isAdmin) {
      fetchVideos();
      fetchUsers();
      fetchPreapprovedEmails();
      fetchCheckoutRequests();
    }
  }, [userData]);

  const fetchVideos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'videos'));
      const fetchedVideos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      fetchedVideos.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      setVideos(fetchedVideos);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'videos');
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  };

  const fetchPreapprovedEmails = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'preapproved_emails'));
      setPreapprovedEmails(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'preapproved_emails');
    }
  };

  const fetchCheckoutRequests = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'checkout_requests'));
      setCheckoutRequests(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'checkout_requests');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalThumbnailUrl = newVideo.thumbnail;
      let finalResourceUrl = newVideo.resourceUrl;

      if (thumbnailType === 'file' && thumbnailFile) {
        finalThumbnailUrl = await fileToBase64(thumbnailFile);
      }

      if (resourceType === 'file' && resourceFile) {
        finalResourceUrl = await fileToBase64(resourceFile);
      }

      const videoData = {
        ...newVideo,
        thumbnail: finalThumbnailUrl,
        resourceUrl: finalResourceUrl,
      };

      if (isEditing && editingId) {
        await updateDoc(doc(db, 'videos', editingId), {
          ...videoData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'videos'), {
          ...videoData,
          order: videos.length,
          createdAt: new Date().toISOString()
        });
      }

      setNewVideo({ title: '', category: '', module: '', url: 'https://res.cloudinary.com/demo/video/upload/v1604052322/elephants.mp4', resourceTitle: '', resourceUrl: '', thumbnail: '', description: '' });
      setThumbnailFile(null);
      setResourceFile(null);
      setIsEditing(false);
      setEditingId(null);
      fetchVideos();
    } catch (error) {
      console.error("Error saving video: ", error);
      handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'videos');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = videos.findIndex((v) => v.id === active.id);
      const newIndex = videos.findIndex((v) => v.id === over.id);

      const newVideos = arrayMove(videos, oldIndex, newIndex);
      setVideos(newVideos);

      try {
        const updatePromises = newVideos.map((video, index) => 
          updateDoc(doc(db, 'videos', video.id), { order: index })
        );
        await Promise.all(updatePromises);
      } catch (error) {
        console.error("Error updating video order:", error);
        handleFirestoreError(error, OperationType.UPDATE, 'videos');
      }
    }
  };

  const handleEditClick = (video: any) => {
    setNewVideo({
      title: video.title || '',
      category: video.category || '',
      module: video.module || '',
      url: video.url || '',
      resourceTitle: video.resourceTitle || '',
      resourceUrl: video.resourceUrl || '',
      thumbnail: video.thumbnail || '',
      description: video.description || ''
    });
    setThumbnailType('url');
    setResourceType('url');
    setThumbnailFile(null);
    setResourceFile(null);
    setIsEditing(true);
    setEditingId(video.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setNewVideo({ title: '', category: '', module: '', url: 'https://res.cloudinary.com/demo/video/upload/v1604052322/elephants.mp4', resourceTitle: '', resourceUrl: '', thumbnail: '', description: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleManageQuizClick = (video: any) => {
    setCurrentQuizVideo(video);
    setQuizQuestions(video.quiz || []);
    setIsQuizModalOpen(true);
  };

  const handleSaveQuiz = async () => {
    if (!currentQuizVideo) return;
    try {
      await updateDoc(doc(db, 'videos', currentQuizVideo.id), {
        quiz: quizQuestions
      });
      setIsQuizModalOpen(false);
      fetchVideos();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `videos/${currentQuizVideo.id}`);
    }
  };

  const addQuestion = () => {
    setQuizQuestions([...quizQuestions, { text: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...quizQuestions];
    newQuestions[index][field] = value;
    setQuizQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...quizQuestions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuizQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = quizQuestions.filter((_, i) => i !== index);
    setQuizQuestions(newQuestions);
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: true,
        isPaid: true
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating user: ", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freeAccessEmail) return;

    const emailToGrant = freeAccessEmail.toLowerCase().trim();

    try {
      const userToUpdate = users.find(u => u.email.toLowerCase() === emailToGrant);
      if (userToUpdate) {
        await updateDoc(doc(db, 'users', userToUpdate.id), {
          isPaid: true
        });
      } else {
        await setDoc(doc(db, 'preapproved_emails', emailToGrant), {
          email: emailToGrant,
          grantedAt: new Date().toISOString()
        });
      }
      setFreeAccessEmail('');
      fetchUsers();
      fetchPreapprovedEmails();
      // Using a simple alert for now, could be replaced with a toast
      alert(`Granted free access to ${emailToGrant}`);
    } catch (error) {
      console.error("Error granting access: ", error);
      alert("Error granting access. Check console.");
      handleFirestoreError(error, OperationType.UPDATE, 'users/preapproved_emails');
    }
  };

  if (loading || !userData?.isAdmin) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface text-on-surface p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-headline font-black text-4xl md:text-5xl mb-8 md:mb-12 uppercase tracking-tighter">Admin <span className="text-primary">Panel</span></h1>
        
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${activeTab === 'videos' ? 'bg-primary text-on-primary-fixed' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
          >
            Manage Videos
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${activeTab === 'users' ? 'bg-primary text-on-primary-fixed' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
          >
            User Management
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${activeTab === 'analytics' ? 'bg-primary text-on-primary-fixed' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
          >
            Analytics
          </button>
        </div>

        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
            {/* Video Management */}
          <div className="bg-surface-container rounded-3xl p-4 sm:p-6 md:p-8">
            <h2 className="font-headline font-bold text-2xl md:text-3xl mb-6">{isEditing ? 'Edit Video' : 'Add Video'}</h2>
            <form onSubmit={handleSaveVideo} className="space-y-4 mb-8">
              <input 
                type="text" 
                placeholder="Video Title" 
                value={newVideo.title}
                onChange={e => setNewVideo({...newVideo, title: e.target.value})}
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary"
                required
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <select 
                  value={newVideo.category}
                  onChange={e => setNewVideo({...newVideo, category: e.target.value})}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Viral Reels">Viral Reels</option>
                  <option value="UGC">UGC</option>
                  <option value="Branding">Branding</option>
                  <option value="Content Strategy">Content Strategy</option>
                  <option value="Monetization">Monetization</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Module Name (e.g. Hook Mastery)" 
                  value={newVideo.module}
                  onChange={e => setNewVideo({...newVideo, module: e.target.value})}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <input 
                type="url" 
                placeholder="Cloudinary Video URL" 
                value={newVideo.url}
                onChange={e => setNewVideo({...newVideo, url: e.target.value})}
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary"
                required
              />
              <textarea
                placeholder="Video Description & Chapters (e.g. [02:15] - Understanding React Hooks)"
                value={newVideo.description}
                onChange={e => setNewVideo({...newVideo, description: e.target.value})}
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary min-h-[100px] resize-y"
              />
              
              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-on-surface-variant">Thumbnail</label>
                  <select 
                    value={thumbnailType}
                    onChange={(e) => setThumbnailType(e.target.value as 'url' | 'file')}
                    className="bg-surface-container-high border border-outline-variant/30 rounded-lg px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="url">URL</option>
                    <option value="file">Upload File</option>
                  </select>
                </div>
                {thumbnailType === 'url' ? (
                  <input 
                    type="url" 
                    placeholder="Thumbnail URL (Optional)" 
                    value={newVideo.thumbnail}
                    onChange={e => setNewVideo({...newVideo, thumbnail: e.target.value})}
                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary"
                  />
                ) : (
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setThumbnailFile(e.target.files?.[0] || null)}
                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary-fixed hover:file:bg-primary/90"
                  />
                )}
              </div>

              {/* Resource Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-on-surface-variant">Resource (Optional)</label>
                  <select 
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value as 'url' | 'file')}
                    className="bg-surface-container-high border border-outline-variant/30 rounded-lg px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="url">URL</option>
                    <option value="file">Upload File</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  placeholder="Resource Title (e.g. PDF Guide)" 
                  value={newVideo.resourceTitle}
                  onChange={e => setNewVideo({...newVideo, resourceTitle: e.target.value})}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary mb-2"
                />
                {resourceType === 'url' ? (
                  <input 
                    type="url" 
                    placeholder="Resource URL" 
                    value={newVideo.resourceUrl}
                    onChange={e => setNewVideo({...newVideo, resourceUrl: e.target.value})}
                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary"
                  />
                ) : (
                  <input 
                    type="file" 
                    onChange={e => setResourceFile(e.target.files?.[0] || null)}
                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary-fixed hover:file:bg-primary/90"
                  />
                )}
              </div>

              <div className="flex gap-4">
                <button type="submit" disabled={isSaving} className="flex-1 kinetic-gradient-primary text-on-primary-fixed px-6 py-4 rounded-xl font-headline font-bold tracking-widest uppercase shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100">
                  {isSaving ? 'Saving...' : (isEditing ? 'Update Video' : 'Add Video')}
                </button>
                {isEditing && (
                  <button type="button" onClick={handleCancelEdit} className="px-6 py-4 rounded-xl font-headline font-bold tracking-widest uppercase border border-outline-variant/30 hover:bg-surface-container transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Existing Videos List */}
          <div className="bg-surface-container rounded-3xl p-4 sm:p-6 md:p-8">
            <h3 className="font-headline font-bold text-2xl mb-4">Existing Videos</h3>
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={videos.map(v => v.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {videos.map(video => (
                    <SortableVideoItem 
                      key={video.id} 
                      video={video} 
                      onEdit={handleEditClick}
                      onManageQuiz={handleManageQuizClick}
                      onDelete={async (id: string) => {
                        setConfirmDeleteVideo(id);
                      }}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>
          </div>
        )}

        {/* User Management */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 gap-6 lg:gap-12">
              <div className="bg-surface-container rounded-3xl p-4 sm:p-6 md:p-8">
                <h2 className="font-headline font-bold text-2xl md:text-3xl mb-6">User Management</h2>
            
            <form onSubmit={handleGrantAccess} className="flex flex-col sm:flex-row gap-4 mb-8">
              <input 
                type="email" 
                placeholder="User Email for Free Access" 
                value={freeAccessEmail}
                onChange={e => setFreeAccessEmail(e.target.value)}
                className="flex-1 w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary"
                required
              />
              <button type="submit" className="w-full sm:w-auto kinetic-gradient-primary text-on-primary-fixed px-6 py-3 rounded-xl font-headline font-bold tracking-widest uppercase shadow-lg hover:scale-[1.02] transition-transform whitespace-nowrap">
                Grant Access
              </button>
            </form>

            <h3 className="font-headline font-bold text-xl mb-4">All Users & Granted Access</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 mb-8">
              {/* Pre-approved emails first */}
              {preapprovedEmails.map(item => (
                <div key={item.id} className="bg-surface-container-high p-4 rounded-xl flex justify-between items-center border border-secondary/30">
                  <div className="break-all">
                    <h4 className="font-bold">{item.email}</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-md uppercase tracking-widest font-bold">Access Granted (Pending Signup)</span>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await deleteDoc(doc(db, 'preapproved_emails', item.id));
                        fetchPreapprovedEmails();
                      } catch (error) {
                        handleFirestoreError(error, OperationType.DELETE, `preapproved_emails/${item.id}`);
                      }
                    }}
                    className="text-red-500 hover:text-red-400 p-2"
                    title="Revoke Access"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))}

              {/* Registered users */}
              {users.map(user => (
                <div key={user.id} className="bg-surface-container-high p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="break-all">
                    <h4 className="font-bold">{user.email}</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user.isAdmin && <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md uppercase tracking-widest font-bold">Admin</span>}
                      {user.isPaid && <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-md uppercase tracking-widest font-bold">Paid</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {!user.isAdmin && (
                      <button 
                        onClick={() => handleMakeAdmin(user.id)}
                        className="flex-1 sm:flex-none liquid-glass border border-outline-variant/30 px-4 py-2 rounded-lg text-sm font-bold hover:bg-surface-container transition-colors whitespace-nowrap"
                      >
                        Make Admin
                      </button>
                    )}
                    {user.isPaid && !user.isAdmin && (
                      <button 
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'users', user.id), { isPaid: false });
                            fetchUsers();
                          } catch (error) {
                            handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
                          }
                        }}
                        className="flex-1 sm:flex-none bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-colors whitespace-nowrap"
                        title="Revoke Paid Access"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Requests */}
          <div className="bg-surface-container rounded-3xl p-6 md:p-8">
            <h2 className="font-headline font-bold text-2xl md:text-3xl mb-6">Checkout Requests</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {checkoutRequests.length === 0 ? (
                <p className="text-on-surface-variant">No checkout requests found.</p>
              ) : (
                checkoutRequests.map(request => (
                  <div key={request.id} className="bg-surface-container-high p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="break-all">
                      <h4 className="font-bold">{request.name}</h4>
                      <p className="text-sm text-on-surface-variant">{request.email}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md uppercase tracking-widest font-bold">
                          {request.paymentMethod}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-md uppercase tracking-widest font-bold ${request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <button 
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'checkout_requests', request.id), { status: 'completed' });
                            // Also grant access
                            const userToUpdate = users.find(u => u.email === request.email);
                            if (userToUpdate) {
                              await updateDoc(doc(db, 'users', userToUpdate.id), { isPaid: true });
                            } else {
                              await setDoc(doc(db, 'preapproved_emails', request.email), {
                                email: request.email,
                                grantedAt: new Date().toISOString()
                              });
                            }
                            fetchCheckoutRequests();
                            fetchUsers();
                            fetchPreapprovedEmails();
                            alert(`Granted access to ${request.email}`);
                          } catch (error) {
                            console.error("Error processing request:", error);
                            alert("Error processing request.");
                            handleFirestoreError(error, OperationType.UPDATE, `checkout_requests/${request.id}`);
                          }
                        }}
                        className="w-full sm:w-auto kinetic-gradient-primary text-on-primary-fixed px-4 py-2 rounded-lg text-sm font-bold hover:scale-[1.02] transition-transform whitespace-nowrap"
                      >
                        Approve & Grant Access
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="bg-surface-container rounded-3xl p-4 sm:p-6 md:p-8">
            <h2 className="font-headline font-bold text-2xl md:text-3xl mb-6">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/20">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Total Active Users</h3>
                <p className="text-4xl font-black text-primary">{users.length}</p>
              </div>
              <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/20">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Total Videos</h3>
                <p className="text-4xl font-black text-secondary">{videos.length}</p>
              </div>
              <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/20">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Avg Quiz Score</h3>
                <p className="text-4xl font-black text-purple-400">
                  {users.reduce((acc, user) => {
                    if (!user.quizScores) return acc;
                    const scores = Object.values(user.quizScores) as number[];
                    if (scores.length === 0) return acc;
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    return acc === 0 ? avg : (acc + avg) / 2;
                  }, 0).toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/20">
                <h3 className="text-lg font-bold mb-4">Daily Video Views (Last 7 Days)</h3>
                <div className="h-64 flex items-end gap-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Mon', views: 45 },
                        { name: 'Tue', views: 62 },
                        { name: 'Wed', views: 38 },
                        { name: 'Thu', views: 85 },
                        { name: 'Fri', views: 54 },
                        { name: 'Sat', views: 92 },
                        { name: 'Sun', views: 76 },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="views" fill="#F27D26" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-surface-container-high p-6 rounded-2xl border border-outline-variant/20">
                <h3 className="text-lg font-bold mb-4">Most Watched Videos</h3>
                <div className="space-y-4">
                  {[...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((v, i) => (
                    <div key={v.id} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface-variant shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 truncate">
                        <p className="font-bold text-sm truncate">{v.title}</p>
                        <p className="text-xs text-on-surface-variant">{v.category}</p>
                      </div>
                      <div className="text-sm font-bold text-primary">
                        {v.views || 0} views
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Quiz Modal */}
      {isQuizModalOpen && currentQuizVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container rounded-3xl p-6 md:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline font-bold text-2xl">Manage Quiz: {currentQuizVideo.title}</h2>
              <button onClick={() => setIsQuizModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-8">
              {quizQuestions.map((q, qIndex) => (
                <div key={qIndex} className="bg-surface-container-high p-4 rounded-xl border border-outline-variant/30 relative">
                  <button 
                    onClick={() => removeQuestion(qIndex)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-400"
                    title="Remove Question"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                  
                  <div className="mb-4 pr-8">
                    <label className="block text-sm font-bold text-on-surface-variant mb-2">Question {qIndex + 1}</label>
                    <input 
                      type="text" 
                      value={q.text}
                      onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                      placeholder="Enter question text"
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-on-surface-variant">Options (Select the correct one)</label>
                    {q.options.map((opt: string, oIndex: number) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name={`correct-${qIndex}`} 
                          checked={q.correctAnswer === oIndex}
                          onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                          className="w-5 h-5 text-primary focus:ring-primary bg-surface-container border-outline-variant"
                        />
                        <input 
                          type="text" 
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button 
                onClick={addQuestion}
                className="w-full py-4 border-2 border-dashed border-outline-variant/50 rounded-xl text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 font-bold"
              >
                <span className="material-symbols-outlined">add</span>
                Add Question
              </button>
            </div>

            <div className="mt-8 flex gap-4 justify-end">
              <button 
                onClick={() => setIsQuizModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveQuiz}
                className="kinetic-gradient-primary text-on-primary-fixed px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform"
              >
                Save Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Video Modal */}
      {confirmDeleteVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-outline-variant/20">
            <h2 className="text-2xl font-bold mb-4 text-on-surface">Confirm Deletion</h2>
            <p className="text-on-surface-variant mb-8">
              Are you sure you want to delete this video? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDeleteVideo(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await deleteDoc(doc(db, 'videos', confirmDeleteVideo));
                    fetchVideos();
                  } catch (error) {
                    handleFirestoreError(error, OperationType.DELETE, `videos/${confirmDeleteVideo}`);
                  }
                  setConfirmDeleteVideo(null);
                }}
                className="px-6 py-2.5 rounded-xl font-bold bg-error text-on-error hover:bg-error/90 transition-colors shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
