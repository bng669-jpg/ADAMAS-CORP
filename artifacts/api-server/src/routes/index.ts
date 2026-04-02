import { Router, type IRouter } from "express";
import healthRouter from "./health";
import simulationRouter from "./simulation";
import formationsRouter from "./formations";
import historyRouter from "./history";

const router: IRouter = Router();

router.use(healthRouter);
router.use(simulationRouter);
router.use(formationsRouter);
router.use(historyRouter);

export default router;
