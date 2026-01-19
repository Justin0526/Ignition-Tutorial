import { Router } from "express"
import * as ctrl from "../controllers/tutorial.controller.js"

const router = Router()

// POST /staff/tutorials/drafts
router.post("/drafts", ctrl.createTutorialDraftHandler);

// POST /staff/tutorials/publish
router.post("/publish", ctrl.publishTutorial);

export default router;