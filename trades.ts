import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";

export const tradesTable = pgTable("trades", {
  id:            serial("id").primaryKey(),
  tradeId:       text("trade_id").notNull(),
  ticker:        text("ticker").notNull(),
  signal:        text("signal").notNull(),        // "CALL" | "PUT"
  entryPrice:    numeric("entry_price",    { precision: 12, scale: 4 }).notNull(),
  strike:        numeric("strike",         { precision: 12, scale: 2 }).notNull(),
  expiry:        text("expiry").notNull(),
  confidence:    integer("confidence").notNull(),
  risk:          text("risk").notNull(),           // "low" | "medium" | "high"
  reason:        text("reason").notNull(),
  tp1:           numeric("tp1",            { precision: 12, scale: 4 }).notNull(),
  tp2:           numeric("tp2",            { precision: 12, scale: 4 }).notNull(),
  tp3:           numeric("tp3",            { precision: 12, scale: 4 }).notNull(),
  stopPrice:     numeric("stop_price",     { precision: 12, scale: 4 }).notNull(),
  highPrice:     numeric("high_price",     { precision: 12, scale: 4 }).notNull(),
  contractEntry: numeric("contract_entry", { precision: 10, scale: 4 }).notNull(),
  contractHigh:  numeric("contract_high",  { precision: 10, scale: 4 }).notNull(),
  pnlPct:        numeric("pnl_pct",        { precision: 8,  scale: 2 }).notNull(),
  closeReason:   text("close_reason").notNull(),   // "tp1"|"tp2"|"tp3"|"stop"|"expired"
  openedAt:      timestamp("opened_at",  { withTimezone: true }).notNull(),
  closedAt:      timestamp("closed_at",  { withTimezone: true }).notNull(),
});

export type Trade = typeof tradesTable.$inferSelect;
