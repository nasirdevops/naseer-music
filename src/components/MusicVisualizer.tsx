import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useMusic } from "@/lib/music-context";

const MUSIC_SYMBOLS = [
  "♪", "♫", "♬", "♩",
  "🎵", "🎶", "🎼", "🎹", "🎻", "🎷", "🎸", "🎺", "🥁", "🎤", "🎧", "🎙",
  "𝄞", "𝄢", "𝄡",
  "♭", "♮", "♯",
  "𝄆", "𝄇",
  "𝄄", " даж",
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

const EQ_BAR_COUNT = 48;

// Gradient for the digital equalizer - vibrant rainbow
function getBarColor(index: number, value: number): string {
  const ratio = index / EQ_BAR_COUNT;
  if (ratio < 0.15) return value > 0.6 ? "#22c55e" : "#16a34a";
  if (ratio < 0.30) return value > 0.6 ? "#4ade80" : "#22c55e";
  if (ratio < 0.45) return value > 0.6 ? "#facc15" : "#eab308";
  if (ratio < 0.55) return value > 0.6 ? "#f97316" : "#ea580c";
  if (ratio < 0.70) return value > 0.6 ? "#ef4444" : "#dc2626";
  if (ratio < 0.85) return value > 0.6 ? "#ec4899" : "#db2777";
  return value > 0.6 ? "#a855f7" : "#9333ea";
}

function getBarGlow(index: number): string {
  const ratio = index / EQ_BAR_COUNT;
  if (ratio < 0.2) return "rgba(34,197,94,0.4)";
  if (ratio < 0.4) return "rgba(250,204,21,0.4)";
  if (ratio < 0.6) return "rgba(249,115,22,0.4)";
  if (ratio < 0.8) return "rgba(236,72,153,0.4)";
  return "rgba(168,85,247,0.4)";
}

export function MusicVisualizer() {
  const { currentTrack, isPlaying } = useMusic();
  const [tick, setTick] = useState(0);
  const [eqBars, setEqBars] = useState<number[]>(() => new Array(EQ_BAR_COUNT).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const simFrameRef = useRef<number>(0);
  const simulatedRef = useRef<number[]>(new Array(EQ_BAR_COUNT).fill(0));
  const timeRef = useRef(0);

  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    const interval = setInterval(() => setTick((t) => t + 1), 2500);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const connectAnalyser = useCallback(() => {
    try {
      const audioElements = document.querySelectorAll("audio");
      if (audioElements.length > 0 && !audioContextRef.current) {
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
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
    } catch { /* AudioContext not available */ }
  }, []);

  // Big, dramatic EQ animation
  useEffect(() => {
    if (!isPlaying || !currentTrack) {
      setEqBars(new Array(EQ_BAR_COUNT).fill(0));
      return;
    }
    connectAnalyser();

    const animate = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;

      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const bars: number[] = [];
        for (let i = 0; i < EQ_BAR_COUNT; i++) {
          const idx = Math.floor((i / EQ_BAR_COUNT) * data.length);
          bars.push(data[idx] / 255);
        }
        setEqBars(bars);
      } else {
        const sim = simulatedRef.current;
        for (let i = 0; i < EQ_BAR_COUNT; i++) {
          // Multiple sine waves for organic feel
          const wave1 = Math.sin(t * 4.0 + i * 0.15) * 0.35;
          const wave2 = Math.sin(t * 2.5 + i * 0.25) * 0.25;
          const wave3 = Math.sin(t * 6.0 + i * 0.08) * 0.15;
          // Bass punch on left bars
          const bass = i < 12 ? Math.pow(Math.sin(t * 3.0) * 0.5 + 0.5, 1.5) * 0.5 : 0;
          // Mid energy
          const mid = (i >= 12 && i < 32) ? Math.sin(t * 5.0 + i * 0.3) * 0.2 + 0.15 : 0;
          // Treble sparkle on right
          const treble = i >= 32 ? Math.sin(t * 8.0 + i * 0.4) * 0.25 + 0.15 : 0;
          // Beat pulse
          const beat = Math.pow(Math.abs(Math.sin(t * 3.5)), 8) * 0.3;
          // Randomness
          const noise = Math.random() * 0.12;
          const target = Math.max(0.05, Math.min(1, wave1 + wave2 + wave3 + bass + mid + treble + beat + noise));
          // Smooth but responsive
          sim[i] = sim[i] * 0.65 + target * 0.35;
        }
        setEqBars([...sim]);
      }
      simFrameRef.current = requestAnimationFrame(animate);
    };

    simFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(simFrameRef.current);
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
  }, [isPlaying, currentTrack, tick]); // eslint-disable-line

  const crackers: Cracker[] = useMemo(() => {
    if (!isPlaying || !currentTrack) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 5 + Math.random() * 30,
      color: COLORS[i % COLORS.length],
      delay: i * 1.5,
    }));
  }, [isPlaying, currentTrack, tick]); // eslint-disable-line

  if (!isPlaying || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">

      {/* ══════ MAIN DIGITAL EQUALIZER — Large Center ══════ */}
      <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 flex items-end justify-center gap-[1px] sm:gap-[2px] px-2 sm:px-4 h-48 sm:h-72 md:h-96 opacity-50 sm:opacity-60">
        {eqBars.map((value, i) => {
          const maxH = 340;
          const height = 6 + value * maxH;
          const color = getBarColor(i, value);
          const glow = getBarGlow(i);
          const isPeak = value > 0.75;
          return (
            <div key={`eq-${i}`} className="flex-1 max-w-[16px] flex flex-col items-center">
              {/* Peak dot */}
              {isPeak && (
                <div
                  className="w-full h-[3px] rounded-full mb-[1px] transition-all duration-75"
                  style={{
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                  }}
                />
              )}
              {/* Bar */}
              <div
                className="w-full rounded-t-[2px] sm:rounded-t-[3px] transition-all duration-75"
                style={{
                  height: `${height}px`,
                  background: `linear-gradient(to top, ${color}ff, ${color}bb, ${color}55)`,
                  boxShadow: value > 0.4 ? `0 0 10px ${glow}, 0 -6px 20px ${glow}` : "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ══════ REFLECTION — Mirror below main EQ ══════ */}
      <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 flex items-start justify-center gap-[1px] sm:gap-[2px] px-2 sm:px-4 h-10 sm:h-20 opacity-10 sm:opacity-15 rotate-180">
        {eqBars.map((value, i) => {
          const height = 4 + value * 80;
          const color = getBarColor(i, value);
          return (
            <div
              key={`eq-ref-${i}`}
              className="flex-1 max-w-[16px] rounded-t-[3px] transition-all duration-75"
              style={{
                height: `${height}px`,
                background: `linear-gradient(to top, ${color}66, transparent)`,
              }}
            />
          );
        })}
      </div>

      {/* ══════ SIDE EQUALIZERS ══════ */}
      {/* Left side */}
      <div className="absolute bottom-20 sm:bottom-24 left-1 sm:left-2 flex flex-col items-center gap-[2px] h-32 sm:h-48 opacity-20 sm:opacity-30 hidden sm:flex">
        {eqBars.slice(0, 16).map((value, i) => {
          const height = 4 + value * 160;
          const color = getBarColor(i, value);
          return (
            <div
              key={`eq-l-${i}`}
              className="h-[5px] rounded-sm transition-all duration-75"
              style={{
                width: `${height}px`,
                background: `linear-gradient(to right, ${color}, transparent)`,
              }}
            />
          );
        })}
      </div>
      {/* Right side */}
      <div className="absolute bottom-20 sm:bottom-24 right-1 sm:right-2 flex flex-col items-center gap-[2px] h-32 sm:h-48 opacity-20 sm:opacity-30 hidden sm:flex">
        {eqBars.slice(32, 48).map((value, i) => {
          const height = 4 + value * 160;
          const color = getBarColor(i + 32, value);
          return (
            <div
              key={`eq-r-${i}`}
              className="h-[5px] rounded-sm transition-all duration-75"
              style={{
                width: `${height}px`,
                background: `linear-gradient(to left, ${color}, transparent)`,
              }}
            />
          );
        })}
      </div>

      {/* ══════ DIGITAL WAVE LINE — Top ══════ */}
      <svg className="absolute top-0 left-0 right-0 h-10 sm:h-16 opacity-15 sm:opacity-20" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="25%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="75%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <path
          d={(() => {
            const t = timeRef.current;
            let path = "M0,30 ";
            for (let x = 0; x <= 1200; x += 8) {
              const barIdx = Math.floor((x / 1200) * EQ_BAR_COUNT);
              const val = eqBars[barIdx] || 0;
              const y = 30 - val * 25 + Math.sin(t * 3 + x * 0.01) * 3;
              path += `L${x},${y} `;
            }
            path += "L1200,60 L0,60 Z";
            return path;
          })()}
          fill="url(#wave-grad)"
          opacity="0.5"
        />
        <path
          d={(() => {
            const t = timeRef.current;
            let path = "M0,30 ";
            for (let x = 0; x <= 1200; x += 8) {
              const barIdx = Math.floor((x / 1200) * EQ_BAR_COUNT);
              const val = eqBars[barIdx] || 0;
              const y = 30 - val * 25 + Math.sin(t * 3 + x * 0.01) * 3;
              path += `L${x},${y} `;
            }
            return path;
          })()}
          fill="none"
          stroke="url(#wave-grad)"
          strokeWidth="2"
          opacity="0.8"
        />
      </svg>

      {/* ══════ DIGITAL WAVE LINE — Bottom ══════ */}
      <svg className="absolute bottom-16 sm:bottom-20 left-0 right-0 h-8 sm:h-12 opacity-10 sm:opacity-15" viewBox="0 0 1200 48" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave-grad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path
          d={(() => {
            const t = timeRef.current;
            let path = "M0,24 ";
            for (let x = 0; x <= 1200; x += 10) {
              const y = 24 + Math.sin(t * 5 + x * 0.02) * 18 * (eqBars[Math.floor(x / 25)] || 0.3);
              path += `L${x},${y} `;
            }
            return path;
          })()}
          fill="none"
          stroke="url(#wave-grad2)"
          strokeWidth="1.5"
        />
      </svg>

      {/* ══════ CRACKER LIGHT BURSTS ══════ */}
      {crackers.map((c) => (
        <div key={`cracker-${c.id}`} className="absolute" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 8,
              height: 8,
              background: c.color,
              boxShadow: `0 0 24px 10px ${c.color}50, 0 0 80px 30px ${c.color}25`,
              animation: `crackerPulse 3s ease-in-out ${c.delay}s infinite`,
            }}
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <div
              key={angle}
              className="absolute"
              style={{
                width: 2,
                height: 40 + Math.random() * 25,
                background: `linear-gradient(to bottom, ${c.color}90, transparent)`,
                transform: `rotate(${angle}deg) translateY(-24px)`,
                transformOrigin: "top center",
                animation: `crackerRay 2s ease-in-out ${c.delay + angle * 0.005}s infinite`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      ))}

      {/* ══════ FLOATING MUSIC SYMBOLS ══════ */}
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

      {/* ══════ COVER BLAST RINGS ══════ */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={`ring-${i}`}
            className="absolute rounded-full border"
            style={{
              width: 250,
              height: 250,
              borderColor: `rgba(34, 197, 94, ${0.12 - i * 0.03})`,
              animation: `coverBlast 4s ease-out ${i * 1.3}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ══════ AMBIENT GLOW ══════ */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 90%, rgba(34,197,94,0.08) 0%, transparent 50%)`,
          animation: "ambientPulse 3s ease-in-out infinite",
        }}
      />
    </div>
  );
}
