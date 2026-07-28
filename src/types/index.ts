export interface Episode {
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl?: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string;
  releaseYear: number;
  thumbnailUrl: string;
  trailerUrl: string;
  videoUrl: string;
  duration: string;
  rating: string;
  cast: string[];
  views: number;
  likes: number;
  isFeatured: boolean;
  createdAt: string;
  type?: 'movie' | 'series';
  episodes?: Episode[];
  likedBy?: string[];
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'moderator';
  subscription: {
    active: boolean;
    planId: string;
    expiresAt: string;
  };
  watchlist: string[];
  history: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface PlatformStats {
  totalViews: number;
  totalLikes: number;
  totalMovies: number;
  totalSeries: number;
  subscribedUsers: number;
  freeUsers: number;
  totalUsers: number;
  estimatedRevenue: number;
  averageRating: string;
  popularGenre: string;
  storageUsed: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}