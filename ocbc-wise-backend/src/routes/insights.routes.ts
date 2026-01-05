import { Router } from "express"
import * as ctrl from "../controllers/enquiry.controller.js"

const router = Router()

// GET /staff/insights/top-enquiry-categories
router.get("/top-enquiry-categories", ctrl.topEnquiryCategories)

export default router