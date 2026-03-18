import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const callSessions = pgTable("call_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostUserId: varchar("host_user_id").notNull(),
  guestUserId: varchar("guest_user_id"),
  status: text("status").notNull().default("waiting"), // waiting, active, ended
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const translations = pgTable("translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  originalText: text("original_text").notNull(),
  translatedText: text("translated_text").notNull(),
  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  speakerId: varchar("speaker_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCallSessionSchema = createInsertSchema(callSessions).pick({
  hostUserId: true,
  guestUserId: true,
});

export const insertTranslationSchema = createInsertSchema(translations).pick({
  sessionId: true,
  originalText: true,
  translatedText: true,
  sourceLanguage: true,
  targetLanguage: true,
  speakerId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCallSession = z.infer<typeof insertCallSessionSchema>;
export type CallSession = typeof callSessions.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translations.$inferSelect;

// WebRTC signaling message types
export const signalingMessageSchema = z.object({
  type: z.enum(["offer", "answer", "ice-candidate", "join-room", "leave-room", "ready-to-receive"]),
  data: z.any(),
  roomId: z.string(),
  senderId: z.string(),
});

export type SignalingMessage = z.infer<typeof signalingMessageSchema>;

// Translation message types
export const translationMessageSchema = z.object({
  type: z.enum(["speech-start", "speech-end", "translation-result"]),
  data: z.object({
    text: z.string().optional(),
    sourceLanguage: z.string().optional(),
    targetLanguage: z.string().optional(),
    speechCode: z.string().optional(),
    translatedText: z.string().optional(),
    confidence: z.number().optional(),
  }).optional(),
  sessionId: z.string(),
  speakerId: z.string(),
});

export type TranslationMessage = z.infer<typeof translationMessageSchema>;
