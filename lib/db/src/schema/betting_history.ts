import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bettingHistoryTable = pgTable("betting_history", {
  id: serial("id").primaryKey(),
  homeTeamName: text("home_team_name").notNull(),
  awayTeamName: text("away_team_name").notNull(),
  homeFormation: text("home_formation"),
  awayFormation: text("away_formation"),
  homeColor: text("home_color"),
  awayColor: text("away_color"),
  homeWinProb: real("home_win_prob").notNull(),
  awayWinProb: real("away_win_prob").notNull(),
  drawProb: real("draw_prob").notNull(),
  expectedGoals: real("expected_goals"),
  betRecommendation: text("bet_recommendation"),
  betMarket: text("bet_market"),
  betConfidence: real("bet_confidence"),
  weather: text("weather"),
  referee: text("referee"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBettingHistorySchema = createInsertSchema(bettingHistoryTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBettingHistory = z.infer<typeof insertBettingHistorySchema>;
export type BettingHistory = typeof bettingHistoryTable.$inferSelect;
