import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import enquiryRoutes from "./routes/enquiry.routes.js"
import screenAssetsRoutes from "./routes/screenAssets.routes.js"
import tutorialRoutes from "./routes/tutorial.routes.js"
import tutorialStepRoutes from "./routes/tutorialStep.routes.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get("/health", (req, res) => res.json({ ok: true }))

app.use("/staff/insights", enquiryRoutes)
app.use("/staff/screen-assets", screenAssetsRoutes)
app.use("/staff/tutorials", tutorialRoutes)
app.use("/staff/tutorial-steps", tutorialStepRoutes)

export default app