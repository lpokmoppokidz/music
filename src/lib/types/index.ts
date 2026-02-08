export interface Song {
  _id: string;
  title: string;
  artist: string;
  albumId?: string;
  duration: number;
  audioUrl: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  userId: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Album {
  _id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  userId: string;
  songs: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Favorite {
  _id: string;
  userId: string;
  songId: string;
  song?: Song;
  createdAt: Date;
}

export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
}
