import { motion } from "framer-motion";
import {
  Play,
  Headphones,
  Music2,
  Sparkles,
  ArrowRight,
  Zap,
  Globe,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router";

function GuitarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="44" rx="14" ry="16" fill="currentColor" opacity="0.2" />
      <ellipse cx="32" cy="44" rx="10" ry="12" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M32 32V8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 8L26 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 8L38 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="44" r="2.5" fill="currentColor" opacity="0.4" />
      <line x1="29" y1="44" x2="29" y2="44" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <line x1="35" y1="44" x2="35" y2="44" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <path d="M32 4V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HeadphoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 36V32C12 20.954 20.954 12 32 12C43.046 12 52 20.954 52 32V36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="8" y="34" width="8" height="14" rx="4" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="2" />
      <rect x="48" y="34" width="8" height="14" rx="4" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="12" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

const genres = [
  { name: "Pop", color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { name: "Hip-Hop", color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { name: "Rock", color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { name: "Jazz", color: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" },
  { name: "Classical", color: "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)" },
  { name: "Electronic", color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "R&B", color: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)" },
  { name: "Bollywood", color: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)" },
];

const features = [
  {
    icon: Headphones,
    title: "High-Quality Audio",
    desc: "Crystal-clear streaming with premium audio quality for every track.",
  },
  {
    icon: Zap,
    title: "Instant Playback",
    desc: "Start listening instantly with zero buffering and blazing fast streams.",
  },
  {
    icon: Globe,
    title: "Millions of Tracks",
    desc: "Access an enormous library spanning every genre and language.",
  },
  {
    icon: Shield,
    title: "Free & Ad-Free",
    desc: "No subscriptions, no ads, no interruptions. Just pure music.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <GuitarIcon className="h-7 w-7 text-primary" />
              <HeadphoneIcon className="h-5 w-5 text-primary/60 -ml-1" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              SONA <span className="text-primary">Music</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-chart-2/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8"
          >
            <Sparkles className="h-4 w-4" />
            Free music streaming — no catches
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1]"
          >
            Your music.{" "}
            <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-4 bg-clip-text text-transparent">
              Your way.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Stream millions of songs in high quality. Create playlists, discover
            new artists, and enjoy your favorite music — completely free, with
            zero ads.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="h-5 w-5 fill-current" />
              Start Listening — It's Free
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-primary/30 to-chart-2/30 flex items-center justify-center"
                  >
                    <Music2 className="h-3 w-3 text-foreground/60" />
                  </div>
                ))}
              </div>
              <span>
                <strong className="text-foreground">50K+</strong> listeners
              </span>
            </div>
          </motion.div>
        </div>

        {/* Hero visual — floating album covers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative mx-auto mt-16 max-w-4xl h-64"
        >
          <div className="absolute left-1/2 top-0 -translate-x-1/2 flex items-center gap-4">
            {[
              "from-primary/30 to-chart-2/30",
              "from-chart-2/30 to-chart-3/30",
              "from-primary/20 to-chart-4/30",
              "from-chart-4/30 to-chart-5/30",
              "from-chart-5/30 to-primary/30",
            ].map((grad, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                className={`h-32 w-32 sm:h-40 sm:w-40 rounded-2xl bg-gradient-to-br ${grad} border border-white/10 shadow-2xl`}
                style={{
                  transform: `rotate(${(i - 2) * 5}deg) translateY(${Math.abs(i - 2) * 10}px)`,
                }}
              >
                <div className="flex h-full items-center justify-center">
                  <Music2 className="h-8 w-8 text-foreground/20" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Genres */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
          >
            Explore every genre
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-center mb-12"
          >
            From Bollywood to Classical, Hip-Hop to Jazz — find your vibe.
          </motion.p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {genres.map((g, i) => (
              <motion.div
                key={g.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/auth")}
                className="cursor-pointer rounded-xl p-5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-shadow"
                style={{ background: g.color }}
              >
                {g.name}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-border/40">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-12"
          >
            Built for music lovers
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border/60 bg-card/50 p-6 hover:bg-card transition-colors"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-primary/20 via-background to-chart-2/20 border border-border/60 p-12 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to press play?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of listeners enjoying unlimited, high-quality music.
            It takes 10 seconds to sign up.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25"
          >
            Start Listening Now
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GuitarIcon className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">SONA Music</span>
          </div>
          <p>Free & ad-free music streaming. Built with ❤️</p>
        </div>
      </footer>

      {/* Bottom spacer for now-playing bar */}
      <div className="h-24" />
    </div>
  );
}
