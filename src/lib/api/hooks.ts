import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from './client';
import type { Song, Album, Favorite } from '../types';

const SONGS_KEY = 'songs';
const ALBUMS_KEY = 'albums';
const FAVORITES_KEY = 'favorites';

// Get all songs
export function useGetSongs() {
  return useQuery<Song[]>({
    queryKey: [SONGS_KEY],
    queryFn: () => fetchApi('/songs'),
  });
}

// Get all albums
export function useGetAlbums() {
  return useQuery<Album[]>({
    queryKey: [ALBUMS_KEY],
    queryFn: () => fetchApi('/albums'),
  });
}

// Get all favorites
export function useGetFavorites() {
  return useQuery<Favorite[]>({
    queryKey: [FAVORITES_KEY],
    queryFn: () => fetchApi('/favorites'),
  });
}

// Add song to favorites
export function useAddToFavorites() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (songId: string) =>
      fetchApi('/favorites', {
        method: 'POST',
        body: JSON.stringify({ songId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAVORITES_KEY] });
      queryClient.invalidateQueries({ queryKey: [SONGS_KEY] });
    },
  });
}

// Remove song from favorites
export function useRemoveFromFavorites() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (songId: string) =>
      fetchApi(`/favorites/${songId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAVORITES_KEY] });
      queryClient.invalidateQueries({ queryKey: [SONGS_KEY] });
    },
  });
}

// Create new album
export function useCreateAlbum() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (album: Omit<Album, '_id' | 'createdAt' | 'updatedAt'>) =>
      fetchApi('/albums', {
        method: 'POST',
        body: JSON.stringify(album),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALBUMS_KEY] });
    },
  });
}

// Add song to album
export function useAddSongToAlbum() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ albumId, songId }: { albumId: string; songId: string }) =>
      fetchApi(`/albums/${albumId}/songs`, {
        method: 'POST',
        body: JSON.stringify({ songId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALBUMS_KEY] });
    },
  });
}
