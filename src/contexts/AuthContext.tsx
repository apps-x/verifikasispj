import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  linkWithPopup,
  signOut, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  driveToken: string | null;
  signIn: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>;
  logOut: () => Promise<void>;
  connectDrive: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [driveToken, setDriveToken] = useState<string | null>(localStorage.getItem('google_drive_token'));

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      
      // Cleanup previous listener
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setUser(user);
      if (user) {
        // Fetch or create profile
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'User',
            role: 'user', // Default to user
            createdAt: Date.now()
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }
        
        console.log('Starting profile listener for UID:', user.uid, 'Email:', user.email);
        // Listen for profile changes (role updates, etc)
        unsubProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            console.log('Profile update received for role:', doc.data()?.role);
            setProfile(doc.data() as UserProfile);
          } else {
            console.warn('Profile document does not exist yet');
          }
        }, (error) => {
          console.error("Profile listener error details (UID: " + user.uid + "):", error);
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        localStorage.setItem('google_drive_token', token);
        setDriveToken(token);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const connectDrive = async () => {
    if (!auth.currentUser) return;
    
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    
    try {
      // linkWithPopup adds the Google scope to the current account without switching users
      const result = await linkWithPopup(auth.currentUser, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        localStorage.setItem('google_drive_token', token);
        setDriveToken(token);
      }
    } catch (error: any) {
      // If already linked, we just need to get the token via signInWithPopup but for the SAME user
      // or handle the already-linked error by just signing in again but specifically for scopes.
      if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/provider-already-linked') {
        try {
          const result = await signInWithPopup(auth, provider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential?.accessToken;
          if (token) {
            localStorage.setItem('google_drive_token', token);
            setDriveToken(token);
          }
        } catch (reErr) {
          console.error('Re-sign in for scopes failed:', reErr);
        }
      } else {
        console.error('Connect Drive error:', error);
        throw error;
      }
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('google_drive_token');
      setDriveToken(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  };

  const signUpEmail = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      // Immediately set profile to ensure display name is ready
      const userRef = doc(db, 'users', result.user.uid);
      const newProfile: UserProfile = {
        uid: result.user.uid,
        email: email,
        displayName: name,
        role: 'user',
        createdAt: Date.now()
      };
      await setDoc(userRef, newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      driveToken, 
      signIn, 
      signInEmail, 
      signUpEmail, 
      logOut,
      connectDrive
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
