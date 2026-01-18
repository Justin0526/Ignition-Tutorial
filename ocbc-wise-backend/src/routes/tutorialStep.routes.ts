import { Router } from "express"
import { validateUpsertTutorialStep } from "../middleware/validateUpsertTutorialStep.js"
import * as ctrl from "../controllers/tutorialStep.controller.js"

const router = Router()

// PUT /staff/tutorial-versions/:versionId/steps/:stepIndex
router.put("/tutorial-versions/:versionId/steps/:stepIndex", validateUpsertTutorialStep, ctrl.upsertTutorialStepHandler)

export default router;
