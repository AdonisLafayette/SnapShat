import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const friends = pgTable("friends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  profilePictureUrl: text("profile_picture_url"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  friendId: varchar("friend_id").notNull().references(() => friends.id),
  status: text("status").notNull(), // 'pending' | 'running' | 'success' | 'failed' | 'captcha'
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  logEntries: text("log_entries").array(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
});

export const insertFriendSchema = createInsertSchema(friends).omit({
  id: true,
  addedAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type SubmissionStatus = 'pending' | 'running' | 'success' | 'failed' | 'captcha';
