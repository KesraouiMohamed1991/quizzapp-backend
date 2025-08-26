// server.js
require("dotenv").config()
const express = require("express")
const helmet = require("helmet")
const cors = require("cors")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const { z } = require("zod")
const { connectDB } = require("./lib/db")
const User = require("./models/User")

const app = express()

// Middleware
app.use(helmet())
app.use(cors({ origin: ["http://localhost:3000", "https://quizzfr.vercel.app/"], credentials: false }))
app.use(express.json())
app.use(morgan("tiny"))
app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 60, // 60 req/min per IP
        standardHeaders: true,
        legacyHeaders: false,
    })
)

const UserInput = z.object({
    name: z.string().min(1).max(120),
    email: z.string().email().max(254),
})

// Routes
app.get("/health", (_req, res) => res.json({ ok: true }))

// Create or update user by email (idempotent)
app.post("/users", async (req, res) => {
    try {
        const { name, email } = UserInput.parse(req.body)

        // Upsert: create if new, update name if email exists
        const user = await User.findOneAndUpdate(
            { email },
            { $set: { name } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        )

        return res.status(201).json({ ok: true, user })
    } catch (err) {
        if (err.name === "ZodError") {
            return res.status(400).json({ ok: false, error: "Invalid input", details: err.issues })
        }
        if (err.code === 11000) {
            // unique index conflict (rare with upsert but possible under race)
            return res.status(409).json({ ok: false, error: "Email already exists" })
        }
        console.error(err)
        return res.status(500).json({ ok: false, error: "Server error" })
    }
})

// List recent users (paginate in real apps)
app.get("/users", async (req, res) => {
    const { limit = 100 } = req.query
    const users = await User.find({}, { name: 1, email: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .limit(Math.min(Number(limit) || 100, 500))
    res.json({ ok: true, users })
})

async function start() {
    const { PORT, MONGODB_URI } = process.env
    if (!MONGODB_URI) throw new Error("Missing MONGODB_URI")
    await connectDB(MONGODB_URI)
    app.listen(PORT || 4000, () => {
        console.log(`🚀 Server ready on http://localhost:${PORT || 4000}`)
    })
}
start()
