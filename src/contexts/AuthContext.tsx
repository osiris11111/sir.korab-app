import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface UserData {
  uid: string;
  email: string;
  isAdmin: boolean;
  isPaid: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Fetch or create user document
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          let data: UserData;
          if (userSnap.exists()) {
            data = userSnap.data() as UserData;
          } else {
            // Check if email is preapproved
            let isPreapproved = false;
            if (user.email) {
              const preapprovedRef = doc(db, 'preapproved_emails', user.email);
              const preapprovedSnap = await getDoc(preapprovedRef);
              isPreapproved = preapprovedSnap.exists();
            }

            // Create new user
            const adminEmails = ['apolokor@gmail.com', 'joeykorab88@gmail.com'];
            const isAdmin = user.email ? adminEmails.includes(user.email) : false;
            data = {
              uid: user.uid,
              email: user.email || '',
              isAdmin: isAdmin,
              isPaid: isAdmin || isPreapproved, // Admins and preapproved get paid access automatically
            };
            await setDoc(userRef, data);
          }
          setUserData(data);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
