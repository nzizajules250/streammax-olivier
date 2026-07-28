import { 
  db, collection, doc, setDoc, getDoc, getDocs, query, orderBy, 
  deleteDoc, updateDoc, arrayUnion, arrayRemove, onAuthStateChanged,
  auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut
} from './firebase';
import { Movie, User, Episode } from '../types';

// Movies Collection
const MOVIES_COLLECTION = 'movies';
const USERS_COLLECTION = 'users';

// ============ MOVIE OPERATIONS ============

export const getAllMovies = async (): Promise<Movie[]> => {
  try {
    const q = query(collection(db, MOVIES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const movies: Movie[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      movies.push({ 
        id: docSnap.id, 
        ...data,
        createdAt: data.createdAt || new Date().toISOString()
      } as Movie);
    });
    return movies;
  } catch (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }
};

export const getMovieById = async (id: string): Promise<Movie | null> => {
  try {
    const docRef = doc(db, MOVIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Movie;
    }
    return null;
  } catch (error) {
    console.error('Error fetching movie:', error);
    throw error;
  }
};

export const addMovie = async (movieData: Omit<Movie, 'id' | 'views' | 'likes' | 'createdAt'>): Promise<Movie> => {
  try {
    const newMovie = {
      ...movieData,
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    const docRef = doc(collection(db, MOVIES_COLLECTION));
    await setDoc(docRef, newMovie);
    return { id: docRef.id, ...newMovie } as Movie;
  } catch (error) {
    console.error('Error adding movie:', error);
    throw error;
  }
};

export const updateMovie = async (id: string, updates: Partial<Movie>): Promise<void> => {
  try {
    const docRef = doc(db, MOVIES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating movie:', error);
    throw error;
  }
};

export const deleteMovie = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, MOVIES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting movie:', error);
    throw error;
  }
};

export const incrementMovieViews = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, MOVIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentViews = docSnap.data().views || 0;
      await updateDoc(docRef, { views: currentViews + 1 });
    }
  } catch (error) {
    console.error('Error incrementing views:', error);
  }
};

export const toggleMovieLike = async (id: string, userId: string, currentLikes: number, isLiked: boolean): Promise<number> => {
  try {
    const docRef = doc(db, MOVIES_COLLECTION, id);
    const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
    await updateDoc(docRef, { 
      likes: newLikes,
      likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId)
    });
    return newLikes;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// ============ USER OPERATIONS ============

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const q = query(collection(db, USERS_COLLECTION));
    const snapshot = await getDocs(q);
    const users: User[] = [];
    snapshot.forEach((docSnap) => {
      users.push({ id: docSnap.id, ...docSnap.data() } as User);
    });
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  try {
    const newUser = {
      ...userData,
      createdAt: new Date().toISOString(),
      watchlist: userData.watchlist || [],
      history: userData.history || []
    };
    const docRef = doc(collection(db, USERS_COLLECTION));
    await setDoc(docRef, newUser);
    return { id: docRef.id, ...newUser } as User;
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const updateUserSubscription = async (userId: string, active: boolean, planId: string = 'gold'): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      'subscription.active': active,
      'subscription.planId': planId,
      'subscription.expiresAt': active ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
    });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
};

export const addToWatchlist = async (userId: string, movieId: string): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      watchlist: arrayUnion(movieId)
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
};

export const removeFromWatchlist = async (userId: string, movieId: string): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      watchlist: arrayRemove(movieId)
    });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
};

export const addToHistory = async (userId: string, movieId: string): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      history: arrayUnion(movieId)
    });
  } catch (error) {
    console.error('Error adding to history:', error);
    throw error;
  }
};

// ============ AUTH OPERATIONS ============

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signUp = async (email: string, password: string, username: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create user profile in Firestore
    await addUser({
      email,
      username,
      role: 'user',
      subscription: {
        active: false,
        planId: '',
        expiresAt: ''
      },
      watchlist: [],
      history: []
    });
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};