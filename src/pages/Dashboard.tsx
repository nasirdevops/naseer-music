import { useState, useEffect, useCallback, useRef } from "react";
import {
  Home,
  Search,
  Library,
  Heart,
  Clock,
  Plus,
  LogOut,
  Music,
  X,
  Loader2,
  ChevronLeft,
  Disc3,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { useMusic, type Track } from "@/lib/music-context";
import { TrackRow } from "@/components/music/TrackRow";
import { NowPlayingBar } from "@/components/music/NowPlayingBar";
import { MusicVisualizer } from "@/components/MusicVisualizer";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type View = "home" | "search" | "library";

type SaavnAlbum = {
  id: string;
  title: string;
  image: string;
  language: string;
  artist: string;
};

const LANGUAGES = [
  "telugu",
  "hindi",
  "tamil",
  "kannada",
  "malayalam",
  "punjabi",
  "bengali",
  "marathi",
];

function isLanguageQuery(q: string): boolean {
  const lower = q.toLowerCase().trim();
  return (
    LANGUAGES.includes(lower) ||
    lower.endsWith(" songs") ||
    lower.endsWith(" albums") ||
    lower.endsWith(" hits")
  );
}

const GENRE_COLORS: Record<string, string> = {
  Bollywood: "linear-gradient(135deg, #f5af19, #f12711)",
  "Hindi Songs": "linear-gradient(135deg, #e44d26, #ff6b35)",
  "Telugu Songs": "linear-gradient(135deg, #ff6f61, #de4313)",
  "Tamil Songs": "linear-gradient(135deg, #f7971e, #ffd200)",
  "Kannada Songs": "linear-gradient(135deg, #667eea, #764ba2)",
  "Punjabi Songs": "linear-gradient(135deg, #f093fb, #f5576c)",
  "Malayalam Songs": "linear-gradient(135deg, #134e5e, #71b280)",
  "English Pop": "linear-gradient(135deg, #4facfe, #00f2fe)",
  "Hip-Hop": "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "K-Pop": "linear-gradient(135deg, #e91e63, #9c27b0)",
  Rock: "linear-gradient(135deg, #fa709a, #fee140)",
  Classical: "linear-gradient(135deg, #fccb90, #d57eeb)",
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const { playTrack, playQueue, currentTrack, isPlaying } = useMusic();

  // Logo toggle
  const [brandName, setBrandName] = useState<"SONA" | "NAYA">("SONA");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Background photo
  const [bgImage, setBgImage] = useState<string | null>(() => {
    try { return localStorage.getItem("sona_bg_image"); } catch { return null; }
  });
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Album search
  const [albumResults, setAlbumResults] = useState<SaavnAlbum[]>([]);
  const [isSearchingAlbums, setIsSearchingAlbums] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<SaavnAlbum | null>(null);
  const [albumSongs, setAlbumSongs] = useState<Track[]>([]);
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false);

  const searchSmart = useAction(api.music.searchSmart);
  const searchSaavnAlbums = useAction(api.music.searchSaavnAlbums);
  const getSaavnAlbumSongs = useAction(api.music.getSaavnAlbumSongs);
  const recentlyPlayed = useQuery(api.userMusic.getRecentlyPlayed);
  const likedSongs = useQuery(api.userMusic.getLikedSongs);
  const playlists = useQuery(api.userMusic.getPlaylists);
  const createPlaylist = useMutation(api.userMusic.createPlaylist);

  // Load trending on mount
  useEffect(() => {
    const loadTrending = async () => {
      try {
        setIsLoadingTrending(true);
        const [topHits, bollywood, hindi, telugu] = await Promise.allSettled([
          searchSmart({ query: "top hits 2024", limit: 15 }),
          searchSmart({ query: "bollywood songs", limit: 10 }),
          searchSmart({ query: "hindi songs hits", limit: 10 }),
          searchSmart({ query: "telugu songs hits", limit: 10 }),
        ]);
        const allTracks: Track[] = [];
        if (topHits.status === "fulfilled") allTracks.push(...topHits.value);
        if (bollywood.status === "fulfilled") allTracks.push(...bollywood.value);
        if (hindi.status === "fulfilled") allTracks.push(...hindi.value);
        if (telugu.status === "fulfilled") allTracks.push(...telugu.value);
        setTrendingTracks(allTracks);
      } catch (e) {
        console.error("Failed to load trending:", e);
      } finally {
        setIsLoadingTrending(false);
      }
    };
    loadTrending();
  }, [searchSmart]);

  // Search handler
  const handleSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSearchResults([]);
        setAlbumResults([]);
        return;
      }
      setIsSearching(true);
      setIsSearchingAlbums(true);
      setSelectedAlbum(null);
      setAlbumSongs([]);
      try {
        if (isLanguageQuery(q)) {
          const albums = await searchSaavnAlbums({ query: q, limit: 20 });
          setAlbumResults(albums as SaavnAlbum[]);
          setSearchResults([]);
        } else {
          const data = await searchSmart({ query: q, limit: 40 });
          setSearchResults(data as Track[]);
          setAlbumResults([]);
        }
      } catch (e) {
        console.error("Search failed:", e);
      } finally {
        setIsSearching(false);
        setIsSearchingAlbums(false);
      }
    },
    [searchSmart, searchSaavnAlbums]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) handleSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Click album → load songs
  const handleAlbumClick = useCallback(
    async (album: SaavnAlbum) => {
      setSelectedAlbum(album);
      setIsLoadingAlbum(true);
      setAlbumSongs([]);
      try {
        const songs = await getSaavnAlbumSongs({
          albumId: album.id,
          albumName: album.title,
        });
        setAlbumSongs(songs as Track[]);
      } catch (e) {
        console.error("Failed to load album:", e);
      } finally {
        setIsLoadingAlbum(false);
      }
    },
    [getSaavnAlbumSongs]
  );

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setBgImage(dataUrl);
      try { localStorage.setItem("sona_bg_image", dataUrl); } catch { /* quota */ }
    };
    reader.readAsDataURL(file);
  };

  const removeBg = () => {
    setBgImage(null);
    try { localStorage.removeItem("sona_bg_image"); } catch { /* ignore */ }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleCreatePlaylist = async () => {
    const name = prompt("Playlist name:");
    if (name) await createPlaylist({ name });
  };

  const uniqueArtists = trendingTracks
    .filter((t, i, arr) => arr.findIndex((a) => a.artist === t.artist) === i)
    .slice(0, 6);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
      {/* Custom background image */}
      {bgImage && (
        <div className="fixed inset-0 z-0">
          <img src={bgImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}
      {/* Sidebar */}
      <aside className={cn("hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-background/80 backdrop-blur-xl transition-all duration-300 relative z-10", !sidebarOpen && "w-0 overflow-hidden border-0")}>
        {/* Logo — toggles SONA ↔ Naya */}
        <div
          className="p-5 flex items-center gap-2 cursor-pointer select-none"
          onClick={() =>
            setBrandName((prev) => (prev === "SONA" ? "NAYA" : "SONA"))
          }
        >
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Music className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold">
            {brandName} <span className="text-primary">Music</span>
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {(
            [
              { id: "home" as View, icon: Home, label: "Home" },
              { id: "search" as View, icon: Search, label: "Search" },
              { id: "library" as View, icon: Library, label: "Your Library" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                setSelectedAlbum(null);
                setAlbumSongs([]);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                view === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}

          <div className="pt-4 pb-2 px-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Playlists
            </h4>
          </div>
          {playlists?.map((pl) => (
            <button
              key={pl._id}
              onClick={() => setView("library")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                <Music className="h-3.5 w-3.5" />
              </div>
              <span className="truncate">{pl.name}</span>
            </button>
          ))}
          <button
            onClick={handleCreatePlaylist}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <div className="h-8 w-8 rounded border border-dashed border-border flex items-center justify-center">
              <Plus className="h-3.5 w-3.5" />
            </div>
            <span>Create Playlist</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-border/40 bg-background/60 backdrop-blur-xl">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            {sidebarOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
          <div className="flex lg:hidden items-center gap-2">
            {(
              [
                { id: "home" as View, icon: Home },
                { id: "search" as View, icon: Search },
                { id: "library" as View, icon: Library },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setSelectedAlbum(null);
                }}
                className={cn(
                  "h-9 w-9 flex items-center justify-center rounded-lg transition-colors",
                  view === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
              </button>
            ))}
          </div>

          {view === "search" && (
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Telugu, Hindi, Tamil, Kannada albums & songs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedAlbum(null);
                  setAlbumSongs([]);
                }}
                className="w-full h-10 pl-10 pr-10 rounded-full bg-white/5 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setAlbumResults([]);
                    setSelectedAlbum(null);
                    setAlbumSongs([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {view === "home" && (
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                Good {getTimeGreeting()}, {user?.name?.split(" ")[0] ?? "there"}
              </h2>
            </div>
          )}

          {view === "library" && (
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Your Library</h2>
            </div>
          )}

          {/* Background upload + User profile — top right */}
          <div className="ml-auto flex items-center gap-3">
            <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
            <button
              onClick={() => bgImage ? removeBg() : bgInputRef.current?.click()}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              title={bgImage ? "Remove background photo" : "Upload background photo"}
            >
              {bgImage ? <Trash2 className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold truncate max-w-[140px]">
                {user?.name ?? user?.email?.split("@")[0] ?? "Guest"}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                {user?.email ?? ""}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {(user?.name ?? user?.email ?? "G").charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleSignOut}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className={cn("flex-1 overflow-y-auto p-6 pb-28", bgImage && "")}>
          <AnimatePresence mode="wait">
            {/* HOME */}
            {view === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setView("search")}
                    className="flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 p-4 hover:bg-primary/15 transition-colors text-left"
                  >
                    <Search className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">Search Music</span>
                  </button>
                  <button
                    onClick={() => setView("library")}
                    className="flex items-center gap-3 rounded-xl bg-white/5 border border-border/60 p-4 hover:bg-white/8 transition-colors text-left"
                  >
                    <Heart className="h-5 w-5 text-chart-2" />
                    <span className="text-sm font-semibold">Liked Songs</span>
                  </button>
                  <button
                    onClick={() => setView("library")}
                    className="flex items-center gap-3 rounded-xl bg-white/5 border border-border/60 p-4 hover:bg-white/8 transition-colors text-left"
                  >
                    <Clock className="h-5 w-5 text-chart-3" />
                    <span className="text-sm font-semibold">
                      Recently Played
                    </span>
                  </button>
                </div>

                {recentlyPlayed && recentlyPlayed.length > 0 && (
                  <section>
                    <h3 className="text-xl font-bold mb-4">Recently Played</h3>
                    <div className="space-y-1">
                      {recentlyPlayed.slice(0, 5).map((item) => (
                        <TrackRow
                          key={item._id}
                          track={{
                            id: item.trackId,
                            title: item.title,
                            artist: item.artist,
                            album: item.album,
                            albumCover: item.albumCover,
                            preview: item.preview,
                            duration: item.duration,
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="text-xl font-bold mb-4">🇮🇳 Indian Music</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {[
                      { label: "Bollywood Hits", q: "hindi albums", color: "from-orange-500 to-red-500" },
                      { label: "Hindi Pop", q: "hindi songs", color: "from-pink-500 to-rose-500" },
                      { label: "Telugu Hits", q: "telugu albums", color: "from-amber-500 to-orange-600" },
                      { label: "Tamil Hits", q: "tamil albums", color: "from-yellow-500 to-amber-600" },
                      { label: "Kannada Songs", q: "kannada albums", color: "from-purple-500 to-indigo-500" },
                      { label: "Punjabi Beats", q: "punjabi albums", color: "from-fuchsia-500 to-pink-500" },
                      { label: "AR Rahman Best", q: "AR Rahman songs", color: "from-cyan-500 to-blue-500" },
                      { label: "Arijit Singh", q: "Arijit Singh songs", color: "from-teal-500 to-emerald-500" },
                    ].map((item) => (
                      <motion.div
                        key={item.label}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setSearchQuery(item.q);
                          setView("search");
                        }}
                        className={`cursor-pointer rounded-xl bg-gradient-to-br ${item.color} p-4 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-shadow`}
                      >
                        {item.label}
                      </motion.div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Trending Now</h3>
                    <button
                      onClick={() => trendingTracks.length > 0 && playQueue(trendingTracks)}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Play All
                    </button>
                  </div>
                  {isLoadingTrending ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {trendingTracks.slice(0, 10).map((track, i) => (
                        <TrackRow key={track.id} track={track} index={i} queue={trendingTracks} />
                      ))}
                    </div>
                  )}
                </section>

                {uniqueArtists.length > 0 && (
                  <section>
                    <h3 className="text-xl font-bold mb-4">Featured Artists</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                      {uniqueArtists.map((track) => (
                        <motion.div
                          key={track.artist}
                          whileHover={{ scale: 1.05 }}
                          className="text-center cursor-pointer"
                          onClick={() => { setSearchQuery(track.artist); setView("search"); }}
                        >
                          <div className="aspect-square rounded-full overflow-hidden bg-gradient-to-br from-primary/30 to-chart-2/30 border-2 border-transparent hover:border-primary transition-colors mb-2">
                            {track.albumCover ? (
                              <img src={track.albumCover} alt={track.artist} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Music className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-medium truncate">{track.artist}</p>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="text-xl font-bold mb-4">Browse Genres</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {Object.entries(GENRE_COLORS).map(([name, color]) => (
                      <motion.div
                        key={name}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setSearchQuery(name); setView("search"); }}
                        className="cursor-pointer rounded-xl p-4 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-shadow"
                        style={{ background: color }}
                      >
                        {name}
                      </motion.div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {/* SEARCH */}
            {view === "search" && (
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {selectedAlbum ? (
                  /* Album Detail */
                  <div className="space-y-6">
                    <button
                      onClick={() => { setSelectedAlbum(null); setAlbumSongs([]); }}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to albums
                    </button>
                    <div className="flex items-end gap-5">
                      <div className="h-40 w-40 shrink-0 rounded-xl overflow-hidden shadow-2xl bg-muted">
                        {selectedAlbum.image ? (
                          <img src={selectedAlbum.image} alt={selectedAlbum.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Disc3 className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Album</p>
                        <h2 className="text-3xl font-bold truncate">{selectedAlbum.title}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{selectedAlbum.artist || selectedAlbum.language}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{albumSongs.length} songs</p>
                      </div>
                    </div>
                    {albumSongs.length > 0 && (
                      <button onClick={() => playQueue(albumSongs)} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all">
                        ▶ Play All
                      </button>
                    )}
                    {isLoadingAlbum ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {albumSongs.map((track, i) => (
                          <TrackRow key={track.id} track={track} index={i} queue={albumSongs} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : isSearching || isSearchingAlbums ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : albumResults.length > 0 ? (
                  /* Album Results Grid */
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{albumResults.length} albums found</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {albumResults.map((album) => (
                        <motion.div
                          key={album.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleAlbumClick(album)}
                          className="cursor-pointer rounded-xl bg-card/50 p-3 border border-border/40 hover:bg-card transition-colors"
                        >
                          <div className="aspect-square overflow-hidden rounded-lg bg-muted mb-3">
                            {album.image ? (
                              <img src={album.image} alt={album.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <Disc3 className="h-8 w-8 text-primary/40" />
                              </div>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold truncate">{album.title}</h3>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{album.language || album.artist || "Album"}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground mb-3">{searchResults.length} results found</p>
                    {searchResults.map((track, i) => (
                      <TrackRow key={track.id} track={track} index={i} queue={searchResults} />
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Search className="h-12 w-12 mb-4 opacity-30" />
                    <p className="text-lg font-medium">No results found</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-bold mb-3">🇮🇳 Browse by Language</h3>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {["Telugu Albums", "Hindi Albums", "Tamil Albums", "Kannada Albums", "Punjabi Albums", "Malayalam Albums", "Bengali Albums"].map((chip) => (
                          <button key={chip} onClick={() => setSearchQuery(chip.toLowerCase())} className="px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-3">🎤 Popular Artists</h3>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {["Arijit Singh", "AR Rahman", "Pritam Songs", "SP Balasubrahmanyam", "Ilaiyaraaja", "Shreya Ghoshal", "Kishore Kumar", "Lata Mangeshkar"].map((chip) => (
                          <button key={chip} onClick={() => setSearchQuery(chip)} className="px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-foreground/80 border border-border/60 hover:bg-white/10 transition-colors">
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-4">Browse All</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Object.entries(GENRE_COLORS).map(([name, color]) => (
                          <motion.div key={name} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setSearchQuery(name)} className="cursor-pointer rounded-xl p-5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-shadow" style={{ background: color }}>
                            {name}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* LIBRARY */}
            {view === "library" && (
              <motion.div
                key="library"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-chart-2 to-chart-4 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-white fill-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Liked Songs</h3>
                      <p className="text-xs text-muted-foreground">{likedSongs?.length ?? 0} songs</p>
                    </div>
                  </div>
                  {likedSongs && likedSongs.length > 0 ? (
                    <div className="space-y-1">
                      {likedSongs.map((song) => (
                        <TrackRow key={song._id} track={{ id: song.trackId, title: song.title, artist: song.artist, album: song.album, albumCover: song.albumCover, preview: song.preview, duration: song.duration }} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">No liked songs yet. Heart a song to add it here.</p>
                  )}
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Your Playlists</h3>
                    <button onClick={handleCreatePlaylist} className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium">
                      <Plus className="h-4 w-4" />
                      New
                    </button>
                  </div>
                  {playlists && playlists.length > 0 ? (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {playlists.map((pl) => (
                        <div key={pl._id} className="rounded-xl border border-border/60 bg-card/50 p-4 hover:bg-card transition-colors">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Music className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{pl.name}</p>
                              <p className="text-xs text-muted-foreground">{pl.trackIds ? JSON.parse(pl.trackIds).length : 0} songs</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">No playlists yet.</p>
                  )}
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <MusicVisualizer />
      <NowPlayingBar />
    </div>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
