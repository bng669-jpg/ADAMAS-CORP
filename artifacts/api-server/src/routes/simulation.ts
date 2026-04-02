import { Router, type IRouter } from "express";
import { RunSimulationBody, RunSimulationResponse } from "@workspace/api-zod";
import { runMonteCarlo } from "../lib/montecarlo.js";

const router: IRouter = Router();

router.post("/simulate", async (req, res): Promise<void> => {
  const parsed = RunSimulationBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid simulation input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  req.log.info({ home: parsed.data.homeTeam.name, away: parsed.data.awayTeam.name }, "Running Monte Carlo simulation");

  const result = runMonteCarlo(parsed.data as any);

  res.json(RunSimulationResponse.parse(result));
});

export default router;
