import React, { useEffect, useRef, useState, FormEvent, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Heart, Bookmark, BookmarkCheck, Play, Volume2, VolumeX,
  Maximize2, Minimize2, Eye, ThumbsUp, Calendar, Clock, Sparkles, 
  Star, Share2, Film, CheckCircle2, Tv, SkipForward, SkipBack,
  Settings, Subtitles, Languages, PictureInPicture2, Cast, Download,
  MessageSquare, ThumbsDown, Flag, MoreHorizontal, ChevronUp, ChevronDown,
  Pause, RotateCcw, FastForward, Rewind, List, Grid, TrendingUp,
  Radio, Disc, Zap, Crown, Gift, Users, Activity, BarChart3
} from 'lucide-react';
import { Movie, User, Episode } from '../types';

interface VideoPlayerPageProps {
  movie: Movie;
  allMovies: Movie[];
  currentUser: User | null;
  onLikeToggle: (id: string) => void;
  onWatchlistToggle: (id: string) => void;
  onPlayMovie: (movie: Movie) => void;
  onBack: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onUpdateHistory: (movieId: string, progress: number, currentTime: number) => Promise<void>;
}

// Custom video player controls component
const VideoPlayerControls = ({
  videoRef,
  onFullscreen,
  isFullscreen,
  isMuted,
  onMuteToggle,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  buffered,
  qualityLevels,
  currentQuality,
  onQualityChange,
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  onFullscreen: () => void;
  isFullscreen: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  buffered: number;
  qualityLevels: string[];
  currentQuality: string;
  onQualityChange: (quality: string) => void;
}) => {
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const controlsTimerRef = useRef<NodeJS.Timeout>();

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showControls ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"
    >
      {/* Center Play/Pause */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onPlayPause}
          className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          )}
        </motion.button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        {/* Progress Bar */}
        <div className="group relative">
          <div 
            className="w-full h-1 bg-white/20 rounded-full cursor-pointer group-hover:h-2 transition-all"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = x / rect.width;
              onSeek(percentage * duration);
            }}
          >
            <div className="h-full bg-red-500 rounded-full relative" style={{ width: `${(currentTime / duration) * 100}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
            </div>
            {/* Buffered */}
            <div 
              className="absolute top-0 h-full bg-white/30 rounded-full" 
              style={{ width: `${buffered}%` }} 
            />
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button onClick={onPlayPause} className="text-white hover:text-red-400 transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Skip Buttons */}
            <button 
              onClick={() => onSeek(currentTime - 10)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <Rewind className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onSeek(currentTime + 10)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <FastForward className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group">
              <button onClick={onMuteToggle} className="text-white/70 hover:text-white transition-colors">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div className="w-0 group-hover:w-20 transition-all overflow-hidden">
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full h-1 accent-red-500"
                />
              </div>
            </div>

            {/* Time Display */}
            <span className="text-xs text-white/70 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Settings */}
            <div className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-800 rounded-xl p-2 min-w-[150px]"
                  >
                    <div className="text-xs text-gray-400 px-3 py-1">Quality</div>
                    {qualityLevels.map(quality => (
                      <button
                        key={quality}
                        onClick={() => {
                          onQualityChange(quality);
                          setShowSettings(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          quality === currentQuality
                            ? 'bg-red-500/10 text-red-400'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {quality}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Subtitles */}
            <button className="text-white/70 hover:text-white transition-colors">
              <Subtitles className="w-5 h-5" />
            </button>

            {/* Picture in Picture */}
            <button className="text-white/70 hover:text-white transition-colors">
              <PictureInPicture2 className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button onClick={onFullscreen} className="text-white/70 hover:text-white transition-colors">
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
// Enhanced review card component
const ReviewCard = ({ review, onLike }: { review: any; onLike: (id: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-600 rounded-xl flex items-center justify-center text-white font-black">
            {review.user[0].toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{review.user}</h4>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">{review.date}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-500 hover:text-white transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      
      <p className={`text-sm text-gray-300 ${!isExpanded && 'line-clamp-3'}`}>
        {review.text}
      </p>
      
      {review.text.length > 150 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-red-400 hover:text-red-300 font-semibold"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}
      
      <div className="flex items-center gap-4 pt-2 border-t border-gray-800/50">
        <button
          onClick={() => {
            setIsLiked(!isLiked);
            onLike(review.id);
          }}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            isLiked ? 'text-red-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          <span>{isLiked ? (review.likes || 0) + 1 : review.likes || 0}</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Reply</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors ml-auto">
          <Flag className="w-3.5 h-3.5" />
          <span>Report</span>
        </button>
      </div>
    </motion.div>
  );
};

export default function VideoPlayerPage({
  movie,
  allMovies,
  currentUser,
  onLikeToggle,
  onWatchlistToggle,
  onPlayMovie,
  onBack,
  addToast,
  onUpdateHistory
}: VideoPlayerPageProps) {
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const stateRef = useRef({ currentTime: 0, duration: 0 });

  // UI state
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'episodes' | 'details'>('details');
  const [quality, setQuality] = useState('1080p');
  
  // Review state
  const [reviews, setReviews] = useState([
    { 
      id: '1', 
      user: 'Alex Mercer', 
      text: 'Stunning cinematography and gripping storyline. The visual effects are absolutely breathtaking, and the sound design creates an immersive experience that keeps you on the edge of your seat throughout the entire film.', 
      rating: 5, 
      date: '2 hours ago',
      likes: 24 
    },
    { 
      id: '2', 
      user: 'Elena Rostova', 
      text: 'A masterpiece! The audio score is incredible. Kept me on the edge of my seat. Every frame is a work of art, and the performances are career-defining.', 
      rating: 4, 
      date: '1 day ago',
      likes: 18 
    },
  ]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  // Initialize episode
  useEffect(() => {
    if (movie.type === 'series' && movie.episodes?.length) {
      setCurrentEpisode(movie.episodes[0]);
    } else {
      setCurrentEpisode(null);
    }
  }, [movie]);

  // Sync refs
  const onUpdateHistoryRef = useRef(onUpdateHistory);
  useEffect(() => {
    onUpdateHistoryRef.current = onUpdateHistory;
  }, [onUpdateHistory]);

  // Save progress
  const saveProgress = useCallback((currentTime: number, duration: number) => {
    if (!currentUser || !duration || duration <= 0) return;
    const progress = Math.min(100, Math.floor((currentTime / duration) * 100));
    lastSavedTimeRef.current = currentTime;
    onUpdateHistoryRef.current(movie.id, progress, currentTime);
  }, [currentUser, movie.id]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      const historyItem = currentUser?.history?.find(item => item.movieId === movie.id);
      if (historyItem?.currentTime && historyItem.currentTime > 0 && (historyItem.progress || 0) < 98) {
        videoRef.current.currentTime = historyItem.currentTime;
        addToast(`Resuming from ${formatTime(historyItem.currentTime)}`, 'info');
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const ct = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      setCurrentTime(ct);
      stateRef.current = { currentTime: ct, duration: dur };

      // Update buffered
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBuffered((bufferedEnd / dur) * 100);
      }

      // Save progress periodically
      if (Math.abs(ct - lastSavedTimeRef.current) > 10) {
        saveProgress(ct, dur);
      }
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        saveProgress(videoRef.current.currentTime, videoRef.current.duration || 0);
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch(e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          handleSeek(currentTime - 10);
          break;
        case 'ArrowRight':
          handleSeek(currentTime + 10);
          break;
        case 'f':
          handleFullscreen();
          break;
        case 'm':
          setIsMuted(!isMuted);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTime, isPlaying, isMuted, isFullscreen]);

  // Cleanup on unmount
  useEffect(() => {
    lastSavedTimeRef.current = 0;
    stateRef.current = { currentTime: 0, duration: 0 };

    return () => {
      const { currentTime, duration } = stateRef.current;
      if (currentTime > 0 && duration > 0) {
        const progress = Math.min(100, Math.floor((currentTime / duration) * 100));
        onUpdateHistoryRef.current(movie.id, progress, currentTime);
      }
    };
  }, [movie.id]);

  const handleBackWithSave = () => {
    if (videoRef.current) {
      saveProgress(videoRef.current.currentTime, videoRef.current.duration || 0);
    }
    onBack();
  };

  const handleAddReview = (e: FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    if (!currentUser) {
      addToast('Please sign in to write a review', 'warning');
      return;
    }

    const review = {
      id: Date.now().toString(),
      user: currentUser.username,
      text: newReviewText,
      rating: newReviewRating,
      date: 'Just now',
      likes: 0,
    };

    setReviews([review, ...reviews]);
    setNewReviewText('');
    addToast('Review posted successfully! 🎬', 'success');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      addToast('Link copied to clipboard! 📋', 'success');
    } catch {
      addToast('Failed to copy link', 'error');
    }
  };

  // Format time helper
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Related movies
  const relatedMovies = useMemo(() => {
    return allMovies
      .filter(m => m.id !== movie.id)
      .sort((a, b) => {
        if (a.genre === movie.genre && b.genre !== movie.genre) return -1;
        if (a.genre !== movie.genre && b.genre === movie.genre) return 1;
        return b.views - a.views;
      })
      .slice(0, 6);
  }, [allMovies, movie.id, movie.genre]);

  const isLiked = currentUser?.watchlist?.includes(movie.id) || false;
  const isWatchlisted = currentUser?.watchlist?.includes(movie.id) || false;

  const qualityLevels = ['2160p', '1440p', '1080p', '720p', '480p', '360p', 'Auto'];

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white">
      {/* Video Player Section */}
      <div className="relative bg-black">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleBackWithSave}
          className="absolute top-4 left-4 z-30 flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-bold hidden md:inline">Back</span>
        </motion.button>

        {/* Video Element */}
        <div className="relative aspect-video bg-black group">
          <video
            ref={videoRef}
            src={currentEpisode ? currentEpisode.videoUrl : movie.videoUrl}
            poster={movie.thumbnailUrl}
            autoPlay
            muted={isMuted}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => {
              setIsPlaying(false);
              if (videoRef.current) {
                saveProgress(videoRef.current.currentTime, videoRef.current.duration || 0);
              }
            }}
            className="w-full h-full"
            style={{ maxHeight: '85vh' }}
          />

          {/* Custom Controls Overlay */}
          <VideoPlayerControls
            videoRef={videoRef}
            onFullscreen={handleFullscreen}
            isFullscreen={isFullscreen}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted(!isMuted)}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            buffered={buffered}
            qualityLevels={qualityLevels}
            currentQuality={quality}
            onQualityChange={setQuality}
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Movie Info Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full md:w-48 shrink-0"
          >
            <img
              src={movie.thumbnailUrl}
              alt={movie.title}
              className="w-full aspect-[3/4] object-cover rounded-2xl shadow-2xl"
            />
          </motion.div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black rounded-lg">
                {movie.genre}
              </span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs font-bold rounded-lg flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {movie.releaseYear}
              </span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs font-bold rounded-lg flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {movie.duration}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              {movie.title}
            </h1>

            <div className="flex items-center gap-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(parseFloat(movie.rating) / 2)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-amber-400 font-bold">{movie.rating}/10</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400 text-sm">{movie.views?.toLocaleString()} views</span>
            </div>

            <p className="text-gray-300 leading-relaxed max-w-2xl">
              {movie.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onLikeToggle(movie.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isLiked
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
                <span className="text-xs opacity-75">({movie.likes})</span>
              </button>

              <button
                onClick={() => onWatchlistToggle(movie.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isWatchlisted
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {isWatchlisted ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    Watchlisted
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    Watchlist
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>

              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-800 mb-6">
          <div className="flex gap-1">
            {[
              { id: 'details' as const, label: 'Details', icon: Info },
              { id: 'episodes' as const, label: 'Episodes', icon: Tv, show: movie.type === 'series' },
              { id: 'reviews' as const, label: 'Reviews', icon: MessageSquare },
            ].filter(tab => tab.show !== false).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === id
                    ? 'text-white border-red-500'
                    : 'text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-8"
            >
              {/* Cast */}
              <div>
                <h3 className="text-lg font-black mb-4">Cast & Crew</h3>
                <div className="space-y-2">
                  {movie.cast?.map((member, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                        {member.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-semibold">{member}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Specs */}
              <div>
                <h3 className="text-lg font-black mb-4">Technical Specs</h3>
                <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                  {[
                    { icon: Film, label: 'Stream Quality', value: 'Ultra HD 4K HDR' },
                    { icon: Disc, label: 'Audio', value: 'Dolby Atmos 7.1' },
                    { icon: Zap, label: 'Bitrate', value: '25 Mbps Adaptive' },
                    { icon: Globe, label: 'Subtitles', value: '12 Languages' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-gray-400 flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {label}
                      </span>
                      <span className="text-sm font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'episodes' && movie.type === 'series' && (
            <motion.div
              key="episodes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid gap-3">
                {movie.episodes?.map((ep) => {
                  const isActive = currentEpisode?.id === ep.id;
                  return (
                    <motion.button
                      key={ep.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setCurrentEpisode(ep);
                        addToast(`Now playing: ${ep.title}`, 'info');
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                        isActive
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                        isActive ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400'
                      }`}>
                        {isActive ? <Play className="w-5 h-5 fill-current" /> : ep.episodeNumber}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold">{ep.title}</h4>
                        <p className="text-sm text-gray-400">
                          Episode {ep.episodeNumber} • {ep.duration}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Review Form */}
              <form onSubmit={handleAddReview} className="bg-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-black">Write a Review</h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= newReviewRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Share your thoughts about this movie..."
                  rows={3}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-all resize-none"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/20 transition-all"
                >
                  Post Review
                </button>
              </form>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onLike={(id) => {
                      setReviews(reviews.map(r =>
                        r.id === id ? { ...r, likes: (r.likes || 0) + 1 } : r
                      ));
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Related Movies */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Film className="w-6 h-6 text-red-400" />
              More Like This
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedMovies.map((relMovie) => (
              <motion.div
                key={relMovie.id}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPlayMovie(relMovie)}
                className="cursor-pointer group"
              >
                <div className="aspect-[3/4] rounded-2xl overflow-hidden relative mb-2">
                  <img
                    src={relMovie.thumbnailUrl}
                    alt={relMovie.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="text-left">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-white">{relMovie.rating}</span>
                      </div>
                      <span className="text-[10px] text-gray-300">{relMovie.duration}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <h4 className="text-sm font-bold truncate">{relMovie.title}</h4>
                <p className="text-xs text-gray-400">{relMovie.genre}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}