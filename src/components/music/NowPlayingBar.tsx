import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Music,
} from "lucide-react";
import { useMusic } from "@/lib/music-context";
import { formatTime } from "./TrackRow";

export function NowPlayingBar() {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    stopPlayback,
  } = useMusic();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1600px] items-center gap-4 px-4">
        {/* Track info */}
        <div className="flex items-center gap-3 w-72 shrink-0">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted shadow-md">
            {currentTrack.albumCover ? (
              <img
                src={currentTrack.albumCover}
                alt={currentTrack.album}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Controls + Progress */}
        <div className="flex-1 flex flex-col items-center gap-1 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={prevTrack}
              className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipBack className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-foreground text-background hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </button>
            <button
              onClick={nextTrack}
              className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipForward className="h-4 w-4 fill-current" />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
              {formatTime(progress)}
            </span>
            <div className="relative flex-1 group">
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: duration > 0 ? `${(progress / duration) * 100}%` : "0%",
                  }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={progress}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums w-8">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume + Close */}
        <div className="hidden md:flex items-center gap-2 w-44 shrink-0">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <div className="relative flex-1">
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-foreground/60 rounded-full"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <button
            onClick={stopPlayback}
            className="h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors ml-1"
            title="Stop & close player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
