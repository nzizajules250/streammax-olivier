import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, PlusCircle, Film, Users, Trash2, Edit3, Grid, List, 
  Upload, Sparkles, TrendingUp, DollarSign, Eye, Play, Star, Calendar, 
  Clock, Check, Settings, Tv, Plus, X, AlertTriangle, Activity,
  HardDrive, Globe, Zap, Download, RefreshCw, Filter, Search,
  ChevronDown, ChevronUp, MoreVertical, PieChart, LineChart, 
  Shield, Crown, UserCheck, UserX, Monitor, Smartphone, Tablet,
  Bell, MessageSquare, ThumbsUp, Share2, Flag, Image, Video,
  FileText, Layers, Sliders, Maximize2, Minimize2, Copy, Link
} from 'lucide-react';
import { Movie, User, PlatformStats, Episode } from '../types';
import { GENRES } from '../data/mockMovies';
import { uploadToCloudinary } from '../lib/cloudinary';

interface AdminDashboardProps {
  movies: Movie[];
  users: User[];
  onAddMovie: (newMovie: Omit<Movie, 'id' | 'views' | 'likes' | 'createdAt'>) => void;
  onDeleteMovie: (id: string) => void;
  onUpdateUserSubscription: (userId: string, active: boolean, planId?: string) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

// Animated counter component
const AnimatedCounter = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

// Progress ring component
const ProgressRing = ({ progress, size = 60, strokeWidth = 4, color = '#f59e0b' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.3em"
        className="transform rotate-90"
        fill="white"
        fontSize="12"
        fontWeight="bold"
      >
        {progress}%
      </text>
    </svg>
  );
};

// Real-time clock component
const RealTimeClock = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="text-right">
      <div className="text-sm font-bold text-white">
        {time.toLocaleTimeString('en-US', { hour12: false })}
      </div>
      <div className="text-[10px] text-gray-400">
        {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  );
};

export default function AdminDashboard({
  movies,
  users,
  onAddMovie,
  onDeleteMovie,
  onUpdateUserSubscription,
  addToast
}: AdminDashboardProps) {
  // Tab management
  const [adminTab, setAdminTab] = useState<'analytics' | 'add-movie' | 'movies-list' | 'users' | 'settings'>('analytics');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Movie form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('Action');
  const [releaseYear, setReleaseYear] = useState<number>(2026);
  const [duration, setDuration] = useState('2h 10m');
  const [rating, setRating] = useState('PG-13');
  const [castStr, setCastStr] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  
  // Upload states
  const [thumbnailSourceMode, setThumbnailSourceMode] = useState<'upload' | 'url'>('upload');
  const [videoSourceMode, setVideoSourceMode] = useState<'upload' | 'url'>('url');
  const [episodeSourceMode, setEpisodeSourceMode] = useState<'upload' | 'url'>('url');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingEpisodes, setIsUploadingEpisodes] = useState(false);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [episodesUploadProgress, setEpisodesUploadProgress] = useState(0);
  const [bulkEpisodeUrls, setBulkEpisodeUrls] = useState('');
  
  // Cloudinary config
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState(
    localStorage.getItem('cloudinary_cloud_name') || ''
  );
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState(
    localStorage.getItem('cloudinary_upload_preset') || ''
  );
  const [showCloudinaryConfig, setShowCloudinaryConfig] = useState(false);
  
  // Filters
  const [adminGenreFilter, setAdminGenreFilter] = useState('All');
  const [adminYearFilter, setAdminYearFilter] = useState('All');
  const [adminViewMode, setAdminViewMode] = useState<'grid' | 'list'>('grid');
  const [searchUsers, setSearchUsers] = useState('');
  const [sortUsersBy, setSortUsersBy] = useState<'name' | 'date' | 'status'>('name');
  
  // Refs
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const episodesInputRef = useRef<HTMLInputElement>(null);

  // Real-time stats calculation
  const stats = useMemo(() => ({
    totalViews: movies.reduce((sum, m) => sum + (m.views || 0), 0),
    totalLikes: movies.reduce((sum, m) => sum + (m.likes || 0), 0),
    totalMovies: movies.filter(m => m.type !== 'series').length,
    totalSeries: movies.filter(m => m.type === 'series').length,
    subscribedUsers: users.filter(u => u.subscription?.active).length,
    freeUsers: users.filter(u => !u.subscription?.active).length,
    totalUsers: users.length,
    estimatedRevenue: users.filter(u => u.subscription?.active).length * 14.99,
    averageRating: movies.length > 0 
      ? (movies.reduce((sum, m) => sum + (parseFloat(m.rating) || 0), 0) / movies.length).toFixed(1)
      : '0.0',
    popularGenre: movies.length > 0
      ? Object.entries(movies.reduce((acc, m) => {
          acc[m.genre] = (acc[m.genre] || 0) + 1;
          return acc;
        }, {} as Record<string, number>))
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
      : 'N/A',
    storageUsed: Math.round(movies.length * 2.4 * 10) / 10,
  }), [movies, users]);

  // Simulated real-time data
  const [activeUsers, setActiveUsers] = useState(0);
  const [bandwidthUsage, setBandwidthUsage] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(Math.floor(Math.random() * 100) + 50);
      setBandwidthUsage(Math.floor(Math.random() * 500) + 200);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Cloudinary handlers
  const saveCloudinaryConfig = (cloud: string, preset: string) => {
    setCloudinaryCloudName(cloud);
    setCloudinaryUploadPreset(preset);
    localStorage.setItem('cloudinary_cloud_name', cloud);
    localStorage.setItem('cloudinary_upload_preset', preset);
    addToast('Cloudinary configuration saved!', 'success');
  };

  const simulateUpload = (file: File, type: 'thumbnail' | 'video') => {
    const setProgress = type === 'thumbnail' ? setThumbnailUploadProgress : setVideoUploadProgress;
    const setUploading = type === 'thumbnail' ? setIsUploadingThumbnail : setIsUploadingVideo;
    const setUrl = type === 'thumbnail' ? setThumbnailUrl : setVideoUrl;
    
    setUploading(true);
    setProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setUploading(false);
          const mockUrl = `https://res.cloudinary.com/demo/${type === 'thumbnail' ? 'image' : 'video'}/upload/v${Date.now()}/${file.name}`;
          setUrl(mockUrl);
          addToast(`[Demo] ${type === 'thumbnail' ? 'Poster' : 'Video'} uploaded successfully!`, 'success');
        }, 500);
      }
      setProgress(Math.min(progress, 100));
    }, 200);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      simulateUpload(file, 'thumbnail');
      return;
    }
    
    setIsUploadingThumbnail(true);
    try {
      const url = await uploadToCloudinary(file, cloudinaryCloudName, cloudinaryUploadPreset, setThumbnailUploadProgress);
      setThumbnailUrl(url);
      addToast('Poster uploaded to Cloudinary!', 'success');
    } catch (err) {
      addToast('Upload failed, using demo mode', 'warning');
      simulateUpload(file, 'thumbnail');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      simulateUpload(file, 'video');
      return;
    }
    
    setIsUploadingVideo(true);
    try {
      const url = await uploadToCloudinary(file, cloudinaryCloudName, cloudinaryUploadPreset, setVideoUploadProgress);
      setVideoUrl(url);
      addToast('Video uploaded to Cloudinary!', 'success');
    } catch (err) {
      addToast('Upload failed, using demo mode', 'warning');
      simulateUpload(file, 'video');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleBulkEpisodesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    setIsUploadingEpisodes(true);
    const newEpisodes: Episode[] = [...episodes];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setEpisodesUploadProgress(0);
      
      let url = '';
      if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
        await new Promise<void>(resolve => {
          let p = 0;
          const int = setInterval(() => {
            p += 25;
            setEpisodesUploadProgress(Math.min(p, 100));
            if (p >= 100) { clearInterval(int); resolve(); }
          }, 150);
        });
        url = `https://res.cloudinary.com/demo/video/upload/ep${newEpisodes.length + 1}.mp4`;
      } else {
        try {
          url = await uploadToCloudinary(file, cloudinaryCloudName, cloudinaryUploadPreset, setEpisodesUploadProgress);
        } catch {
          url = `https://res.cloudinary.com/demo/video/upload/ep${newEpisodes.length + 1}.mp4`;
        }
      }
      
      newEpisodes.push({
        id: `ep-${Date.now()}-${i}`,
        episodeNumber: newEpisodes.length + 1,
        seasonNumber: 1,
        title: file.name.replace(/\.[^/.]+$/, ""),
        duration: '45m',
        videoUrl: url
      });
      
      setEpisodes([...newEpisodes]);
    }
    
    setIsUploadingEpisodes(false);
    addToast(`${files.length} episodes uploaded!`, 'success');
  };

  const handleBulkEpisodeUrlsAdd = () => {
    const urls = bulkEpisodeUrls.split('\n').filter(u => u.trim());
    if (!urls.length) return;
    
    const newEpisodes = urls.map((url, i) => ({
      id: `ep-${Date.now()}-${i}`,
      episodeNumber: episodes.length + i + 1,
      seasonNumber: 1,
      title: `Episode ${episodes.length + i + 1}`,
      duration: '45m',
      videoUrl: url.trim()
    }));
    
    setEpisodes([...episodes, ...newEpisodes]);
    setBulkEpisodeUrls('');
    addToast(`${urls.length} episodes added!`, 'success');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !thumbnailUrl) {
      addToast('Please fill all required fields', 'error');
      return;
    }
    
    if (contentType === 'series' && episodes.length === 0) {
      addToast('Add at least one episode for series', 'error');
      return;
    }
    
    onAddMovie({
      title,
      description,
      genre,
      releaseYear,
      duration: contentType === 'series' ? `${episodes.length} Episodes` : duration,
      rating,
      cast: castStr.split(',').map(s => s.trim()).filter(Boolean),
      thumbnailUrl,
      trailerUrl: videoUrl || episodes[0]?.videoUrl || '',
      videoUrl: videoUrl || episodes[0]?.videoUrl || '',
      isFeatured: false,
      type: contentType,
      episodes: contentType === 'series' ? episodes : undefined,
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setGenre('Action');
    setReleaseYear(2026);
    setDuration('2h 10m');
    setRating('PG-13');
    setCastStr('');
    setThumbnailUrl('');
    setVideoUrl('');
    setEpisodes([]);
    setContentType('movie');
    
    addToast('Content published successfully!', 'success');
    setAdminTab('movies-list');
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users
      .filter(u => 
        u.username.toLowerCase().includes(searchUsers.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchUsers.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortUsersBy) {
          case 'name': return a.username.localeCompare(b.username);
          case 'date': return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
          case 'status': return (b.subscription?.active ? 1 : 0) - (a.subscription?.active ? 1 : 0);
          default: return 0;
        }
      });
  }, [users, searchUsers, sortUsersBy]);

  return (
    <div className={`bg-gray-950 text-white ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'}`}>
      {/* Header */}
      <div className="border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black">Admin Console</h1>
                <p className="text-xs text-gray-400">Platform Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <RealTimeClock />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-semibold">System Online</span>
              </div>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 shrink-0 space-y-2">
            <nav className="space-y-1">
              {[
                { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'amber' },
                { id: 'add-movie', label: 'Add Content', icon: PlusCircle, color: 'green' },
                { id: 'movies-list', label: 'Content Library', icon: Film, color: 'blue' },
                { id: 'users', label: 'User Management', icon: Users, color: 'purple' },
                { id: 'settings', label: 'Settings', icon: Settings, color: 'gray' },
              ].map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setAdminTab(id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${
                    adminTab === id
                      ? 'bg-white/10 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${
                    adminTab === id ? 'text-amber-400' : 'text-gray-500 group-hover:text-gray-300'
                  }`} />
                  <span>{label}</span>
                  {id === 'analytics' && (
                    <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {stats.totalMovies + stats.totalSeries}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Quick Stats Card */}
            <div className="mt-6 p-4 bg-gray-900/50 rounded-2xl border border-gray-800/50">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">System Health</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">CPU Usage</span>
                    <span className="text-green-400 font-bold">23%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{ width: '23%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Storage</span>
                    <span className="text-amber-400 font-bold">{stats.storageUsed}GB</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Bandwidth</span>
                    <span className="text-blue-400 font-bold">{bandwidthUsage} Mbps</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full" style={{ width: `${(bandwidthUsage / 1000) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* Analytics Dashboard */}
              {adminTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'from-blue-500 to-cyan-500', change: '+12.5%' },
                      { label: 'Active Users', value: activeUsers, icon: Users, color: 'from-green-500 to-emerald-500', change: '+5.2%' },
                      { label: 'Revenue', value: stats.estimatedRevenue, icon: DollarSign, color: 'from-amber-500 to-orange-500', change: '+18.3%', prefix: '$' },
                      { label: 'Content Items', value: stats.totalMovies + stats.totalSeries, icon: Film, color: 'from-purple-500 to-pink-500', change: '+3' },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700/50 transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                          <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color}`}>
                            <stat.icon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="text-3xl font-black">
                          <AnimatedCounter value={stat.value} prefix={stat.prefix} />
                        </div>
                        <span className="text-xs text-green-400 font-semibold mt-1 block">{stat.change}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Traffic Chart */}
                    <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-400" />
                        Traffic Overview
                      </h3>
                      <div className="h-48 flex items-end gap-2">
                        {[30, 45, 78, 92, 120, 145, 132, 158, 167, 189, 201, 234].map((val, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${(val / 250) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="flex-1 bg-gradient-to-t from-amber-500/20 to-amber-500 rounded-t-lg relative group"
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {val}K views
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                          <span key={m}>{m}</span>
                        ))}
                      </div>
                    </div>

                    {/* Genre Distribution */}
                    <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-purple-400" />
                        Genre Distribution
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(
                          movies.reduce((acc, m) => {
                            acc[m.genre] = (acc[m.genre] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 5)
                          .map(([genre, count]) => (
                            <div key={genre} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-300">{genre}</span>
                                <span className="text-gray-500">{count} items</span>
                              </div>
                              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(count / movies.length) * 100}%` }}
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {[
                        { icon: Play, text: 'New movie "Dune: Part Two" started streaming', time: '2 min ago', color: 'text-green-400' },
                        { icon: UserCheck, text: 'User "cinephile42" upgraded to VIP', time: '15 min ago', color: 'text-amber-400' },
                        { icon: Upload, text: 'Content upload completed successfully', time: '1 hour ago', color: 'text-blue-400' },
                        { icon: Star, text: '"Interstellar" reached 10K likes milestone', time: '3 hours ago', color: 'text-yellow-400' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors">
                          <div className={`p-2 rounded-lg bg-white/5`}>
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-300">{item.text}</p>
                            <p className="text-xs text-gray-500">{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Add Content Form */}
              {adminTab === 'add-movie' && (
                <motion.div
                  key="add-movie"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-3xl space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black">Add New Content</h2>
                      <p className="text-sm text-gray-400 mt-1">Publish movies or TV series to your platform</p>
                    </div>
                    <button
                      onClick={() => setShowCloudinaryConfig(!showCloudinaryConfig)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      Cloudinary Config
                    </button>
                  </div>

                  {showCloudinaryConfig && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 space-y-4"
                    >
                      <h3 className="text-sm font-bold text-amber-400">Cloudinary API Settings</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cloud Name</label>
                          <input
                            value={cloudinaryCloudName}
                            onChange={(e) => saveCloudinaryConfig(e.target.value, cloudinaryUploadPreset)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                            placeholder="your-cloud-name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Upload Preset</label>
                          <input
                            value={cloudinaryUploadPreset}
                            onChange={(e) => saveCloudinaryConfig(cloudinaryCloudName, e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                            placeholder="unsigned-preset"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    {/* Content Type Selector */}
                    <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4">
                      <div className="flex gap-2">
                        {[
                          { type: 'movie' as const, label: 'Movie', icon: Film },
                          { type: 'series' as const, label: 'TV Series', icon: Tv },
                        ].map(({ type, label, icon: Icon }) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setContentType(type)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                              contentType === type
                                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Title *</label>
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                          placeholder="Enter content title"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Genre *</label>
                        <select
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
                        >
                          {GENRES.filter(g => g !== 'All').map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Release Year *</label>
                        <input
                          type="number"
                          value={releaseYear}
                          onChange={(e) => setReleaseYear(Number(e.target.value))}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Duration</label>
                        <input
                          value={contentType === 'series' ? `${episodes.length} Episodes` : duration}
                          onChange={(e) => setDuration(e.target.value)}
                          disabled={contentType === 'series'}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Rating</label>
                        <input
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
                          placeholder="PG-13, R, etc."
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description *</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 resize-none"
                        placeholder="Write a compelling description..."
                        required
                      />
                    </div>

                    {/* Cast */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cast (comma separated)</label>
                      <input
                        value={castStr}
                        onChange={(e) => setCastStr(e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
                        placeholder="Actor 1, Actor 2, Actor 3"
                      />
                    </div>

                    {/* Thumbnail Upload */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Poster Image *</label>
                      <div className="flex gap-2 mb-3">
                        {[
                          { mode: 'upload' as const, label: 'Upload File' },
                          { mode: 'url' as const, label: 'Paste URL' },
                        ].map(({ mode, label }) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setThumbnailSourceMode(mode)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              thumbnailSourceMode === mode
                                ? 'bg-amber-500 text-black'
                                : 'bg-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      
                      {thumbnailSourceMode === 'upload' ? (
                        <div
                          onClick={() => thumbnailInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center hover:border-amber-500/50 transition-all cursor-pointer"
                        >
                          <input
                            ref={thumbnailInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                            className="hidden"
                          />
                          {isUploadingThumbnail ? (
                            <div className="space-y-3">
                              <Upload className="w-8 h-8 text-amber-400 animate-bounce mx-auto" />
                              <p className="text-sm font-bold text-amber-400">Uploading...</p>
                              <div className="w-48 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-300"
                                  style={{ width: `${thumbnailUploadProgress}%` }}
                                />
                              </div>
                            </div>
                          ) : thumbnailUrl ? (
                            <div className="space-y-3">
                              <img src={thumbnailUrl} alt="Preview" className="w-32 h-32 object-cover rounded-xl mx-auto" />
                              <p className="text-xs text-green-400 font-bold">✓ Uploaded successfully</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-8 h-8 text-gray-500 mx-auto" />
                              <p className="text-sm text-gray-400">Click to upload poster</p>
                              <p className="text-xs text-gray-600">PNG, JPG, WebP supported</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
                          placeholder="https://example.com/poster.jpg"
                        />
                      )}
                    </div>

                    {/* Video Upload (Movies only) */}
                    {contentType === 'movie' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Video Stream</label>
                        <div className="flex gap-2 mb-3">
                          {[
                            { mode: 'upload' as const, label: 'Upload File' },
                            { mode: 'url' as const, label: 'Paste URL' },
                          ].map(({ mode, label }) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setVideoSourceMode(mode)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                videoSourceMode === mode
                                  ? 'bg-amber-500 text-black'
                                  : 'bg-white/5 text-gray-400 hover:text-white'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        
                        {videoSourceMode === 'upload' ? (
                          <div
                            onClick={() => videoInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center hover:border-amber-500/50 transition-all cursor-pointer"
                          >
                            <input
                              ref={videoInputRef}
                              type="file"
                              accept="video/*"
                              onChange={handleVideoUpload}
                              className="hidden"
                            />
                            {isUploadingVideo ? (
                              <div className="space-y-3">
                                <Upload className="w-8 h-8 text-blue-400 animate-bounce mx-auto" />
                                <p className="text-sm font-bold text-blue-400">Uploading video...</p>
                                <div className="w-48 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-300"
                                    style={{ width: `${videoUploadProgress}%` }}
                                  />
                                </div>
                              </div>
                            ) : videoUrl ? (
                              <div className="space-y-3">
                                <Video className="w-8 h-8 text-green-400 mx-auto" />
                                <p className="text-xs text-green-400 font-bold">✓ Video uploaded</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Video className="w-8 h-8 text-gray-500 mx-auto" />
                                <p className="text-sm text-gray-400">Click to upload video</p>
                                <p className="text-xs text-gray-600">MP4, WebM supported</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <input
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
                            placeholder="https://example.com/video.mp4"
                          />
                        )}
                      </div>
                    )}

                    {/* Episodes Manager (Series only) */}
                    {contentType === 'series' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Episodes ({episodes.length})
                          </h3>
                          <div className="flex gap-2">
                            {[
                              { mode: 'upload' as const, label: 'Bulk Upload' },
                              { mode: 'url' as const, label: 'Bulk URLs' },
                            ].map(({ mode, label }) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setEpisodeSourceMode(mode)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                  episodeSourceMode === mode
                                    ? 'bg-amber-500 text-black'
                                    : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {episodeSourceMode === 'upload' ? (
                          <div
                            onClick={() => episodesInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center hover:border-amber-500/50 transition-all cursor-pointer"
                          >
                            <input
                              ref={episodesInputRef}
                              type="file"
                              accept="video/*"
                              multiple
                              onChange={handleBulkEpisodesUpload}
                              className="hidden"
                            />
                            <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Select multiple episode files</p>
                            <p className="text-xs text-gray-600 mt-1">Videos will be uploaded sequentially</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <textarea
                              value={bulkEpisodeUrls}
                              onChange={(e) => setBulkEpisodeUrls(e.target.value)}
                              rows={4}
                              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 resize-none font-mono"
                              placeholder="https://example.com/ep1.mp4&#10;https://example.com/ep2.mp4"
                            />
                            <button
                              type="button"
                              onClick={handleBulkEpisodeUrlsAdd}
                              className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
                            >
                              Add Episodes from URLs
                            </button>
                          </div>
                        )}

                        {episodes.length > 0 && (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {episodes.map((ep, i) => (
                              <div key={ep.id} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl">
                                <span className="w-8 h-8 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center text-xs font-bold">
                                  {ep.episodeNumber}
                                </span>
                                <input
                                  value={ep.title}
                                  onChange={(e) => {
                                    const updated = [...episodes];
                                    updated[i] = { ...ep, title: e.target.value };
                                    setEpisodes(updated);
                                  }}
                                  className="flex-1 bg-transparent text-sm focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEpisodes(episodes.filter((_, j) => j !== i))}
                                  className="p-1 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black rounded-2xl hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Publish {contentType === 'movie' ? 'Movie' : 'TV Series'}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Content Library */}
              {adminTab === 'movies-list' && (
                <motion.div
                  key="movies-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black">Content Library</h2>
                      <p className="text-sm text-gray-400 mt-1">{movies.length} items total</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex bg-white/5 rounded-xl p-1">
                        <button
                          onClick={() => setAdminViewMode('grid')}
                          className={`p-2 rounded-lg transition-all ${adminViewMode === 'grid' ? 'bg-amber-500 text-black' : 'text-gray-400'}`}
                        >
                          <Grid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setAdminViewMode('list')}
                          className={`p-2 rounded-lg transition-all ${adminViewMode === 'list' ? 'bg-amber-500 text-black' : 'text-gray-400'}`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex gap-4">
                    <select
                      value={adminGenreFilter}
                      onChange={(e) => setAdminGenreFilter(e.target.value)}
                      className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                    >
                      {GENRES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <select
                      value={adminYearFilter}
                      onChange={(e) => setAdminYearFilter(e.target.value)}
                      className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                    >
                      <option value="All">All Years</option>
                      {[2026, 2025, 2024, 2023].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Content Grid/List */}
                  {adminViewMode === 'grid' ? (
                    <div className="grid grid-cols-3 gap-4">
                      {movies
                        .filter(m => {
                          const genreMatch = adminGenreFilter === 'All' || m.genre === adminGenreFilter;
                          const yearMatch = adminYearFilter === 'All' || m.releaseYear?.toString() === adminYearFilter;
                          return genreMatch && yearMatch;
                        })
                        .map((movie) => (
                          <motion.div
                            key={movie.id}
                            layout
                            className="bg-gray-900/50 border border-gray-800/50 rounded-2xl overflow-hidden group hover:border-gray-700/50 transition-all"
                          >
                            <div className="aspect-video relative">
                              <img
                                src={movie.thumbnailUrl}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => onDeleteMovie(movie.id)}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-lg">
                                  {movie.genre}
                                </span>
                                <span className="text-xs text-gray-400">{movie.releaseYear}</span>
                              </div>
                              <h3 className="font-bold text-sm truncate">{movie.title}</h3>
                              <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                                <span>★ {movie.rating}</span>
                                <span>{movie.views?.toLocaleString()} views</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  ) : (
                    <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-800 text-xs text-gray-400 uppercase">
                            <th className="text-left p-4">Title</th>
                            <th className="text-left p-4">Genre</th>
                            <th className="text-left p-4">Year</th>
                            <th className="text-left p-4">Rating</th>
                            <th className="text-left p-4">Views</th>
                            <th className="text-right p-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                          {movies
                            .filter(m => {
                              const genreMatch = adminGenreFilter === 'All' || m.genre === adminGenreFilter;
                              const yearMatch = adminYearFilter === 'All' || m.releaseYear?.toString() === adminYearFilter;
                              return genreMatch && yearMatch;
                            })
                            .map((movie) => (
                              <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={movie.thumbnailUrl}
                                      alt={movie.title}
                                      className="w-10 h-10 rounded-lg object-cover"
                                    />
                                    <span className="font-bold text-sm">{movie.title}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg">
                                    {movie.genre}
                                  </span>
                                </td>
                                <td className="p-4 text-sm text-gray-400">{movie.releaseYear}</td>
                                <td className="p-4 text-sm text-gray-400">{movie.rating}</td>
                                <td className="p-4 text-sm text-gray-400">{movie.views?.toLocaleString()}</td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => onDeleteMovie(movie.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-xl text-red-400 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}

              {/* User Management */}
              {adminTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black">User Management</h2>
                      <p className="text-sm text-gray-400 mt-1">{users.length} registered users</p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        value={searchUsers}
                        onChange={(e) => setSearchUsers(e.target.value)}
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm focus:outline-none focus:border-amber-500 w-64"
                      />
                    </div>
                  </div>

                  {/* User Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
                      { label: 'VIP Members', value: stats.subscribedUsers, icon: Crown, color: 'text-amber-400' },
                      { label: 'Free Users', value: stats.freeUsers, icon: UserX, color: 'text-gray-400' },
                      { label: 'Conversion Rate', value: `${((stats.subscribedUsers / stats.totalUsers) * 100).toFixed(1)}%`, icon: TrendingUp, color: 'text-green-400' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">{stat.label}</span>
                          <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <div className="text-2xl font-black">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Users Table */}
                  <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800 text-xs text-gray-400 uppercase">
                          <th className="text-left p-4">User</th>
                          <th className="text-left p-4">Status</th>
                          <th className="text-left p-4">Watchlist</th>
                          <th className="text-left p-4">Joined</th>
                          <th className="text-right p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center text-black font-bold">
                                  {user.username[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{user.username}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                user.subscription?.active
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : 'bg-gray-800 text-gray-400 border border-gray-700'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${user.subscription?.active ? 'bg-green-400' : 'bg-gray-500'}`} />
                                {user.subscription?.active ? 'VIP' : 'Free'}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-400">
                              {user.watchlist?.length || 0} items
                            </td>
                            <td className="p-4 text-sm text-gray-400">
                              {new Date(user.createdAt || '').toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => {
                                  onUpdateUserSubscription(user.id, !user.subscription?.active, 'gold');
                                  addToast(`Updated ${user.username}'s subscription`, 'success');
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                  user.subscription?.active
                                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                                }`}
                              >
                                {user.subscription?.active ? 'Revoke VIP' : 'Grant VIP'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Settings */}
              {adminTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6 max-w-2xl"
                >
                  <h2 className="text-2xl font-black">Platform Settings</h2>
                  
                  <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-amber-400" />
                        Cloudinary Configuration
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cloud Name</label>
                          <input
                            value={cloudinaryCloudName}
                            onChange={(e) => saveCloudinaryConfig(e.target.value, cloudinaryUploadPreset)}
                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Upload Preset</label>
                          <input
                            value={cloudinaryUploadPreset}
                            onChange={(e) => saveCloudinaryConfig(cloudinaryCloudName, e.target.value)}
                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-800 pt-6">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-blue-400" />
                        Storage Statistics
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-black">{stats.totalMovies + stats.totalSeries}</p>
                          <p className="text-xs text-gray-400 mt-1">Total Assets</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-black">{stats.storageUsed} GB</p>
                          <p className="text-xs text-gray-400 mt-1">Storage Used</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-black text-green-400">Unlimited</p>
                          <p className="text-xs text-gray-400 mt-1">Bandwidth</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}