import { Router } from "express"
import * as ctrl from "../controllers/enquiry.controller.js"

const router = Router()

// GET /staff/insights/top-enquiry-categories
router.get("/top-frequently-asked", ctrl.topEnquiryCategories)
router.get("/top-most-escalated", ctrl.topEscalatedEnquiries)
router.get("/all-categories", ctrl.allEnquiryCategories)

export default router