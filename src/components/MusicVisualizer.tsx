import { useEffect, useState, useMemo } from "react";
import { useMusic } from "@/lib/music-context";

const MUSIC_SYMBOLS = ["♪", "♫", "♬", "♩", "🎵", "🎶", "🎸", "🎹", "🥁", "🎷", "🎺", "🎻"];

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  symbol: string;
  color: string;
  duration: number;
  delay: number;
  drift: number;
}

interface Cracker {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
}

const COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ec4899",
  "#a855f7", "#06b6d4", "#f97316", "#10b981",
];

export function MusicVisualizer() {
  const { currentTrack, isPlaying } = useMusic();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    const interval = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const particles: Particle[] = useMemo(() => {
    if (!isPlaying || !currentTrack) return [];
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 60 + Math.random() * 40,
      size: 16 + Math.random() * 24,
      symbol: MUSIC_SYMBOLS[i % MUSIC_SYMBOLS.length],
      color: COLORS[i % COLORS.length],
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
      drift: (Math.random() - 0.5) * 80,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTrack, tick]);

  const crackers: Cracker[] = useMemo(() => {
    if (!isPlaying || !currentTrack) return [];
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 5 + Math.random() * 30,
      color: COLORS[i % COLORS.length],
      delay: i * 1.5,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTrack, tick]);

  if (!isPlaying || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Cracker light bursts */}
      {crackers.map((c) => (
        <div
          key={`cracker-${c.id}`}
          className="absolute"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
        >
          {/* Central burst */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 6,
              height: 6,
              background: c.color,
              boxShadow: `0 0 20px 8px ${c.color}40, 0 0 60px 20px ${c.color}20`,
              animation: `crackerPulse 3s ease-in-out ${c.delay}s infinite`,
            }}
          />
          {/* Radial rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <div
              key={angle}
              className="absolute"
              style={{
                width: 2,
                height: 30 + Math.random() * 20,
                background: `linear-gradient(to bottom, ${c.color}80, transparent)`,
                transform: `rotate(${angle}deg) translateY(-20px)`,
                transformOrigin: "top center",
                animation: `crackerRay 2s ease-in-out ${c.delay + angle * 0.005}s infinite`,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      ))}

      {/* Floating music symbols */}
      {particles.map((p) => (
        <div
          key={`particle-${p.id}`}
          className="absolute select-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            color: p.color,
            opacity: 0,
            animation: `floatUp ${p.duration}s ease-out ${p.delay}s infinite`,
            filter: `drop-shadow(0 0 8px ${p.color}60)`,
          }}
        >
          {p.symbol}
        </div>
      ))}

      {/* Cover blast effect — expanding rings from center */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={`ring-${i}`}
            className="absolute rounded-full border"
            style={{
              width: 200,
              height: 200,
              borderColor: `rgba(34, 197, 94, ${0.15 - i * 0.04})`,
              animation: `coverBlast 4s ease-out ${i * 1.3}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Ambient glow overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 80%, rgba(34,197,94,0.06) 0%, transparent 60%)`,
          animation: "ambientPulse 3s ease-in-out infinite",
        }}
      />
    </div>
  );
}
