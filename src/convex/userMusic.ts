import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Liked Songs ────────────────────────────────────────
export const toggleLike = mutation({
  args: {
    trackId: v.number(),
    title: v.string(),
    artist: v.string(),
    album: v.string(),
    albumCover: v.string(),
    preview: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("likedSongs")
      .withIndex("by_user_track", (q) =>
        q.eq("userId", userId).eq("trackId", args.trackId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("likedSongs", {
        userId,
        ...args,
        likedAt: Date.now(),
      });
      return true;
    }
  },
});

export const isLiked = query({
  args: { trackId: v.number() },
  handler: async (ctx, { trackId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db
      .query("likedSongs")
      .withIndex("by_user_track", (q) =>
        q.eq("userId", userId).eq("trackId", trackId)
      )
      .unique();
    return !!existing;
  },
});

export const getLikedSongs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("likedSongs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// ─── Recently Played ────────────────────────────────────
export const addRecentlyPlayed = mutation({
  args: {
    trackId: v.number(),
    title: v.string(),
    artist: v.string(),
    album: v.string(),
    albumCover: v.string(),
    preview: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("recentlyPlayed")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const duplicate = existing.find((e) => e.trackId === args.trackId);
    if (duplicate) {
      await ctx.db.delete(duplicate._id);
    }

    await ctx.db.insert("recentlyPlayed", {
      userId,
      ...args,
      playedAt: Date.now(),
    });

    const all = await ctx.db
      .query("recentlyPlayed")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (all.length > 50) {
      for (const item of all.slice(50)) {
        await ctx.db.delete(item._id);
      }
    }
  },
});

export const getRecentlyPlayed = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const results = await ctx.db
      .query("recentlyPlayed")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return results.slice(0, 50);
  },
});

// ─── Playlists ──────────────────────────────────────────
export const createPlaylist = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("playlists", {
      userId,
      name: args.name,
      description: args.description,
      image: args.image,
      trackIds: "[]",
      createdAt: Date.now(),
    });
  },
});

export const getPlaylists = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("playlists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const deletePlaylist = mutation({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, { playlistId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const playlist = await ctx.db.get(playlistId);
    if (!playlist || playlist.userId !== userId)
      throw new Error("Playlist not found");
    await ctx.db.delete(playlistId);
  },
});
