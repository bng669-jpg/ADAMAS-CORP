import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, bettingHistoryTable } from "@workspace/db";
import {
  GetBettingHistoryResponse,
  SaveBettingHistoryBody,
  DeleteBettingHistoryParams,
  DeleteBettingHistoryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/history", async (req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(bettingHistoryTable)
    .orderBy(desc(bettingHistoryTable.createdAt));

  const mapped = entries.map((e) => ({
    ...e,
    notes: e.notes ?? undefined,
    homeFormation: e.homeFormation ?? undefined,
    awayFormation: e.awayFormation ?? undefined,
    homeColor: e.homeColor ?? undefined,
    awayColor: e.awayColor ?? undefined,
    expectedGoals: e.expectedGoals ?? undefined,
    betRecommendation: e.betRecommendation ?? undefined,
    betMarket: e.betMarket ?? undefined,
    betConfidence: e.betConfidence ?? undefined,
    weather: e.weather ?? undefined,
    referee: e.referee ?? undefined,
    fullResult: e.fullResult ?? undefined,
    inputData: e.inputData ?? undefined,
    createdAt: e.createdAt.toISOString(),
  }));

  res.json(GetBettingHistoryResponse.parse({ entries: mapped }));
});

router.post("/history", async (req, res): Promise<void> => {
  const parsed = SaveBettingHistoryBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid history input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .insert(bettingHistoryTable)
    .values(parsed.data)
    .returning();

  req.log.info({ id: entry.id }, "Saved betting history entry");

  res.status(201).json({
    ...entry,
    notes: entry.notes ?? undefined,
    createdAt: entry.createdAt.toISOString(),
  });
});

router.delete("/history/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteBettingHistoryParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db
    .delete(bettingHistoryTable)
    .where(eq(bettingHistoryTable.id, params.data.id));

  req.log.info({ id: params.data.id }, "Deleted betting history entry");

  res.json(DeleteBettingHistoryResponse.parse({ success: true }));
});

export default router;
