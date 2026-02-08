import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Playback state interface
interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
  thumbnailUrl?: string;
}

interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

interface PlaybackState {
  currentTrack: Track | null;
  currentTime: number;
  currentPlaylist: Playlist | null;
  isPlaying: boolean;
  volume: number;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  queue: Track[];
  queueIndex: number;
}

interface PlaybackStore extends PlaybackState {
  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setCurrentTime: (time: number) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  togglePlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setQueue: (queue: Track[]) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  playFromQueue: (index: number) => void;
  clearPlayback: () => void;
}

// Playback state storage (non-sensitive, can be in localStorage)
export const usePlaybackStore = create<PlaybackStore>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      currentTime: 0,
      currentPlaylist: null,
      isPlaying: false,
      volume: 0.7,
      shuffle: false,
      repeat: "off",
      queue: [],
      queueIndex: 0,

      setCurrentTrack: (track) => {
        set({ currentTrack: track, currentTime: 0 });
      },

      setCurrentTime: (time) => {
        set({ currentTime: time });
      },

      setCurrentPlaylist: (playlist) => {
        set({ currentPlaylist: playlist });
      },

      togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }));
      },

      setIsPlaying: (isPlaying) => {
        set({ isPlaying });
      },

      setVolume: (volume) => {
        set({ volume });
      },

      toggleShuffle: () => {
        set((state) => ({ shuffle: !state.shuffle }));
      },

      toggleRepeat: () => {
        set((state) => {
          const modes: ("off" | "one" | "all")[] = ["off", "one", "all"];
          const currentIndex = modes.indexOf(state.repeat);
          const nextIndex = (currentIndex + 1) % modes.length;
          return { repeat: modes[nextIndex] };
        });
      },

      setQueue: (queue) => {
        set({ queue, queueIndex: 0 });
      },

      nextTrack: () => {
        const { queue, queueIndex, repeat } = get();

        if (queue.length === 0) return;

        if (repeat === "one") {
          // Replay current track
          set({ currentTime: 0, isPlaying: true });
          return;
        }

        const nextIndex = queueIndex + 1;

        if (nextIndex >= queue.length) {
          if (repeat === "all") {
            // Loop back to start
            set({ queueIndex: 0, currentTrack: queue[0], currentTime: 0 });
          } else {
            // Stop at end
            set({ isPlaying: false, currentTime: 0 });
          }
        } else {
          set({
            queueIndex: nextIndex,
            currentTrack: queue[nextIndex],
            currentTime: 0,
          });
        }
      },

      previousTrack: () => {
        const { queue, queueIndex } = get();

        if (queue.length === 0) return;

        const prevIndex = queueIndex - 1;

        if (prevIndex < 0) {
          // Stay at beginning or loop to end if repeat all
          if (get().repeat === "all") {
            const lastIndex = queue.length - 1;
            set({
              queueIndex: lastIndex,
              currentTrack: queue[lastIndex],
              currentTime: 0,
            });
          } else {
            set({ currentTime: 0 });
          }
        } else {
          set({
            queueIndex: prevIndex,
            currentTrack: queue[prevIndex],
            currentTime: 0,
          });
        }
      },

      playFromQueue: (index) => {
        const { queue } = get();
        if (index >= 0 && index < queue.length) {
          set({
            queueIndex: index,
            currentTrack: queue[index],
            currentTime: 0,
            isPlaying: true,
          });
        }
      },

      clearPlayback: () => {
        set({
          currentTrack: null,
          currentTime: 0,
          currentPlaylist: null,
          isPlaying: false,
          queue: [],
          queueIndex: 0,
        });
      },
    }),
    {
      name: "ezconv-playback-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist non-sensitive playback state
      partialize: (state) => ({
        // We persist the track metadata but NOT the audioUrl which contains the token
        currentTrack: state.currentTrack
          ? {
              id: state.currentTrack.id,
              title: state.currentTrack.title,
              artist: state.currentTrack.artist,
              duration: state.currentTrack.duration,
              thumbnailUrl: state.currentTrack.thumbnailUrl,
              // audioUrl is EXCLUDED
            }
          : null,
        currentTime: state.currentTime,
        currentPlaylist: state.currentPlaylist,
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        // queue is EXCLUDED as it also contains tokens in URLs
        queueIndex: state.queueIndex,
      }),
    },
  ),
);
