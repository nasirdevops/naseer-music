import { Play, Pause, Heart, Plus, Music } from "lucide-react";
import { useMusic, type Track } from "@/lib/music-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TrackRowProps {
  track: Track;
  index?: number;
  queue?: Track[];
  showImage?: boolean;
}

export function TrackRow({ track, index, queue, showImage = true }: TrackRowProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useMusic();
  const isActive = currentTrack?.id === track.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: (index ?? 0) * 0.02 }}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors cursor-pointer",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-white/5 text-foreground/80",
      )}
      onClick={() => {
        if (isActive) {
          togglePlay();
        } else {
          playTrack(track, queue);
        }
      }}
    >
      {showImage && (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
          {track.albumCover ? (
            <img
              src={track.albumCover}
              alt={track.album}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Music className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            {isActive && isPlaying ? (
              <Pause className="h-4 w-4 text-white fill-white" />
            ) : (
              <Play className="h-4 w-4 text-white fill-white" />
            )}
          </div>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isActive && "text-primary",
          )}
        >
          {track.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatTime(track.duration)}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10"
        >
          <Heart className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

interface AlbumCardProps {
  title: string;
  artist?: string;
  cover: string;
  onClick?: () => void;
}

export function AlbumCard({ title, artist, cover, onClick }: AlbumCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer rounded-xl bg-card/50 p-3 transition-colors hover:bg-card border border-border/40"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-3">
        {cover ? (
          <img
            src={cover}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Music className="h-8 w-8 text-primary/40" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
          <Play className="h-5 w-5 fill-current ml-0.5" />
        </div>
      </div>
      <h3 className="text-sm font-semibold truncate">{title}</h3>
      {artist && (
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {artist}
        </p>
      )}
    </motion.div>
  );
}

interface GenreCardProps {
  name: string;
  color: string;
  onClick?: () => void;
}

export function GenreCard({ name, color, onClick }: GenreCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer rounded-xl p-4 text-sm font-semibold text-white transition-shadow hover:shadow-lg"
      style={{ background: color }}
    >
      {name}
    </motion.div>
  );
}

export function NowPlayingMini() {
  const { currentTrack, isPlaying, togglePlay } = useMusic();
  if (!currentTrack) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {currentTrack.albumCover ? (
          <img
            src={currentTrack.albumCover}
            alt={currentTrack.album}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{currentTrack.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {currentTrack.artist}
        </p>
      </div>
      <button
        onClick={togglePlay}
        className="ml-auto h-8 w-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" />
        )}
      </button>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export { formatTime };
