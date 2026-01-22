import { Router } from "express"
import { validateUpsertTutorialStep } from "../middleware/validateUpsertTutorialStep.js"
import * as ctrl from "../controllers/tutorialStep.controller.js"

const router = Router()

// PUT /staff/tutorial-steps/:versionId/steps/:stepIndex
router.put("/:versionId/steps/:stepIndex", validateUpsertTutorialStep, ctrl.upsertTutorialStepHandler)
router.get("/:tutorialVersionId/steps", ctrl.getTutorialStepsByVersionHandler)
router.post("/sync", ctrl.syncTutorialStepsHandler)

export default router;
