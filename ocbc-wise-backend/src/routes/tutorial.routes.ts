import { Router } from "express"
import * as ctrl from "../controllers/tutorial.controller.js"

const router = Router()

// POST /staff/tutorials/drafts
router.post("/drafts", ctrl.createTutorialDraftHandler);

// POST /staff/tutorials/publish
router.post("/publish", ctrl.publishTutorial);

// GET /staff/tutorials/library
router.get("/library", ctrl.getTutorialLibraryHandler);

// POST /staff/tutorials/:tutorialId/resolve-edit
router.post("/:tutorialId/resolve-edit", ctrl.resolveEditHandler);

export default router;