import {
  Play,
  Heart,
  MoreHorizontal,
  Clock,
  Music,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/auth/AuthProvider";
import { usePlaybackStore } from "../lib/stores/playbackStore";

interface Song {
  _id: string;
  title: string;
  artist: string;
  albumId?: { name: string };
  duration: number;
  createdAt: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  status: string;
  isFavorite: boolean;
}

export default function SongsPage() {
  const { api, accessToken } = useAuth();
  const { setCurrentTrack, setQueue, currentTrack, isPlaying } =
    usePlaybackStore();

  const {
    data: songs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      const response = await api.get("/songs");
      return response.data as Song[];
    },
    enabled: !!accessToken,
    refetchInterval: (query) => {
      const data = query.state.data as Song[] | undefined;
      const hasProcessing = data?.some(
        (s) => s.status === "converting" || s.status === "pending",
      );
      return hasProcessing ? 3000 : false;
    },
  });

  const truncateTitle = (title: string, maxWords: number = 12) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Play a song
  const handlePlaySong = (song: Song) => {
    // Only play if status is completed
    if (song.status !== "completed") {
      console.warn("Song not ready:", song.status);
      return;
    }

    // Build audio URL - use stream endpoint with token for authentication
    const audioUrl = `/api/convert/${song._id}/stream?token=${accessToken}`;

    // Set current track
    setCurrentTrack({
      id: song._id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      audioUrl: audioUrl,
      thumbnailUrl: song.thumbnailUrl,
    });

    // Set queue with all completed songs
    const completedSongs = (songs || [])
      .filter((s) => s.status === "completed")
      .map((s) => ({
        id: s._id,
        title: s.title,
        artist: s.artist,
        duration: s.duration,
        audioUrl: `/api/convert/${s._id}/stream?token=${accessToken}`,
        thumbnailUrl: s.thumbnailUrl,
      }));

    setQueue(completedSongs);
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
        Failed to load songs. Please try again.
      </div>
    );
  }

  const songList = songs || [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Bài hát</h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
            {songList.length} songs in your library
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>Recently added</option>
            <option>Name</option>
            <option>Artist</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {songList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary-light dark:text-text-secondary-dark">
          <Music className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">No songs yet</p>
          <p className="text-sm mt-2">
            Go to "Thêm bài hát" to convert YouTube videos
          </p>
        </div>
      )}

      {/* Songs Table */}
      {songList.length > 0 && (
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
          {songList.map((song, index) => {
            const isCurrentlyPlaying = currentTrack?.id === song._id;
            const isReady = song.status === "completed";

            return (
              <div
                key={song._id}
                onClick={() => handlePlaySong(song)}
                className={`group flex items-center py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-md px-2 -mx-2 transition-colors ${
                  isReady ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                } ${isCurrentlyPlaying ? "bg-primary/10" : ""}`}
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
                      <button
                        className={`hidden group-hover:block ${isReady ? "text-primary" : "text-gray-400"}`}
                        disabled={!isReady}
                      >
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
                    {song.status === "converting" && (
                      <span className="text-xs text-amber-500 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Converting...
                      </span>
                    )}
                    {song.status === "failed" && (
                      <span className="text-xs text-red-500">Failed</span>
                    )}
                    {song.status === "pending" && (
                      <span className="text-xs text-gray-500">Pending...</span>
                    )}
                  </div>
                </div>
                <div className="w-48 hidden lg:block text-text-secondary-light dark:text-text-secondary-dark truncate">
                  {song.albumId?.name || "-"}
                </div>
                <div className="w-32 hidden md:block text-text-secondary-light dark:text-text-secondary-dark text-sm">
                  {formatDate(song.createdAt)}
                </div>
                <div className="w-24 flex items-center justify-end gap-3">
                  <button
                    className={`transition-colors ${song.isFavorite ? "text-primary" : "text-text-secondary-light dark:text-text-secondary-dark opacity-0 group-hover:opacity-100"}`}
                  >
                    <Heart
                      className={`w-4 h-4 ${song.isFavorite ? "fill-current" : ""}`}
                    />
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
          })}
        </div>
      )}
    </div>
  );
}
