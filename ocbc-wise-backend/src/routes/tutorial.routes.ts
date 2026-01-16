import { Router } from "express"
import * as ctrl from "../controllers/tutorial.controller.js"

const router = Router()

// POST /staff/tutorial/drafts
router.post("/drafts", ctrl.createTutorialDraftHandler);

export default router;