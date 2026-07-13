import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { 
  Home, Film, Search, User as UserIcon, ShieldCheck, Heart, Sparkles, 
  ArrowRight, PlayCircle, Star, Calendar, Clock, Compass, Zap, TrendingUp,
  Award, Monitor, Smartphone, Tablet, Globe, ChevronUp
} from 'lucide-react';

import { Movie, User, ActiveTab, ToastMessage, ViewMode } from './types';
import { INITIAL_MOVIES, GENRES } from './data/mockMovies';

// Firebase Integrations
import { 
  collection, doc, setDoc, getDocs, updateDoc, deleteDoc, 
  onSnapshot, getDocFromServer, query, where, orderBy, limit,
  writeBatch, increment, serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';

// Lazy-loaded components for performance
const Navbar = lazy(() => import('./components/Navbar'));
const HeroSection = lazy(() => import('./components/HeroSection'));
const MovieCard = lazy(() => import('./components/MovieCard'));
const MovieDetailModal = lazy(() => import('./components/MovieDetailModal'));
const SubscriptionModal = lazy(() => import('./components/SubscriptionModal'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const VideoPlayerPage = lazy(() => import('./components/VideoPlayerPage'));
const ToastContainer = lazy(() => import('./components/Toast'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
      <Film className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    </div>
  </div>
);

// Scroll to top button component
const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 md:bottom-8 right-8 z-50 p-3 bg-emerald-400 text-black rounded-full shadow-lg hover:shadow-emerald-400/20 transition-all hover:scale-110 active:scale-95"
    >
      <ChevronUp className="w-6 h-6" />
    </button>
  );
};

// Debounce utility
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// Local storage hook
const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

// Analytics tracker
const useAnalytics = () => {
  const trackEvent = useCallback((eventName: string, data?: Record<string, any>) => {
    // Implement analytics tracking
    console.log(`[Analytics] ${eventName}:`, data);
  }, []);

  return { trackEvent };
};

export default function App() {
  // --- Core Application States ---
  const [movies, setMovies] = useState<Movie[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [currentPlayingMovie, setCurrentPlayingMovie] = useState<Movie | null>(null);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // --- Filtering States ---
  const [genreFilter, setGenreFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'movie' | 'series' | 'upcoming'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular' | 'rating'>('newest');

  // --- UI Preferences (persisted) ---
  const [prefersReducedMotion, setPrefersReducedMotion] = useLocalStorage('prefersReducedMotion', false);
  const [autoplayTrailers, setAutoplayTrailers] = useLocalStorage('autoplayTrailers', true);

  // --- Refs ---
  const mainContentRef = useRef<HTMLDivElement>(null);
  const previousRoute = useRef<ActiveTab>('home');

  // --- Hooks ---
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { trackEvent } = useAnalytics();

  // --- Connection & Health Check ---
  const testConnection = async () => {
    try {
      const startTime = performance.now();
      await getDocFromServer(doc(db, 'test', 'connection'));
      const latency = Math.round(performance.now() - startTime);
      console.log(`Firebase connection established (${latency}ms)`);
      return true;
    } catch (error) {
      console.error('Firebase connection failed:', error);
      return false;
    }
  };

  // --- Movie Data Synchronization ---
  useEffect(() => {
    const initializeMovies = async () => {
      setIsLoading(true);
      
      // Subscribe to real-time movies
      const q = query(collection(db, 'movies'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
          console.log('Seeding initial movie catalog...');
          const batch = writeBatch(db);
          
          INITIAL_MOVIES.forEach((movie) => {
            const movieRef = doc(db, 'movies', movie.id);
            batch.set(movieRef, {
              ...movie,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          });
          
          try {
            await batch.commit();
            console.log('Movie catalog seeded successfully');
            trackEvent('movies_seeded', { count: INITIAL_MOVIES.length });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'movies');
          }
        } else {
          const loadedMovies: Movie[] = [];
          snapshot.forEach((docSnap) => {
            loadedMovies.push({ id: docSnap.id, ...docSnap.data() } as Movie);
          });
          setMovies(loadedMovies);
          trackEvent('movies_loaded', { count: loadedMovies.length });
        }
        
        setIsLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'movies');
        setIsLoading(false);
      });

      return () => unsubscribe();
    };

    testConnection().then(initializeMovies);
  }, [trackEvent]);

  // --- Authentication State ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Get custom claims for role verification
        const tokenResult = await getIdTokenResult(authUser, true);
        const isAdmin = tokenResult.claims.role === 'admin';

        const unsubscribeProfile = onSnapshot(doc(db, 'users', authUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            setCurrentUser({
              ...userData,
              id: authUser.uid,
              role: isAdmin ? 'admin' : userData.role || 'user',
            });
            trackEvent('user_session_restored', { userId: authUser.uid });
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${authUser.uid}`);
        });

        return () => unsubscribeProfile();
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [trackEvent]);

  // --- Admin Users List ---
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      setUsers([]);
      return;
    }

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers: User[] = [];
      snapshot.forEach((docSnap) => {
        allUsers.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
      setUsers(allUsers);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => unsubscribe();
  }, [currentUser?.role]);

  // --- Route Change Tracking ---
  useEffect(() => {
    trackEvent('route_changed', { 
      from: previousRoute.current, 
      to: activeTab 
    });
    previousRoute.current = activeTab;
    
    // Scroll to top on route change
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, trackEvent]);

  // --- Toast Manager ---
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]); // Keep max 5 toasts
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // --- User State Sync ---
  const syncUserState = useCallback(async (updatedUser: User) => {
    try {
      const userRef = doc(db, 'users', updatedUser.id);
      await setDoc(userRef, {
        ...updatedUser,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${updatedUser.id}`);
      throw err;
    }
  }, []);

  // --- Authentication Handlers ---
  const handleLoginSuccess = useCallback((user: User) => {
    addToast(`Welcome back, ${user.username}! 🎬`, 'success');
    setActiveTab('home');
    trackEvent('user_login', { userId: user.id });
  }, [addToast, trackEvent]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      addToast('See you soon! 👋', 'info');
      setActiveTab('home');
      trackEvent('user_logout');
    } catch (err: any) {
      addToast(err.message || 'Failed to logout', 'error');
    }
  }, [addToast, trackEvent]);

  // --- Subscription Management ---
  const handleSubscribe = useCallback(async (planId: string, planName: string) => {
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      subscription: {
        active: true,
        planId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
      }
    };

    try {
      await syncUserState(updatedUser);
      addToast(`🎉 Welcome to ${planName}! Enjoy unlimited streaming!`, 'success');
      setIsSubscriptionOpen(false);
      trackEvent('subscription_activated', { planId, planName });
    } catch (err: any) {
      addToast('Failed to activate subscription. Please try again.', 'error');
    }
  }, [currentUser, syncUserState, addToast, trackEvent]);

  // --- Content Interactions ---
  const handleLikeToggle = useCallback(async (movieId: string) => {
    if (!currentUser) {
      addToast('Sign in to save your favorites! ❤️', 'warning');
      setActiveTab('auth');
      return;
    }

    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;

    const isLiked = currentUser.watchlist?.includes(movieId);
    const updatedWatchlist = isLiked
      ? currentUser.watchlist.filter(id => id !== movieId)
      : [...(currentUser.watchlist || []), movieId];

    const updatedUser: User = {
      ...currentUser,
      watchlist: updatedWatchlist
    };

    try {
      // Batch update for consistency
      const batch = writeBatch(db);
      
      // Update user watchlist
      batch.set(doc(db, 'users', currentUser.id), {
        watchlist: updatedWatchlist,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      // Update movie likes count
      batch.update(doc(db, 'movies', movieId), {
        likes: increment(isLiked ? -1 : 1),
      });

      await batch.commit();
      
      addToast(
        isLiked ? 'Removed from favorites' : 'Added to favorites! ❤️',
        isLiked ? 'info' : 'success'
      );
      
      trackEvent(isLiked ? 'movie_unliked' : 'movie_liked', { movieId });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `movies/${movieId}`);
    }
  }, [currentUser, movies, addToast, trackEvent]);

  const handleWatchlistToggle = useCallback(async (movieId: string) => {
    if (!currentUser) {
      addToast('Sign in to manage your watchlist!', 'warning');
      setActiveTab('auth');
      return;
    }

    const isWatchlisted = currentUser.watchlist?.includes(movieId);
    const updatedWatchlist = isWatchlisted
      ? currentUser.watchlist.filter(id => id !== movieId)
      : [...(currentUser.watchlist || []), movieId];

    const updatedUser: User = {
      ...currentUser,
      watchlist: updatedWatchlist
    };
    
    try {
      await syncUserState(updatedUser);
      addToast(
        isWatchlisted ? 'Removed from watchlist' : 'Added to watchlist! 📺',
        isWatchlisted ? 'info' : 'success'
      );
      trackEvent(isWatchlisted ? 'watchlist_remove' : 'watchlist_add', { movieId });
    } catch (err: any) {
      addToast('Failed to update watchlist', 'error');
    }
  }, [currentUser, syncUserState, addToast, trackEvent]);

  // --- Video Playback ---
  const handlePlayMovie = useCallback(async (movie: Movie) => {
    if (!currentUser) {
      addToast('Authentication required to stream movies!', 'warning');
      setActiveTab('auth');
      return;
    }

    if (!currentUser.subscription?.active) {
      addToast('VIP subscription required for streaming! 🌟', 'info');
      setIsSubscriptionOpen(true);
      return;
    }

    // Update watch history
    const existingHistory = currentUser.history || [];
    const historyItem = existingHistory.find(item => item.movieId === movie.id);
    
    const updatedHistory = [
      {
        movieId: movie.id,
        watchedAt: new Date().toISOString(),
        progress: historyItem?.progress || 0,
        currentTime: historyItem?.currentTime || 0,
      },
      ...existingHistory.filter(item => item.movieId !== movie.id),
    ].slice(0, 50); // Keep last 50 watched items

    const updatedUser: User = {
      ...currentUser,
      history: updatedHistory,
    };

    try {
      await Promise.all([
        syncUserState(updatedUser),
        updateDoc(doc(db, 'movies', movie.id), {
          views: increment(1),
        }),
      ]);
      
      setSelectedMovie(null);
      setCurrentPlayingMovie(movie);
      setActiveTab('player');
      
      trackEvent('movie_play', { 
        movieId: movie.id, 
        title: movie.title,
        resumeFrom: historyItem?.progress || 0 
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `movies/${movie.id}`);
    }
  }, [currentUser, syncUserState, addToast, trackEvent]);

  // --- Admin Operations ---
  const handleAddMovie = useCallback(async (newMovie: Omit<Movie, 'id' | 'views' | 'likes' | 'createdAt'>) => {
    const movieId = `movie-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const movieData: Movie = {
      ...newMovie,
      id: movieId,
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFeatured: false,
    };

    try {
      await setDoc(doc(db, 'movies', movieId), movieData);
      addToast(`"${newMovie.title}" added to catalog! 🎬`, 'success');
      trackEvent('admin_movie_added', { movieId });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `movies/${movieId}`);
      addToast('Failed to add movie', 'error');
    }
  }, [addToast, trackEvent]);

  const handleDeleteMovie = useCallback(async (movieId: string) => {
    try {
      await deleteDoc(doc(db, 'movies', movieId));
      addToast('Movie removed from catalog', 'success');
      trackEvent('admin_movie_deleted', { movieId });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `movies/${movieId}`);
      addToast('Failed to delete movie', 'error');
    }
  }, [addToast, trackEvent]);

  // --- Computed Values ---
  const featuredMovie = useMemo(() => {
    const featured = movies.find(m => m.isFeatured);
    return featured || movies[0] || null;
  }, [movies]);

  const nextMovie = useMemo(() => {
    if (!featuredMovie) return null;
    return movies.find(m => m.id !== featuredMovie.id) || null;
  }, [movies, featuredMovie]);

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchSearch = movie.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                          movie.genre?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchGenre = genreFilter === 'All' || movie.genre === genreFilter;
      const matchYear = yearFilter === 'All' || movie.releaseYear?.toString() === yearFilter;
      
      let matchType = true;
      if (mediaTypeFilter === 'movie') matchType = movie.type === 'movie';
      else if (mediaTypeFilter === 'series') matchType = movie.type === 'series';
      else if (mediaTypeFilter === 'upcoming') matchType = movie.status === 'upcoming';
      
      return matchSearch && matchGenre && matchYear && matchType;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'popular': return (b.views || 0) - (a.views || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        default: return 0;
      }
    });
  }, [movies, debouncedSearch, genreFilter, yearFilter, mediaTypeFilter, sortBy]);

  const watchHistory = useMemo(() => {
    if (!currentUser?.history) return [];
    return currentUser.history
      .map(hist => {
        const movie = movies.find(m => m.id === hist.movieId);
        return movie ? { ...movie, ...hist } : null;
      })
      .filter(Boolean)
      .slice(0, 4);
  }, [currentUser?.history, movies]);

  const trendingMovies = useMemo(() => {
    return [...movies]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 3);
  }, [movies]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white flex flex-col selection:bg-emerald-400/20 selection:text-emerald-400">
      {/* Toast Notifications */}
      <Suspense fallback={null}>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </Suspense>

      {/* Subscription Modal */}
      <Suspense fallback={null}>
        <SubscriptionModal
          isOpen={isSubscriptionOpen}
          onClose={() => setIsSubscriptionOpen(false)}
          currentUser={currentUser}
          onSubscribe={handleSubscribe}
          onOpenAuth={() => setActiveTab('auth')}
        />
      </Suspense>

      {/* Movie Detail Modal */}
      <Suspense fallback={null}>
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          currentUser={currentUser}
          onPlay={handlePlayMovie}
          onLikeToggle={handleLikeToggle}
          onWatchlistToggle={handleWatchlistToggle}
          isLiked={currentUser?.watchlist?.includes(selectedMovie?.id || '') || false}
          isWatchlisted={currentUser?.watchlist?.includes(selectedMovie?.id || '') || false}
          isSubscribed={currentUser?.subscription?.active || false}
        />
      </Suspense>

      {/* Navigation */}
      <Suspense fallback={<div className="h-16 bg-gray-950" />}>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSubscription={() => setIsSubscriptionOpen(true)}
          mediaTypeFilter={mediaTypeFilter}
          setMediaTypeFilter={setMediaTypeFilter}
          setGenreFilter={setGenreFilter}
        />
      </Suspense>

      {/* Main Content */}
      <main ref={mainContentRef} className="flex-1 relative">
        {isLoading ? (
          <LoadingFallback />
        ) : (
          <>
            {/* Home View */}
            {activeTab === 'home' && (
              <div className="animate-fadeIn">
                {featuredMovie && (
                  <Suspense fallback={<LoadingFallback />}>
                    <HeroSection
                      featuredMovie={featuredMovie}
                      nextMovie={nextMovie}
                      onPlay={handlePlayMovie}
                      onDetail={setSelectedMovie}
                      onLikeToggle={handleLikeToggle}
                      isLiked={currentUser?.watchlist?.includes(featuredMovie.id) || false}
                      onSwapFeatured={(movie) => {
                        // Implement swap featured logic
                        const updatedMovies = movies.map(m => ({
                          ...m,
                          isFeatured: m.id === movie.id,
                        }));
                        setMovies(updatedMovies);
                      }}
                      moviesList={movies}
                    />
                  </Suspense>
                )}

                <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16 py-12">
                  {/* Continue Watching */}
                  {watchHistory.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3">
                            <Clock className="w-6 h-6 text-amber-400" />
                            Continue Watching
                          </h2>
                          <p className="text-sm text-gray-400 mt-1">Pick up where you left off</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {watchHistory.map((item: any) => (
                          <div
                            key={item.id}
                            onClick={() => handlePlayMovie(item)}
                            className="group relative bg-gray-900/50 rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 border border-gray-800/50 hover:border-emerald-400/30"
                          >
                            <div className="aspect-video relative">
                              <img
                                src={item.thumbnailUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PlayCircle className="w-12 h-12 text-white" />
                              </div>
                              {/* Progress bar */}
                              {item.progress > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="text-sm font-bold truncate">{item.title}</h3>
                              <p className="text-xs text-gray-400 mt-1">
                                {item.progress}% completed
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Trending Now */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3">
                          <TrendingUp className="w-6 h-6 text-red-400" />
                          Trending Now
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Most watched this week</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {trendingMovies.map((movie) => (
                        <Suspense key={movie.id} fallback={<LoadingFallback />}>
                          <MovieCard
                            movie={movie}
                            onPlay={handlePlayMovie}
                            onDetail={setSelectedMovie}
                            onLikeToggle={handleLikeToggle}
                            isLiked={currentUser?.watchlist?.includes(movie.id) || false}
                            isSubscribed={currentUser?.subscription?.active || false}
                          />
                        </Suspense>
                      ))}
                    </div>
                  </section>

                  {/* Browse All */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3">
                          <Film className="w-6 h-6 text-emerald-400" />
                          Browse All
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Explore our complete catalog</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('movies')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all border border-white/10 hover:border-white/20"
                      >
                        View All
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {movies.slice(0, 3).map((movie) => (
                        <Suspense key={movie.id} fallback={<LoadingFallback />}>
                          <MovieCard
                            movie={movie}
                            onPlay={handlePlayMovie}
                            onDetail={setSelectedMovie}
                            onLikeToggle={handleLikeToggle}
                            isLiked={currentUser?.watchlist?.includes(movie.id) || false}
                            isSubscribed={currentUser?.subscription?.active || false}
                          />
                        </Suspense>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* Movies Catalog View */}
            {activeTab === 'movies' && (
              <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fadeIn">
                <div className="mb-8">
                  <h1 className="text-3xl md:text-4xl font-black">Movie Catalog</h1>
                  <p className="text-gray-400 mt-2">Discover your next favorite film</p>
                </div>

                {/* Filters */}
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-800/50">
                  <div className="flex flex-wrap gap-4 items-center">
                    {/* Genre Filter */}
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map((genre) => (
                        <button
                          key={genre}
                          onClick={() => setGenreFilter(genre)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            genreFilter === genre
                              ? 'bg-emerald-400 text-black'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>

                    {/* Year Filter */}
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="px-4 py-2 bg-white/5 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="All">All Years</option>
                      {[2026, 2025, 2024, 2023, 2022].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>

                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-4 py-2 bg-white/5 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="popular">Most Popular</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>
                </div>

                {/* Results */}
                {filteredMovies.length === 0 ? (
                  <div className="text-center py-20">
                    <Film className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400">No movies found matching your criteria</p>
                    <button
                      onClick={() => {
                        setGenreFilter('All');
                        setYearFilter('All');
                        setSearchQuery('');
                      }}
                      className="mt-4 px-6 py-2 bg-emerald-400 text-black rounded-xl font-semibold hover:bg-emerald-300 transition-all"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredMovies.map((movie) => (
                      <Suspense key={movie.id} fallback={<LoadingFallback />}>
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onDetail={setSelectedMovie}
                          onLikeToggle={handleLikeToggle}
                          isLiked={currentUser?.watchlist?.includes(movie.id) || false}
                          isSubscribed={currentUser?.subscription?.active || false}
                        />
                      </Suspense>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search View */}
            {activeTab === 'search' && (
              <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fadeIn">
                <div className="max-w-2xl mx-auto mb-12">
                  <h1 className="text-3xl md:text-4xl font-black text-center mb-8">Search</h1>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search movies, genres, actors..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {searchQuery && (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredMovies.map((movie) => (
                      <Suspense key={movie.id} fallback={<LoadingFallback />}>
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onDetail={setSelectedMovie}
                          onLikeToggle={handleLikeToggle}
                          isLiked={currentUser?.watchlist?.includes(movie.id) || false}
                          isSubscribed={currentUser?.subscription?.active || false}
                        />
                      </Suspense>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile View */}
            {activeTab === 'profile' && (
              <Suspense fallback={<LoadingFallback />}>
                <UserProfile
                  currentUser={currentUser}
                  movies={movies}
                  onRemoveFromWatchlist={handleWatchlistToggle}
                  onPlayMovie={handlePlayMovie}
                  onOpenSubscription={() => setIsSubscriptionOpen(true)}
                />
              </Suspense>
            )}

            {/* Admin View */}
            {activeTab === 'admin' && currentUser?.role === 'admin' && (
              <Suspense fallback={<LoadingFallback />}>
                <AdminDashboard
                  movies={movies}
                  users={users}
                  onAddMovie={handleAddMovie}
                  onDeleteMovie={handleDeleteMovie}
                  onUpdateUserSubscription={async (userId, active, planId) => {
                    try {
                      await updateDoc(doc(db, 'users', userId), {
                        subscription: {
                          active,
                          planId: planId || null,
                          expiresAt: active ? new Date(Date.now() + 30*24*60*60*1000).toISOString() : null,
                        },
                      });
                      addToast('User subscription updated', 'success');
                    } catch (err) {
                      addToast('Failed to update subscription', 'error');
                    }
                  }}
                  addToast={addToast}
                />
              </Suspense>
            )}

            {/* Auth View */}
            {activeTab === 'auth' && (
              <Suspense fallback={<LoadingFallback />}>
                <AuthPage onLoginSuccess={handleLoginSuccess} addToast={addToast} />
              </Suspense>
            )}

            {/* Video Player View */}
            {activeTab === 'player' && currentPlayingMovie && (
              <Suspense fallback={<LoadingFallback />}>
                <VideoPlayerPage
                  movie={currentPlayingMovie}
                  allMovies={movies}
                  currentUser={currentUser}
                  onLikeToggle={handleLikeToggle}
                  onWatchlistToggle={handleWatchlistToggle}
                  onPlayMovie={handlePlayMovie}
                  onBack={() => setActiveTab('home')}
                  addToast={addToast}
                  onUpdateHistory={async (movieId, progress, currentTime) => {
                    if (!currentUser) return;
                    const updatedHistory = currentUser.history?.map(item =>
                      item.movieId === movieId
                        ? { ...item, progress, currentTime, watchedAt: new Date().toISOString() }
                        : item
                    ) || [];
                    
                    try {
                      await syncUserState({ ...currentUser, history: updatedHistory });
                    } catch (err) {
                      console.error('Failed to update playback progress:', err);
                    }
                  }}
                />
              </Suspense>
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-gray-950/95 backdrop-blur-xl border-t border-gray-800/50 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-3">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'movies', icon: Film, label: 'Browse' },
            { id: 'search', icon: Search, label: 'Search' },
            { id: 'profile', icon: UserIcon, label: 'Profile' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as ActiveTab)}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition-all ${
                activeTab === id
                  ? 'text-emerald-400 scale-110'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Footer */}
      <footer className="hidden md:block border-t border-gray-800/50 bg-gray-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                <Film className="w-5 h-5 text-emerald-400" />
                CineLand
              </h3>
              <p className="text-sm text-gray-400">
                Your premium streaming destination for movies and TV shows.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-gray-300">Browse</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <button onClick={() => setActiveTab('movies')} className="block hover:text-white transition-colors">Movies</button>
                <button onClick={() => { setMediaTypeFilter('series'); setActiveTab('movies'); }} className="block hover:text-white transition-colors">TV Shows</button>
                <button onClick={() => { setMediaTypeFilter('upcoming'); setActiveTab('movies'); }} className="block hover:text-white transition-colors">Coming Soon</button>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-gray-300">Account</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <button onClick={() => setActiveTab(currentUser ? 'profile' : 'auth')} className="block hover:text-white transition-colors">
                  {currentUser ? 'My Profile' : 'Sign In'}
                </button>
                <button onClick={() => setIsSubscriptionOpen(true)} className="block hover:text-white transition-colors">
                  Subscription
                </button>
                {currentUser && (
                  <button onClick={handleLogout} className="block hover:text-red-400 transition-colors">
                    Sign Out
                  </button>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-gray-300">Connect</h4>
              <div className="flex gap-3">
                {[Monitor, Smartphone, Tablet, Globe].map((Icon, i) => (
                  <div key={i} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800/50 text-center text-sm text-gray-500">
            <p>© 2026 CineLand. All rights reserved. Powered by advanced streaming technology.</p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}