export interface Episode {
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  duration: string;
  videoUrl: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string;
  releaseYear: number;
  thumbnailUrl: string;
  trailerUrl: string; // url to a high-quality preview/trailer loop or video
  videoUrl: string; // url to simulated full movie or main content
  duration: string; // e.g., "2h 15m"
  rating: string; // e.g., "PG-13", "R", "8.5"
  cast: string[];
  views: number;
  likes: number;
  isFeatured?: boolean;
  createdAt: string;
  type?: 'movie' | 'series';
  episodes?: Episode[];
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  subscription: {
    active: boolean;
    planId?: string; // 'basic' | 'standard' | 'premium'
    expiresAt?: string; // ISO string
  };
  watchlist: string[]; // movie IDs
  history: {
    movieId: string;
    watchedAt: string; // ISO string
    progress: number; // percentage (0-100)
    currentTime?: number; // exact playback time in seconds
  }[];
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string;
  features: string[];
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export type ActiveTab = 'home' | 'movies' | 'search' | 'profile' | 'admin' | 'auth' | 'player';

export interface PlatformStats {
  totalViews: number;
  totalWatchTime: number;
  totalRevenue: number;
  monthlyRevenue: number[];
  genreViews: { genre: string; count: number }[];
}


export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  subscription: {
    active: boolean;
    planId?: string;
    expiresAt?: string;
    autoRenew?: boolean;
  };
  watchlist: string[];
  history: Array<{
    movieId: string;
    watchedAt: string;
    progress: number;
    currentTime?: number;
  }>;
  createdAt: string;
  updatedAt?: string;
}