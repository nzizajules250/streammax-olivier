import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Info, Heart, Eye, Star, Clock, Calendar, 
  Plus, Check, Share2, Bookmark, TrendingUp, Award,
  Volume2, VolumeX, Maximize2, ThumbsUp, Film
} from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onDetail: (movie: Movie) => void;
  onLikeToggle: (movieId: string) => void;
  isLiked: boolean;
  isSubscribed: boolean;
  key?: string | number;
  variant?: 'default' | 'featured' | 'compact' | 'horizontal';
}

export default function MovieCard({
  movie,
  onPlay,
  onDetail,
  onLikeToggle,
  isLiked,
  isSubscribed,
  variant = 'default'
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Mouse tracking for parallax effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  // Auto-play trailer preview on hover
  useEffect(() => {
    if (showTrailer && videoRef.current && movie.trailerUrl) {
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [showTrailer, movie.trailerUrl]);

  // Determine card aspect ratio based on variant
  const aspectRatioClass = {
    default: 'aspect-[16/10]',
    featured: 'aspect-[16/9]',
    compact: 'aspect-[3/4]',
    horizontal: 'aspect-[16/7]',
  }[variant];

  // Determine if we should show the trailer preview
  const shouldShowTrailer = isHovered && movie.trailerUrl && variant !== 'compact';

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ 
        scale: 1.03,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      onHoverStart={() => {
        setIsHovered(true);
        setShowTrailer(true);
      }}
      onHoverEnd={() => {
        setIsHovered(false);
        setShowTrailer(false);
      }}
      onClick={() => onDetail(movie)}
      className={`relative group cursor-pointer overflow-hidden rounded-2xl bg-gray-900 ${aspectRatioClass}`}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {/* Premium Border Glow on Hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(0,230,162,0.3), rgba(0,200,255,0.3), rgba(168,85,247,0.3))',
          filter: 'blur(20px)',
          zIndex: -1,
        }}
        animate={{
          scale: isHovered ? 1.05 : 1,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Main Image/Video Container */}
      <div className="relative w-full h-full overflow-hidden">
        {/* Background Image */}
        <AnimatePresence mode="wait">
          {shouldShowTrailer && movie.trailerUrl ? (
            <motion.video
              key="trailer"
              ref={videoRef}
              src={movie.trailerUrl}
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <motion.img
              key="poster"
              src={movie.thumbnailUrl}
              alt={movie.title}
              onLoad={() => setImageLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                imageLoaded ? 'opacity-100' : 'opacity-0 scale-105'
              } ${isHovered ? 'scale-110' : 'scale-100'}`}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: isHovered ? 1.1 : 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>

        {/* Skeleton Loading */}
        {!imageLoaded && !shouldShowTrailer && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse">
            <Film className="w-12 h-12 text-gray-700 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Top Gradient for Badges */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />

        {/* Premium Badge */}
        {movie.isFeatured && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-full shadow-lg"
          >
            <Award className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-wider">Featured</span>
          </motion.div>
        )}

        {/* View Count Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full"
          >
            <Eye className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] font-bold text-gray-300">
              {movie.views > 1000 ? `${(movie.views / 1000).toFixed(1)}K` : movie.views}
            </span>
          </motion.div>
          
          {movie.likes > 0 && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full"
            >
              <Heart className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-bold text-gray-300">
                {movie.likes > 1000 ? `${(movie.likes / 1000).toFixed(1)}K` : movie.likes}
              </span>
            </motion.div>
          )}
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          {/* Genre & Year Row */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0.8 }}
            className="flex items-center gap-2 mb-2 flex-wrap"
          >
            <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black rounded-lg uppercase tracking-wider">
              {movie.genre}
            </span>
            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {movie.releaseYear}
            </span>
            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {movie.duration}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h3
            layout
            className={`font-black text-white uppercase tracking-tight mb-3 transition-all duration-300 ${
              variant === 'featured' ? 'text-2xl md:text-3xl' : 
              variant === 'compact' ? 'text-sm' : 'text-lg md:text-xl'
            }`}
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            {movie.title}
          </motion.h3>

          {/* Rating Stars */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
            className="flex items-center gap-1 mb-3"
          >
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(parseFloat(movie.rating) || 4)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-600'
                }`}
              />
            ))}
            <span className="text-xs font-bold text-amber-400 ml-1">{movie.rating}</span>
          </motion.div>

          {/* Description (Featured only) */}
          {variant === 'featured' && isHovered && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="text-sm text-gray-300 mb-4 line-clamp-2"
            >
              {movie.description}
            </motion.p>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex items-center gap-2"
          >
            {/* Play Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(movie);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-green-500 text-black font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Play Now
            </motion.button>

            {/* More Info */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onDetail(movie);
              }}
              className="p-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
            >
              <Info className="w-4 h-4" />
            </motion.button>

            {/* Like Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onLikeToggle(movie.id);
              }}
              className={`p-2.5 backdrop-blur-sm border rounded-xl transition-all ${
                isLiked
                  ? 'bg-red-500/20 border-red-500/30 text-red-400 shadow-lg shadow-red-500/10'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
            >
              <Heart className={`w-4 h-4 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} />
            </motion.button>

            {/* Watchlist Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsInWatchlist(!isInWatchlist);
              }}
              className={`p-2.5 backdrop-blur-sm border rounded-xl transition-all ${
                isInWatchlist
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
            >
              {isInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </motion.button>
          </motion.div>
        </div>

        {/* Trailer Preview Indicator */}
        {shouldShowTrailer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/40">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </motion.div>
        )}

        {/* Progress Bar (if watched) */}
        {movie.progress && movie.progress > 0 && movie.progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${movie.progress}%` }}
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
            />
          </div>
        )}
      </div>

      {/* Card Reflection Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(255,255,255,0.1) 0%, transparent 60%)`,
        }}
      />
    </motion.div>
  );
}