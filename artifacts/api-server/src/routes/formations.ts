import { Router, type IRouter } from "express";
import { GetFormationsResponse, GetFormationMatchupBody, GetFormationMatchupResponse } from "@workspace/api-zod";
import { getAllFormations, getFormationMatchup } from "../lib/formations.js";

const router: IRouter = Router();

router.get("/formations", async (_req, res): Promise<void> => {
  const formations = getAllFormations();
  res.json(GetFormationsResponse.parse({ formations }));
});

router.post("/formations/matchup", async (req, res): Promise<void> => {
  const parsed = GetFormationMatchupBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid formation matchup input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const matchup = getFormationMatchup(parsed.data.homeFormation, parsed.data.awayFormation);
  res.json(GetFormationMatchupResponse.parse(matchup));
});

export default router;
