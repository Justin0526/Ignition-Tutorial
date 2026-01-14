import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import insightsRoutes from "./routes/insights.routes.js"
import screenAssetsRoutes from "./routes/screenAssets.routes.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get("/health", (req, res) => res.json({ ok: true }))

app.use("/staff/insights", insightsRoutes)
app.use("/staff/screen-assets", screenAssetsRoutes)

export default app