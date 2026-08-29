import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    playlists: defineTable({
      userId: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      image: v.optional(v.string()),
      trackIds: v.string(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    likedSongs: defineTable({
      userId: v.string(),
      trackId: v.number(),
      title: v.string(),
      artist: v.string(),
      album: v.string(),
      albumCover: v.string(),
      preview: v.string(),
      duration: v.number(),
      likedAt: v.number(),
    }).index("by_user", ["userId"]).index("by_user_track", ["userId", "trackId"]),

    recentlyPlayed: defineTable({
      userId: v.string(),
      trackId: v.number(),
      title: v.string(),
      artist: v.string(),
      album: v.string(),
      albumCover: v.string(),
      preview: v.string(),
      duration: v.number(),
      playedAt: v.number(),
    }).index("by_user", ["userId"]).index("by_user_time", ["userId", "playedAt"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
