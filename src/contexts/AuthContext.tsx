import React, { createContext, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { toast } from 'sonner';

interface UserData {
  userId: string;
  botToken: string;
  hasSetupTemplates: boolean;
  createdAt: number;
  updatedAt: number;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  updateBotToken: (token: string) => Promise<void>;
  setupDefaultTemplates: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        await loadUserData(u.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loadUserData = async (uid: string) => {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      setUserData(snap.data() as UserData);
    } else {
      // Create new user record
      const newData: Omit<UserData, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        userId: uid,
        botToken: '',
        hasSetupTemplates: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, newData);
      const updatedSnap = await getDoc(userRef);
      setUserData(updatedSnap.data() as UserData);
    }
  };

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      toast.error(e.message || 'Error signing in');
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const updateBotToken = async (token: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { botToken: token, updatedAt: serverTimestamp() }, { merge: true });
      await loadUserData(user.uid);
      toast.success('¡Token del bot actualizado de forma segura!');
    } catch (e: any) {
      toast.error('No se pudo guardar el token.');
    }
  };

  const setupDefaultTemplates = async (force: boolean = false) => {
     if (!user || (!force && userData?.hasSetupTemplates)) return;
     try {
       const { TEMPLATES } = await import('../data/templates');
       const { collection, addDoc, writeBatch } = await import('firebase/firestore');
       
       const batch = writeBatch(db);
       const modulesRef = collection(db, 'modules');

       for (const template of TEMPLATES) {
         const newDocRef = doc(modulesRef);
         batch.set(newDocRef, {
           userId: user.uid,
           name: template.name,
           type: template.type,
           nodes: template.nodes,
           edges: template.edges,
           createdAt: serverTimestamp(),
           updatedAt: serverTimestamp()
         });
       }

       const userRef = doc(db, 'users', user.uid);
       batch.update(userRef, { hasSetupTemplates: true, updatedAt: serverTimestamp() });

       await batch.commit();
       await loadUserData(user.uid);
       toast.success('¡Plantillas por defecto cargadas con éxito!');
     } catch (e: any) {
       console.error(e);
       toast.error('Error al cargar las plantillas.');
     }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signIn, logOut, updateBotToken, setupDefaultTemplates }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
