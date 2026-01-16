import { Router } from "express";
import * as ctrl from "../controllers/tutorialStep.controller.js";

const router = Router();

// GET /staff/tutorial-steps/:tutorial_version_id/steps?lang-en-SG
router.get("/tutorial-versions/:tutorial_version_id/steps", ctrl.getStepsHandler);

// POST /staff/tutorial-steps/tutorial-versions/:tutorial_version_id/steps
router.post("/tutorial-versions/:tutorial_version_id/steps", ctrl.createStepHandler);

export default router;