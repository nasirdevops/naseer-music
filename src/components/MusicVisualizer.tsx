import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useMusic } from "@/lib/music-context";

// Music symbols from alt-codes.net/music_note_alt_codes.php
const MUSIC_SYMBOLS = [
  "♪", "♫", "♬", "♩",
  "🎵", "🎶", "🎼", "🎹", "🎻", "🎷", "🎸", "🎺", "🥁", "🎤", "🎧", "🎙",
  "𝄞", "𝄢", "𝄡",
  "♭", "♮", "♯",
  "𝄆", "𝄇",
  "𝄄", ".djang",
  "𝄐",
  "𝄜", "𝄝",
  "𝄗", "𝄘", "〞", "𝄚", "𝄛",
];

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  symbol: string;
  color: string;
  duration: number;
  delay: number;
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

const EQ_COLORS = [
  "#22c55e", "#16a34a", "#4ade80", "#86efac",
  "#f59e0b", "#f97316", "#ef4444", "#ec4899",
  "#a855f7", "#3b82f6", "#06b6d4", "#10b981",
];

const EQ_BAR_COUNT = 32;

export function MusicVisualizer() {
  const { currentTrack, isPlaying } = useMusic();
  const [tick, setTick] = useState(0);
  const [eqBars, setEqBars] = useState<number[]>(() => new Array(EQ_BAR_COUNT).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const simulatedRef = useRef<number[]>(new Array(EQ_BAR_COUNT).fill(0));
  const simFrameRef = useRef<number>(0);

  // Tick for regenerating particles
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    const interval = setInterval(() => setTick((t) => t + 1), 2500);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  // Try to connect to real audio for analyser
  const connectAnalyser = useCallback(() => {
    try {
      // Try to find existing Audio elements in the DOM
      const audioElements = document.querySelectorAll("audio");
      if (audioElements.length > 0 && !audioContextRef.current) {
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.7;
        try {
          const source = ctx.createMediaElementSource(audioElements[0] as HTMLAudioElement);
          source.connect(analyser);
          analyser.connect(ctx.destination);
          audioContextRef.current = ctx;
          analyserRef.current = analyser;
        } catch {
          ctx.close();
        }
      }
    } catch {
      // AudioContext not available
    }
  }, []);

  // Equalizer animation - use simulated beats if no real audio
  useEffect(() => {
    if (!isPlaying || !currentTrack) {
      setEqBars(new Array(EQ_BAR_COUNT).fill(0));
      return;
    }

    connectAnalyser();

    const animate = () => {
      if (analyserRef.current) {
        // Real audio data
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const bars: number[] = [];
        for (let i = 0; i < EQ_BAR_COUNT; i++) {
          const idx = Math.floor((i / EQ_BAR_COUNT) * data.length);
          bars.push(data[idx] / 255);
        }
        setEqBars(bars);
      } else {
        // Simulated beat pattern
        const sim = simulatedRef.current;
        const time = Date.now() / 1000;
        for (let i = 0; i < EQ_BAR_COUNT; i++) {
          // Create a rhythmic pattern that looks like music
          const baseFreq = 0.8 + Math.sin(time * 3 + i * 0.3) * 0.5;
          const beat = Math.pow(Math.sin(time * 4 + i * 0.5) * 0.5 + 0.5, 2);
          const bass = i < 8 ? Math.sin(time * 2.5) * 0.3 + 0.4 : 0;
          const treble = i > 20 ? Math.sin(time * 5 + i) * 0.2 + 0.2 : 0;
          const noise = Math.random() * 0.15;
          const target = Math.max(0, Math.min(1, baseFreq * beat + bass + treble + noise));
          // Smooth interpolation
          sim[i] = sim[i] * 0.7 + target * 0.3;
        }
        setEqBars([...sim]);
      }
      simFrameRef.current = requestAnimationFrame(animate);
    };

    simFrameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(simFrameRef.current);
    };
  }, [isPlaying, currentTrack, connectAnalyser]);

  const particles: Particle[] = useMemo(() => {
    if (!isPlaying || !currentTrack) return [];
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 60 + Math.random() * 40,
      size: 14 + Math.random() * 30,
      symbol: MUSIC_SYMBOLS[Math.floor(Math.random() * MUSIC_SYMBOLS.length)],
      color: COLORS[i % COLORS.length],
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
    }));
  }, [isPlaying, currentTrack, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const crackers: Cracker[] = useMemo(() => {
    if (!isPlaying || !currentTrack) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 5 + Math.random() * 30,
      color: COLORS[i % COLORS.length],
      delay: i * 1.5,
    }));
  }, [isPlaying, currentTrack, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isPlaying || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* === EQUALIZER BARS === */}
      <div className="absolute bottom-24 left-0 right-0 flex items-end justify-center gap-[3px] px-8 h-48 opacity-30">
        {eqBars.map((value, i) => {
          const height = 4 + value * 180;
          const colorIdx = Math.floor((i / EQ_BAR_COUNT) * EQ_COLORS.length);
          const color = EQ_COLORS[colorIdx % EQ_COLORS.length];
          return (
            <div
              key={`eq-${i}`}
              className="flex-1 max-w-[14px] rounded-t-sm transition-all duration-75"
              style={{
                height: `${height}px`,
                background: `linear-gradient(to top, ${color}, ${color}99, ${color}33)`,
                boxShadow: value > 0.5 ? `0 0 8px ${color}60, 0 -4px 12px ${color}30` : "none",
              }}
            />
          );
        })}
      </div>

      {/* === EQUALIZER SIDES (left & right mirrors) === */}
      <div className="absolute bottom-24 left-4 flex items-end gap-[2px] h-32 opacity-15">
        {eqBars.slice(0, 12).map((value, i) => {
          const height = 4 + value * 120;
          const color = EQ_COLORS[i % EQ_COLORS.length];
          return (
            <div
              key={`eq-l-${i}`}
              className="w-[6px] rounded-t-sm transition-all duration-75"
              style={{
                height: `${height}px`,
                background: `linear-gradient(to top, ${color}, transparent)`,
              }}
            />
          );
        })}
      </div>
      <div className="absolute bottom-24 right-4 flex items-end gap-[2px] h-32 opacity-15">
        {eqBars.slice(12, 24).map((value, i) => {
          const height = 4 + value * 120;
          const color = EQ_COLORS[(i + 6) % EQ_COLORS.length];
          return (
            <div
              key={`eq-r-${i}`}
              className="w-[6px] rounded-t-sm transition-all duration-75"
              style={{
                height: `${height}px`,
                background: `linear-gradient(to top, ${color}, transparent)`,
              }}
            />
          );
        })}
      </div>

      {/* === CRACKER LIGHT BURSTS === */}
      {crackers.map((c) => (
        <div
          key={`cracker-${c.id}`}
          className="absolute"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
        >
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

      {/* === FLOATING MUSIC SYMBOLS === */}
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

      {/* === COVER BLAST RINGS === */}
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

      {/* === AMBIENT GLOW === */}
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
