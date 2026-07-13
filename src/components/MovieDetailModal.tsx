import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Play, Plus, Check, Heart, Clock, Star, Volume2, VolumeX,
  Maximize, PlayCircle, Info, Share2, Download, ThumbsUp,
  Calendar, Eye, Users, Award, Film, Subtitles, Languages,
  ChevronRight, SkipForward, SkipBack, Pause, Settings,
  Sparkles, Crown, TrendingUp, MessageSquare, Bookmark
} from 'lucide-react';
import { Movie, User } from '../types';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  currentUser: User | null;
  onPlay: (movie: Movie) => void;
  onLikeToggle: (movieId: string) => void;
  onWatchlistToggle: (movieId: string) => void;
  isLiked: boolean;
  isWatchlisted: boolean;
  isSubscribed: boolean;
}

// Animated rating stars component
const RatingStars = ({ rating, size = 'md' }: { rating: string; size?: 'sm' | 'md' | 'lg' }) => {
  const numericRating = parseFloat(rating) || 0;
  const fullStars = Math.floor(numericRating / 2);
  const hasHalfStar = numericRating % 2 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  const sizeClass = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }[size];
  
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <motion.div
          key={`full-${i}`}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.1, type: 'spring' }}
        >
          <Star className={`${sizeClass} fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]`} />
        </motion.div>
      ))}
      {hasHalfStar && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: fullStars * 0.1, type: 'spring' }}
          className="relative"
        >
          <Star className={`${sizeClass} text-gray-600`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${sizeClass} fill-amber-400 text-amber-400`} />
          </div>
        </motion.div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <motion.div
          key={`empty-${i}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: (fullStars + (hasHalfStar ? 1 : 0) + i) * 0.1 }}
        >
          <Star className={`${sizeClass} text-gray-600`} />
        </motion.div>
      ))}
    </div>
  );
};

// Video player controls overlay
const VideoControls = ({ 
  isPlaying, 
  isMuted, 
  onPlayPause, 
  onMuteToggle,
  onFullscreen,
  progress 
}: { 
  isPlaying: boolean; 
  isMuted: boolean; 
  onPlayPause: () => void; 
  onMuteToggle: () => void;
  onFullscreen: () => void;
  progress: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
  >
    {/* Progress Bar */}
    <div className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer group">
      <motion.div
        className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full relative"
        style={{ width: `${progress}%` }}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
      </motion.div>
    </div>
    
    {/* Controls */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onPlayPause} className="text-white hover:text-emerald-400 transition-colors">
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
        </button>
        <button className="text-white/70 hover:text-white transition-colors">
          <SkipBack className="w-5 h-5" />
        </button>
        <button className="text-white/70 hover:text-white transition-colors">
          <SkipForward className="w-5 h-5" />
        </button>
        <button onClick={onMuteToggle} className="text-white/70 hover:text-white transition-colors">
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <button className="text-white/70 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <button className="text-white/70 hover:text-white transition-colors">
          <Subtitles className="w-5 h-5" />
        </button>
        <button onClick={onFullscreen} className="text-white/70 hover:text-white transition-colors">
          <Maximize className="w-5 h-5" />
        </button>
      </div>
    </div>
  </motion.div>
);

export default function MovieDetailModal({
  movie,
  onClose,
  currentUser,
  onPlay,
  onLikeToggle,
  onWatchlistToggle,
  isLiked,
  isWatchlisted,
  isSubscribed
}: MovieDetailModalProps) {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'reviews' | 'related'>('overview');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when movie changes
  useEffect(() => {
    setIsPlayingVideo(false);
    setVideoProgress(0);
    setActiveTab('overview');
    setShowShareMenu(false);
  }, [movie]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!movie) return;
      
      switch(e.key) {
        case 'Escape':
          if (isPlayingVideo) {
            setIsPlayingVideo(false);
          } else {
            onClose();
          }
          break;
        case ' ':
          e.preventDefault();
          if (isPlayingVideo && videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play();
            } else {
              videoRef.current.pause();
            }
          } else if (!isPlayingVideo) {
            handleStartPlayback();
          }
          break;
        case 'f':
          if (isPlayingVideo) {
            videoRef.current?.requestFullscreen();
          }
          break;
        case 'm':
          if (isPlayingVideo) {
            setIsMuted(!isMuted);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movie, isPlayingVideo, isMuted]);

  // Video time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isPlayingVideo) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setVideoProgress(progress);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isPlayingVideo]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (movie) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [movie]);

  if (!movie) return null;

  const handleStartPlayback = () => {
    if (!isSubscribed) {
      onPlay(movie);
    } else {
      setIsPlayingVideo(true);
      onPlay(movie);
    }
  };

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen();
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = `Check out "${movie.title}" on CineLand!`;
    
    switch(platform) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
    }
    setShowShareMenu(false);
  };

  // Mock episodes for series
  const episodes = movie.type === 'series' ? movie.episodes || [
    { id: '1', episodeNumber: 1, seasonNumber: 1, title: 'Pilot', duration: '45m', videoUrl: '' },
    { id: '2', episodeNumber: 2, seasonNumber: 1, title: 'The Beginning', duration: '42m', videoUrl: '' },
    { id: '3', episodeNumber: 3, seasonNumber: 1, title: 'Dark Secrets', duration: '48m', videoUrl: '' },
    { id: '4', episodeNumber: 4, seasonNumber: 1, title: 'Revelations', duration: '50m', videoUrl: '' },
  ] : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/95 backdrop-blur-xl"
        />

        {/* Modal Content */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-gray-950 border border-gray-800/50 rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl z-10 flex flex-col"
        >
          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full text-white hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Video Player or Hero Image */}
          <div className="relative w-full aspect-video bg-black flex-shrink-0">
            <AnimatePresence mode="wait">
              {isPlayingVideo ? (
                <motion.div
                  key="player"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black group"
                >
                  <video
                    ref={videoRef}
                    src={movie.videoUrl || movie.trailerUrl}
                    autoPlay
                    muted={isMuted}
                    className="w-full h-full object-contain"
                    onClick={() => {
                      if (videoRef.current?.paused) {
                        videoRef.current.play();
                      } else {
                        videoRef.current?.pause();
                      }
                    }}
                  />
                  
                  {/* Back to details button */}
                  <button
                    onClick={() => setIsPlayingVideo(false)}
                    className="absolute top-4 left-4 z-20 px-4 py-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/20 transition-all"
                  >
                    ← Back to Details
                  </button>

                  {/* Video Controls */}
                  <AnimatePresence>
                    {isPlayingVideo && (
                      <VideoControls
                        isPlaying={!videoRef.current?.paused}
                        isMuted={isMuted}
                        onPlayPause={() => {
                          if (videoRef.current?.paused) {
                            videoRef.current.play();
                          } else {
                            videoRef.current?.pause();
                          }
                        }}
                        onMuteToggle={() => setIsMuted(!isMuted)}
                        onFullscreen={handleFullscreen}
                        progress={videoProgress}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  key="hero"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  {/* Hero Image */}
                  <img
                    src={movie.thumbnailUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-transparent" />
                  
                  {/* Hero Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.span
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black rounded-lg uppercase tracking-wider"
                      >
                        {movie.genre}
                      </motion.span>
                      {movie.isFeatured && (
                        <motion.span
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black rounded-lg uppercase tracking-wider flex items-center gap-1"
                        >
                          <Crown className="w-3 h-3" />
                          Featured
                        </motion.span>
                      )}
                    </div>
                    
                    <motion.h2
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-4"
                      style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
                    >
                      {movie.title}
                    </motion.h2>
                    
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-4 mb-6"
                    >
                      <RatingStars rating={movie.rating} size="md" />
                      <span className="text-amber-400 font-bold">{movie.rating}/10</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-300 text-sm">{movie.duration}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-300 text-sm">{movie.releaseYear}</span>
                    </motion.div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center gap-3"
                    >
                      <button
                        onClick={handleStartPlayback}
                        className="px-8 py-4 bg-gradient-to-r from-emerald-400 to-green-500 text-black font-black rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        {isSubscribed ? 'Watch Now' : 'Play Trailer'}
                      </button>
                      
                      <button
                        onClick={() => onWatchlistToggle(movie.id)}
                        className={`p-4 rounded-xl border transition-all ${
                          isWatchlisted
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                        }`}
                      >
                        {isWatchlisted ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </button>
                      
                      <button
                        onClick={() => onLikeToggle(movie.id)}
                        className={`p-4 rounded-xl border transition-all ${
                          isLiked
                            ? 'bg-red-500/20 border-red-500/30 text-red-400'
                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={() => setShowShareMenu(!showShareMenu)}
                          className="p-4 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                        
                        <AnimatePresence>
                          {showShareMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-full mb-2 right-0 bg-gray-900 border border-gray-800 rounded-xl p-2 shadow-xl"
                            >
                              {[
                                { label: 'Copy Link', action: () => handleShare('copy'), icon: Share2 },
                                { label: 'Twitter', action: () => handleShare('twitter'), icon: Share2 },
                                { label: 'Facebook', action: () => handleShare('facebook'), icon: Share2 },
                              ].map(({ label, action, icon: Icon }) => (
                                <button
                                  key={label}
                                  onClick={action}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2 whitespace-nowrap"
                                >
                                  <Icon className="w-4 h-4" />
                                  {label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-y-auto">
            {/* Tabs */}
            <div className="sticky top-0 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800/50 z-10">
              <div className="flex gap-1 px-8">
                {[
                  { id: 'overview' as const, label: 'Overview', icon: Info },
                  ...(movie.type === 'series' ? [{ id: 'episodes' as const, label: 'Episodes', icon: Film }] : []),
                  { id: 'reviews' as const, label: 'Reviews', icon: MessageSquare },
                  { id: 'related' as const, label: 'Related', icon: Film },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`px-6 py-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                      activeTab === id
                        ? 'text-emerald-400 border-emerald-400'
                        : 'text-gray-400 border-transparent hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid md:grid-cols-3 gap-8"
                  >
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                      <div>
                        <h3 className="text-lg font-black text-white mb-3">Synopsis</h3>
                        <p className="text-gray-300 leading-relaxed">{movie.description}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-black text-white mb-3">Cast</h3>
                        <div className="flex flex-wrap gap-2">
                          {movie.cast?.map((member, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-all cursor-pointer"
                            >
                              {member}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                      <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Movie Info</h3>
                        <div className="space-y-3">
                          {[
                            { label: 'Genre', value: movie.genre, icon: Film },
                            { label: 'Release Year', value: movie.releaseYear, icon: Calendar },
                            { label: 'Duration', value: movie.duration, icon: Clock },
                            { label: 'Rating', value: `${movie.rating}/10`, icon: Star },
                            { label: 'Views', value: movie.views?.toLocaleString(), icon: Eye },
                          ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                              <span className="text-sm text-gray-400 flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {label}
                              </span>
                              <span className="text-sm font-bold text-white">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {!isSubscribed && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6"
                        >
                          <Crown className="w-8 h-8 text-amber-400 mb-3" />
                          <h4 className="text-sm font-black text-amber-400 mb-2">Upgrade to VIP</h4>
                          <p className="text-xs text-gray-400 mb-4">
                            Watch this movie and thousands more with a VIP subscription.
                          </p>
                          <button
                            onClick={() => onPlay(movie)}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded-xl text-sm hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                          >
                            Upgrade Now
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'episodes' && movie.type === 'series' && (
                  <motion.div
                    key="episodes"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-black text-white mb-4">
                      Episodes ({episodes.length})
                    </h3>
                    <div className="space-y-2">
                      {episodes.map((ep, idx) => (
                        <motion.div
                          key={ep.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-4 p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl hover:bg-gray-900 transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 font-black">
                            {ep.episodeNumber}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {ep.title}
                            </h4>
                            <p className="text-xs text-gray-400">{ep.duration}</p>
                          </div>
                          <Play className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                        </motion.div>
                      ))}
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
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-white">User Reviews</h3>
                      <button className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition-all">
                        Write Review
                      </button>
                    </div>
                    
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center text-black font-black">
                            U{i}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">MovieFan{i}</h4>
                            <RatingStars rating="8" size="sm" />
                          </div>
                          <span className="ml-auto text-xs text-gray-500">2 days ago</span>
                        </div>
                        <p className="text-sm text-gray-300">
                          Amazing movie! The cinematography and storytelling are absolutely stunning. 
                          A must-watch for any film enthusiast.
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-400 transition-colors">
                            <ThumbsUp className="w-3.5 h-3.5" /> 24
                          </button>
                          <button className="text-xs text-gray-400 hover:text-emerald-400 transition-colors">
                            Reply
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'related' && (
                  <motion.div
                    key="related"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-black text-white mb-4">Related Movies</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-gray-900/50 border border-gray-800/50 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all cursor-pointer group"
                        >
                          <div className="aspect-video bg-gray-800 relative">
                            <img
                              src={movie.thumbnailUrl}
                              alt={`Related ${i}`}
                              className="w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-10 h-10 text-white fill-white" />
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="text-sm font-bold text-white truncate">Similar Movie {i}</h4>
                            <p className="text-xs text-gray-400 mt-1">2024 • 2h 30m</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}