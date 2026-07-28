import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Sparkles,
  Film,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  Search,
  Home,
  Clapperboard,
  Tv,
  Calendar,
  TrendingUp,
  Crown,
  Bell,
  User,
  ChevronDown,
  Play,
  Plus,
  Zap,
} from 'lucide-react';
import { User as UserType, ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenSubscription: () => void;
  mediaTypeFilter: 'all' | 'movie' | 'series' | 'upcoming';
  setMediaTypeFilter: (filter: 'all' | 'movie' | 'series' | 'upcoming') => void;
  setGenreFilter?: (g: string) => void;
}

// Enhanced sprocket filmstrip component with animation
function FilmStrip({ className = '', animated = false }: { className?: string; animated?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      <div
        aria-hidden="true"
        className="h-[4px] w-full opacity-60"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 4px,
            rgba(0, 230, 0, 0.2) 4px,
            rgba(0, 230, 0, 0.2) 6px,
            transparent 6px,
            transparent 10px
          )`,
          backgroundSize: '20px 4px',
          animation: animated ? 'filmstrip-scroll 2s linear infinite' : 'none',
        }}
      />
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent animate-shimmer" />
      )}
    </div>
  );
}

// Animated logo component
function AnimatedLogo() {
  return (
    <div className="relative group">
      {/* Logo glow effect */}
      <div className="absolute -inset-4 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500" />
      
      <div className="relative flex items-center gap-2">
        {/* Animated film reel icon */}
        <div className="relative w-8 h-8">
          <Film className="w-8 h-8 text-emerald-400 absolute inset-0 animate-pulse" />
          <div className="absolute inset-0 border-2 border-emerald-400/30 rounded-full animate-spin-slow" />
        </div>
        
        {/* Brand text with gradient animation */}
        <h1 className="text-3xl font-black tracking-tighter relative">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300 animate-gradient-x">
            CineLand
          </span>
          {/* Subtle underline animation */}
          <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </h1>
      </div>
    </div>
  );
}

// Notification badge component
function NotificationDot({ count = 0 }: { count?: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-bounce">
      {count}
    </span>
  );
}

const NAV_ITEMS: { id: ActiveTab; label: string; icon: typeof Home; badge?: number }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'movies', label: 'Browse', icon: Clapperboard, badge: 12 },
  { id: 'search', label: 'Search', icon: Search },
];

const MEDIA_TYPES = [
  { id: 'all' as const, label: 'All', icon: Play },
  { id: 'series' as const, label: 'TV Shows', icon: Tv },
  { id: 'movie' as const, label: 'Movies', icon: Film },
  { id: 'upcoming' as const, label: 'Upcoming', icon: Calendar },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenSubscription,
  mediaTypeFilter,
  setMediaTypeFilter,
  setGenreFilter,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount] = useState(3);
  const navRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Enhanced scroll detection with throttle
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowSearchBar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on tab change
  useEffect(() => {
    setMenuOpen(false);
    setShowSearchBar(false);
  }, [activeTab]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchBar(true);
        document.getElementById('nav-search-input')?.focus();
      }
      if (e.key === 'Escape') {
        setShowSearchBar(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const goTo = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setUserMenuOpen(false);
    if (tab === 'home') {
      setMediaTypeFilter('all');
    }
  }, [setActiveTab, setMediaTypeFilter]);

  const selectMediaType = useCallback((filter: 'all' | 'movie' | 'series' | 'upcoming') => {
    setMediaTypeFilter(filter);
    if (setGenreFilter) {
      setGenreFilter('All');
    }
    setActiveTab('movies');
  }, [setMediaTypeFilter, setGenreFilter, setActiveTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      goTo('search');
      // Pass search query via URL or state management
      setShowSearchBar(false);
    }
  };

  const isHome = activeTab === 'home';

  return (
    <>
      {/* Search Overlay */}
      {showSearchBar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 pt-24">
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400" />
                <input
                  id="nav-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies, TV shows, genres..."
                  className="w-full pl-14 pr-20 py-5 bg-gray-900/90 border-2 border-emerald-500/30 rounded-2xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_30px_rgba(0,230,162,0.2)] transition-all backdrop-blur-sm"
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <kbd className="px-2 py-1 text-xs text-gray-500 bg-gray-800 rounded-md border border-gray-700">
                    ESC
                  </kbd>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearchBar(false);
                      setSearchQuery('');
                    }}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Quick suggestions */}
              <div className="mt-6 flex flex-wrap gap-2">
                {['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller'].map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => {
                      setSearchQuery(genre);
                      goTo('search');
                      setShowSearchBar(false);
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 hover:bg-white/10 hover:border-emerald-400/30 transition-all"
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <header
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-40 w-full transition-all duration-500 ${
          scrolled
            ? 'bg-gray-950/90 backdrop-blur-xl border-b border-emerald-900/20 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.9)]'
            : isHome
            ? 'bg-transparent'
            : 'bg-gray-950/80 backdrop-blur-sm'
        }`}
      >
        {/* Animated top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${
            scrolled ? 'py-3' : 'py-4'
          }`}>
            {/* Left Section - Logo */}
            <div className="flex items-center gap-8">
              <div
                onClick={() => goTo('home')}
                className="cursor-pointer select-none shrink-0"
              >
                <AnimatedLogo />
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {isHome ? (
                  // Home page media type selector
                  <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-full p-1 border border-white/10">
                    {MEDIA_TYPES.map(({ id, label, icon: Icon }) => {
                      const isActive = mediaTypeFilter === id;
                      return (
                        <button
                          key={id}
                          onClick={() => selectMediaType(id)}
                          className={`relative px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 group ${
                            isActive
                              ? 'text-black'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {isActive && (
                            <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full shadow-[0_0_15px_rgba(0,230,162,0.3)]" />
                          )}
                          <Icon className={`relative w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-black' : ''
                          }`} />
                          <span className="relative">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  // Other pages navigation
                  <>
                    <FilmStrip className="absolute -top-1 left-0 right-0" animated />
                    {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => {
                      const isActive = activeTab === id;
                      const isHovered = hoveredNav === id;
                      
                      return (
                        <button
                          key={id}
                          onClick={() => goTo(id)}
                          onMouseEnter={() => setHoveredNav(id)}
                          onMouseLeave={() => setHoveredNav(null)}
                          className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 group ${
                            isActive
                              ? 'text-emerald-400 bg-emerald-400/10 shadow-[0_0_20px_rgba(0,230,162,0.1)]'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {/* Active indicator */}
                          {isActive && (
                            <>
                              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                            </>
                          )}
                          
                          {/* Hover glow effect */}
                          {isHovered && !isActive && (
                            <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-emerald-400/0 rounded-xl" />
                          )}
                          
                          <Icon className={`w-4 h-4 transition-transform duration-300 ${
                            isHovered ? 'scale-110' : ''
                          } ${isActive ? 'text-emerald-400' : ''}`} />
                          <span>{label}</span>
                          
                          {/* Notification badge */}
                          {badge && (
                            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse">
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    
                    {/* My Cinema button */}
                    <button
                      onClick={() => goTo(currentUser ? 'profile' : 'auth')}
                      onMouseEnter={() => setHoveredNav('profile')}
                      onMouseLeave={() => setHoveredNav(null)}
                      className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 group ${
                        activeTab === 'profile'
                          ? 'text-emerald-400 bg-emerald-400/10 shadow-[0_0_20px_rgba(0,230,162,0.1)]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>My Cinema</span>
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-3">
              {/* Search trigger */}
              <button
                onClick={() => setShowSearchBar(true)}
                className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group hidden lg:flex items-center gap-2"
                title="Search (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
                <kbd className="hidden xl:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] text-gray-500 bg-gray-800 rounded-md border border-gray-700">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>

              {/* Notifications */}
              {currentUser && (
                <button className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                  <Bell className="w-5 h-5" />
                  <NotificationDot count={notificationCount} />
                </button>
              )}

              {/* User Menu */}
              {currentUser ? (
                <div ref={userMenuRef} className="relative">
                  {/* User avatar button */}
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-all group ${
                      userMenuOpen
                        ? 'bg-white/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Avatar with glow */}
                    <div className="relative">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-black font-black text-sm shadow-lg group-hover:shadow-emerald-400/20 transition-shadow">
                        {currentUser.username.slice(0, 2).toUpperCase()}
                      </div>
                      {currentUser.subscription?.active && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                          <Crown className="w-2.5 h-2.5 text-black" />
                        </span>
                      )}
                    </div>
                    
                    {/* User info */}
                    <div className="hidden xl:flex flex-col items-start">
                      <span className="text-sm font-semibold text-white leading-tight">
                        {currentUser.username}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        {currentUser.subscription?.active ? 'VIP Member' : 'Free User'}
                      </span>
                    </div>
                    
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 transform origin-top-right ${
                    userMenuOpen
                      ? 'opacity-100 scale-100 translate-y-0'
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}>
                    {/* User info header */}
                    <div className="p-4 border-b border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-black font-black">
                          {currentUser.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{currentUser.username}</p>
                          <p className="text-xs text-gray-500">{currentUser.email || 'user@example.com'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-2">
                      {/* VIP Status */}
                      <button
                        onClick={() => {
                          onOpenSubscription();
                          setUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                          currentUser.subscription?.active
                            ? 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                            : 'bg-gradient-to-r from-emerald-400/10 to-green-400/10 text-emerald-400 hover:from-emerald-400/20 hover:to-green-400/20'
                        }`}
                      >
                        {currentUser.subscription?.active ? (
                          <>
                            <Crown className="w-4 h-4" />
                            <span>VIP Active</span>
                            <span className="ml-auto text-[10px] uppercase font-bold">Premium</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            <span>Upgrade to VIP</span>
                            <Sparkles className="w-4 h-4 ml-auto" />
                          </>
                        )}
                      </button>

                      {/* Admin button */}
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            goTo('admin');
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-all mt-1"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      {/* Profile */}
                      <button
                        onClick={() => {
                          goTo('profile');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 transition-all mt-1"
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </button>

                      {/* Logout */}
                      <div className="border-t border-gray-800 mt-2 pt-2">
                        <button
                          onClick={() => {
                            onLogout();
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Sign In button */
                <button
                  onClick={() => goTo('auth')}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-green-500 text-black text-sm font-bold rounded-xl hover:shadow-[0_0_25px_rgba(0,230,162,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Sign In
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-500 ${
          menuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <FilmStrip />
          <div className="px-4 py-6 bg-gray-950/95 backdrop-blur-xl space-y-2">
            {/* Search bar in mobile */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/50"
                onFocus={() => goTo('search')}
              />
            </div>

            {isHome ? (
              // Mobile media type selector
              <div className="grid grid-cols-2 gap-2">
                {MEDIA_TYPES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      selectMediaType(id);
                      setMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      mediaTypeFilter === id
                        ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              // Mobile navigation
              NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => goTo(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === id
                      ? 'bg-emerald-400/10 text-emerald-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))
            )}

            <button
              onClick={() => {
                goTo(currentUser ? 'profile' : 'auth');
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <User className="w-4 h-4" />
              My Cinema
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent my-4" />

            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      goTo('admin');
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Admin Dashboard
                  </button>
                )}
                
                <button
                  onClick={() => {
                    onOpenSubscription();
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    currentUser.subscription?.active
                      ? 'text-amber-400 hover:bg-amber-400/10'
                      : 'text-emerald-400 hover:bg-emerald-400/10'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  {currentUser.subscription?.active ? 'VIP Active' : 'Go VIP'}
                </button>
                
                <button
                  onClick={() => {
                    onLogout();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  goTo('auth');
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-400 to-green-500 text-black text-sm font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Custom animations */}
      <style>{`
        @keyframes filmstrip-scroll {
          from { background-position: 0 0; }
          to { background-position: 20px 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </>
  );
}