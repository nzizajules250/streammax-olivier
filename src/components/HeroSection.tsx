import { Play, Info, Heart, VolumeX, Volume2, Star, Film, ChevronRight, Sparkles, TrendingUp, Clock, Calendar } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Movie } from '../types';

interface HeroSectionProps {
  featuredMovie: Movie;
  nextMovie: Movie | null;
  onPlay: (movie: Movie) => void;
  onDetail: (movie: Movie) => void;
  onLikeToggle: (movieId: string) => void;
  isLiked: boolean;
  onSwapFeatured: (movie: Movie) => void;
  moviesList?: Movie[];
}

export default function HeroSection({
  featuredMovie,
  nextMovie,
  onPlay,
  onDetail,
  onLikeToggle,
  isLiked,
  onSwapFeatured,
  moviesList = []
}: HeroSectionProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);
  const [showTitleAnimation, setShowTitleAnimation] = useState(false);
  const [hoveredMovie, setHoveredMovie] = useState<string | null>(null);
  const [particleEffect, setParticleEffect] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });

  // Enhanced mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mousePosition.current = { x, y };

      const parallaxElements = heroRef.current.querySelectorAll('[data-parallax]');
      parallaxElements.forEach((el: Element) => {
        const speed = parseFloat((el as HTMLElement).dataset.parallax || '0.1');
        const htmlEl = el as HTMLElement;
        htmlEl.style.transform = `translate(${x * speed * 20}px, ${y * speed * 20}px)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Main video loading and playback management
  useEffect(() => {
    if (!videoRef.current || !featuredMovie.trailerUrl) {
      setIsVideoError(true);
      return;
    }

    setIsVideoLoaded(false);
    setIsVideoError(false);
    
    const video = videoRef.current;
    
    // Reset and load new video source
    video.src = featuredMovie.trailerUrl;
    video.load();

    const handleCanPlay = () => {
      setIsVideoLoaded(true);
      setIsVideoError(false);
      
      // Attempt autoplay
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('Autoplay prevented:', error);
          // Will show poster as fallback
          setIsVideoError(true);
        });
      }
    };

    const handleError = () => {
      console.error('Video failed to load');
      setIsVideoError(true);
      setIsVideoLoaded(false);
    };

    const handleTimeUpdate = () => {
      if (video.duration) {
        setVideoProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.pause();
      video.src = '';
    };
  }, [featuredMovie.trailerUrl, featuredMovie.id]);

  // Title animation on mount and movie change
  useEffect(() => {
    setShowTitleAnimation(false);
    const timer = setTimeout(() => setShowTitleAnimation(true), 100);
    return () => clearTimeout(timer);
  }, [featuredMovie.id]);

  // Particle burst effect on interaction
  const triggerParticleEffect = useCallback(() => {
    setParticleEffect(true);
    setTimeout(() => setParticleEffect(false), 1000);
  }, []);

  // Handle mute toggle with smooth transition
  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Fallback movies list
  const sliderMovies = moviesList && moviesList.length > 0 ? moviesList.slice(0, 6) : [];

  // Generate dynamic particles
  const generateParticles = () => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${1 + Math.random() * 3}s`,
        width: `${2 + Math.random() * 4}px`,
        height: `${2 + Math.random() * 4}px`,
      }
    }));
  };

  const particles = generateParticles();

  return (
    <div
      ref={heroRef}
      id="hero-section"
      className="relative w-full min-h-screen md:h-[100vh] bg-black overflow-hidden flex flex-col justify-between -mt-[88px] select-none"
    >
      {/* Advanced Particle System */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-r from-red-500/30 to-amber-500/20 animate-float"
            style={particle.style}
          />
        ))}
      </div>

      {/* MAIN VIDEO BACKGROUND - Takes priority over everything */}
      <div className="absolute inset-0 z-0">
        {/* Video Background Layer */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isVideoLoaded && !isVideoError ? 'opacity-100' : 'opacity-0'}`}>
          <video
            ref={videoRef}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            style={{ 
              filter: 'brightness(0.4) saturate(1.2) contrast(1.1)',
              transform: 'scale(1.05)' // Slight zoom to prevent edges
            }}
          />
          
          {/* Video grain overlay for cinematic feel */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1Ii8+PC9zdmc+')] opacity-20 mix-blend-overlay pointer-events-none" />
        </div>

        {/* Poster Fallback - Only shows when video fails or is loading */}
        <div 
          className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${
            isVideoLoaded && !isVideoError ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
          }`}
          style={{ 
            backgroundImage: `url(${featuredMovie.thumbnailUrl})`,
            filter: 'brightness(0.3) saturate(0.8)',
          }}
        />

        {/* Video Loading Spinner */}
        {!isVideoLoaded && !isVideoError && featuredMovie.trailerUrl && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <Film className="w-6 h-6 text-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}

        {/* Advanced Atmospheric Gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black opacity-80 pointer-events-none" />
        
        {/* Radial light effect following mouse */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)',
            left: `calc(${(mousePosition.current.x + 1) * 50}% - 300px)`,
            top: `calc(${(mousePosition.current.y + 1) * 50}% - 300px)`,
          }}
        />
        
        {/* Cinematic letterbox bars */}
        <div className="absolute top-0 left-0 right-0 h-[10vh] bg-gradient-to-b from-black via-black/50 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[10vh] bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

        {/* Video Progress Bar (subtle) */}
        {isVideoLoaded && !isVideoError && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 pointer-events-none">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-1000"
              style={{ width: `${videoProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Hero Content Overlay */}
      <div className="relative z-20 flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-24 max-w-3xl">
        {/* Animated Entrance Container */}
        <div className={`transition-all duration-1000 transform ${showTitleAnimation ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Premium Badge with Glow Effect */}
          <div className="mb-4 inline-flex">
            {featuredMovie.id === 'mandala' ? (
              <div className="relative group">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                <h2 className="relative text-2xl md:text-3xl font-black font-sans tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600 uppercase">
                  Season 1
                </h2>
              </div>
            ) : (
              <span className="relative px-4 py-2 bg-gradient-to-r from-red-600/20 to-red-800/20 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-sm">
                <Sparkles className="w-3 h-3 inline-block mr-2 animate-pulse" />
                {featuredMovie.genre} Exclusive
              </span>
            )}
          </div>

          {/* Title with Dynamic Typography Effect */}
          <h1 
            className={`font-black uppercase mb-4 leading-[0.9] transition-all duration-700 ${
              featuredMovie.id === 'mandala' 
                ? 'text-6xl md:text-8xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-red-400 via-red-600 to-red-900 animate-title-glow tracking-[0.05em]' 
                : 'text-5xl md:text-7xl lg:text-8xl text-white'
            }`}
            style={{
              textShadow: featuredMovie.id === 'mandala' 
                ? '0 0 40px rgba(239,68,68,0.5), 0 0 80px rgba(239,68,68,0.3), 0 0 120px rgba(239,68,68,0.2)' 
                : '0 2px 20px rgba(0,0,0,0.8)'
            }}
          >
            {featuredMovie.title}
          </h1>

          {/* Enhanced Rating System with Animation */}
          <div className="flex items-center gap-3 mb-4 group">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 transition-all duration-300 ${
                    i < 4 
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                      : 'text-slate-600'
                  } ${i < 4 ? 'group-hover:scale-110' : ''}`}
                  style={{ transitionDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-amber-400 font-bold">★ {featuredMovie.rating || '9.0'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {featuredMovie.duration}
              </span>
              {featuredMovie.releaseYear && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {featuredMovie.releaseYear}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Genre Tags with Hover Effects */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(featuredMovie.id === 'mandala' 
              ? ['Crime', 'Drama', 'Mystery', 'Thriller'] 
              : [featuredMovie.genre, 'Blockbuster', 'Cinema']
            ).map((genre, index) => (
              <span
                key={genre}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Description with Type Effect */}
          <p className="text-slate-300 text-sm md:text-base max-w-xl leading-relaxed mb-8 font-light backdrop-blur-sm bg-black/10 p-4 border-l-2 border-red-600/30">
            {featuredMovie.id === 'mandala' 
              ? 'A gripping tale of ancient secrets and modern crimes intertwine in this psychological thriller that will keep you on the edge of your seat.'
              : featuredMovie.description
            }
          </p>

          {/* Action Buttons with Premium Styling */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Play Button with Ripple Effect */}
            <button
              onClick={() => {
                triggerParticleEffect();
                onPlay(featuredMovie);
              }}
              className="group relative px-8 py-3.5 bg-gradient-to-r from-emerald-400 to-emerald-600 text-black font-bold text-sm uppercase overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,230,162,0.3)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Play className="w-5 h-5 fill-current" />
                Play Now
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-300 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
              {particleEffect && (
                <div className="absolute inset-0 animate-ping bg-emerald-400/20 rounded-lg" />
              )}
            </button>

            {/* Trailer Button */}
            <button
              onClick={() => onDetail(featuredMovie)}
              className="group px-8 py-3.5 border-2 border-white/20 text-white font-bold text-sm uppercase backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/5 hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Watch Trailer
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            {/* Enhanced Like Button */}
            <button
              onClick={() => {
                triggerParticleEffect();
                onLikeToggle(featuredMovie.id);
              }}
              className={`relative p-3 backdrop-blur-sm border transition-all duration-300 hover:scale-110 ${
                isLiked
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  : 'bg-white/5 border-white/20 text-slate-400 hover:border-white/40 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 transition-all ${isLiked ? 'fill-current scale-110' : ''}`} />
              {isLiked && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Video Audio Control */}
            {featuredMovie.trailerUrl && isVideoLoaded && !isVideoError && (
              <button
                onClick={handleMuteToggle}
                className="p-3 backdrop-blur-sm bg-white/5 border border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition-all duration-300"
                title={isMuted ? 'Unmute Background Video' : 'Mute Background Video'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            )}
          </div>

          {/* Video Status Indicator */}
          {featuredMovie.trailerUrl && (
            <div className="flex items-center gap-6 mt-8 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isVideoLoaded && !isVideoError 
                    ? 'bg-emerald-400 animate-pulse' 
                    : 'bg-red-400'
                }`} />
                <span>
                  {isVideoError 
                    ? 'Video Unavailable' 
                    : isVideoLoaded 
                      ? 'Background Video Playing' 
                      : 'Loading Video...'}
                </span>
              </div>
              <div className="w-px h-4 bg-slate-800" />
              <span>4K Ultra HD</span>
              <div className="w-px h-4 bg-slate-800" />
              <span>Dolby Atmos</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Bottom Carousel */}
      <div className="relative z-20 w-full bg-gradient-to-t from-black via-black/95 to-transparent pb-8 pt-12 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Carousel Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent" />
              <h3 className="text-xs font-black tracking-[0.3em] text-emerald-400 uppercase flex items-center gap-2">
                <Film className="w-4 h-4" />
                Cinematic Universe
              </h3>
              <div className="w-8 h-0.5 bg-gradient-to-l from-emerald-400 to-transparent" />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Click to Feature
            </div>
          </div>

          {/* Advanced Grid with Hover Effects */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {sliderMovies.map((movie, index) => {
              const isSelected = movie.id === featuredMovie.id;
              const isHovered = hoveredMovie === movie.id;
              
              return (
                <div
                  key={movie.id}
                  onClick={() => {
                    triggerParticleEffect();
                    onSwapFeatured(movie);
                  }}
                  onMouseEnter={() => setHoveredMovie(movie.id)}
                  onMouseLeave={() => setHoveredMovie(null)}
                  className={`relative aspect-[3/4] cursor-pointer transition-all duration-500 group transform ${
                    isSelected
                      ? 'scale-105 z-10'
                      : 'hover:scale-105 hover:z-10'
                  }`}
                  style={{
                    transitionDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Glow Effect for Selected */}
                  {isSelected && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 rounded-2xl blur opacity-75 animate-pulse" />
                  )}
                  
                  {/* Card Container */}
                  <div className={`relative h-full rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                    isSelected
                      ? 'border-emerald-400 shadow-[0_0_30px_rgba(0,230,162,0.3)]'
                      : isHovered
                      ? 'border-white/30 shadow-xl'
                      : 'border-white/10 hover:border-white/20'
                  }`}>
                    {/* Poster Image with Dynamic Zoom */}
                    <img
                      src={movie.thumbnailUrl}
                      alt={movie.title}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        isHovered ? 'scale-110' : 'scale-100'
                      }`}
                    />

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-emerald-900/20 transition-opacity duration-300 ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`} />

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-400 text-black text-[9px] font-black uppercase rounded-full shadow-lg flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                        Now Playing
                      </div>
                    )}

                    {/* Movie Info Overlay */}
                    <div className={`absolute inset-x-0 bottom-0 p-3 transition-all duration-300 ${
                      isHovered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-90'
                    }`}>
                      <h4 className="text-xs font-black text-white truncate uppercase mb-1">
                        {movie.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[9px] text-slate-400">
                        <span>{movie.genre}</span>
                        <span>•</span>
                        <span>{movie.releaseYear}</span>
                      </div>
                      
                      {/* Hover Rating */}
                      <div className={`flex items-center gap-1 mt-1 transition-all duration-300 ${
                        isHovered ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0'
                      }`}>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] text-amber-400">{movie.rating || '8.5'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {sliderMovies.map((movie) => (
              <div
                key={movie.id}
                className={`h-1 transition-all duration-500 rounded-full ${
                  movie.id === featuredMovie.id
                    ? 'w-8 bg-emerald-400'
                    : 'w-2 bg-slate-800 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.5; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes title-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }
        .animate-float {
          animation: float linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-title-glow {
          animation: title-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}