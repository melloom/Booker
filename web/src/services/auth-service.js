import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const dbFirestore = getFirestore();

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (email, password, role = 'user') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document with role
    await setDoc(doc(dbFirestore, 'users', userCredential.user.uid), {
      email: email,
      role: role,
      createdAt: new Date()
    });

    return userCredential.user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const getUserRole = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error('No user found');
      return 'user';
    }

    // First try to get from users collection
    const userDoc = await getDoc(doc(dbFirestore, 'users', user.uid));
    if (userDoc.exists()) {
      return userDoc.data().role || 'user';
    }

    // Then try admins collection
    const adminDoc = await getDoc(doc(dbFirestore, 'admins', user.uid));
    if (adminDoc.exists()) {
      return adminDoc.data().role || 'admin';
    }

    // Then try managers collection
    const managerDoc = await getDoc(doc(dbFirestore, 'managers', user.uid));
    if (managerDoc.exists()) {
      return managerDoc.data().role || 'manager';
    }

    // If user doesn't exist in any collection, create a new user document
    const defaultUserData = {
      email: user.email,
      role: 'user',
      createdAt: serverTimestamp(),
      firstName: user.displayName?.split(' ')[0] || '',
      lastName: user.displayName?.split(' ').slice(1).join(' ') || ''
    };

    await setDoc(doc(dbFirestore, 'users', user.uid), defaultUserData);
    return 'user';

  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user'; // Default to user role on error
  }
};

export const getAllUsers = async () => {
  try {
    const usersQuery = query(collection(dbFirestore, 'users'));
    const querySnapshot = await getDocs(usersQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const updateUserRole = async (userId, newRole) => {
  try {
    await setDoc(doc(dbFirestore, 'users', userId), {
      role: newRole
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}; 