import {
  Play,
  Heart,
  Music,
  Loader2,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/auth/AuthProvider";
import { usePlaybackStore } from "../lib/stores/playbackStore";

interface Favorite {
  _id: string;
  songId: {
    _id: string;
    title: string;
    artist: string;
    duration: number;
    thumbnailUrl?: string;
    audioUrl?: string;
  };
  createdAt: string;
}

export default function FavoritesPage() {
  const { api, accessToken } = useAuth();
  const { setCurrentTrack, setQueue, currentTrack, isPlaying } =
    usePlaybackStore();

  const {
    data: favorites,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const response = await api.get("/favorites");
      return response.data as Favorite[];
    },
    enabled: !!accessToken,
  });

  const truncateTitle = (title: string, maxWords: number = 10) => {
    const words = title.split(" ");
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(" ") + "...";
    }
    return title;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayFavorite = (fav: Favorite) => {
    const song = fav.songId;
    if (!song) return;

    const audioUrl = `/api/convert/${song._id}/stream?token=${accessToken}`;

    setCurrentTrack({
      id: song._id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      audioUrl: audioUrl,
      thumbnailUrl: song.thumbnailUrl,
    });

    const queue = (favorites || [])
      .map((f) => f.songId)
      .filter(Boolean)
      .map((s) => ({
        id: s._id,
        title: s.title,
        artist: s.artist,
        duration: s.duration,
        audioUrl: `/api/convert/${s._id}/stream?token=${accessToken}`,
        thumbnailUrl: s.thumbnailUrl,
      }));

    setQueue(queue);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Failed to load favorites. Please try again.
      </div>
    );
  }

  const favoriteList = favorites || [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-end gap-6 mb-8">
        <div className="w-52 h-52 bg-gradient-to-br from-primary/80 to-primary rounded-md shadow-lg flex items-center justify-center flex-shrink-0">
          <Heart className="w-24 h-24 text-white fill-current" />
        </div>
        <div className="flex-1">
          <p className="text-sm uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark mb-2">
            Playlist
          </p>
          <h1 className="text-6xl font-bold mb-4">Bài hát yêu thích</h1>
          <div className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
              Thư viện của bạn
            </span>
            <span>•</span>
            <span>{favoriteList.length} songs</span>
          </div>
        </div>
      </div>

      {/* Play Button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() =>
            favoriteList.length > 0 && handlePlayFavorite(favoriteList[0])
          }
          className="w-14 h-14 rounded-full bg-primary hover:scale-105 transition-transform flex items-center justify-center shadow-lg disabled:opacity-50"
          disabled={favoriteList.length === 0}
        >
          <Play className="w-7 h-7 text-gray-900 fill-current ml-1" />
        </button>
      </div>

      {/* Songs Table */}
      <div className="w-full">
        {/* Table Header */}
        <div className="flex items-center text-text-secondary-light dark:text-text-secondary-dark pb-3 border-b border-border-light dark:border-border-dark text-xs uppercase tracking-wide sticky top-0 bg-background-light dark:bg-background-dark z-[1]">
          <div className="w-12 text-center">#</div>
          <div className="flex-1">Title</div>
          <div className="w-48 hidden lg:block">Album</div>
          <div className="w-32 hidden md:block">Date added</div>
          <div className="w-24 text-right flex items-center justify-end gap-1">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Table Body */}
        {favoriteList.length > 0 ? (
          favoriteList.map((fav, index) => {
            const song = fav.songId;
            if (!song) return null;
            const isCurrentlyPlaying = currentTrack?.id === song._id;

            return (
              <div
                key={fav._id}
                onClick={() => handlePlayFavorite(fav)}
                className={`group flex items-center py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-md px-2 -mx-2 cursor-pointer transition-colors ${isCurrentlyPlaying ? "bg-primary/10" : ""}`}
              >
                <div className="w-12 flex items-center justify-center">
                  {isCurrentlyPlaying && isPlaying ? (
                    <div className="flex gap-0.5">
                      <span className="w-1 h-4 bg-primary animate-pulse" />
                      <span className="w-1 h-3 bg-primary animate-pulse delay-75" />
                      <span className="w-1 h-5 bg-primary animate-pulse delay-150" />
                    </div>
                  ) : (
                    <>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark group-hover:hidden">
                        {index + 1}
                      </span>
                      <button className="hidden group-hover:block text-primary">
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="min-w-0">
                    <div
                      className={`font-medium truncate ${isCurrentlyPlaying ? "text-primary" : ""}`}
                    >
                      {truncateTitle(song.title)}
                    </div>
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {song.artist}
                    </div>
                  </div>
                </div>
                <div className="w-48 hidden lg:block text-text-secondary-light dark:text-text-secondary-dark truncate">
                  Playlist cá nhân
                </div>
                <div className="w-32 hidden md:block text-text-secondary-light dark:text-text-secondary-dark text-sm">
                  {new Date(fav.createdAt).toLocaleDateString()}
                </div>
                <div className="w-24 flex items-center justify-end gap-3">
                  <button className="text-primary">
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-mono">
                    {formatDuration(song.duration)}
                  </span>
                  <button className="text-text-secondary-light dark:text-text-secondary-dark opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center text-text-secondary-light dark:text-text-secondary-dark">
            <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No favorites yet</h3>
            <p>Your liked songs will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
