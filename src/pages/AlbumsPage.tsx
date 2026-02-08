import { Plus, Play, MoreHorizontal, Music, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../lib/auth/AuthProvider";

interface Album {
  _id: string;
  name: string;
  description: string;
  songs: string[];
  createdAt: string;
}

export default function AlbumsPage() {
  const { api, accessToken } = useAuth();

  const {
    data: albums,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const response = await api.get("/albums");
      return response.data as Album[];
    },
    enabled: !!accessToken,
  });

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
        Failed to load playlists. Please try again.
      </div>
    );
  }

  const albumList = albums || [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Playlists của bạn</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-[#e8e8d0] text-gray-900 rounded-md transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          Tạo Playlist
        </button>
      </div>

      {/* Albums Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {albumList.map((album) => (
          <div key={album._id} className="group cursor-pointer">
            <div className="aspect-square rounded-md overflow-hidden mb-4 relative shadow-lg bg-black/5 dark:bg-white/5 flex items-center justify-center font-bold text-4xl text-primary/20">
              <Music className="w-16 h-16 opacity-30" />
              <button className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-primary text-gray-900 shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all flex items-center justify-center">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>
              <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-semibold text-base truncate hover:underline">
              {album.name}
            </h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              {album.songs?.length || 0} songs
            </p>
          </div>
        ))}

        {/* Create New Album Card */}
        <div className="border-2 border-dashed border-border-light dark:border-border-dark rounded-md aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 hover:border-primary transition-colors group">
          <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
            <Plus className="w-8 h-8 text-text-secondary-light dark:text-text-secondary-dark group-hover:text-primary transition-colors" />
          </div>
          <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark group-hover:text-text-primary-light dark:group-hover:text-text-primary-dark">
            Tạo Playlist mới
          </span>
        </div>
      </div>

      {albumList.length === 0 && (
        <div className="mt-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
          <p>Bạn chưa có Playlist nào. Hãy tạo một cái nhé!</p>
        </div>
      )}
    </div>
  );
}
