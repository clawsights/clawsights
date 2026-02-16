import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  githubHandle: text("github_handle").notNull().unique(),
  githubId: integer("github_id").notNull().unique(),
  avatarUrl: text("avatar_url"),
  displayName: text("display_name"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const stats = sqliteTable("stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  reportHtml: text("report_html").notNull(),
  totalMessages: integer("total_messages"),
  totalSessions: integer("total_sessions"),
  linesAdded: integer("lines_added"),
  linesRemoved: integer("lines_removed"),
  filesTouched: integer("files_touched"),
  daysActive: integer("days_active"),
  msgsPerDay: real("msgs_per_day"),
  dateFrom: text("date_from"),
  dateTo: text("date_to"),
  languages: text("languages"), // JSON: {"TypeScript": 96431, ...}
  multiclaudeEvents: integer("multiclaude_events"),
  multiclaudeSessions: integer("multiclaude_sessions"),
  multiclaudePct: real("multiclaude_pct"),
  hourCounts: text("hour_counts"), // JSON: {"3": 16, "7": 40, ...}
  usageNarrative: text("usage_narrative"), // JSON: { paragraphs: string[], keyInsight: string }
  impressiveThings: text("impressive_things"), // JSON: { intro: string, wins: [{ title, desc }] }
  ghTotalCommits: integer("gh_total_commits"),
  ghActiveDays: integer("gh_active_days"),
  ghTotalContributions: integer("gh_total_contributions"),
  ghContributions: text("gh_contributions"), // JSON: GitHub contribution calendar data
  uploadedAt: text("uploaded_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Stat = typeof stats.$inferSelect;
export type NewStat = typeof stats.$inferInsert;
