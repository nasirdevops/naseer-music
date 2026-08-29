"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";

const DEEZER_BASE = "https://api.deezer.com";
const SAAVN_BASE = "https://www.jiosaavn.com/api.php";

/**
 * Decrypt JioSaavn encrypted_media_url using DES-ECB
 */
function decryptSaavnUrl(encryptedUrl: string): string {
  try {
    const key = Buffer.from("38346591");
    const decipher = crypto.createDecipheriv("des-ecb", key, null);
    decipher.setAutoPadding(true);
    const encrypted = Buffer.from(encryptedUrl, "base64");
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    let url = decrypted.toString("utf-8");
    url = url.replace("_96.mp4", "_320.mp4");
    return url;
  } catch {
    return "";
  }
}

function cleanString(s: string): string {
  return (s || "")
    .replace(/&quot;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'");
}

/**
 * Search YouTube via YouTube's own innertube API (no key needed).
 * Uses WEB_REMIX client (YouTube Music) for better music results.
 */
async function searchYouTube(
  query: string,
  limit: number
): Promise<{ videoId: string; title: string; duration: number }[]> {
  try {
    const res = await fetch(
      "https://music.youtube.com/youtubei/v1/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20240101.00.00",
              hl: "en",
              gl: "IN",
            },
          },
          query,
          params: "EgIQAQ==", // Videos filter
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return [];
    const data = await res.json();    // Navigate the complex response structure to find video IDs
    const results: { videoId: string; title: string; duration: number }[] = [];
    const tabs =
      data?.contents?.tabbedSearchResultsRenderer?.tabs ?? [];

    for (const tab of tabs) {
      const sections =
        tab?.tabRenderer?.content?.sectionListRenderer?.contents ?? [];
      for (const section of sections) {
        // 1) musicCardShelfRenderer — top result card
        if (section?.musicCardShelfRenderer) {
          const shelf = section.musicCardShelfRenderer;
          const titleRuns = shelf?.title?.runs ?? [];
          if (titleRuns[0]) {
            const vid =
              titleRuns[0].navigationEndpoint?.watchEndpoint?.videoId ?? "";
            const txt = titleRuns[0].text ?? "";
            if (vid && txt) {
              results.push({ videoId: vid, title: txt, duration: 0 });
            }
          }
        }

        // 2) itemSectionRenderer — individual track results
        const items = section?.itemSectionRenderer?.contents ?? [];
        for (const item of items) {
          const renderer =
            item?.musicResponsiveListItemRenderer ??
            item?.musicTwoRowItemRenderer;
          if (!renderer) continue;

          let videoId = "";
          let titleText = "";
          let durationSec = 0;

          // Primary: extract videoId from overlay play button
          const overlay = renderer?.overlay
            ?.musicItemThumbnailOverlayRenderer?.content
            ?.musicPlayButtonRenderer;
          if (overlay) {
            videoId =
              overlay.playNavigationEndpoint?.watchEndpoint?.videoId ?? "";
          }

          // Fallback: check flexColumns navigation endpoints
          if (!videoId) {
            const flexColumns = renderer.flexColumns ?? [];
            for (const col of flexColumns) {
              const runs =
                col?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ??
                [];
              for (const run of runs) {
                if (run?.navigationEndpoint?.watchEndpoint?.videoId) {
                  videoId = run.navigationEndpoint.watchEndpoint.videoId;
                  titleText = run.text ?? "";
                }
              }
            }
          }

          // Get title from first flexColumn
          if (!titleText) {
            const flexColumns = renderer.flexColumns ?? [];
            const runs =
              flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text
                ?.runs ?? [];
            if (runs[0]) titleText = runs[0].text ?? "";
          }

          // Get duration from accessibility text
          const flexColumns = renderer.flexColumns ?? [];
          const accessibility =
            flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text
              ?.accessibility?.accessibilityData?.label ?? "";
          const durationMatch = accessibility.match(
            /(\d+)\s*minute[s]?,?\s*(\d+)\s*second[s]?/
          );
          if (durationMatch) {
            durationSec =
              parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]);
          }

          if (videoId && titleText) {
            results.push({ videoId, title: titleText, duration: durationSec });
          }

          if (results.length >= limit) break;
        }
        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }

    return results;
  } catch (e) {
    console.warn("YouTube innertube search failed:", e);
    return [];
  }
}

/** Step 1: Autocomplete search */
async function saavnAutocomplete(query: string) {
  const params = new URLSearchParams({
    __call: "autocomplete.get",
    _format: "json",
    _marker: "0",
    cc: "in",
    includeMetaTags: "1",
    query,
  });
  const res = await fetch(`${SAAVN_BASE}?${params}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) return [];
  const text = await res.text();
  const data = JSON.parse(text);
  return data?.songs?.data ?? [];
}

/** Step 2: Get full song details */
async function saavnGetSongDetails(songId: string) {
  const params = new URLSearchParams({
    __call: "song.getDetails",
    cc: "in",
    _marker: "0",
    _format: "json",
    pids: songId,
  });
  const res = await fetch(`${SAAVN_BASE}?${params}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) return null;
  const text = await res.text();
  const data = JSON.parse(text);
  return data?.[songId] ?? null;
}

async function fetchDeezer(path: string) {
  const res = await fetch(`${DEEZER_BASE}${path}`);
  if (!res.ok) throw new Error(`Deezer API error: ${res.status}`);
  return res.json();
}

type TrackResult = {
  id: number;
  title: string;
  artist: string;
  album: string;
  albumCover: string;
  preview: string;
  duration: number;
  source: "jiosaavn" | "deezer";
  youtubeId?: string;
};

function mapDeezerTrack(t: Record<string, unknown>): TrackResult {
  return {
    id: t.id as number,
    title: (t.title as string) ?? "",
    artist:
      ((t.artist as Record<string, unknown>)?.name as string) ?? "Unknown",
    album:
      ((t.album as Record<string, unknown>)?.title as string) ?? "Unknown",
    albumCover:
      ((t.album as Record<string, unknown>)?.cover_medium as string) ?? "",
    preview: (t.preview as string) ?? "",
    duration: (t.duration as number) ?? 0,
    source: "deezer",
  };
}

function dedup(tracks: TrackResult[]) {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    const key = `${t.title.toLowerCase()}-${t.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const searchSmart = action({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (_ctx, { query, limit }) => {
    const max = limit ?? 40;
    const q = query.trim();
    const lower = q.toLowerCase();

    const queries: string[] = [q];
    if (!lower.includes("songs") && !lower.includes("song")) {
      queries.push(`${q} songs`);
    }
    const hasLang = [
      "hindi", "telugu", "tamil", "kannada", "malayalam", "punjabi",
    ].some((l) => lower.includes(l));
    if (!hasLang) {
      queries.push(`${q} hindi`);
      queries.push(`${q} telugu`);
    }

    const uniqueQueries = [...new Set(queries)].slice(0, 3);
    const allTracks: TrackResult[] = [];

    // === JIO-SAAVN: search → getDetails → decrypt ===
    try {
      const searchResults = await Promise.allSettled(
        uniqueQueries.map((q) => saavnAutocomplete(q))
      );
      const songIds: string[] = [];
      for (const result of searchResults) {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          for (const song of result.value) {
            if (song?.id) songIds.push(String(song.id));
          }
        }
      }
      const uniqueIds = [...new Set(songIds)].slice(0, 20);
      const detailResults = await Promise.allSettled(
        uniqueIds.map((id) => saavnGetSongDetails(id))
      );

      for (const result of detailResults) {
        if (result.status === "fulfilled" && result.value) {
          const song = result.value;
          let fullUrl = "";
          if (song.encrypted_media_url) {
            fullUrl = decryptSaavnUrl(song.encrypted_media_url);
          }
          if (!fullUrl && song.media_url) {
            fullUrl = song.media_url;
          }
          if (!fullUrl) continue;
          fullUrl = fullUrl.replace("http://", "https://");

          const image = (song.image as string) ?? "";
          const cover = image
            ? image.replace("150x150", "500x500").replace("http://", "https://")
            : "";
          const duration = parseInt(song.duration as string, 10) || 0;
          const songId = parseInt(song.id as string, 10) || 0;

          allTracks.push({
            id: songId || Math.floor(Math.random() * 1000000),
            title: cleanString(
              (song.song as string) ?? (song.title as string) ?? ""
            ),
            artist: cleanString(
              (song.singers as string) ??
                (song.primary_artists as string) ??
                "Unknown"
            ),
            album: cleanString((song.album as string) ?? ""),
            albumCover: cover,
            preview: fullUrl,
            duration,
            source: "jiosaavn",
          });
        }
      }
    } catch (e) {
      console.warn("JioSaavn search failed:", e);
    }

    // === DEEZER: backup for non-Indian music ===
    try {
      const deezerResults = await Promise.allSettled(
        uniqueQueries.slice(0, 2).map((q) =>
          fetchDeezer(
            `/search?q=${encodeURIComponent(q)}&limit=${Math.ceil(max / 3)}`
          )
        )
      );
      for (const result of deezerResults) {
        if (result.status === "fulfilled" && result.value?.data) {
          for (const t of result.value.data) {
            const track = mapDeezerTrack(t as Record<string, unknown>);
            if (track.preview) allTracks.push(track);
          }
        }
      }
    } catch (e) {
      console.warn("Deezer search failed:", e);
    }

    const deduped = dedup(allTracks).slice(0, max);

    // === YOUTUBE INNERTUBE: find full-length video IDs ===
    // Search YouTube Music for the top tracks (batch, limited concurrency)
    const BATCH_SIZE = 5;
    for (let i = 0; i < Math.min(deduped.length, 20); i += BATCH_SIZE) {
      const batch = deduped.slice(i, i + BATCH_SIZE);
      const ytResults = await Promise.allSettled(
        batch.map((track) =>
          searchYouTube(`${track.title} ${track.artist}`, 1)
        )
      );

      for (let j = 0; j < batch.length; j++) {
        const ytResult = ytResults[j];
        if (
          ytResult.status === "fulfilled" &&
          ytResult.value.length > 0
        ) {
          deduped[i + j].youtubeId = ytResult.value[0].videoId;
        }
      }
    }

    return deduped;
  },
});

/** Search YouTube directly — exposed for lazy loading */
export const searchYouTubeForTrack = action({
  args: { title: v.string(), artist: v.string() },
  handler: async (_ctx, { title, artist }) => {
    const results = await searchYouTube(`${title} ${artist}`, 1);
    return results.length > 0 ? results[0].videoId : null;
  },
});

export const search = action({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (_ctx, { query, limit }) => {
    const data = await fetchDeezer(
      `/search?q=${encodeURIComponent(query)}&limit=${limit ?? 25}`
    );
    return (data.data ?? [])
      .map((t: Record<string, unknown>) => mapDeezerTrack(t))
      .filter((t: TrackResult) => t.preview);
  },
});

export const searchAlbums = action({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (_ctx, { query, limit }) => {
    const data = await fetchDeezer(
      `/search/album?q=${encodeURIComponent(query)}&limit=${limit ?? 12}`
    );
    return data.data;
  },
});

export const getAlbum = action({
  args: { id: v.number() },
  handler: async (_ctx, { id }) => {
    return await fetchDeezer(`/album/${id}`);
  },
});

export const getAlbumTracks = action({
  args: { id: v.number() },
  handler: async (_ctx, { id }) => {
    const data = await fetchDeezer(`/album/${id}/tracks`);
    return (data.data ?? [])
      .map((t: Record<string, unknown>) => mapDeezerTrack(t))
      .filter((t: TrackResult) => t.preview);
  },
});

export const getArtistTopTracks = action({
  args: { id: v.number() },
  handler: async (_ctx, { id }) => {
    const data = await fetchDeezer(`/artist/${id}/top?limit=20`);
    return (data.data ?? [])
      .map((t: Record<string, unknown>) => mapDeezerTrack(t))
      .filter((t: TrackResult) => t.preview);
  },
});

export const getArtistAlbums = action({
  args: { id: v.number() },
  handler: async (_ctx, { id }) => {
    const data = await fetchDeezer(`/artist/${id}/albums`);
    return data.data;
  },
});

export const getPlaylistTracks = action({
  args: { id: v.number() },
  handler: async (_ctx, { id }) => {
    const data = await fetchDeezer(`/playlist/${id}/tracks`);
    return (data.data ?? [])
      .map((t: Record<string, unknown>) => mapDeezerTrack(t))
      .filter((t: TrackResult) => t.preview);
  },
});

/**
 * Search JioSaavn albums — used when user searches language names
 * like "telugu", "hindi", "tamil", "kannada".
 */
export const searchSaavnAlbums = action({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (_ctx, { query, limit }) => {
    const max = limit ?? 20;
    const q = query.trim();

    try {
      const params = new URLSearchParams({
        __call: "autocomplete.get",
        _format: "json",
        _marker: "0",
        cc: "in",
        includeMetaTags: "1",
        query: q,
      });

      const res = await fetch(`${SAAVN_BASE}?${params}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) return [];
      const text = await res.text();
      const data = JSON.parse(text);
      const albums = data?.albums?.data ?? [];

      return albums.slice(0, max).map((a: Record<string, unknown>) => ({
        id: a.id,
        title: cleanString((a.title as string) ?? ""),
        image: ((a.image as string) ?? "").replace("50x50", "500x500").replace("http://", "https://"),
        language: (a.more_info as Record<string, unknown>)?.language as string ?? "",
        artist: cleanString(
          (a.description as string)?.split(" \u00b7 ")?.[0] ?? ""
        ),
      }));
    } catch (e) {
      console.warn("Album search failed:", e);
      return [];
    }
  },
});

/**
 * Get songs in a JioSaavn album, with YouTube video IDs for full playback.
 */
export const getSaavnAlbumSongs = action({
  args: { albumId: v.string(), albumName: v.optional(v.string()) },
  handler: async (_ctx, { albumId, albumName }) => {
    try {
      const params = new URLSearchParams({
        __call: "content.getAlbumDetails",
        _format: "json",
        cc: "in",
        _marker: "0",
        albumid: albumId,
      });

      const res = await fetch(`${SAAVN_BASE}?${params}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) return [];
      const text = await res.text();
      const data = JSON.parse(text);
      const songs = data?.songs ?? [];
      const albumTitle = cleanString((data?.name as string) ?? albumName ?? "");
      const albumImage = ((data?.image as string) ?? "")
        .replace("150x150", "500x500")
        .replace("http://", "https://");

      const tracks: TrackResult[] = songs.map((s: Record<string, unknown>) => {
        const image = (s.image as string) ?? "";
        return {
          id: parseInt(s.id as string, 10) || Math.floor(Math.random() * 1000000),
          title: cleanString((s.song as string) ?? ""),
          artist: cleanString(
            (s.singers as string) ?? (s.primary_artists as string) ?? "Unknown"
          ),
          album: albumTitle,
          albumCover: image ? image.replace("150x150", "500x500").replace("http://", "https://") : albumImage,
          preview: "",
          duration: parseInt(s.duration as string, 10) || 0,
          source: "jiosaavn" as const,
        };
      });

      // Find YouTube video IDs for all songs in the album
      const BATCH_SIZE = 5;
      for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
        const batch = tracks.slice(i, i + BATCH_SIZE);
        const ytResults = await Promise.allSettled(
          batch.map((t) =>
            searchYouTube(`${t.title} ${t.artist} ${albumTitle}`, 1)
          )
        );
        for (let j = 0; j < batch.length; j++) {
          const r = ytResults[j];
          if (r.status === "fulfilled" && r.value.length > 0) {
            tracks[i + j].youtubeId = r.value[0].videoId;
          }
        }
      }

      return tracks;
    } catch (e) {
      console.warn("Album songs fetch failed:", e);
      return [];
    }
  },
});
