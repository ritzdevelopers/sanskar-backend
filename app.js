import express from "express"
import dotenv from "dotenv"
import dns from "node:dns"
import path from "node:path"
import cookieParser from "cookie-parser"
import cors from "cors"
import connectDB from "./db/connectdb.js"
import router from "./route/authRoutes.js"

dotenv.config()

// mongodb+srv:// needs DNS SRV lookups; broken/resolver-blocking DNS causes querySrv ECONNREFUSED
if (process.env.MONGO_URI?.startsWith("mongodb+srv://")) {
  dns.setServers(["1.1.1.1", "8.8.8.8"])
}

const PORT = process.env.PORT || 3001
const app = express()
const jsonParser = express.json()
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
)
app.use((req, res, next) => {
  const ct = req.headers["content-type"] || ""
  if (ct.includes("multipart/form-data")) {
    return next()
  }
  jsonParser(req, res, next)
})
app.use(cookieParser())

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))

app.get("/", (req, res) => {
    res.send("Hello World")
})

app.use("/api/users", router)

const start = async () => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
  })
}

start().catch((err) => {
  console.error("Server failed to start:", err)
  process.exit(1)
})