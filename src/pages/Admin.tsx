import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Admin() {
  const { userData, loading } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [preapprovedEmails, setPreapprovedEmails] = useState<any[]>([]);
  const [checkoutRequests, setCheckoutRequests] = useState<any[]>([]);
  const [newVideo, setNewVideo] = useState({ title: '', category: '', module: '', url: 'https://res.cloudinary.com/demo/video/upload/v1604052322/elephants.mp4', resourceTitle: '', resourceUrl: '' });
  const [freeAccessEmail, setFreeAccessEmail] = useState('');

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
      setVideos(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'videos'), {
        ...newVideo,
        createdAt: new Date().toISOString()
      });
      setNewVideo({ title: '', category: '', module: '', url: 'https://res.cloudinary.com/demo/video/upload/v1604052322/elephants.mp4', resourceTitle: '', resourceUrl: '' });
      fetchVideos();
    } catch (error) {
      console.error("Error adding video: ", error);
      handleFirestoreError(error, OperationType.CREATE, 'videos');
    }
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Video Management */}
          <div className="bg-surface-container rounded-3xl p-4 sm:p-6 md:p-8">
            <h2 className="font-headline font-bold text-2xl md:text-3xl mb-6">Add Video</h2>
            <form onSubmit={handleAddVideo} className="space-y-4 mb-8">
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
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="Resource Title (Optional, e.g. PDF Guide)" 
                  value={newVideo.resourceTitle}
                  onChange={e => setNewVideo({...newVideo, resourceTitle: e.target.value})}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary"
                />
                <input 
                  type="url" 
                  placeholder="Resource URL (Optional)" 
                  value={newVideo.resourceUrl}
                  onChange={e => setNewVideo({...newVideo, resourceUrl: e.target.value})}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <button type="submit" className="w-full kinetic-gradient-primary text-on-primary-fixed px-6 py-4 rounded-xl font-headline font-bold tracking-widest uppercase shadow-lg hover:scale-[1.02] transition-transform">
                Add Video
              </button>
            </form>

            <h3 className="font-headline font-bold text-2xl mb-4">Existing Videos</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {videos.map(video => (
                <div key={video.id} className="bg-surface-container-high p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-bold">{video.title}</h4>
                    <span className="text-xs text-secondary uppercase tracking-widest">{video.category} {video.module ? `• ${video.module}` : ''}</span>
                    {video.resourceUrl && (
                      <div className="text-xs text-primary mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">attach_file</span>
                        {video.resourceTitle || 'Resource Attached'}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await deleteDoc(doc(db, 'videos', video.id));
                        fetchVideos();
                      } catch (error) {
                        handleFirestoreError(error, OperationType.DELETE, `videos/${video.id}`);
                      }
                    }}
                    className="text-red-500 hover:text-red-400 self-end sm:self-auto"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* User Management */}
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
        </div>

        {/* Checkout Requests */}
        <div className="mt-12 bg-surface-container rounded-3xl p-6 md:p-8">
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
      </div>
      <Footer />
    </>
  );
}
