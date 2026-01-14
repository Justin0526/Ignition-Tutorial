import { Router } from "express"
import multer from "multer";
import * as ctrl from "../controllers/screenAssets.controller.js"

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// GET /staff/screen-assets/all
router.get("/all", ctrl.getAllScreenAssets)

// POST /staff/screen-assets
router.post("/", upload.single("file"), ctrl.createScreenAssets);

export default router