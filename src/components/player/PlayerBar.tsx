import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
} from "lucide-react";
import { usePlaybackStore } from "../../lib/stores/playbackStore";
import { useAuth } from "../../lib/auth/AuthProvider";
import { Howl } from "howler";

export default function PlayerBar() {
  const { accessToken } = useAuth();
  const howlRef = useRef<Howl | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [localProgress, setLocalProgress] = useState(0);

  const {
    currentTrack,
    isPlaying,
    volume,
    shuffle,
    repeat,
    setIsPlaying,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    nextTrack,
    previousTrack,
    setCurrentTime,
  } = usePlaybackStore();

  const truncateTitle = (title: string, maxWords: number = 12) => {
    const words = title.split(" ");
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(" ") + "...";
    }
    return title;
  };

  // Initialize/update Howl when track changes
  useEffect(() => {
    if (!currentTrack?.id) return;

    // Reconstruct audioUrl if it was stripped for security (localStorage)
    const effectiveAudioUrl =
      currentTrack.audioUrl ||
      (accessToken
        ? `/api/convert/${currentTrack.id}/stream?token=${accessToken}`
        : null);

    if (!effectiveAudioUrl) return;

    // Don't recreate if it's the same song ID (to handle token refreshes)
    if (
      howlRef.current &&
      (howlRef.current as any)._songId === currentTrack.id
    ) {
      return;
    }

    // Stop previous track
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
    }

    console.log(
      "[Player] Initializing audio:",
      currentTrack.title,
      "URL:",
      effectiveAudioUrl,
    );

    // Create new Howl instance
    const newHowl = new Howl({
      src: [effectiveAudioUrl],
      format: ["mp3"], // CRITICAL: Force MP3 format as URL has query params
      html5: true, // Required for streaming large files
      volume: volume,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onend: () => {
        if (repeat === "one") {
          howlRef.current?.seek(0);
          howlRef.current?.play();
        } else {
          nextTrack();
        }
      },
      onloaderror: (_, error) => {
        console.error("Audio load error:", error, "URL:", effectiveAudioUrl);
        setIsPlaying(false);
      },
    });

    (newHowl as any)._songId = currentTrack.id;
    howlRef.current = newHowl;

    // Auto-play when track changes
    newHowl.play();

    return () => {
      // We don't necessarily want to unload on every minor re-render
      // Only when explicitly navigating away or changing tracks
    };
  }, [currentTrack?.id]); // ONLY depend on ID

  // Safety Effect: Stop music if currentTrack is null (logout)
  useEffect(() => {
    if (!currentTrack && howlRef.current) {
      console.log("[Player] No track selected, stopping audio");
      howlRef.current.stop();
      howlRef.current.unload();
      howlRef.current = null;
    }
  }, [currentTrack]);

  // Handle play/pause state changes
  useEffect(() => {
    if (!howlRef.current) return;

    if (isPlaying) {
      if (!howlRef.current.playing()) howlRef.current.play();
    } else {
      if (howlRef.current.playing()) howlRef.current.pause();
    }
  }, [isPlaying]);

  // Update volume
  useEffect(() => {
    howlRef.current?.volume(volume);
  }, [volume]);

  // Update progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      if (howlRef.current && isPlaying) {
        const seek = howlRef.current.seek() as number;
        const duration = howlRef.current.duration();
        if (duration > 0) {
          const p = (seek / duration) * 100;
          setLocalProgress(p);
          setCurrentTime(seek);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime]);

  // Click on progress bar to seek
  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current || !howlRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    const duration = howlRef.current.duration();

    if (duration > 0) {
      howlRef.current.seek(percent * duration);
      setLocalProgress(percent * 100);
      setCurrentTime(percent * duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentTime = howlRef.current ? (howlRef.current.seek() as number) : 0;
  const duration = howlRef.current ? howlRef.current.duration() : 0;

  // No track playing
  if (!currentTrack) {
    return (
      <footer className="h-20 bg-card-light dark:bg-card-dark border-t border-border-light dark:border-border-dark flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark">
        <span>No track playing</span>
        <span className="ml-2 text-sm">Select a song</span>
      </footer>
    );
  }

  return (
    <footer className="h-20 bg-card-light dark:bg-card-dark border-t border-border-light dark:border-border-dark flex items-center justify-between px-4 z-50">
      {/* Now Playing */}
      <div className="flex items-center w-1/4 min-w-[200px]">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
            {truncateTitle(currentTrack.title)}
          </span>
          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
            {currentTrack.artist}
          </span>
        </div>
        <button className="ml-4 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
          <Heart className="w-5 h-5" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center w-2/4 max-w-xl">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={toggleShuffle}
            className={`transition-colors ${shuffle ? "text-primary" : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"}`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={previousTrack}
            className="text-text-primary-light dark:text-text-primary-dark hover:scale-110 transition-transform"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-full hover:scale-105 transition-transform"
            title="Play/Pause"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
          <button
            onClick={nextTrack}
            className="text-text-primary-light dark:text-text-primary-dark hover:scale-110 transition-transform"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={toggleRepeat}
            className={`transition-colors relative ${repeat !== "off" ? "text-primary" : "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"}`}
            title={`Repeat: ${repeat}`}
          >
            <Repeat className="w-4 h-4" />
            {repeat === "one" && (
              <span className="absolute -top-1 -right-1 text-[10px] font-bold">
                1
              </span>
            )}
          </button>
        </div>
        <div className="w-full flex items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono">
          <span>{formatTime(currentTime)}</span>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="flex-1 h-1 bg-border-light dark:bg-border-dark rounded-full cursor-pointer relative group"
          >
            <div
              className="absolute h-full bg-primary rounded-full group-hover:bg-opacity-80"
              style={{ width: `${localProgress}%` }}
            />
            <div
              className="absolute h-3 w-3 bg-white border border-gray-300 shadow rounded-full top-1/2 -mt-1.5 hidden group-hover:block"
              style={{
                left: `${localProgress}%`,
                transform: "translateX(-50%)",
              }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Extras */}
      <div className="flex items-center justify-end w-1/4 min-w-[200px] gap-3">
        <button className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors">
          <ListMusic className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 group">
          <button onClick={() => setVolume(volume === 0 ? 0.7 : 0)}>
            {volume === 0 ? (
              <VolumeX className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
            ) : (
              <Volume2 className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-border-light dark:bg-border-dark rounded-full cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow"
          />
        </div>
      </div>
    </footer>
  );
}
