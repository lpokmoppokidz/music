import { useState } from "react";
import { Settings, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/auth/AuthProvider";

interface ConversionResponse {
  success: boolean;
  songId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  status: string;
}

export default function AddSongPage() {
  const [url, setUrl] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState<"128" | "320">("320");
  const { api } = useAuth();
  const queryClient = useQueryClient();

  // Conversion mutation
  const convertMutation = useMutation({
    mutationFn: async ({ url, quality }: { url: string; quality: string }) => {
      const response = await api.post("/convert", { url, quality });
      return response.data as ConversionResponse;
    },
    onSuccess: () => {
      // Invalidate songs query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
  });

  const handleConvert = async () => {
    if (!url || !isValidUrl) return;

    convertMutation.mutate({ url, quality });
  };

  const isValidUrl =
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("tiktok.com");

  const isConverting = convertMutation.isPending;
  const isSuccess = convertMutation.isSuccess;
  const isError = convertMutation.isError;
  const convertedSongId = convertMutation.data?.songId;

  // Track status of the converting song
  const { data: conversionStatus } = useQuery({
    queryKey: ["conversion", convertedSongId],
    queryFn: async () => {
      const response = await api.get(`/convert/status/${convertedSongId}`);
      return response.data;
    },
    enabled: !!convertedSongId,
    refetchInterval: (query: any) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "converting" ? 2000 : false;
    },
  });

  const convertedSong = conversionStatus || convertMutation.data;

  return (
    <div className="flex flex-col items-center justify-start pt-12 px-4 sm:px-6">
      <div className="w-full max-w-lg bg-card-light dark:bg-card-dark rounded-xl shadow-lg dark:shadow-none border border-border-light dark:border-border-dark p-8 md:p-10 transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center mb-4 text-3xl shadow-sm">
            🎵
          </div>
          <h1 className="text-2xl font-semibold text-center">Add new song</h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2 text-center text-sm">
            Paste a link to convert and save to your library
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div className="relative">
            <div className="flex shadow-sm rounded-md">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube or TikTok link..."
                disabled={isConverting}
                className="block w-full rounded-l-md border border-border-light dark:border-border-dark dark:bg-[#2C2C2C] dark:text-white dark:placeholder-gray-400 focus:border-primary focus:ring-primary sm:text-sm py-3 px-4 transition-colors disabled:opacity-50"
              />
              <button
                onClick={() => setShowSettings(!showSettings)}
                disabled={isConverting}
                className="inline-flex items-center px-4 py-2 border border-l-0 border-border-light dark:border-border-dark rounded-r-md bg-black/5 dark:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-primary text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-2 p-4 bg-black/5 dark:bg-white/5 rounded-md">
                <p className="text-sm font-medium mb-3">Audio Quality</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setQuality("128")}
                    className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                      quality === "128"
                        ? "bg-primary text-white"
                        : "bg-white dark:bg-[#2C2C2C] border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    128 kbps
                  </button>
                  <button
                    onClick={() => setQuality("320")}
                    className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                      quality === "320"
                        ? "bg-primary text-white"
                        : "bg-white dark:bg-[#2C2C2C] border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    320 kbps
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={!url || isConverting || !isValidUrl}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-primary hover:bg-[#e8e8d0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              "Convert to MP3"
            )}
          </button>

          {/* Success Message */}
          {isSuccess && convertedSong && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Conversion started!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                    "{convertedSong.title}" by {convertedSong.artist}
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-2">
                    The song will appear in your library once complete. Check
                    the "Bài hát" page to see all your songs.
                  </p>
                </div>
              </div>

              {/* Preview - Text only */}
              {convertedSong.title && (
                <div className="mt-3 p-3 bg-white dark:bg-black/20 rounded">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {convertedSong.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {convertedSong.artist}
                    </p>
                    <p className="text-xs text-gray-400">
                      {Math.floor(convertedSong.duration / 60)}:
                      {(convertedSong.duration % 60)
                        .toString()
                        .padStart(2, "0")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {isError && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>
                {convertMutation.error instanceof Error
                  ? convertMutation.error.message
                  : "Failed to convert video. Please try again."}
              </span>
            </div>
          )}

          {url && !isValidUrl && (
            <div className="flex items-center gap-2 text-amber-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Please enter a valid YouTube or TikTok URL</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-light dark:border-border-dark"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-card-light dark:bg-card-dark text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
              How it works
            </span>
          </div>
        </div>

        {/* How It Works */}
        <div className="space-y-4 text-sm">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
              1
            </span>
            <div>
              <p className="font-medium">Find your video</p>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-0.5 text-xs">
                Copy the URL from the address bar or share menu.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
              2
            </span>
            <div>
              <p className="font-medium">Paste & Convert</p>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-0.5 text-xs">
                Paste the link above and click the Convert button.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
              3
            </span>
            <div>
              <p className="font-medium">Save to Library</p>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-0.5 text-xs">
                The song will be added to your library automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
