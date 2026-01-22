import { Router } from "express"
import multer from "multer";
import * as ctrl from "../controllers/screenAssets.controller.js"

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// GET /staff/screen-assets/all
router.get("/all", ctrl.getAllScreenAssets)

// GET /staff/screen-assets/navbar
router.get("/navbar", ctrl.getAllNavBars)

// POST /staff/screen-assets
router.post("/", upload.single("file"), ctrl.createScreenAssets);

// DELETE /staff/screen-assets/:screenAssetId
router.delete("/:screenAssetId", ctrl.deleteScreenAsset);

export default router